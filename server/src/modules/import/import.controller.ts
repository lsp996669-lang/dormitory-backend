import { Controller, Post, Body, Get, Query, Res, UseInterceptors, UploadedFile } from '@nestjs/common';
import { Response } from 'express';
import { ImportService } from './import.service';
import { FileInterceptor } from '@nestjs/platform-express';

@Controller('import')
export class ImportController {
  constructor(private readonly importService: ImportService) {}

  /**
   * 从URL导入数据
   */
  @Post('url')
  async importFromUrl(
    @Body() body: { url: string },
    @Res() res: Response,
  ) {
    console.log('[ImportController] 从URL导入:', body.url);
    
    try {
      const result = await this.importService.importFromUrl(body.url);
      
      return res.json({
        code: 200,
        msg: '导入完成',
        data: result,
      });
    } catch (error: any) {
      console.error('[ImportController] 导入失败:', error);
      return res.json({
        code: 500,
        msg: error.message || '导入失败',
        data: null,
      });
    }
  }

  /**
   * 上传Excel文件导入
   */
  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async importFromFile(
    @UploadedFile() file: any,
    @Res() res: Response,
  ) {
    console.log('[ImportController] 文件上传导入, 文件名:', file?.originalname, '大小:', file?.size);

    if (!file) {
      return res.json({
        code: 400,
        msg: '请上传文件',
        data: null,
      });
    }

    try {
      // 支持小程序端 file.path 和 H5端 file.buffer
      const buffer = file.buffer || (file.path ? require('fs').readFileSync(file.path) : null);
      
      if (!buffer) {
        return res.json({
          code: 400,
          msg: '无法读取文件内容',
          data: null,
        });
      }

      // 调用完整的导入流程（包含清空数据和确保床位存在）
      const result = await this.importService.importFromBuffer(buffer);
      
      return res.json({
        code: 200,
        msg: '导入完成',
        data: result,
      });
    } catch (error: any) {
      console.error('[ImportController] 导入失败:', error);
      return res.json({
        code: 500,
        msg: error.message || '导入失败',
        data: null,
      });
    }
  }
}
