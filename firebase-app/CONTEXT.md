# Project Context & Rules

## ⚠️ กฏเหล็กที่ห้ามละเมิดเด็ดขาด (Strict Rules)
1. **ห้ามลบไฟล์ `migrate.html` ออกจากระบบโดยพลการเด็ดขาด!** 
   - ไฟล์นี้ยังต้องใช้สำหรับการอัปโหลดข้อมูลในขั้นตอนสุดท้าย
   - ที่ยังอัปโหลดไม่หมดเพราะตอนนี้ติดปัญหาโควต้า (Quota) ของ Firebase
   - หากเป็นการถาม หรือให้เสนอวิธีแก้ หรือหาสาเหตุ ห้ามแก้ในทันทีให้รายงานมาก่อน และหยุดการทำงานทันทีจนกว่าจะได้รับคำสั่งเปลี่ยนแปลงจากผู้ใช้
2. **ลำดับการทำงาน (Workflow Priority):**
   - การแก้บัคและปรับปรุงระบบ (UI/UX, Logic) คือความสำคัญอันดับหนึ่งในตอนนี้
   - การอัปโหลดข้อมูลขึ้น Firebase จะเป็น "ขั้นตอนสุดท้าย" หลังจากแก้ระบบเสร็จสมบูรณ์แล้วเท่านั้น

## 🏢 ข้อมูลและจุดประสงค์ของโครงการ (Project Overview)
- **ชื่อโปรเจกต์:** ผังห้องว่าง (Room Availability Dashboard)
- **จุดประสงค์:** เป็นระบบบริหารจัดการห้องพัก/หอพักแบบ Real-time (เช่น โครงการ กอล์ฟวิว, กอล์ฟซิตี้, เมเปิลซิตี้ ฯลฯ) เพื่อให้แอดมินหรือพนักงานสามารถดูสถานะห้อง (ว่าง, จอง, ไม่ว่าง, ปรับปรุง, ออกคืนประกัน, ตัดหนี) อัปเดตข้อมูลการเข้าพัก ดูภาพรวมสถิติ (Dashboard) และออกรายงาน (Excel/PDF) ได้อย่างรวดเร็ว

## 💻 โครงสร้างและเทคโนโลยีที่ใช้ (Tech Stack & Architecture)
1. **Frontend:** 
   - HTML5, CSS3, JavaScript (Vanilla ES6)
   - **Styling:** Tailwind CSS (ผ่าน CDN) และมีการเขียน Custom CSS ใน `public/css/style.css` 
   - **Fonts & Icons:** Font Awesome 6, Google Fonts (Sarabun)
   - **Architecture:** เป็นลักษณะ Single Page Application (SPA) ที่มีระบบสลับหน้า (Routing) ในตัว เช่น `#view-login` และ `#view-main` โค้ดถูกแยกเป็นโมดูล เช่น `app.js`, `db.js`, `utils.js` และไฟล์ View ต่างๆ ในโฟลเดอร์ `public/js/views/`
2. **Backend & Database (Firebase):**
   - ใช้ **Firebase Firestore** เป็นฐานข้อมูลหลักแบบ Real-time (มีระบบ `onSnapshot` เพื่อซิงค์ข้อมูลให้ตรงกันโดยไม่ต้องกดรีเฟรช)
   - ใช้ **Firebase Authentication** สำหรับระบบ Login/Register
   - ใช้ **Firebase Hosting** ในการ Deploy
   - ใช้ Firebase SDK v10 (Compat mode)
3. **Libraries อื่นๆ:**
   - **SheetJS:** สำหรับระบบ Export/Import ข้อมูล Excel
   - **jsPDF / html2pdf:** สำหรับการสร้างและ Export รายงานเป็น PDF

## 🔄 บริบทการย้ายระบบ (Migration Context)
- โปรเจกต์นี้เป็นการ **ย้ายระบบ (Migration)** มาจากระบบเดิมที่ใช้ Google Apps Script (GAS) + Google Sheets
- ระบบใหม่จะใช้ Firebase Firestore แทน Google Sheets เพื่อประสิทธิภาพและความเร็ว
- เมนูบางส่วนอาจยังเชื่อมต่อกับ GAS (เช่น ใบจอง, ร้านค้า) ให้คง URL เหล่านั้นไว้ตามเดิมจนกว่าจะได้รับคำสั่งเปลี่ยนแปลง
- มีไฟล์ `public/migrate.html` สำหรับดึงข้อมูลจาก Excel ก้อนเก่าขึ้น Firestore (ห้ามลบตามกฏเหล็ก)
