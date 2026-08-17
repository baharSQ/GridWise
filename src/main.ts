// Node.js 18 does not expose the Web Crypto API as a global (that became standard
// in Node 19). @nestjs/typeorm@11 calls crypto.randomUUID() as a global, so we
// polyfill it here — at the very top of the entry file — before any Nest module
// is loaded. Node 20+ doesn't need this.
import { webcrypto } from 'node:crypto';
if (!globalThis.crypto) {
  Object.defineProperty(globalThis, 'crypto', { value: webcrypto });
}

import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api');
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  const configService = app.get(ConfigService);
  const port = configService.get<number>('app.port', 3000);

  await app.listen(port);
}
void bootstrap();
