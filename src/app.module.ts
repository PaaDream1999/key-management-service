// src/app.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { WinstonModule } from 'nest-winston';
import { MongooseModule } from '@nestjs/mongoose';
import * as Joi from 'joi';
import { transportDailyRotateFile, transportConsole } from './logger/winston-logger';
import { KeyModule } from './key/key.module';
import { TestController } from './test/test.controller';

/**
 * Module หลักของแอปพลิเคชัน
 */
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      validationSchema: Joi.object({
        MONGODB_URI: Joi.string().uri().required(),
        PORT: Joi.number().optional(),
      }),
    }),
    // ตั้งค่า Winston transports โดยตรง
    WinstonModule.forRoot({
      transports: [transportDailyRotateFile, transportConsole],
    }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        uri: configService.get<string>('MONGODB_URI'),
        autoIndex: process.env.NODE_ENV !== 'production',
      }),
    }),
    KeyModule,
  ],
  controllers: [TestController],
})
export class AppModule {}