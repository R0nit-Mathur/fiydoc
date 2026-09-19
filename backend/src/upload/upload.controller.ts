import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  Request,
  Response,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { UploadService } from './upload.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

export class Base64UploadDto {
  filename: string;
  base64: string;
  mimeType?: string;
  category?: string;
}

@Controller('upload')
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  async uploadFile(@Body() body: Base64UploadDto, @Request() req: any) {
    if (!body || !body.base64) {
      throw new BadRequestException('File base64 data is required for upload.');
    }
    const userId = req.user?.id || 'anonymous';
    const proto = req.headers['x-forwarded-proto'] || req.protocol || 'http';
    const host = req.headers['x-forwarded-host'] || req.headers.host;
    const baseUrl = host ? `${proto}://${host}` : undefined;

    return this.uploadService.uploadBase64(
      userId,
      body.filename,
      body.base64,
      body.mimeType,
      body.category,
      baseUrl
    );
  }

  // Public endpoint to serve uploaded files directly from server disk with caching
  @Get('file/*')
  async serveFile(@Request() req: any, @Response() res: any) {
    const reqUrl: string = req.url.split('?')[0];
    const relativePath = reqUrl.replace(/^\/upload\/file\//, '');
    if (!relativePath) {
      throw new NotFoundException('File path not provided.');
    }

    const localPath = this.uploadService.getLocalFilePath(relativePath);
    if (!localPath) {
      throw new NotFoundException('File not found on server.');
    }

    res.sendFile(localPath, {
      headers: {
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  }
}
