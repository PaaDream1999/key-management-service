// src/logger/winston-logger.ts
import * as fs from 'fs';
import * as path from 'path';
import * as winston from 'winston';
import 'winston-daily-rotate-file';

const { combine, timestamp, printf, errors, splat, json } = winston.format;

// ตรวจสอบและสร้างโฟลเดอร์ logs หากยังไม่มี
const logDir = path.resolve(__dirname, '../../logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

/**
 * กำหนดรูปแบบการบันทึก Log:
 * - เพิ่ม timestamp ในฟอร์แมต 'YYYY-MM-DD HH:mm:ss'
 * - แสดง stack trace เมื่อเกิด error
 * - รองรับ placeholder (splat)
 */
const loggerFormat = combine(
  timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  errors({ stack: true }),
  splat(),
  printf(({ timestamp, level, message, stack, ...meta }) => {
    const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
    return `${timestamp} [${level}]: ${stack || message}${metaStr}`;
  })
);

/**
 * Daily Rotate File transport
 */
export const transportDailyRotateFile = new winston.transports.DailyRotateFile({
  level: 'info',
  filename: `${logDir}/application-%DATE%.log`,
  datePattern: 'YYYY-MM-DD',
  zippedArchive: true,
  maxSize: '9000m', // จำกัดขนาดไฟล์สูงสุด 9000 MB = 9 GB
  maxFiles: '90d',
  format: loggerFormat,
});

/**
 * Console transport
 */
export const transportConsole = new winston.transports.Console({
  level: 'debug',
  format: combine(
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    errors({ stack: true }),
    splat(),
    json()
  ),
});