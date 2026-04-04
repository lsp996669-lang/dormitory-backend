import { Injectable } from '@nestjs/common';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import * as ExcelJS from 'exceljs';

@Injectable()
export class ExportService {
  async exportCheckInData() {
    const client = getSupabaseClient();

    const { data: checkIns, error } = await client
      .from('check_ins')
      .select('*');

    if (error) {
      console.error('获取入住记录失败:', error);
      throw new Error('获取数据失败');
    }

    // 获取床位信息
    const bedIds = [...new Set(checkIns?.map((r: any) => r.bed_id) || [])];
    const { data: beds } = await client
      .from('beds')
      .select('*')
      .in('id', bedIds);
    
    const bedMap = new Map(beds?.map((b: any) => [b.id, b]));

    // 按楼层、床号、铺位排序
    const sortedRecords = this.sortByFloorAndBed(checkIns || [], bedMap);

    const workbook = new ExcelJS.Workbook();
    workbook.creator = '宿舍管理系统';
    workbook.created = new Date();

    const worksheet = workbook.addWorksheet('入住人员名单', {
      views: [{ state: 'frozen', ySplit: 1 }],
    });

    worksheet.columns = [
      { header: '序号', key: 'index', width: 8 },
      { header: '入住日期', key: 'checkInDate', width: 14 },
      { header: '楼层', key: 'floor', width: 8 },
      { header: '床号', key: 'bedNumber', width: 10 },
      { header: '铺位', key: 'position', width: 8 },
      { header: '姓名', key: 'name', width: 20 },
      { header: '身份证号', key: 'idCard', width: 22 },
      { header: '联系电话', key: 'phone', width: 15 },
    ];

    const headerRow = worksheet.getRow(1);
    headerRow.height = 25;
    headerRow.alignment = { horizontal: 'center', vertical: 'middle' };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF4472C4' },
    };
    headerRow.font = { bold: true, size: 12, color: { argb: 'FFFFFFFF' } };

    sortedRecords.forEach((record: any, index: number) => {
      const bed = bedMap.get(record.bed_id);
      worksheet.addRow({
        index: index + 1,
        checkInDate: this.formatDate(record.check_in_time),
        floor: `${bed?.floor || '-'}楼`,
        bedNumber: `${bed?.bed_number || '-'}号床`,
        position: bed?.position === 'upper' ? '上铺' : '下铺',
        name: record.name,
        idCard: record.id_card,
        phone: record.phone,
      });
    });

    this.applyDataStyle(worksheet, 'FFF2F2F2');

