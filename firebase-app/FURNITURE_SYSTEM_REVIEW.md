# 📋 รายงานการรีวิวระบบผังเฟอร์นิเจอร์ (Furniture Management System Review)

**โครงการ**: ระบบจัดการหอพัก (Pinehurst Dormitory Management System)  
**วันที่รีวิว**: 9 พฤศจิกายน 2026  
**ขอบเขตการตรวจสอบ**:
- หน้าจอและการใช้งานจริง (`ผังเฟอร์นิเจอร์ (ไม่รวมห้องรายวัน)`)
- โค้ดส่วนแสดงผล: [`public/js/views/furniture.js`](file:///c:/Users/acer/Documents/pinehurst-dorm/firebase-app/public/js/views/furniture.js), [`public/js/views/rooms.js`](file:///c:/Users/acer/Documents/pinehurst-dorm/firebase-app/public/js/views/rooms.js), [`public/js/views/settings.js`](file:///c:/Users/acer/Documents/pinehurst-dorm/firebase-app/public/js/views/settings.js)
- โค้ดส่วนจัดการฐานข้อมูลและสถานะ: [`public/js/db.js`](file:///c:/Users/acer/Documents/pinehurst-dorm/firebase-app/public/js/db.js), [`public/js/app.js`](file:///c:/Users/acer/Documents/pinehurst-dorm/firebase-app/public/js/app.js)
- กฎความปลอดภัยฐานข้อมูล: [`firestore.rules`](file:///c:/Users/acer/Documents/pinehurst-dorm/firebase-app/firestore.rules)

---

## 📊 บทสรุปผู้บริหาร (Executive Summary)

ระบบผังเฟอร์นิเจอร์ถูกออกแบบสถาปัตยกรรมพื้นฐานมาได้ดีมาก โดยใช้รูปแบบ **Mega-Document** (`roomFurniture` แยกตามตึก) ร่วมกับ **Firestore Transaction** ในการเพิ่ม/คืน/โอนย้ายสต๊อก ซึ่งช่วยลดค่าใช้จ่าย Firebase Quota และป้องกันปัญหาข้อมูลชนกัน (Race Condition) ได้อย่างมีประสิทธิภาพ

อย่างไรก็ตาม เมื่อประเมินในมุมของ **ผู้ใช้งานจริง (User)** และ **ผู้ตรวจสอบภายใน (Auditor)** พบจุดที่ควรปรับปรุงทั้งในด้านความสอดคล้องของคำศัพท์บนหน้าจอ, การแสดงผลตัวเลขสต๊อกแบบ Real-time, ความแม่นยำของตรรกะรายงานสต๊อกย้อนหลัง และช่องโหว่ของการตรวจสอบค่าตัวเลข (Input Validation)

| มิติการประเมิน | คะแนน | สรุปภาพรวม |
| :--- | :---: | :--- |
| **1. การออกแบบหน้าจอและประสบการณ์ผู้ใช้ (UI/UX)** | ⭐⭐⭐⭐☆ (4.0/5) | มองเห็นภาพรวมง่าย แยกสีเขียว/ส้มชัดเจน แต่มีปัญหาคำถูกตัด (`เครื่...`, `ไมโ...`) และชื่อหัวข้อสต๊อกชวนสับสน |
| **2. ความคล่องตัวในการทำงาน (Operational Workflow)** | ⭐⭐⭐☆☆ (3.5/5) | เบิก-คืนง่าย แต่คลิกหัวการ์ดตึกแล้วหลุดไปหน้าผังห้องพัก และหน้าจอสต๊อกไม่อัปเดตเองเมื่อโอนย้าย |
| **3. ความถูกต้องของข้อมูลและรายงาน (Data Accuracy)** | ⭐⭐⭐☆☆ (3.0/5) | ยอดรวมหน้าแรกกรองห้องรายวันออก แต่หน้ารายละเอียดและรายงาน Excel ไม่ได้กรองออก และตรรกะดูที่มาสต๊อกคลาดเคลื่อนได้ |
| **4. ร่องรอยการตรวจสอบและการควบคุม (Audit & Control)** | ⭐⭐⭐☆☆ (3.0/5) | มี `furnitureLogs` แต่ยังขาดหน้าเรียกดูประวัติการโอน/ตัดสต๊อก และยังขาดการดักจับตัวเลขติดลบ/เกินจำนวน |

---

## 👤 ส่วนที่ 1: รีวิวในฐานะผู้ใช้งาน (User & UX/UI Perspective)

### ✅ จุดแข็งที่ทำได้ดีมาก (Strengths)
1. **การสื่อสารด้วยสี (Visual Status Indicator) เข้าใจง่ายทันที**:
   - ในการ์ดตึก (เช่น `M1`, `M2`, `M3`, `M4`) ระบบใช้ **สีเขียว** (`bg-emerald-50`) เมื่อทุกห้องในตึกมีเฟอร์นิเจอร์ชิ้นนั้นครบ (เช่น ตึก `M2` มี 83 ห้อง และมีเครื่องทำน้ำอุ่น/โซฟาครบ 83 ห้อง) และใช้ **สีส้ม** (`bg-amber-50`) เมื่อมีไม่ครบทุกห้อง ช่วยให้ผู้ดูแลมองปราดเดียวรู้ทันทีว่าตึกไหนขาดอะไร
2. **การเจาะลึกข้อมูล (Drill-down) สะดวก**:
   - คลิกที่ตัวเลขเฟอร์นิเจอร์ในการ์ดตึก ระบบจะพาไปหน้ารายละเอียดห้องพร้อมตั้งตัวกรอง (Filter) ตึกและชนิดเฟอร์นิเจอร์นั้นให้อัตโนมัติ
   - ตัวกรองในหน้ารายละเอียดรองรับการสลับดู **"ห้องที่มี"** และ **"ห้องที่ไม่มี"** ได้ทันที ช่วยให้หาห้องที่ยังขาดเฟอร์นิเจอร์ได้ง่ายมาก
3. **เชื่อมโยงกับหน้าแก้ไขห้องพักโดยตรง**:
   - ใน Modal แก้ไขข้อมูลห้องพัก (`#roomModal`) มีส่วนแสดงเฟอร์นิเจอร์ในห้อง พร้อมปุ่ม `ดูประวัติ`, `คืน`, `เพิ่ม` โดยไม่ต้องสลับกลับมาหน้าผังเฟอร์นิเจอร์

---

### ⚠️ จุดที่พบปัญหาในการใช้งานจริง (UX/UI Pain Points)

#### 1. ชื่อหัวข้อสต๊อกด้านบนไม่ตรงกับความหมายจริงและไม่ตรงกับหน้าสต๊อก (ชวนสับสนมาก)
- ในหน้าแรก ([`renderFurnitureMap`](file:///c:/Users/acer/Documents/pinehurst-dorm/firebase-app/public/js/views/furniture.js#L73-L100)):
  - กล่องซ้าย (สีม่วง) แสดงข้อมูลจาก `centralStock` แต่ใช้ชื่อหัวข้อว่า **“จำนวนเครื่องใช้ไฟฟ้าที่ไม่มีในระบบ”** (แต่พอไม่มีข้อมูล กลับแสดงข้อความว่า *"ไม่มีสต็อกส่วนกลาง"*)
  - กล่องขวา (สีเขียว) แสดงข้อมูลจาก `buildingStock` แต่ใช้ชื่อหัวข้อว่า **“ยอดคืนเครื่องใช้ไฟฟ้าที่มีในสต๊อก”** (แต่พอไม่มีข้อมูล กลับแสดงข้อความว่า *"ยังไม่มีการเบิกออก"*)
- พอผู้ใช้กดปุ่ม **“สต๊อก”** มุมขวาบนเข้าไปหน้า [`renderFurnitureStockPanel`](file:///c:/Users/acer/Documents/pinehurst-dorm/firebase-app/public/js/views/furniture.js#L1331-L1381) ชื่อกลับเปลี่ยนเป็น **“สต๊อกส่วนกลาง”** และ **“สต๊อกตามตึก”**
- **ผลกระทบต่อผู้ใช้**: พนักงานจะสับสนว่าเมื่อกด *"เบิกไปส่วนกลาง"* ทำไมตัวเลขถึงย้ายไปอยู่ในช่อง *"จำนวนเครื่องใช้ไฟฟ้าที่ไม่มีในระบบ"* และคำว่า *"เครื่องใช้ไฟฟ้า"* ไม่ครอบคลุมเฟอร์นิเจอร์ทั่วไป เช่น โซฟา เตียง ตู้เสื้อผ้า

#### 2. ชื่อเฟอร์นิเจอร์ในการ์ดตึกถูกตัดคำจนอ่านยาก (Text Truncation)
- จากภาพหน้าจอจริง ในการ์ดตึก `M1`–`M4`:
  - คำว่า **“เครื่องทำน้ำอุ่น”** ถูกตัดเหลือเพียง **`เครื่...`**
  - คำว่า **“ไมโครเวฟ”** ถูกตัดเหลือเพียง **`ไมโ...`**
- **สาเหตุ**: การ์ดตึกถูกจำกัดความกว้างไว้ที่ `w-44` (`176px`) และแบ่งเป็น 3 คอลัมน์ (`grid-cols-3`) ใน [`generateFurnitureBuildingCard`](file:///c:/Users/acer/Documents/pinehurst-dorm/firebase-app/public/js/views/furniture.js#L547-L570)
- **ผลกระทบต่อผู้ใช้**: บนหน้าจอสัมผัส (มือถือ/iPad) ไม่สามารถเอาเมาส์ไปชี้เพื่อดู Tooltip ได้ หากมีรายการที่ขึ้นต้นเหมือนกัน (เช่น *เครื่องทำน้ำอุ่น*, *เครื่องซักผ้า*, *เครื่องดูดควัน*) ผู้ใช้จะแยกไม่ออกทันที

#### 3. คลิกที่หัวตึก (เช่น แถบสีดำ `M1`) แล้วระบบดีดออกจากผังเฟอร์นิเจอร์
- ใน [`generateFurnitureBuildingCard`](file:///c:/Users/acer/Documents/pinehurst-dorm/firebase-app/public/js/views/furniture.js#L569) กำหนดไว้ว่า:
  ```javascript
  onclick="updateActiveNav(1); renderRoomList('${bldg}')"
  ```
- **ผลกระทบต่อผู้ใช้**: เมื่อผู้ใช้ต้องการดูเฟอร์นิเจอร์ทั้งหมดของตึก `M1` จึงคลิกที่ชื่อตึก `M1` ระบบกลับพาออกไปยังเมนู **"ผังตึก/โซน" (สถานะห้องว่าง/ไม่ว่าง)** แทนที่จะเปิดหน้า `renderFurnitureRoomDetail('M1')` เพื่อดูเฟอร์นิเจอร์รายห้องของตึก `M1`

#### 4. ตัวเลขสต๊อกไม่อัปเดตบนหน้าจอทันทีหลังทำรายการ (Real-time Sync ขาดช่วง)
- ระบบมี Real-time listener (`onSnapshot`) เฉพาะคอลเลกชัน `roomFurniture` ([`handleGetRoomFurnitureFirebase`](file:///c:/Users/acer/Documents/pinehurst-dorm/firebase-app/public/js/db.js#L1719-L1760)) **แต่ไม่มี Real-time listener สำหรับ `furnitureStock`** และไม่ได้เรียก `fetchFurnitureStock()` ใหม่หลังทำรายการเสร็จ
- **ผลกระทบต่อผู้ใช้**:
  1. เมื่อกด **เบิกไปส่วนกลาง**, **เบิกกลับไปตึก**, **เพิ่มเข้าสต๊อกส่วนกลาง**, หรือ **ตัดสต๊อก** หน้าจอจะไม่เปลี่ยนแปลงตัวเลขเลยจนกว่าจะรีเฟรชหน้าเว็บหรือสลับโครงการใหม่
  2. เมื่อกด **คืนเฟอร์** หรือ **เพิ่มเฟอร์เข้าห้อง** ตัวเลขในห้องอัปเดต แต่ตัวเลขในกล่องสต๊อกด้านบนและจำนวนคงเหลือในสต๊อกตึก (`STATE.furnitureStock`) ยังค้างเป็นค่าเก่า!
  3. หากเปิดหน้ารายละเอียดเฟอร์นิเจอร์ (`furniture_detail`) ค้างไว้แล้วกดเพิ่ม/คืนเฟอร์นิเจอร์ หน้าจอจะไม่ re-render อัตโนมัติ เพราะใน [`app.js`](file:///c:/Users/acer/Documents/pinehurst-dorm/firebase-app/public/js/app.js#L101-L103) ดักรีเฟรชไว้เฉพาะหน้า `furniture_map` เท่านั้น

#### 5. ขั้นตอนการนำเฟอร์นิเจอร์จากส่วนกลางเข้าห้องต้องทำ 2 ต่อ
- หากของอยู่ในสต๊อกส่วนกลาง พนักงานไม่สามารถกดเพิ่มเข้าห้องจากส่วนกลางได้โดยตรง ต้องไปหน้าสต๊อกเพื่อ *"เบิกกลับไปตึก"* ก่อน แล้วค่อยกลับมาหน้ารายละเอียดห้องเพื่อกด *"เพิ่มเข้าห้อง"* จากสต๊อกตึก

---

## 🔍 ส่วนที่ 2: รีวิวในฐานะผู้ตรวจสอบ (Auditor & Inspector Perspective)

ในมุมมองของการตรวจสอบภายใน (Internal Audit), การตรวจนับทรัพย์สิน (Physical Count Reconciliation) และการควบคุมภายใน (Internal Control) พบประเด็นสำคัญที่ต้องระวังดังนี้:

### 🚨 ประเด็นระดับวิกฤต (Critical Findings)

#### 1. ความคลาดเคลื่อนของรายงาน “ประวัติที่มาของเฟอร์นิเจอร์ที่อยู่ในสต๊อก” (`instock` Mode)
- **จุดที่พบ**: ฟังก์ชัน [`fetchReturnedInStockReport`](file:///c:/Users/acer/Documents/pinehurst-dorm/firebase-app/public/js/views/furniture.js#L237-L261) และ [`showStockItemHistory`](file:///c:/Users/acer/Documents/pinehurst-dorm/firebase-app/public/js/views/furniture.js#L434-L450)
- **สาเหตุทางเทคนิค**:
  - ระบบหาจำนวนคงเหลือรวมทุกตึก (`transferred[itemName]`) เช่น มีโซฟาในสต๊อกรวม 2 ชิ้น
  - จากนั้นไปดึง Log การคืน (`action: 'return'`) ล่าสุด 2 รายการแรกของทั้งโครงการมาแสดงทันที **โดยไม่ได้ตรวจสอบว่าของที่ถอดจากห้องล่าสุดนั้น ถูกนำไปใส่ห้องอื่นแล้ว (`action: 'add'`) หรือถูกโอนเข้าส่วนกลางไปแล้ว (`action: 'transfer_to_central'`) หรือไม่ และไม่ได้แยกโควต้าตามตึก!**
- **ตัวอย่างผลกระทบต่อผู้ตรวจสอบ**:
  - วันที่ 1 ม.ค.: ห้อง `M1101` ถอดทีวีเข้าสต๊อกตึก `M1` (สต๊อก M1 = 1)
  - วันที่ 5 ม.ค.: ห้อง `M4101` ถอดทีวีเข้าสต๊อกตึก `M4` และในวันเดียวกัน ช่างนำทีวีตัวนั้นไปใส่ห้อง `M4102` ทันที (สต๊อก M4 = 0)
  - ปัจจุบันเหลือทีวีในสต๊อกรวม 1 เครื่อง (ซึ่งจริงๆ คือของตึก `M1` จากห้อง `M1101`)
  - แต่เมื่อผู้ตรวจสอบกดดูประวัติที่มาของทีวี 1 เครื่องในสต๊อก ระบบจะดึง Log ล่าสุดคือห้อง **`M4101`** มาแสดง! ทำให้ผู้ตรวจสอบไปตามหาของผิดตึกและผิดห้อง

#### 2. ตัวเลขหน้าแรก กับ หน้ารายงาน/หน้ารายละเอียด ไม่ตรงกัน (เรื่อง “ห้องรายวัน”)
- **จุดที่พบ**:
  - หน้าแรก [`generateFurnitureBuildingCard`](file:///c:/Users/acer/Documents/pinehurst-dorm/firebase-app/public/js/views/furniture.js#L508-L513) มีการกรองห้องที่มีคำว่า `'รายวัน'` ใน `roomType` หรือ `status` ออก ตามชื่อหน้าจอ *"ผังเฟอร์นิเจอร์(ไม่รวมห้องรายวัน)"*
  - **แต่** ในหน้ารายละเอียด [`renderFurnitureRoomDetail`](file:///c:/Users/acer/Documents/pinehurst-dorm/firebase-app/public/js/views/furniture.js#L628-L634) และหน้าออกรายงาน Excel [`generateFurnitureReport`](file:///c:/Users/acer/Documents/pinehurst-dorm/firebase-app/public/js/views/furniture.js#L1548-L1576) **ไม่ได้กรองห้องรายวันออก**
- **ผลกระทบต่อผู้ตรวจสอบ**: เมื่อผู้ตรวจสอบเห็นยอดรวมบนการ์ดตึกหน้าแรก แล้วกด Export Excel ออกมาตรวจนับ ยอดรวมในไฟล์ Excel จะไม่ตรงกับหน้าจอหลักทันทีหากตึกนั้นมีห้องรายวัน

#### 3. ช่องโหว่การกรอกจำนวนติดลบ หรือ 0 (Missing Input & Transaction Validation)
- **จุดที่พบ**: การรับค่าจำนวน (`qty`) ใน [`executeReturnFurniture`](file:///c:/Users/acer/Documents/pinehurst-dorm/firebase-app/public/js/views/furniture.js#L939), [`executeAddFurniture`](file:///c:/Users/acer/Documents/pinehurst-dorm/firebase-app/public/js/views/furniture.js#L1045), [`executeTransferToCentral`](file:///c:/Users/acer/Documents/pinehurst-dorm/firebase-app/public/js/views/furniture.js#L1148), [`executeTransferFromCentral`](file:///c:/Users/acer/Documents/pinehurst-dorm/firebase-app/public/js/views/furniture.js#L1267), [`executeDisposeCentralStock`](file:///c:/Users/acer/Documents/pinehurst-dorm/firebase-app/public/js/views/furniture.js#L1932) และใน [`db.js`](file:///c:/Users/acer/Documents/pinehurst-dorm/firebase-app/public/js/db.js#L1788-L1805)
- **สาเหตุทางเทคนิค**:
  - แม้ `<input type="number" min="1" max="...">` จะกำหนดค่าต่ำสุดไว้ แต่เบราว์เซอร์อนุญาตให้ผู้ใช้พิมพ์เลขติดลบ (เช่น `-5`) หรือ `0` หรือตัวเลขเกิน `max` ทางคีย์บอร์ดได้
  - ใน [`db.js`](file:///c:/Users/acer/Documents/pinehurst-dorm/firebase-app/public/js/db.js#L1791) ตรวจสอบเพียง `if (currentQty < quantity)` แต่ไม่ได้ตรวจสอบ `if (!Number.isInteger(quantity) || quantity <= 0)`
- **ผลกระทบต่อผู้ตรวจสอบ**: หากมีผู้กรอกค่า `-5` ในหน้าคืนเฟอร์นิเจอร์ เงื่อนไข `1 < -5` จะเป็นเท็จ (ผ่านการตรวจสอบ) และระบบจะคำนวณ `1 - (-5) = 6` ทำให้ยอดเฟอร์นิเจอร์ในห้องเพิ่มขึ้นเองโดยไม่ผ่านสต๊อก และทำให้สต๊อกตึกติดลบ

---

### 🟠 ประเด็นระดับสูง (High Findings — Audit Trail & Access Control)

#### 4. ร่องรอยการตรวจสอบ (Audit Trail) มีการบันทึก แต่ขาดหน้าจอตรวจสอบครบวงจร
- **สิ่งที่บันทึกไว้ใน `furnitureLogs` แต่ไม่มีหน้า UI ให้ผู้ตรวจสอบดู**:
  - `transfer_to_central` (เบิกจากตึกไปส่วนกลาง)
  - `transfer_from_central` (เบิกจากส่วนกลางไปตึก)
  - `add_central_stock` (Admin เพิ่มสต๊อกส่วนกลาง)
  - `dispose_central` (Admin ตัดสต๊อกส่วนกลางทิ้ง)
- **สิ่งที่ไม่ได้บันทึกลงตาราง `logs` หลัก (หน้าเมนู "ประวัติการทำงาน" ของ Admin)**:
  - การโอนย้ายสต๊อก (`transferToCentral`, `transferFromCentral`) และ **การตัดสต๊อกทิ้งถาวร (`disposeCentralStock`)** ไม่ได้เรียกฟังก์ชัน `logAction()` ลงตาราง `logs` หลัก (ในขณะที่การเพิ่มสต๊อก `addCentralStock` เรียก `logAction()` ปกติ)
  - การตั้งค่าเพิ่ม/แก้ไข/ลบชนิดเฟอร์นิเจอร์ และการกด **"ผูกเข้าห้อง" (`applyFurnitureToRooms`)** ไม่มีการบันทึก Audit Log ใดๆ เลย

#### 5. การบันทึกชื่อผู้ทำรายการ (`userName`) ไม่สม่ำเสมอ
- ใน [`executeAddCentralStock`](file:///c:/Users/acer/Documents/pinehurst-dorm/firebase-app/public/js/views/furniture.js#L1812) ใช้ `STATE.user.username` แต่ในฟังก์ชันอื่นๆ ทั้งหมดใช้ `STATE.user.name`
- ควรใช้รูปแบบเดียวกัน เช่น `STATE.user?.name || STATE.user?.username || 'Unknown'` ทุกจุด เพื่อให้ชื่อผู้ใช้งานในรายงาน Audit ตรงกันเสมอ

#### 6. การควบคุมสิทธิ์ระดับ Database (`db.js` และ `firestore.rules`)
- ปัจจุบันการจำกัดสิทธิ์เฉพาะ Admin สำหรับ `addCentralStock` (เพิ่มสต๊อก) และ `disposeCentralStock` (ตัดสต๊อก) ตรวจสอบเฉพาะที่ฝั่ง UI (`furniture.js`) เท่านั้น
- ใน [`db.js`](file:///c:/Users/acer/Documents/pinehurst-dorm/firebase-app/public/js/db.js#L2117-L2210) และ [`firestore.rules`](file:///c:/Users/acer/Documents/pinehurst-dorm/firebase-app/firestore.rules#L106-L128) อนุญาตให้ผู้ใช้ที่ล็อกอินทุกคน (`isAuthenticated()`) แก้ไข `furnitureItems` และ `furnitureStock` ได้โดยยังไม่ได้บังคับใช้ฟังก์ชัน `isAdmin()` ที่มีอยู่ในไฟล์ `firestore.rules`

#### 7. ข้อมูลตกค้างเมื่อลบห้องพักหรือลบชนิดเฟอร์นิเจอร์ (Orphaned Data)
- เมื่อมีการลบห้องพัก (`softDeleteRoom` / `permanentDeleteRoom`) ข้อมูลเฟอร์นิเจอร์ของห้องนั้นยังค้างอยู่ใน `roomFurniture` (แม้ในหน้าแผนที่จะไม่ถูกนับรวมเพราะกรองจาก `STATE.data` แต่หากห้องนั้นมีเฟอร์นิเจอร์อยู่จริง เท่ากับเฟอร์นิเจอร์หายไปจากระบบโดยไม่ได้ถูกคืนเข้าสต๊อกตึก)
- ใน [`openAddCentralStockModal`](file:///c:/Users/acer/Documents/pinehurst-dorm/firebase-app/public/js/views/furniture.js#L1729-L1733) ใช้ `id="add_central_qty_${name}"` โดยไม่ได้แปลงช่องว่างเป็น `_` (`.replace(/\s/g, '_')`) ซึ่งอาจทำให้เกิดบั๊กหากชื่อเฟอร์นิเจอร์มีเว้นวรรค

---

## 💡 ส่วนที่ 3: คำแนะนำและแนวทางการพัฒนาต่อยอด (Recommendations)

เพื่อยกระดับระบบให้ใช้งานง่ายสำหรับพนักงาน และโปร่งใสตรวจสอบได้ 100% สำหรับผู้ตรวจสอบ ขอแนะนำแนวทางปรับปรุงตามลำดับความสำคัญดังนี้:

### 🔴 Priority 1: แก้ไขความถูกต้องของข้อมูลและ Real-time Sync (แนะนำให้ทำทันที)

1. **เพิ่ม Real-time Listener หรือ Auto-fetch สำหรับ `furnitureStock` และอัปเดตทุก View**:
   - เพิ่ม `onSnapshot` ให้กับคอลเลกชัน `furnitureStock` ใน [`db.js`](file:///c:/Users/acer/Documents/pinehurst-dorm/firebase-app/public/js/db.js) (เหมือนกับ `roomFurniture`) เพื่อให้ตัวเลขสต๊อกส่วนกลางและสต๊อกตามตึกอัปเดตทันทีแบบ Real-time
   - ใน [`app.js`](file:///c:/Users/acer/Documents/pinehurst-dorm/firebase-app/public/js/app.js#L97-L105) เมื่อข้อมูลเฟอร์นิเจอร์หรือสต๊อกอัปเดต ให้สั่ง re-render ทั้งหน้า `furniture_map`, `furniture_detail`, และ `furniture_stock`
2. **ปรับปรุงการกรอง "ห้องรายวัน" ให้ตรงกันทุกหน้า**:
   - สร้างฟังก์ชันกลาง เช่น `isDailyRoom(room)` เพื่อใช้กรองห้องรายวันออกเหมือนกันทั้งใน `renderFurnitureMap`, `renderFurnitureRoomDetail`, และ `generateFurnitureReport` (หรือเพิ่มตัวเลือก Checkbox ในหน้ารายงานว่า *"รวมห้องรายวันหรือไม่"*)
3. **เพิ่มการตรวจสอบค่าตัวเลข (Input Validation) ทั้งฝั่ง Frontend และ Transaction**:
   - ดักจับว่าจำนวน (`qty`) ต้องเป็นจำนวนเต็มบวก (`Number.isInteger(qty) && qty >= 1`) และห้ามเกินจำนวนที่มีอยู่ในห้องหรือในสต๊อก
4. **แก้ไขตรรกะรายงาน "ยอดที่ยังอยู่ในสต๊อกปัจจุบัน" (`instock` Mode)**:
   - เปลี่ยนจากการนับย้อนหลังรวมทั้งโครงการ เป็นการ **คำนวณแยกตามตึก (`buildingStock[bldg][itemName]`)** โดยดึงเฉพาะ Log การคืน (`action: 'return'`) ของตึกนั้นๆ นับย้อนหลังจากล่าสุดตามจำนวนที่ค้างอยู่ในสต๊อกของตึกนั้นจริงๆ จะทำให้ระบุห้องที่มาของเฟอร์นิเจอร์ที่ค้างอยู่ในแต่ละตึกได้แม่นยำขึ้นมาก

---

### 🟡 Priority 2: ปรับปรุง UX/UI ให้ใช้งานง่ายและไม่สับสน

1. **ปรับชื่อหัวข้อสต๊อกให้ชัดเจนและตรงกันทุกหน้า**:
   - กล่องสีม่วง: เปลี่ยนจาก *"จำนวนเครื่องใช้ไฟฟ้าที่ไม่มีในระบบ"* เป็น **“สต๊อกส่วนกลาง (รอกระจาย/ไม่ได้ผูกห้อง)”**
   - กล่องสีเขียว: เปลี่ยนจาก *"ยอดคืนเครื่องใช้ไฟฟ้าที่มีในสต๊อก"* เป็น **“สต๊อกประจำตึก (ถอดจากห้อง/พร้อมเบิกใช้)”** พร้อมแสดงรายละเอียดเมื่อเอาเมาส์ชี้หรือกดดูว่าอยู่ที่ตึกไหนบ้างกี่ชิ้น
2. **แก้ปัญหาชื่อเฟอร์นิเจอร์ถูกตัดคำในการ์ดตึก (`เครื่...`, `ไมโ...`)**:
   - ขยายความกว้างของการ์ดตึกจาก `w-44` เป็น `w-52` หรือ `w-56` หรือปรับขนาดฟอนต์ชื่อรายการให้แสดงได้เต็มคำ (หรือแบ่งเป็น 2 คอลัมน์เมื่อชื่อยาว)
3. **เปลี่ยนพฤติกรรมการคลิกหัวการ์ดตึกในหน้าผังเฟอร์นิเจอร์**:
   - เมื่อคลิกที่ชื่อตึก (เช่น `M1`) ในหน้าผังเฟอร์นิเจอร์ ให้เปิดหน้ารายละเอียดเฟอร์นิเจอร์ของตึก `M1` (`renderFurnitureRoomDetail('M1')`) แทนการกระโดดข้ามไปเมนูผังห้องพัก (และอาจเพิ่มปุ่มเล็กๆ มุมขวาบนของการ์ดหากต้องการสลับไปดูผังห้องพัก)

---

### 🟢 Priority 3: ยกระดับระบบสำหรับผู้ตรวจสอบ (Audit & Reconciliation Features)

1. **เพิ่มหน้า “ประวัติความเคลื่อนไหวเฟอร์นิเจอร์ทั้งหมด (Full Furniture Audit Log)”**:
   - ให้ผู้ตรวจสอบสามารถกรองดูประวัติได้ทุก Action ในที่เดียว ได้แก่ `คืนเข้าสต๊อกตึก`, `เพิ่มเข้าห้อง`, `โอนไปส่วนกลาง`, `โอนกลับไปตึก`, `เพิ่มสต๊อกใหม่`, และ `ตัดจำหน่ายสต๊อก` พร้อม Export เป็น Excel/PDF
   - เพิ่มการเรียก `logAction()` ใน `handleDisposeCentralStockFirebase`, `handleTransferToCentralFirebase`, และ `handleTransferFromCentralFirebase` เพื่อให้ปรากฏในหน้า Audit Logs หลักของ Admin ด้วย
2. **เพิ่มตาราง “สรุปดุลยภาพทรัพย์สิน (Asset Reconciliation Summary)” ในหน้ารายงาน**:
   - แสดงตารางสรุปยอดรวมทั้งโครงการของเฟอร์นิเจอร์แต่ละชนิดในบรรทัดเดียว:
     $$\text{รวมในห้องทั้งหมด} + \text{สต๊อกประจำตึก} + \text{สต๊อกส่วนกลาง} = \text{รวมทรัพย์สินทั้งโครงการ}$$
   - ช่วยให้ผู้ตรวจสอบและฝ่ายบัญชีสามารถตรวจนับยอดรวมทรัพย์สินเทียบกับทะเบียนทรัพย์สินได้ทันทีโดยไม่ต้องบวกเลขเองทีละตึก
3. **ระบบแจ้งเตือนเมื่อลบห้องพักที่มีเฟอร์นิเจอร์**:
   - ก่อนย้ายห้องไปถังขยะ (`softDeleteRoom`) หากห้องนั้นยังมีเฟอร์นิเจอร์ผูกอยู่ใน `roomFurniture` ให้แจ้งเตือนหรือให้ระบบโอนเฟอร์นิเจอร์เข้าสต๊อกตึกอัตโนมัติพร้อมลงบันทึก Audit Log เพื่อไม่ให้ยอดทรัพย์สินตกหล่น

