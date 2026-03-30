import { Injectable } from '@nestjs/common';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import * as ExcelJS from 'exceljs';
import * as https from 'https';
import * as http from 'http';
import { URL } from 'url';

interface ImportResult {
  checkIns: number;
  checkOuts: number;
  errors: string[];
}

@Injectable()
export class ImportService {
  /**
   * 从URL下载并导入Excel数据
   */
  async importFromUrl(fileUrl: string): Promise<ImportResult> {
    console.log('[Import] 开始从URL导入:', fileUrl);

    try {
      // 1. 下载文件
      const buffer = await this.downloadFile(fileUrl);
      console.log('[Import] 文件下载成功, 大小:', buffer.length);

      // 2. 清空现有数据
      await this.clearAllData();

      // 3. 确保床位存在
      await this.ensureBeds();

      // 4. 解析并导入数据
      const result = await this.parseAndImport(buffer);
      console.log('[Import] 导入完成:', result);

      return result;
    } catch (error) {
      console.error('[Import] 导入失败:', error);
      throw error;
    }
  }

  /**
   * 下载文件
   */
  private downloadFile(url: string): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const parsedUrl = new URL(url);
      const protocol = parsedUrl.protocol === 'https:' ? https : http;

      const chunks: Buffer[] = [];

      protocol.get(url, (response) => {
        if (response.statusCode !== 200) {
          reject(new Error(`下载失败: HTTP ${response.statusCode}`));
          return;
        }

        response.on('data', (chunk) => {
          chunks.push(chunk);
        });

        response.on('end', () => {
          resolve(Buffer.concat(chunks));
        });

        response.on('error', (error) => {
          reject(error);
        });
      }).on('error', (error) => {
        reject(error);
      });
    });
  }

  /**
   * 解析Excel并导入数据
   */
  async parseAndImport(buffer: Buffer): Promise<ImportResult> {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer as any);

    const result: ImportResult = {
      checkIns: 0,
      checkOuts: 0,
      errors: [],
    };

    const client = getSupabaseClient();

    // 遍历所有工作表
    for (const worksheet of workbook.worksheets) {
      const sheetName = worksheet.name;
      console.log('[Import] 处理工作表:', sheetName);

      // 根据工作表名确定楼层
      let floor = 2; // 默认二楼
      if (sheetName.includes('三') || sheetName.includes('3')) floor = 3;
      else if (sheetName.includes('四') || sheetName.includes('4')) floor = 4;
      else if (sheetName.includes('二') || sheetName.includes('2')) floor = 2;

      console.log('[Import] 楼层:', floor);

      // 获取所有行数据
      const rows: ExcelJS.Row[] = [];
      worksheet.eachRow((row, rowNumber) => {
        if (rowNumber > 2) { // 跳过表头
          rows.push(row);
        }
      });

      // 处理每一行
      for (const row of rows) {
        try {
          // 提取床号和铺位
          const bedNumberText = this.getCellValue(row.getCell(3)); // C列：床号
          const bedNumber = parseInt(bedNumberText.replace(/[^0-9]/g, '')) || 0;
          const positionText = this.getCellValue(row.getCell(4)); // D列：铺位
          const position = positionText.includes('上') ? 'upper' : 'lower';

          if (bedNumber === 0) {
            continue;
          }

          // 查找床位
          const { data: bed, error: bedError } = await client
            .from('beds')
            .select('id')
            .eq('floor', floor)
            .eq('bed_number', bedNumber)
            .eq('position', position)
            .single();

          if (bedError || !bed) {
            result.errors.push(`找不到床位: ${floor}楼${bedNumber}号${position === 'upper' ? '上铺' : '下铺'}`);
            continue;
          }

          // 处理当前入住人员（E、F、G列 + B列入住日期）
          const currentName = this.getCellValue(row.getCell(5)); // E列：住宿人员姓名
          const currentIdCard = this.getCellValue(row.getCell(6)); // F列：身份证号
          const currentPhone = this.getCellValue(row.getCell(7)); // G列：电话
          const currentCheckInDate = this.getCellValue(row.getCell(2)); // B列：入住日期

          if (currentName && currentIdCard) {
            // 创建入住记录
            const { data: checkIn, error: checkInError } = await client
              .from('check_ins')
              .insert({
                bed_id: bed.id,
                name: currentName,
                id_card: currentIdCard.toUpperCase(),
                phone: currentPhone || '',
                check_in_time: this.parseDate(currentCheckInDate) || new Date().toISOString(),
              })
              .select()
              .single();

            if (checkInError) {
              result.errors.push(`${currentName}: 入住记录创建失败 - ${checkInError.message}`);
            } else {
              // 更新床位状态
              await client.from('beds').update({ status: 'occupied' }).eq('id', bed.id);
              result.checkIns++;
              console.log('[Import] 入住记录创建成功:', currentName);
            }
          }

          // 处理搬离人员（H、I、J列）
          const checkOutName = this.getCellValue(row.getCell(8)); // H列：搬走人员
          const checkOutCheckInDate = this.getCellValue(row.getCell(9)); // I列：搬走人员入住日期
          const checkOutDate = this.getCellValue(row.getCell(10)); // J列：搬走日期

          // 调试日志
          if (checkOutName) {
            console.log('[Import] 搬离人员姓名:', checkOutName, '长度:', checkOutName.length);
          }

          // 验证搬离人员姓名有效性（不是数字、不是日期、长度>1）
          const isValidName = checkOutName && 
            checkOutName.length > 1 && 
            !/^\d+$/.test(checkOutName) && 
            !/^\d{4}-\d{2}-\d{2}/.test(checkOutName) &&
            !checkOutName.includes('{');

          if (isValidName) {
            console.log('[Import] 验证通过，创建搬离记录:', checkOutName);
            // 创建搬离记录
            const { error: checkOutError } = await client
              .from('check_outs')
              .insert({
                check_in_id: 0, // 历史数据，没有关联ID
                bed_id: bed.id,
                name: checkOutName,
                id_card: '', // 搬离人员没有身份证信息
                phone: '',
                check_in_time: this.parseDate(checkOutCheckInDate) || new Date().toISOString(),
                check_out_time: this.parseDate(checkOutDate) || new Date().toISOString(),
              });

            if (checkOutError) {
              result.errors.push(`${checkOutName}: 搬离记录创建失败 - ${checkOutError.message}`);
            } else {
              result.checkOuts++;
              console.log('[Import] 搬离记录创建成功:', checkOutName);
            }
          }
        } catch (error: any) {
          result.errors.push(`处理失败: ${error.message}`);
        }
      }
    }

    return result;
  }

  /**
   * 获取单元格值
   */
  private getCellValue(cell: ExcelJS.Cell): string {
    let value = cell.value;
    
    if (value === null || value === undefined) return '';
    
    if (typeof value === 'number') return String(value);
    
    if (typeof value === 'string') return value.trim();
    
    if (value instanceof Date) {
      return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, '0')}-${String(value.getDate()).padStart(2, '0')}`;
    }
    
    if (typeof value === 'object') {
      const obj = value as any;
      if (obj.result !== undefined) return String(obj.result);
      if (obj.text !== undefined) return String(obj.text);
      if (obj.richText) {
        return obj.richText.map((r: any) => r.text || '').join('');
      }
    }
    
    return String(value).trim();
  }

  /**
   * 解析日期字符串
   */
  private parseDate(dateStr: string): string | null {
    if (!dateStr) return null;
    
    // 如果是Excel日期对象
    if (dateStr.includes('GMT') || dateStr.includes('Day')) {
      try {
        const date = new Date(dateStr);
        return date.toISOString();
      } catch {
        return null;
      }
    }
    
    // 尝试解析其他格式
    try {
      const date = new Date(dateStr);
      if (!isNaN(date.getTime())) {
        return date.toISOString();
      }
    } catch {
      // 忽略错误
    }
    
    return null;
  }

  /**
   * 确保所有床位都存在
   */
  private async ensureBeds() {
    const client = getSupabaseClient();

    // 检查是否已有床位
    const { count } = await client
      .from('beds')
      .select('*', { count: 'exact', head: true });

    if (count && count > 0) {
      console.log('[Import] 床位已存在，数量:', count);
      return;
    }

    console.log('[Import] 初始化床位数据...');

    // 创建所有床位 (4层楼，每层15张床，每张床2个铺位)
    const beds: Array<{
      floor: number;
      bed_number: number;
      position: string;
      status: string;
    }> = [];
    
    for (let floor = 1; floor <= 4; floor++) {
      for (let bedNumber = 1; bedNumber <= 15; bedNumber++) {
        beds.push({
          floor,
          bed_number: bedNumber,
          position: 'upper',
          status: 'empty',
        });
        beds.push({
          floor,
          bed_number: bedNumber,
          position: 'lower',
          status: 'empty',
        });
      }
    }

    const { error } = await client.from('beds').insert(beds);
    if (error) {
      console.error('[Import] 初始化床位失败:', error);
      throw new Error('初始化床位失败');
    }

    console.log('[Import] 床位初始化完成，共', beds.length, '个床位');
  }

  /**
   * 清空所有数据
   */
  private async clearAllData() {
    const client = getSupabaseClient();

    console.log('[Import] 清空现有数据...');

    // 删除入住记录
    await client.from('check_ins').delete().neq('id', 0);
    
    // 删除搬离记录
    await client.from('check_outs').delete().neq('id', 0);
    
    // 删除点名记录
    await client.from('roll_calls').delete().neq('id', 0);

    // 重置床位状态
    await client.from('beds').update({ status: 'empty' }).neq('id', 0);

    console.log('[Import] 数据清空完成');
  }
}
