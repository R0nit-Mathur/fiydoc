import { Injectable, Logger, BadRequestException, ServiceUnavailableException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';

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

  constructor(private readonly supabaseService: SupabaseService) {}

  async uploadBase64(
    userId: string,
    filename: string,
    base64Data: string,
    mimeType = 'application/octet-stream',
    category = 'records',
  ): Promise<UploadResult> {
    if (!base64Data || typeof base64Data !== 'string') {
      throw new BadRequestException('Invalid file data: base64 payload is required.');
    }

    // Strip data URI header if present (e.g. data:image/png;base64,...)
    const cleanBase64 = base64Data.replace(/^data:[^;]+;base64,/, '');
    const fileBuffer = Buffer.from(cleanBase64, 'base64');
    const size = fileBuffer.length;

    // Max 15MB limit
    if (size > 15 * 1024 * 1024) {
      throw new BadRequestException('File exceeds the 15MB size limit.');
    }

    const sanitizedName = (filename || 'document.pdf').replace(/[^a-zA-Z0-9._-]/g, '_');
    const storagePath = `${userId}/${category}/${Date.now()}-${sanitizedName}`;

    const client = this.supabaseService.getClient();
    if (!client) {
      this.logger.warn('Supabase not configured, generating fallback data URI');
      return {
        url: `data:${mimeType};base64,${cleanBase64}`,
        filename: sanitizedName,
        size,
        mimeType,
        path: storagePath,
      };
    }

    try {
      const { data, error } = await client.storage
        .from(this.BUCKET_NAME)
        .upload(storagePath, fileBuffer, {
          contentType: mimeType,
          upsert: true,
        });

      if (error) {
        this.logger.error(`Supabase upload error: ${error.message}`);
        // Fallback to data URI if storage fails
        return {
          url: `data:${mimeType};base64,${cleanBase64}`,
          filename: sanitizedName,
          size,
          mimeType,
          path: storagePath,
        };
      }

      const { data: pubData } = client.storage
        .from(this.BUCKET_NAME)
        .getPublicUrl(data.path);

      return {
        url: pubData.publicUrl,
        filename: sanitizedName,
        size,
        mimeType,
        path: data.path,
      };
    } catch (err: any) {
      this.logger.error(`Upload error: ${err?.message}`);
      return {
        url: `data:${mimeType};base64,${cleanBase64}`,
        filename: sanitizedName,
        size,
        mimeType,
        path: storagePath,
      };
    }
  }
}
