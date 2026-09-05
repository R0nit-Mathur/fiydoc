import * as dotenv from 'dotenv';
import * as path from 'path';

// Load .env with fallbacks for local and production deployment environments
dotenv.config();
dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config({ path: path.resolve(__dirname, '../.env.production') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
dotenv.config({ path: path.resolve(process.cwd(), '.env.production') });
dotenv.config({ path: path.resolve(process.cwd(), '../.env') });

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.enableCors();

  const config = new DocumentBuilder()
    .setTitle('FiYDoc API Documentation')
    .setDescription('Authoritative REST API specification for FiYDoc Healthcare Platform')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT || 3000;
  await app.listen(port, '0.0.0.0');
  console.log(`🚀 FiYDoc NestJS Backend running on http://localhost:${port}`);
  console.log(`📚 Swagger API Docs available at http://localhost:${port}/api/docs`);

  // Auto Keep-Alive Heartbeat for Render Free Tier (pings every 10 minutes to prevent spin-down)
  const externalUrl = process.env.RENDER_EXTERNAL_URL || process.env.APP_URL;
  if (externalUrl) {
    const PING_INTERVAL = 10 * 60 * 1000; // 10 minutes
    setInterval(async () => {
      try {
        const pingUrl = `${externalUrl.replace(/\/$/, '')}/health`;
        const res = await fetch(pingUrl);
        if (res.ok) {
          console.log(`[KeepAlive] Pinged ${pingUrl} successfully (200 OK)`);
        }
      } catch (err: any) {
        console.warn(`[KeepAlive] Ping notice:`, err.message);
      }
    }, PING_INTERVAL);
    console.log(`⚡ Auto Keep-Alive active for ${externalUrl} (pinging every 10 mins to prevent sleep)`);
  }
}
bootstrap();
