import { Controller, Post, UploadedFiles, UseInterceptors, Body } from '@nestjs/common';
import { UploadService } from './upload.service';
import { FilesInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';

@Controller('upload')
export class UploadController {
  constructor(private readonly uploadService: UploadService) { }

  @Post()
  @UseInterceptors(
    FilesInterceptor('files', 1000, { storage: memoryStorage() })
  )
  async uploadFiles(
    @UploadedFiles() files: Express.Multer.File[],
    @Body() body: { type: string; date: string; city: string; clubCity: string }
  ) {
    console.log('Odebrane pliki:', files.map(f => f.originalname));
    console.log('Dane eventu:', body);

    const uploadedFiles = await this.uploadService.uploadFiles(files, body);

    return { message: 'Pliki wysłane pomyślnie', files: uploadedFiles };
  }
}
