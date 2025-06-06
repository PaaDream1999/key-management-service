# Key Management Service (KMS)

บริการจัดการคีย์ (Key Management) สำหรับเข้ารหัส ถอดรหัส และจัดการคีย์อย่างปลอดภัย รองรับการกำหนดเวอร์ชันคีย์แม่ (Master Key) และการใช้งานร่วมกับระบบที่ต้องการเข้ารหัสข้อมูลลับ เช่น Inspect Drive
---

## วัตถุประสงค์ของระบบ

Key Management Service (KMS) เป็นบริการ Backend แยกต่างหาก ทำหน้าที่ดูแลการสร้างคีย์ (Generate), การเข้ารหัส (Encrypt), การถอดรหัส (Decrypt), การเวอร์ชันคีย์แม่ (Key Rotation) และการลบคีย์ (Delete)โดยข้อมูลสำคัญจะถูกปกป้องด้วยหลักการที่สอดคล้องกับมาตรฐานความมั่นคงปลอดภัยขององค์กร

---

## คุณสมบัติด้านความปลอดภัย

| คุณสมบัติ | รายละเอียด |
| --- | --- |
| การกำหนดเวอร์ชัน Master Key | รองรับการหมุนเวียนคีย์แม่ โดยไม่กระทบข้อมูลเก่า |
| Key Wrapping | Data Key (DK) ถูกเข้ารหัสด้วย Master Key ก่อนจัดเก็บ |
| แยกส่วนการเข้าถึงระบบ | บริการนี้ไม่เปิดให้ใช้งานสาธารณะ ลดความเสี่ยงในการโจมตี |
| การบันทึก Log | ทุกคำสั่งเกี่ยวกับคีย์มีการบันทึก Log อย่างละเอียด |
| ไม่มีการจัดเก็บคีย์ลับแบบ plaintext | DK ที่สร้างขึ้นจะถูกเข้ารหัสเสมอก่อนจัดเก็บ |
| จำกัดสิทธิ์การเรียกใช้งาน | ให้เรียกใช้งานเฉพาะระบบภายในที่ผ่านการตรวจสอบเท่านั้น |

---

## วงจรชีวิตของคีย์ (Key Lifecycle)

1. สร้าง DK ใหม่ (POST /keys/generate)
2. เข้ารหัส DK ด้วย Master Key (Key Wrapping)
3. จัดเก็บ DK ที่เข้ารหัสในฐานข้อมูล
4. ถอดรหัส DK ตามคำขอเพื่อใช้งาน (POST /keys/decrypt)
5. ลบ DK เมื่อไม่ใช้งานแล้ว เช่น หลังไฟล์ถูกลบ

---

## การติดตั้งและใช้งาน

### ความต้องการเบื้องต้น

- Node.js เวอร์ชัน 18 ขึ้นไป
- Docker (ถ้าต้องการรันแบบ Container)
- MongoDB

### ตัวแปรแวดล้อม (.env)

```
PORT=4000
MONGO_URI=mongodb://localhost:27017/kms
MASTER_KEY_SECRET=your-super-secret
```

### รันระบบ

```bash
npm install
npm run start:dev
```

### ใช้งานผ่าน Docker

```bash
docker-compose up --build -d
```

---

## API ที่ให้บริการ

| Method | Endpoint | คำอธิบาย |
| --- | --- | --- |
| POST | /keys/generate | สร้าง Data Key ใหม่ |
| POST | /keys/encrypt | เข้ารหัสข้อมูลด้วย DK |
| POST | /keys/decrypt | ถอดรหัสข้อมูลด้วย DK |
| POST | /keys/rotate | เวอร์ชัน/หมุนเวียน Master Key |
| DELETE | /keys/:id | ลบ Data Key ออกจากระบบ |

> หมายเหตุ: ทุก API ควรจำกัดการเข้าถึงเฉพาะ IP ภายในหรือผ่านระบบ Auth ภายในองค์กร

---

## แนวทางการใช้งานร่วมกับระบบอื่น (เช่น Inspect Drive)

1. ระบบหลักอัปโหลดไฟล์ลับเรียก `/keys/generate` เพื่อสร้าง DK
2. บันทึก DK ที่ถูกเข้ารหัสไว้พร้อมไฟล์
3. ตอนดาวน์โหลดไฟล์เรียก `/keys/decrypt` เพื่อถอดรหัส DK
4. ใช้ DK ถอดรหัสไฟล์ลบ DK เมื่อไม่จำเป็น

---

## นโยบายความมั่นคงปลอดภัยที่เกี่ยวข้อง

| ประเด็น | แนวปฏิบัติของระบบ KMS |
| --- | --- |
| การหมุนเวียน Master Key | รองรับการ Trigger หรือตั้งเวลาเพื่อหมุนเวียนคีย์อัตโนมัติ |
| การเก็บ Audit Log | เก็บ Log อย่างเป็นระบบและปลอดภัย ไม่แก้ไขย้อนหลังได้ |
| การแยกบทบาทผู้ใช้งาน | ไม่เปิดใช้งานกับบุคคลภายนอกหรือผู้ใช้งานโดยตรง |
| การรักษาข้อมูลลับ | ไม่มีการจัดเก็บ DK แบบ Plaintext |
| มาตรฐานการเข้ารหัส | ใช้ AES-256-GCM ตามข้อกำหนดของ NIST |

---

## โครงสร้างโฟลเดอร์

| Path | รายละเอียด |
| --- | --- |
| `src/keys` | จัดการการสร้าง, เข้ารหัส, ถอดรหัส, และหมุนเวียน Data Key (DK) |
| `src/logger` | จัดการระบบ Logging ด้วย Winston และ Daily Rotate Logs |
| `src/config` | โหลดตัวแปรแวดล้อมและค่าคอนฟิกของระบบ |
| `src/app.module.ts` | โมดูลหลักของ NestJS ที่รวมบริการและโมดูลต่าง ๆ |
| `src/main.ts` | Entry point ของ NestJS |
| `logs/` | โฟลเดอร์เก็บไฟล์ Log ที่หมุนเวียนตามวัน |
| `.env` | ตัวแปรระบบ เช่น MONGODB_URI, MASTER_KEY |
| `Dockerfile` | Docker config สำหรับ Key Management Service (KMS) |
| `docker-compose.yml` | กำหนดบริการ KMS + MongoDB สำหรับ Development/Local |

---

## เทคโนโลยีที่ใช้

| Category | Tools |
| --- | --- |
| Runtime | Node.js 18+ |
| Framework | NestJS (TypeScript) |
| Database | MongoDB |
| Encryption | AES-256-GCM (Node.js crypto module) |
| Logger | Winston, Daily Rotate |
| Containerization | Docker, Docker Compose |

---

## ผู้พัฒนา

**พ.อ.ท.อภิศักดิ์ แซ่ลิ้ม**

---

## License

This service is proprietary and intended for internal organizational use only.
