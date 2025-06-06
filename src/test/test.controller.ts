// src/test/test.controller.ts
import { Controller, Get, Logger } from '@nestjs/common';

@Controller('test')
export class TestController {
  private readonly logger = new Logger(TestController.name);

  @Get('log')
  testLog() {
    this.logger.log('Test log');
    this.logger.error('Test error');
    return { message: 'Log test executed. ตรวจสอบ console และไฟล์ log' };
  }
}
