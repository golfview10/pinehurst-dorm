# 🔥 คู่มือติดตั้ง Firebase สำหรับระบบผังห้องว่าง

## 📋 สิ่งที่ต้องเตรียม

1. **Google Account** — สำหรับสร้าง Firebase project
2. **Node.js** (v18+) — ดาวน์โหลดจาก https://nodejs.org/
3. **Firebase CLI** — ติดตั้งผ่าน npm

---

## ขั้นตอนที่ 1: สร้าง Firebase Project

1. ไปที่ https://console.firebase.google.com/
2. คลิก **"Create a project"** หรือ **"Add project"**
3. ตั้งชื่อโปรเจกต์ เช่น `dormitory-management`
4. เลือก Google Analytics (ไม่จำเป็นต้องเปิด)
5. คลิก **"Create project"**

---

## ขั้นตอนที่ 2: เปิดใช้ Firestore

1. ในหน้า Firebase Console → เมนูซ้าย → **"Build"** → **"Firestore Database"**
2. คลิก **"Create database"**
3. เลือก **"Start in test mode"** (จะตั้ง rules เองทีหลัง)
4. เลือก Location → **`asia-southeast1`** (สิงคโปร์ — ใกล้ไทยที่สุด)
5. คลิก **"Enable"**

---

## ขั้นตอนที่ 3: เปิดใช้ Firebase Auth

1. ในหน้า Firebase Console → **"Build"** → **"Authentication"**
2. คลิก **"Get started"**
3. Tab **"Sign-in method"** → เปิดใช้ **"Email/Password"**
4. คลิก **"Save"**

---

## ขั้นตอนที่ 4: สร้าง Web App

1. ไปที่ **Project Settings** (ไอคอนเฟือง ⚙️ ข้างบน)
2. เลื่อนลงไป **"Your apps"** → คลิก **Web icon `</>`**
3. ตั้งชื่อ app เช่น `dormitory-web`
4. ✅ เลือก **"Also set up Firebase Hosting"**
5. คลิก **"Register app"**
6. คุณจะได้ **Firebase Config** หน้าตาแบบนี้:

```javascript
const firebaseConfig = {
    apiKey: "AIzaSy.....................",
    authDomain: "dormitory-management.firebaseapp.com",
    projectId: "dormitory-management",
    storageBucket: "dormitory-management.appspot.com",
    messagingSenderId: "123456789",
    appId: "1:123456789:web:abcdef123456"
};
```

7. **คัดลอก config นี้ไปวางแทนใน** `public/js/firebase-config.js`

---

## ขั้นตอนที่ 5: ติดตั้ง Firebase CLI

เปิด Terminal/PowerShell แล้วรัน:

```bash
npm install -g firebase-tools
```

## ขั้นตอนที่ 6: Login + Init

```bash
# Login เข้า Firebase
firebase login

# เข้าไปที่โฟลเดอร์โปรเจกต์
cd "c:\Users\acer\Documents\รายการห้องว่าง\firebase-app"

# Link กับ Firebase project
firebase use YOUR_PROJECT_ID
```

---

## ขั้นตอนที่ 7: Deploy Firestore Rules

```bash
firebase deploy --only firestore:rules
```

---

## ขั้นตอนที่ 8: สร้าง User แรก (Admin)

เนื่องจากระบบเดิมเก็บ password ใน Sheets (ไม่ปลอดภัย) เราต้องสร้าง user ใหม่:

### วิธีที่ 1: สร้างผ่านหน้า Register ของ App
1. เปิด app ที่ deploy แล้ว
2. คลิก "ลงทะเบียน"
3. กรอก username, email, password
4. ไปที่ Firebase Console → Firestore → Collection `users` → แก้ `role` เป็น `Admin`

### วิธีที่ 2: สร้างผ่าน Firebase Console
1. ไป Authentication → Users → Add user
2. กรอก email + password
3. คัดลอก UID ที่ได้
4. ไป Firestore → สร้าง document ใน `users` collection ด้วย UID นั้น:
```json
{
  "username": "admin",
  "email": "admin@example.com",
  "role": "Admin",
  "access": [],
  "status": "Active"
}
```

---

## ขั้นตอนที่ 9: ย้ายข้อมูลจาก Google Sheets

ข้อมูลที่ต้องย้าย:
1. **ข้อมูลห้อง** (5 โครงการ) → Collection `rooms`
2. **ตั้งค่าประเภทห้อง** → Collection `settings`
3. **Layout ผังตึก** → Collection `layouts`
4. **สีแถบตึก** → Collection `buildingStripes`
5. **กลุ่มการ์ด** → Collection `cardGroups`

### การ import ด้วยมือ (สำหรับข้อมูลไม่มาก)

สามารถใช้ Firebase Console เพิ่ม document ทีละรายการ หรือ export จาก Google Sheets เป็น CSV แล้วใช้ script import:

```bash
# ติดตั้ง dependency
npm install firebase-admin

# รัน migration script (สร้างเอง หรือใช้ Firebase Console import)
node migration/migrate.js
```

---

## ขั้นตอนที่ 10: Deploy to Firebase Hosting

```bash
firebase deploy --only hosting
```

หลัง deploy คุณจะได้ URL เช่น:
```
https://dormitory-management.web.app
```

---

## ❓ FAQ

### Q: ข้อมูลเดิมใน Google Sheets จะหายไหม?
**A:** ไม่หาย! เราไม่ได้แก้ไข Google Sheets เลย ข้อมูลจะยังอยู่ครบ

### Q: ถ้ายังอยากใช้ Google Sheets ต่อได้ไหม?
**A:** ได้! ไฟล์ `code.js` และ `index.html` เดิมยังอยู่ ระบบ Apps Script ยังทำงานเหมือนเดิม

### Q: ระบบ Firebase จะเร็วกว่าเดิมแค่ไหน?
**A:** เร็วกว่ามาก! Firestore มี latency ต่ำมาก (~100ms) เทียบกับ Google Sheets API (~2-5 วินาที)

### Q: ราคาเท่าไหร่?
**A:** ฟรีสำหรับ Spark Plan ที่:
- Firestore: 50K reads/day, 20K writes/day
- Hosting: 10 GB/month
- Auth: ไม่จำกัดจำนวน users
