// src/key/key.module.ts
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { KeyController } from './key.controller';
import { KeyService } from './key.service';
import { DataKey, DataKeySchema } from './schemas/data-key.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: DataKey.name, schema: DataKeySchema }]),
  ],
  controllers: [KeyController],
  providers: [KeyService],
  exports: [KeyService],
})
export class KeyModule {}
