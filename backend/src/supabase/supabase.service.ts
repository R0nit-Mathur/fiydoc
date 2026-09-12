import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class SupabaseService {
  private readonly logger = new Logger(SupabaseService.name);
  private supabase: SupabaseClient | null = null;

  constructor() {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

    if (supabaseUrl && supabaseUrl.startsWith('http') && supabaseKey) {
      this.supabase = createClient(supabaseUrl, supabaseKey);
      this.logger.log('⚡ Supabase Client initialized successfully for DB & Storage');
    } else {
      this.logger.warn('⚠️ Supabase credentials not set in backend/.env. Running in local fallback mode.');
    }
  }

  getClient(): SupabaseClient | null {
    return this.supabase;
  }

  isConfigured(): boolean {
    return this.supabase !== null;
  }

  async uploadFile(bucket: string, path: string, fileBuffer: Buffer, contentType: string): Promise<string> {
    if (!this.supabase) {
      throw new ServiceUnavailableException('Supabase Storage is not configured. File was not saved.');
    }

    const { data, error } = await this.supabase.storage.from(bucket).upload(path, fileBuffer, {
      contentType,
      upsert: true,
    });

    if (error) {
      this.logger.error(`Supabase Storage upload error: ${error.message}`);
      throw error;
    }

    const { data: publicUrlData } = this.supabase.storage.from(bucket).getPublicUrl(data.path);
    return publicUrlData.publicUrl;
  }
}
