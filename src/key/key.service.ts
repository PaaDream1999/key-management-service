// src/key/key.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as crypto from 'crypto';
import { DataKey, DataKeyDocument } from './schemas/data-key.schema';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class KeyService {
  private readonly logger = new Logger(KeyService.name);
  private masterKeyStore: { key: Buffer; version: string };
  private algorithm = 'aes-256-cbc';

  constructor(
    @InjectModel(DataKey.name) private dataKeyModel: Model<DataKeyDocument>,
    private readonly configService: ConfigService,
  ) {
    const mkEnv = this.configService.get<string>('MASTER_KEY');
    if (mkEnv) {
      this.masterKeyStore = { key: Buffer.from(mkEnv, 'hex'), version: 'v1' };
      this.logger.log(`Loaded master key from environment. Version: v1`);
    } else {
      this.masterKeyStore = { key: crypto.randomBytes(32), version: 'v1' };
      this.logger.log(`Generated new master key. Version: v1`);
    }
  }

  async generateAndStoreDataKey(): Promise<{
    id: string;
    plaintextDK: string;
    encryptedDK: string;
    iv: string;
    dkHash: string;
    keyVersion: string;
  }> {
    this.logger.debug(`DEBUG: Enter generateAndStoreDataKey`);
    const dataKey = crypto.randomBytes(32);
    const plaintextDK = dataKey.toString('hex');
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(this.algorithm, this.masterKeyStore.key, iv);
    const encryptedBuffer = Buffer.concat([cipher.update(dataKey), cipher.final()]);
    const dkHash = crypto.createHash('sha256').update(dataKey).digest('hex');

    const newDataKey = new this.dataKeyModel({
      encryptedDK: encryptedBuffer.toString('base64'),
      iv: iv.toString('hex'),
      dkHash,
      keyVersion: this.masterKeyStore.version,
    });
    const saved = await newDataKey.save();
    this.logger.debug(`DEBUG: DataKey saved with _id: ${(saved._id as any).toString()}`);

    return {
      id: (saved._id as any).toString(),
      plaintextDK,
      encryptedDK: saved.encryptedDK,
      iv: saved.iv,
      dkHash: saved.dkHash,
      keyVersion: saved.keyVersion,
    };
  }

  decryptDataKey(encryptedDK: string, iv: string, keyVersion: string): string {
    this.logger.debug(`DEBUG: decryptDataKey called with keyVersion: ${keyVersion}`);
    if (keyVersion !== this.masterKeyStore.version) {
      throw new Error('Master key version mismatch. Rotation may be in progress.');
    }
    const encryptedBuffer = Buffer.from(encryptedDK, 'base64');
    const ivBuffer = Buffer.from(iv, 'hex');
    const decipher = crypto.createDecipheriv(this.algorithm, this.masterKeyStore.key, ivBuffer);
    const decryptedBuffer = Buffer.concat([decipher.update(encryptedBuffer), decipher.final()]);
    return decryptedBuffer.toString('hex');
  }

  async rotateDataKey(dataKeyId: string): Promise<{ oldVersion: string; newVersion: string }> {
    this.logger.debug(`DEBUG: rotateDataKey called with dataKeyId: ${dataKeyId}`);
    const record = await this.dataKeyModel.findById(dataKeyId);
    if (!record) {
      throw new Error(`DataKey record not found for id: ${dataKeyId}`);
    }
    const oldVersion = record.keyVersion;
    const newMasterKey = crypto.randomBytes(32);
    const newVersion = 'v' + (parseInt(oldVersion.replace('v', ''), 10) + 1).toString();
    this.logger.log(`Rotating DataKey ${dataKeyId} from ${oldVersion} to ${newVersion}`);

    const encryptedBuffer = Buffer.from(record.encryptedDK, 'base64');
    const ivBuffer = Buffer.from(record.iv, 'hex');
    const decipher = crypto.createDecipheriv(this.algorithm, this.masterKeyStore.key, ivBuffer);
    const plaintextDK = Buffer.concat([decipher.update(encryptedBuffer), decipher.final()]);

    const newIV = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(this.algorithm, newMasterKey, newIV);
    const newEncryptedBuffer = Buffer.concat([cipher.update(plaintextDK), cipher.final()]);

    record.encryptedDK = newEncryptedBuffer.toString('base64');
    record.iv = newIV.toString('hex');
    record.keyVersion = newVersion;
    await record.save();

    this.masterKeyStore = { key: newMasterKey, version: newVersion };
    this.logger.log(`Rotation complete for DataKey ${dataKeyId}`);

    return { oldVersion, newVersion };
  }

  async deleteDataKeyById(dataKeyId: string): Promise<number> {
    this.logger.debug(`DEBUG: Enter deleteDataKeyById with dataKeyId = ${dataKeyId}`);
    const result = await this.dataKeyModel.findByIdAndDelete(dataKeyId);
    if (!result) {
      this.logger.warn(`DataKey ${dataKeyId} not found or already deleted`);
      throw new Error(`DataKey ${dataKeyId} not found`);
    }
    this.logger.debug(`DEBUG: DataKey ${dataKeyId} deleted successfully`);
    return 1;
  }
}
