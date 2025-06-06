// src/app.service.ts
import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class AppService {
  private readonly logger = new Logger(AppService.name); // ตั้ง Logger scope ตามชื่อ class

  getHello(): string {
    this.logger.debug('getHello() called'); // เพิ่ม log เพื่อ track การเรียก method
    return 'Hello World!';
  }
}
