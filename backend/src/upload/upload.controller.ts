import { Controller, Post, Body, UseGuards, Request, BadRequestException } from '@nestjs/common';
import { UploadService } from './upload.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

export class Base64UploadDto {
  filename: string;
  base64: string;
  mimeType?: string;
  category?: string;
}

@Controller('upload')
@UseGuards(JwtAuthGuard)
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Post()
  async uploadFile(@Body() body: Base64UploadDto, @Request() req: any) {
    if (!body || !body.base64) {
      throw new BadRequestException('File base64 data is required for upload.');
    }
    const userId = req.user?.id || 'anonymous';
    return this.uploadService.uploadBase64(
      userId,
      body.filename,
      body.base64,
      body.mimeType,
      body.category,
    );
  }
}
