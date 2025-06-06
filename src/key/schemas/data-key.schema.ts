// src/key/schemas/data-key.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type DataKeyDocument = DataKey & Document;

@Schema({ timestamps: true })
export class DataKey {
  @Prop({ required: true })
  encryptedDK: string; // เก็บ encrypted data key ในรูปแบบ base64

  @Prop({ required: true })
  iv: string; // เก็บ IV ในรูปแบบ hex

  @Prop({ required: true })
  dkHash: string; // เก็บ hash ของ plaintext DK (hex)

  @Prop({ required: true })
  keyVersion: string; // เช่น 'v1', 'v2'
}

export const DataKeySchema = SchemaFactory.createForClass(DataKey);
