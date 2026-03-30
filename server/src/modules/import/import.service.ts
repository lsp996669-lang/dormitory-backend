import { Injectable } from '@nestjs/common';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import * as ExcelJS from 'exceljs';
import * as https from 'https';
import * as http from 'http';
import { URL } from 'url';

interface ImportRow {
  floor: number;
  bedNumber: number;
  position: string;
  name: string;
  idCard: string;
  phone: string;
  checkInDate?: string;
}

interface ImportResult {
  total: number;
  success: number;
  failed: number;
  errors: string[];
}

@Injectable()
export class ImportService {
  /**
   * 从URL下载并解析Excel文件
   */
  async importFromUrl(fileUrl: string, headers?: Record<string, string>): Promise<ImportResult> {
    console.log('[Import] 开始从URL导入:', fileUrl);

    try {
      // 1. 下载文件
      const buffer = await this.downloadFile(fileUrl);
      console.log('[Import] 文件下载成功, 大小:', buffer.length);

      // 2. 解析Excel
      const rows = await this.parseExcel(buffer);
      console.log('[Import] 解析到数据:', rows.length, '行');

      // 3. 导入数据
      const result = await this.importData(rows);
      console.log('[Import] 导入完成:', result);

      return result;
    } catch (error) {
      console.error('[Import] 导入失败:', error);
      throw error;
    }
  }

