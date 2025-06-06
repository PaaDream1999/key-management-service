// src/some/some.service.ts
import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class SomeService {
  private readonly logger = new Logger(SomeService.name);

  doSomething() {
    this.logger.log('This is an informational message');
    this.logger.error('This is an error message', new Error('Sample error').stack);
  }
}
