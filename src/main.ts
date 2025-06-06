// src/main.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';

/**
 * Bootstrap function
 * - สร้าง Nest แอป
 * - ใช้ Winston logger ผ่าน provider ของ Nest
 * - อ่านค่าพอร์ตจาก ConfigService
 * - เริ่มต้นแอปบนพอร์ตที่กำหนด
 */
async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);

  // ใช้ Winston logger ของ nest-winston
  app.useLogger(app.get(WINSTON_MODULE_NEST_PROVIDER));

  const configService = app.get(ConfigService);
  const port: number = configService.get<number>('PORT') || 4000;

  await app.listen(port);

  // log ว่า service เริ่มทำงานแล้ว
  app.get(WINSTON_MODULE_NEST_PROVIDER).log(
    `Key Management Service is running on port ${port}`,
    'Bootstrap'
  );
}

bootstrap();