  /**
   * 从Buffer解析并导入Excel
   */
  async importFromBuffer(buffer: Buffer): Promise<ImportResult> {
    console.log('[Import] 开始从Buffer导入, 大小:', buffer.length);

    try {
      // 1. 解析Excel
      const rows = await this.parseExcel(buffer);
      console.log('[Import] 解析到数据:', rows.length, '行');

      // 2. 导入数据
      const result = await this.importData(rows);
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
   * 解析Excel文件
   */
  private async parseExcel(buffer: Buffer): Promise<ImportRow[]> {
    const workbook = new ExcelJS.Workbook();
    // 使用 Buffer 的 slice 方法获取 ArrayBuffer
    await workbook.xlsx.load(buffer as any);

    const worksheet = workbook.worksheets[0];
    if (!worksheet) {
      throw new Error('Excel文件中没有工作表');
    }

    const rows: ImportRow[] = [];
    
    // 读取表头，找到对应的列索引
    const headerRow = worksheet.getRow(1);
    const headerMap: Record<string, number> = {};
    
    headerRow.eachCell((cell, colNumber) => {
      const value = String(cell.value || '').trim();
      if (value) {
        headerMap[value] = colNumber;
      }
    });

    console.log('[Import] 表头映射:', headerMap);

    // 尝试识别常见的列名
    const floorCol = headerMap['楼层'] || headerMap['楼'] || headerMap['floor'];
    const bedNumberCol = headerMap['床号'] || headerMap['床铺号'] || headerMap['bed'] || headerMap['bed_number'];
    const positionCol = headerMap['铺位'] || headerMap['位置'] || headerMap['position'];
    const nameCol = headerMap['姓名'] || headerMap['名字'] || headerMap['name'];
    const idCardCol = headerMap['身份证'] || headerMap['身份证号'] || headerMap['id_card'] || headerMap['idCard'];
    const phoneCol = headerMap['电话'] || headerMap['手机'] || headerMap['手机号'] || headerMap['phone'];
    const dateCol = headerMap['入住日期'] || headerMap['日期'] || headerMap['check_in_date'];

    if (!nameCol) {
      throw new Error('找不到姓名列，请检查Excel格式');
    }

    // 遍历数据行
    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return; // 跳过表头

      const getCellValue = (col: number | undefined): string => {
        if (!col) return '';
        const cell = row.getCell(col);
        let value = cell.value;
        
        // 处理不同类型的单元格值
        if (value === null || value === undefined) return '';
        if (typeof value === 'number') return String(value);
        if (typeof value === 'string') return value.trim();
        if (value instanceof Date) {
          return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, '0')}-${String(value.getDate()).padStart(2, '0')}`;
        }
        if (typeof value === 'object' && 'result' in value) {
          // 处理公式单元格
          return String((value as any).result || '');
        }
        
        return String(value).trim();
      };

      const floor = parseInt(getCellValue(floorCol)) || 2;
      const bedNumber = parseInt(getCellValue(bedNumberCol)) || 1;
      const positionText = getCellValue(positionCol).toLowerCase();
      const position = positionText.includes('上') ? 'upper' : 'lower';
      const name = getCellValue(nameCol);
      const idCard = getCellValue(idCardCol).toUpperCase();
      const phone = getCellValue(phoneCol);
      const checkInDate = getCellValue(dateCol);

      // 只导入有姓名的行
      if (name) {
        rows.push({
          floor,
          bedNumber,
          position,
          name,
          idCard,
          phone,
          checkInDate,
        });
      }
    });

    return rows;
  }

  /**
   * 导入数据到数据库
   */
  private async importData(rows: ImportRow[]): Promise<ImportResult> {
    const client = getSupabaseClient();
    const result: ImportResult = {
      total: rows.length,
      success: 0,
      failed: 0,
      errors: [],
    };

    // 先确保所有床位都存在
    await this.ensureBeds(client);

    for (const row of rows) {
      try {
        // 1. 查找床位
        const { data: bed, error: bedError } = await client
          .from('beds')
          .select('id, status')
          .eq('floor', row.floor)
          .eq('bed_number', row.bedNumber)
          .eq('position', row.position)
          .single();

        if (bedError || !bed) {
          result.errors.push(`${row.name}: 找不到床位 ${row.floor}楼${row.bedNumber}号${row.position === 'upper' ? '上铺' : '下铺'}`);
          result.failed++;
          continue;
        }

        if (bed.status === 'occupied') {
          result.errors.push(`${row.name}: 床位已被占用`);
          result.failed++;
          continue;
        }

        // 2. 创建入住记录
        const checkInTime = row.checkInDate || new Date().toISOString();
        const { data: checkIn, error: checkInError } = await client
          .from('check_ins')
          .insert({
            bed_id: bed.id,
            name: row.name,
            id_card: row.idCard,
            phone: row.phone,
            check_in_time: checkInTime,
          })
          .select()
          .single();

        if (checkInError) {
          result.errors.push(`${row.name}: 创建入住记录失败 - ${checkInError.message}`);
          result.failed++;
          continue;
        }

        // 3. 更新床位状态
        const { error: updateError } = await client
          .from('beds')
          .update({ status: 'occupied' })
          .eq('id', bed.id);

        if (updateError) {
          result.errors.push(`${row.name}: 更新床位状态失败`);
          result.failed++;
          // 回滚入住记录
          await client.from('check_ins').delete().eq('id', checkIn.id);
          continue;
        }

        result.success++;
      } catch (error) {
        result.errors.push(`${row.name}: 导入失败 - ${error}`);
        result.failed++;
      }
    }

    return result;
  }

  /**
   * 确保所有床位都存在
   */
  private async ensureBeds(client: any) {
    // 检查是否已有床位
    const { count } = await client
      .from('beds')
      .select('*', { count: 'exact', head: true });

    if (count && count > 0) {
      return; // 已有床位，不需要初始化
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
   * 获取导入预览
   */
  async previewFromUrl(fileUrl: string): Promise<ImportRow[]> {
    const buffer = await this.downloadFile(fileUrl);
    return this.parseExcel(buffer);
  }

  /**
   * 清空所有数据（用于重新导入）
   */
  async clearAllData(): Promise<void> {
    const client = getSupabaseClient();

    // 删除入住记录
    await client.from('check_ins').delete().neq('id', 0);
    
    // 删除搬离记录
    await client.from('check_outs').delete().neq('id', 0);
    
    // 删除点名记录
    await client.from('roll_calls').delete().neq('id', 0);

    // 重置床位状态
    await client.from('beds').update({ status: 'empty' }).neq('id', 0);

    console.log('[Import] 数据已清空');
  }
}
