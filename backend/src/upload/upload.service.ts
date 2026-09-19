import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import * as fs from 'fs';
import * as path from 'path';

export interface UploadResult {
  url: string;
  filename: string;
  size: number;
  mimeType: string;
  path: string;
}

@Injectable()
export class UploadService {
  private readonly logger = new Logger(UploadService.name);
  private readonly BUCKET_NAME = 'fiydoc-documents';
  private readonly uploadDir = path.resolve(process.cwd(), 'uploads');

  constructor(private readonly supabaseService: SupabaseService) {
    if (!fs.existsSync(this.uploadDir)) {
      try {
        fs.mkdirSync(this.uploadDir, { recursive: true });
        this.logger.log(`Initialized server local uploads directory at: ${this.uploadDir}`);
      } catch (err: any) {
        this.logger.warn(`Failed to create local uploads directory: ${err?.message}`);
      }
    }
  }

  async uploadBase64(
    userId: string,
    filename: string,
    base64Data: string,
    mimeType = 'application/octet-stream',
    category = 'records',
    baseUrl?: string
  ): Promise<UploadResult> {
    if (!base64Data || typeof base64Data !== 'string') {
      throw new BadRequestException('Invalid file data: base64 payload is required.');
    }

    // Strip data URI header if present (e.g. data:image/png;base64,...)
    const cleanBase64 = base64Data.replace(/^data:[^;]+;base64,/, '');
    const fileBuffer = Buffer.from(cleanBase64, 'base64');
    const size = fileBuffer.length;

    // Max 25MB limit
    if (size > 25 * 1024 * 1024) {
      throw new BadRequestException('File exceeds the 25MB size limit.');
    }

    const sanitizedName = (filename || `doc_${Date.now()}.pdf`).replace(/[^a-zA-Z0-9._-]/g, '_');
    const relativeStoragePath = `${userId}/${category}/${Date.now()}-${sanitizedName}`;

    // 1. Try Supabase storage if client exists
    const client = this.supabaseService.getClient();
    if (client) {
      try {
        const { data, error } = await client.storage
          .from(this.BUCKET_NAME)
          .upload(relativeStoragePath, fileBuffer, {
            contentType: mimeType,
            upsert: true,
          });

        if (!error && data?.path) {
          const { data: pubData } = client.storage
            .from(this.BUCKET_NAME)
            .getPublicUrl(data.path);

          this.logger.log(`✅ Uploaded file to Supabase storage: ${pubData.publicUrl}`);
          return {
            url: pubData.publicUrl,
            filename: sanitizedName,
            size,
            mimeType,
            path: data.path,
          };
        }
        this.logger.warn(`Supabase upload failed, falling back to server disk storage: ${error?.message}`);
      } catch (err: any) {
        this.logger.warn(`Supabase exception, falling back to server disk: ${err?.message}`);
      }
    }

    // 2. Server Disk Storage: Persist file to local disk on server
    try {
      const localFilePath = path.join(this.uploadDir, relativeStoragePath);
      const parentDir = path.dirname(localFilePath);
      if (!fs.existsSync(parentDir)) {
        fs.mkdirSync(parentDir, { recursive: true });
      }
      await fs.promises.writeFile(localFilePath, fileBuffer);

      // Generate HTTP URL reachable on server
      const host = (baseUrl || process.env.API_BASE_URL || (process.env.PORT ? `http://localhost:${process.env.PORT}` : 'https://fiydoc.onrender.com')).replace(/\/+$/, '');
      const publicUrl = `${host}/upload/file/${relativeStoragePath}`;

      this.logger.log(`✅ Stored file to server disk (${(size / 1024).toFixed(1)} KB): ${publicUrl}`);
      return {
        url: publicUrl,
        filename: sanitizedName,
        size,
        mimeType,
        path: relativeStoragePath,
      };
    } catch (diskErr: any) {
      this.logger.error(`Disk write failed, fallback data URI: ${diskErr?.message}`);
      return {
        url: `data:${mimeType};base64,${cleanBase64}`,
        filename: sanitizedName,
        size,
        mimeType,
        path: relativeStoragePath,
      };
    }
  }

  getLocalFilePath(relativePath: string): string | null {
    // Prevent directory traversal
    const safePath = path.normalize(relativePath).replace(/^(\.\.(\/|\\|$))+/, '');
    const fullPath = path.join(this.uploadDir, safePath);
    if (fs.existsSync(fullPath) && fs.statSync(fullPath).isFile()) {
      return fullPath;
    }
    return null;
  }
}
