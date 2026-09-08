import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    })
  );

  const allowedOrigins = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',').map((s) => s.trim())
    : [
        'http://localhost:8081',
        'http://localhost:19000',
        'http://localhost:19006',
        'http://localhost:3000',
        'https://fiydoc.app',
      ];

  app.enableCors({
    origin: (origin, callback) => {
      // Allow mobile apps, native requests, and local development
      if (!origin || origin.startsWith('http://localhost:') || origin.startsWith('exp://')) {
        return callback(null, true);
      }
      const isAllowed = allowedOrigins.includes(origin);
      if (isAllowed) {
        callback(null, true);
      } else {
        callback(new Error(`Origin ${origin} not allowed by CORS`));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  });

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
}
bootstrap();