    const buffer = await workbook.xlsx.writeBuffer();
    return buffer;
  }

  async exportCheckOutData() {
    const client = getSupabaseClient();

    const { data: checkOuts, error } = await client
      .from('check_outs')
      .select('*');

    if (error) {
      console.error('获取搬离记录失败:', error);
      throw new Error('获取数据失败');
    }

    // 获取床位信息
    const bedIds = [...new Set(checkOuts?.map((r: any) => r.bed_id) || [])];
    const { data: beds } = await client
      .from('beds')
      .select('*')
      .in('id', bedIds);
    
    const bedMap = new Map(beds?.map((b: any) => [b.id, b]));

    // 按楼层、床号、铺位排序
    const sortedRecords = this.sortByFloorAndBed(checkOuts || [], bedMap);

    const workbook = new ExcelJS.Workbook();
    workbook.creator = '宿舍管理系统';
    workbook.created = new Date();

    const worksheet = workbook.addWorksheet('搬离人员名单', {
      views: [{ state: 'frozen', ySplit: 1 }],
    });

    worksheet.columns = [
      { header: '序号', key: 'index', width: 8 },
      { header: '入住日期', key: 'checkInDate', width: 14 },
      { header: '搬离日期', key: 'checkOutDate', width: 14 },
      { header: '楼层', key: 'floor', width: 8 },
      { header: '床号', key: 'bedNumber', width: 10 },
      { header: '铺位', key: 'position', width: 8 },
      { header: '姓名', key: 'name', width: 20 },
      { header: '身份证号', key: 'idCard', width: 22 },
      { header: '联系电话', key: 'phone', width: 15 },
    ];

    const headerRow = worksheet.getRow(1);
    headerRow.height = 25;
    headerRow.alignment = { horizontal: 'center', vertical: 'middle' };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF70AD47' },
    };
    headerRow.font = { bold: true, size: 12, color: { argb: 'FFFFFFFF' } };

    sortedRecords.forEach((record: any, index: number) => {
      const bed = bedMap.get(record.bed_id);
      worksheet.addRow({
        index: index + 1,
        checkInDate: this.formatDate(record.check_in_time),
        checkOutDate: this.formatDate(record.check_out_time),
        floor: `${bed?.floor || '-'}楼`,
        bedNumber: `${bed?.bed_number || '-'}号床`,
        position: bed?.position === 'upper' ? '上铺' : '下铺',
        name: record.name,
        idCard: record.id_card,
        phone: record.phone,
      });
    });

    this.applyDataStyle(worksheet, 'FFE2EFDA');

    const buffer = await workbook.xlsx.writeBuffer();
    return buffer;
  }

  async exportAllData() {
    const client = getSupabaseClient();

    const { data: checkIns } = await client
      .from('check_ins')
      .select('*');

    const { data: checkOuts } = await client
      .from('check_outs')
      .select('*');

    // 获取所有涉及的床位
    const allBedIds = [
      ...(checkIns?.map((r: any) => r.bed_id) || []),
      ...(checkOuts?.map((r: any) => r.bed_id) || []),
    ];
    const uniqueBedIds = [...new Set(allBedIds)];
    const { data: beds } = await client
      .from('beds')
      .select('*')
      .in('id', uniqueBedIds);
    
    const bedMap = new Map(beds?.map((b: any) => [b.id, b]));

    // 排序数据
    const sortedCheckIns = this.sortByFloorAndBed(checkIns || [], bedMap);
    const sortedCheckOuts = this.sortByFloorAndBed(checkOuts || [], bedMap);

    const workbook = new ExcelJS.Workbook();
    workbook.creator = '宿舍管理系统';
    workbook.created = new Date();

    // Sheet 1: 当前入住人员
    const sheet1 = workbook.addWorksheet('当前入住人员', {
      views: [{ state: 'frozen', ySplit: 1 }],
    });

    sheet1.columns = [
      { header: '序号', key: 'index', width: 8 },
      { header: '入住日期', key: 'checkInDate', width: 14 },
      { header: '楼层', key: 'floor', width: 8 },
      { header: '床号', key: 'bedNumber', width: 10 },
      { header: '铺位', key: 'position', width: 8 },
      { header: '姓名', key: 'name', width: 20 },
      { header: '身份证号', key: 'idCard', width: 22 },
      { header: '联系电话', key: 'phone', width: 15 },
    ];

    this.applyHeaderStyle(sheet1.getRow(1), 'FF4472C4');
    sortedCheckIns.forEach((record: any, index: number) => {
      const bed = bedMap.get(record.bed_id);
      sheet1.addRow({
        index: index + 1,
        checkInDate: this.formatDate(record.check_in_time),
        floor: `${bed?.floor || '-'}楼`,
        bedNumber: `${bed?.bed_number || '-'}号床`,
        position: bed?.position === 'upper' ? '上铺' : '下铺',
        name: record.name,
        idCard: record.id_card,
        phone: record.phone,
      });
    });
    this.applyDataStyle(sheet1, 'FFF2F2F2');

    // Sheet 2: 搬离人员
    const sheet2 = workbook.addWorksheet('搬离人员', {
      views: [{ state: 'frozen', ySplit: 1 }],
    });

    sheet2.columns = [
      { header: '序号', key: 'index', width: 8 },
      { header: '入住日期', key: 'checkInDate', width: 14 },
      { header: '搬离日期', key: 'checkOutDate', width: 14 },
      { header: '楼层', key: 'floor', width: 8 },
      { header: '床号', key: 'bedNumber', width: 10 },
      { header: '铺位', key: 'position', width: 8 },
      { header: '姓名', key: 'name', width: 20 },
      { header: '身份证号', key: 'idCard', width: 22 },
      { header: '联系电话', key: 'phone', width: 15 },
    ];

    this.applyHeaderStyle(sheet2.getRow(1), 'FF70AD47');
    sortedCheckOuts.forEach((record: any, index: number) => {
      const bed = bedMap.get(record.bed_id);
      sheet2.addRow({
        index: index + 1,
        checkInDate: this.formatDate(record.check_in_time),
        checkOutDate: this.formatDate(record.check_out_time),
        floor: `${bed?.floor || '-'}楼`,
        bedNumber: `${bed?.bed_number || '-'}号床`,
        position: bed?.position === 'upper' ? '上铺' : '下铺',
        name: record.name,
        idCard: record.id_card,
        phone: record.phone,
      });
    });
    this.applyDataStyle(sheet2, 'FFE2EFDA');

    // Sheet 3: 统计汇总
    const sheet3 = workbook.addWorksheet('统计汇总');

    const floorStats: any[] = [];
    for (let floor = 1; floor <= 4; floor++) {
      const { data: beds } = await client
        .from('beds')
        .select('status')
        .eq('floor', floor);
      
      const total = beds?.length || 30;
      const occupied = beds?.filter(b => b.status === 'occupied').length || 0;
      
      floorStats.push({
        floor: `${floor}楼`,
        total,
        occupied,
        empty: total - occupied,
        rate: total > 0 ? `${Math.round((occupied / total) * 100)}%` : '0%',
      });
    }

    sheet3.columns = [
      { header: '楼层', key: 'floor', width: 12 },
      { header: '总床位数', key: 'total', width: 12 },
      { header: '已入住', key: 'occupied', width: 12 },
      { header: '空闲', key: 'empty', width: 12 },
      { header: '入住率', key: 'rate', width: 12 },
    ];

    this.applyHeaderStyle(sheet3.getRow(1), 'FF5B9BD5');
    floorStats.forEach((stat) => sheet3.addRow(stat));

    const totalRow = sheet3.addRow({
      floor: '总计',
      total: floorStats.reduce((sum, s) => sum + s.total, 0),
      occupied: floorStats.reduce((sum, s) => sum + s.occupied, 0),
      empty: floorStats.reduce((sum, s) => sum + s.empty, 0),
      rate: (() => {
        const total = floorStats.reduce((sum, s) => sum + s.total, 0);
        const occupied = floorStats.reduce((sum, s) => sum + s.occupied, 0);
        return total > 0 ? `${Math.round((occupied / total) * 100)}%` : '0%';
      })(),
    });
    totalRow.font = { bold: true };
    totalRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFFCE4D6' },
    };

    this.applyDataStyle(sheet3, 'FFDEEBF7');

    const buffer = await workbook.xlsx.writeBuffer();
    return buffer;
  }

  /**
   * 按宿舍楼导出数据
   * 入住人员和搬离人员按楼层拆分成多个 sheet
   */
  async exportDormitoryData(dormitory: string) {
    const client = getSupabaseClient();

    // 获取该宿舍楼的床位信息
    const { data: beds } = await client
      .from('beds')
      .select('*')
      .eq('dormitory', dormitory);
    
    const bedMap = new Map(beds?.map((b: any) => [b.id, b]));
    const bedIds = beds?.map((b: any) => b.id) || [];

    // 获取入住记录
    const { data: checkIns } = await client
      .from('check_ins')
      .select('*')
      .in('bed_id', bedIds);

    // 获取搬离记录
    const { data: checkOuts } = await client
      .from('check_outs')
      .select('*')
      .in('bed_id', bedIds);

    // 按楼层分组入住数据
    const checkInsByFloor = this.groupByFloor(checkIns || [], bedMap);
    
    // 按楼层分组搬离数据
    const checkOutsByFloor = this.groupByFloor(checkOuts || [], bedMap);

    // 获取该宿舍楼的楼层列表（排序）
    const floors = [...new Set(beds?.map((b: any) => b.floor))].sort((a, b) => a - b);

    const workbook = new ExcelJS.Workbook();
    workbook.creator = '宿舍管理系统';
    workbook.created = new Date();

    const dormitoryName = dormitory === 'nansi' ? '南四巷180号' : '南二巷24号';

    // 为每个楼层创建入住人员 sheet
    for (const floor of floors) {
      const floorCheckIns = checkInsByFloor.get(floor) || [];
      const sortedRecords = this.sortByBed(floorCheckIns, bedMap);

      const sheetName = `${floor}楼入住人员`;
      const sheet = workbook.addWorksheet(sheetName, {
        views: [{ state: 'frozen', ySplit: 1 }],
      });

      sheet.columns = [
        { header: '序号', key: 'index', width: 8 },
        { header: '入住日期', key: 'checkInDate', width: 14 },
        { header: '房间', key: 'room', width: 10 },
        { header: '床号', key: 'bedNumber', width: 10 },
        { header: '铺位', key: 'position', width: 8 },
        { header: '姓名', key: 'name', width: 20 },
        { header: '身份证号', key: 'idCard', width: 22 },
        { header: '联系电话', key: 'phone', width: 15 },
      ];

      this.applyHeaderStyle(sheet.getRow(1), 'FF4472C4');
      sortedRecords.forEach((record: any, index: number) => {
        const bed = bedMap.get(record.bed_id);
        sheet.addRow({
          index: index + 1,
          checkInDate: this.formatDate(record.check_in_time),
          room: bed?.room || '-',
          bedNumber: `${bed?.bed_number || '-'}号床`,
          position: bed?.position === 'upper' ? '上铺' : '下铺',
          name: record.name,
          idCard: record.id_card,
          phone: record.phone,
        });
      });
      this.applyDataStyle(sheet, 'FFF2F2F2');
    }

    // 为每个楼层创建搬离人员 sheet
    for (const floor of floors) {
      const floorCheckOuts = checkOutsByFloor.get(floor) || [];
      const sortedRecords = this.sortByBed(floorCheckOuts, bedMap);

      const sheetName = `${floor}楼搬离人员`;
      const sheet = workbook.addWorksheet(sheetName, {
        views: [{ state: 'frozen', ySplit: 1 }],
      });

      sheet.columns = [
        { header: '序号', key: 'index', width: 8 },
        { header: '入住日期', key: 'checkInDate', width: 14 },
        { header: '搬离日期', key: 'checkOutDate', width: 14 },
        { header: '房间', key: 'room', width: 10 },
        { header: '床号', key: 'bedNumber', width: 10 },
        { header: '铺位', key: 'position', width: 8 },
        { header: '姓名', key: 'name', width: 20 },
        { header: '身份证号', key: 'idCard', width: 22 },
        { header: '联系电话', key: 'phone', width: 15 },
      ];

      this.applyHeaderStyle(sheet.getRow(1), 'FF70AD47');
      sortedRecords.forEach((record: any, index: number) => {
        const bed = bedMap.get(record.bed_id);
        sheet.addRow({
          index: index + 1,
          checkInDate: this.formatDate(record.check_in_time),
          checkOutDate: this.formatDate(record.check_out_time),
          room: bed?.room || '-',
          bedNumber: `${bed?.bed_number || '-'}号床`,
          position: bed?.position === 'upper' ? '上铺' : '下铺',
          name: record.name,
          idCard: record.id_card,
          phone: record.phone,
        });
      });
      this.applyDataStyle(sheet, 'FFE2EFDA');
    }

    // 统计汇总 sheet
    const sheet3 = workbook.addWorksheet('统计汇总');

    const floorStats: any[] = [];
    for (const floor of floors) {
      const floorBeds = beds?.filter((b: any) => b.floor === floor) || [];
      const total = floorBeds.length;
      const occupied = floorBeds.filter((b: any) => b.status === 'occupied').length;
      
      floorStats.push({
        floor: `${floor}楼`,
        total,
        occupied,
        empty: total - occupied,
        rate: total > 0 ? `${Math.round((occupied / total) * 100)}%` : '0%',
      });
    }

    sheet3.columns = [
      { header: '楼层', key: 'floor', width: 12 },
      { header: '总床位数', key: 'total', width: 12 },
      { header: '已入住', key: 'occupied', width: 12 },
      { header: '空闲', key: 'empty', width: 12 },
      { header: '入住率', key: 'rate', width: 12 },
    ];

    this.applyHeaderStyle(sheet3.getRow(1), 'FF5B9BD5');
    floorStats.forEach((stat) => sheet3.addRow(stat));

    const totalRow = sheet3.addRow({
      floor: '总计',
      total: floorStats.reduce((sum, s) => sum + s.total, 0),
      occupied: floorStats.reduce((sum, s) => sum + s.occupied, 0),
      empty: floorStats.reduce((sum, s) => sum + s.empty, 0),
      rate: (() => {
        const total = floorStats.reduce((sum, s) => sum + s.total, 0);
        const occupied = floorStats.reduce((sum, s) => sum + s.occupied, 0);
        return total > 0 ? `${Math.round((occupied / total) * 100)}%` : '0%';
      })(),
    });
    totalRow.font = { bold: true };
    totalRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFFCE4D6' },
    };

    this.applyDataStyle(sheet3, 'FFDEEBF7');

    const buffer = await workbook.xlsx.writeBuffer();
    return buffer;
  }

  async getExportStats() {
    const client = getSupabaseClient();

    const { count: checkInCount } = await client
      .from('check_ins')
      .select('*', { count: 'exact', head: true });

    const { count: checkOutCount } = await client
      .from('check_outs')
      .select('*', { count: 'exact', head: true });

    const floorStats: any[] = [];
    for (let floor = 1; floor <= 4; floor++) {
      const { data: beds } = await client
        .from('beds')
        .select('status')
        .eq('floor', floor);
      
      const total = beds?.length || 30;
      const occupied = beds?.filter(b => b.status === 'occupied').length || 0;
      
      floorStats.push({
        floor,
        total,
        occupied,
        empty: total - occupied,
      });
    }

    return {
      code: 200,
      msg: '获取成功',
      data: {
        checkInCount: checkInCount || 0,
        checkOutCount: checkOutCount || 0,
        floorStats,
      },
    };
  }

  /**
   * 按楼层分组数据
   */
  private groupByFloor(records: any[], bedMap: Map<number, any>): Map<number, any[]> {
    const result = new Map<number, any[]>();
    
    for (const record of records) {
      const bed = bedMap.get(record.bed_id);
      if (bed) {
        const floor = bed.floor;
        if (!result.has(floor)) {
          result.set(floor, []);
        }
        result.get(floor)!.push(record);
      }
    }
    
    return result;
  }

  /**
   * 按床号、铺位排序（不按楼层排序，因为已经分组了）
   * 排序规则：床号升序 -> 下铺在前、上铺在后
   */
  private sortByBed(records: any[], bedMap: Map<number, any>): any[] {
    return [...records].sort((a, b) => {
      const bedA = bedMap.get(a.bed_id) || {};
      const bedB = bedMap.get(b.bed_id) || {};

      // 1. 按床号升序
      const bedNumA = bedA.bed_number || 0;
      const bedNumB = bedB.bed_number || 0;
      if (bedNumA !== bedNumB) {
        return bedNumA - bedNumB;
      }

      // 2. 按铺位排序：下铺(lower)在前，上铺(upper)在后
      const posA = bedA.position || '';
      const posB = bedB.position || '';
      if (posA === 'lower' && posB === 'upper') return -1;
      if (posA === 'upper' && posB === 'lower') return 1;

      return 0;
    });
  }

  /**
   * 按楼层、床号、铺位排序
   * 排序规则：楼层升序 -> 床号升序 -> 下铺在前、上铺在后
   */
  private sortByFloorAndBed(records: any[], bedMap: Map<number, any>): any[] {
    return [...records].sort((a, b) => {
      const bedA = bedMap.get(a.bed_id) || {};
      const bedB = bedMap.get(b.bed_id) || {};

      // 1. 按楼层升序
      const floorA = bedA.floor || 0;
      const floorB = bedB.floor || 0;
      if (floorA !== floorB) {
        return floorA - floorB;
      }

      // 2. 按床号升序
      const bedNumA = bedA.bed_number || 0;
      const bedNumB = bedB.bed_number || 0;
      if (bedNumA !== bedNumB) {
        return bedNumA - bedNumB;
      }

      // 3. 按铺位排序：下铺(lower)在前，上铺(upper)在后
      const posA = bedA.position || '';
      const posB = bedB.position || '';
      if (posA === 'lower' && posB === 'upper') return -1;
      if (posA === 'upper' && posB === 'lower') return 1;

      return 0;
    });
  }

  private applyHeaderStyle(row: ExcelJS.Row, color: string) {
    row.height = 25;
    row.alignment = { horizontal: 'center', vertical: 'middle' };
    row.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: color },
    };
    row.font = { bold: true, size: 12, color: { argb: 'FFFFFFFF' } };
    row.eachCell((cell) => {
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFD0D0D0' } },
        left: { style: 'thin', color: { argb: 'FFD0D0D0' } },
        bottom: { style: 'thin', color: { argb: 'FFD0D0D0' } },
        right: { style: 'thin', color: { argb: 'FFD0D0D0' } },
      };
    });
  }

  private applyDataStyle(worksheet: ExcelJS.Worksheet, altColor: string) {
    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber > 1) {
        row.height = 22;
        row.alignment = { horizontal: 'center', vertical: 'middle' };
        row.eachCell((cell) => {
          cell.border = {
            top: { style: 'thin', color: { argb: 'FFD0D0D0' } },
            left: { style: 'thin', color: { argb: 'FFD0D0D0' } },
            bottom: { style: 'thin', color: { argb: 'FFD0D0D0' } },
            right: { style: 'thin', color: { argb: 'FFD0D0D0' } },
          };
        });
        
        if (rowNumber % 2 === 0) {
          row.eachCell((cell) => {
            cell.fill = {
              type: 'pattern',
              pattern: 'solid',
              fgColor: { argb: altColor },
            };
          });
        }
      }
    });
  }

  private formatDate(dateStr: string | null): string {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}
