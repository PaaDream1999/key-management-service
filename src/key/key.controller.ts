// src/key/key.controller.ts
import { Body, Controller, Delete, HttpException, HttpStatus, Logger, Param, Post } from '@nestjs/common';
import { KeyService } from './key.service';

@Controller('keys')
export class KeyController {
  private readonly logger = new Logger(KeyController.name); // ใช้ logger ของ NestJS แบบ scoped ตามชื่อคลาส

  constructor(private readonly keyService: KeyService) {}

  @Post('generate')
  async generateDataKey() {
    try {
      this.logger.debug('KMS generateDataKey called');
      const result = await this.keyService.generateAndStoreDataKey();
      this.logger.debug(`generateAndStoreDataKey result: ${JSON.stringify(result)}`);
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Internal server error';
      this.logger.error(`ERROR in /keys/generate: ${errorMessage}`, error instanceof Error ? error.stack : undefined);
      throw new HttpException(errorMessage, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Post('decrypt')
  decryptDataKey(@Body() body: { encryptedDK: string; iv: string; keyVersion: string }) {
    try {
      this.logger.debug(`KMS decryptDataKey called with body: ${JSON.stringify(body)}`);
      const plaintextDK = this.keyService.decryptDataKey(body.encryptedDK, body.iv, body.keyVersion);
      this.logger.debug(`KMS decryptDataKey plaintextDK: ${plaintextDK}`);
      return { plaintextDK };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Bad request';
      this.logger.error(`ERROR in /keys/decrypt: ${errorMessage}`, error instanceof Error ? error.stack : undefined);
      throw new HttpException(errorMessage, HttpStatus.BAD_REQUEST);
    }
  }

  @Post('rotate/:dataKeyId')
  async rotateDataKey(@Param('dataKeyId') dataKeyId: string) {
    try {
      this.logger.debug(`KMS rotateDataKey called with dataKeyId: ${dataKeyId}`);
      const result = await this.keyService.rotateDataKey(dataKeyId);
      this.logger.debug(`rotateDataKey result: ${JSON.stringify(result)}`);
      return { message: 'Data key rotated successfully', ...result };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Internal server error';
      this.logger.error(`ERROR in /keys/rotate: ${errorMessage}`, error instanceof Error ? error.stack : undefined);
      throw new HttpException(errorMessage, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Delete(':dataKeyId')
  async deleteDataKey(@Param('dataKeyId') dataKeyId: string) {
    try {
      this.logger.debug(`KMS deleteDataKey called with dataKeyId: ${dataKeyId}`);
      const deletedCount = await this.keyService.deleteDataKeyById(dataKeyId);
      this.logger.debug(`deleteDataKeyById returned: ${deletedCount}`);
      return {
        message: `DataKey ${dataKeyId} deleted successfully`,
        deletedCount,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Internal server error';
      this.logger.error(`ERROR in /keys/:dataKeyId DELETE: ${errorMessage}`, error instanceof Error ? error.stack : undefined);
      throw new HttpException(errorMessage, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
