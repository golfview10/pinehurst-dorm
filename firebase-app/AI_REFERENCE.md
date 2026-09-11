# 🤖 AI Reference Guide — ระบบ "ผังห้องว่าง" (Dormitory Management System)

> **วัตถุประสงค์ของเอกสาร**: ไฟล์นี้สร้างขึ้นเพื่อให้ AI ตัวใดก็ตามสามารถอ่านแล้วเข้าใจระบบทั้งหมดได้ทันทีโดยไม่ต้องอ่านไฟล์โค้ดทั้งหมด  
> **อัปเดตล่าสุด**: 2026-09-11

---

## ⚠️ กฎเหล็ก (STRICT RULES — ห้ามละเมิดเด็ดขาด)

1. **ห้ามลบไฟล์ `migrate.html` และ `migrate-buildings.html`** — ยังต้องใช้สำหรับอัปโหลดข้อมูลที่ค้างอยู่เนื่องจากปัญหา Firebase Quota
2. **ลำดับการทำงาน**: แก้บัค → อัปโหลดข้อมูลทีหลัง → แบ็คอัพขึ้น GitHub ทันทีหลังเสร็จ
3. **ถ้าเป็นการถามให้เสนอวิธีแก้หรือหาสาเหตุ** ห้ามแก้โค้ดในทันที ให้รายงานมาก่อน และหยุดรอคำสั่งจากผู้ใช้

---

## 📁 โครงสร้างไฟล์ (File Structure)

```
firebase-app/
├── .firebaserc              # Firebase project link → "smartcourt-gvsport"
├── firebase.json            # Hosting config: site "pinehurst-dorm", public dir, SPA rewrite
├── firestore.rules          # Firestore security rules
├── CONTEXT.md               # กฎเหล็กและบริบทโปรเจกต์
├── SETUP_GUIDE.md           # คู่มือติดตั้ง Firebase
├── AI_REFERENCE.md          # ⭐ ไฟล์นี้ — คู่มือ AI
├── fix.js                   # One-time fix script สำหรับแก้ index.html ที่เสียหาย
└── public/
    ├── index.html            # ⭐ หน้าหลัก SPA (664 บรรทัด) — Layout, Modals, Script loading
    ├── migrate.html          # เครื่องมืออัปโหลดข้อมูลห้องจาก Excel ขึ้น Firestore (ห้ามลบ!)
    ├── migrate-buildings.html # เครื่องมือ migrate ข้อมูลตึก (ห้ามลบ!)
    ├── css/
    │   └── style.css         # Custom CSS (43KB) — เสริม Tailwind CDN
    └── js/
        ├── firebase-config.js # ⭐ Firebase initialization + global error handler
        ├── db.js              # ⭐ Data layer — ทุก Firestore operation (887 บรรทัด)
        ├── app.js             # ⭐ Core app logic — Auth, Navigation, State, API caller (1307 บรรทัด)
        ├── utils.js           # Helpers — parseRoomInfo, export Excel/PDF, UI utilities (354 บรรทัด)
        └── views/
            ├── dashboard.js   # ⭐ Dashboard view — สถิติการ์ด, ห้องว่างตามประเภท (1196 บรรทัด)
            ├── map.js         # Visual Map view — แสดงผังตึกแบบ Zone (406 บรรทัด)
            ├── rooms.js       # Room List view — แสดงห้องเป็น Floor Plan (645 บรรทัด)
            └── settings.js    # Settings view — จัดการประเภทห้อง, สถานะ, Layout, User (1072 บรรทัด)
```

---

## 🏗️ สถาปัตยกรรม (Architecture Overview)

### Tech Stack
| Layer | Technology | Details |
|-------|-----------|---------|
| **Frontend** | HTML5 + Vanilla JS (ES6) | Single Page Application (SPA) |
| **Styling** | Tailwind CSS (CDN) + Custom CSS | Font: Sarabun + Inter, Icons: Font Awesome 6 |
| **Backend/DB** | Firebase Firestore | Real-time via `onSnapshot`, SDK v10 Compat mode |
| **Auth** | Firebase Authentication | Email/Password, JIT Migration จากระบบเดิม |
| **Hosting** | Firebase Hosting | Site: `pinehurst-dorm` |
| **Export** | SheetJS (Excel), jsPDF + html2pdf (PDF) | ผ่าน CDN |

### รูปแบบ SPA
- ระบบใช้ **hash-based routing** อย่างง่าย: `#view-login` (หน้า Login), `#view-main` (หน้าหลัก)
- หน้า Login ↔ Main สลับด้วย `display: flex/none` ตรงๆ
- ภายใน Main ใช้ `document.getElementById('mainContent').innerHTML = ...` สำหรับ render ทุก view

### Design Pattern
- **ไม่มี build step** — ทุกอย่างเป็น vanilla JS โหลดผ่าน `<script>` tag ตามลำดับ
- **Global STATE object** ใน `app.js` เก็บข้อมูลทั้งหมด
- **API Layer** ผ่าน `callApi()` → `firebaseApiHandler()` → Firestore functions ใน `db.js`
- **Real-time** ผ่าน Custom Event `roomsDataUpdated` ที่ dispatch จาก `onSnapshot`

---

## 🗂️ Firestore Collections & Data Schema

### สำคัญ: Mega-Document Architecture
ระบบใช้ **Mega-Document** pattern: แทนที่จะเก็บห้องทีละ document (1 room = 1 doc), ระบบจะรวมห้องทั้งตึกไว้ใน document เดียว → ลด Firestore reads ได้ 99%

### Collections

| Collection | Document ID Pattern | คำอธิบาย |
|-----------|-------------------|---------|
| `buildingRooms` | `{project}_{building}` เช่น `กอล์ฟวิว_A1` | ⭐ ข้อมูลห้องทั้งหมด (Mega-Doc) |
| `users` | Firebase Auth UID | ข้อมูลผู้ใช้ (username, email, role, access) |
| `settings` | auto-generated | ประเภทห้อง (name, price, detail, color, category) |
| `roomStatuses` | auto-generated | สถานะห้องที่กำหนดเอง + สี |
| `layouts` | `{project}_{building}` | Template การจัดเรียงห้องในแต่ละชั้น |
| `buildingStripes` | `{project}` | สีแถบหัวตึกบนแผนที่ |
| `cardGroups` | `{project}_{cardKey}` | การจัดกลุ่มตึกสำหรับ Dashboard card |
| `summaryCards` | auto-generated | การ์ดสรุปยอดรวมกำหนดเอง (Custom Aggregate Cards) เช่น ห้องว่างรวม |
| `logs` | auto-generated | Audit log (user, project, room, action, status, timestamp) |
| `rooms` | *(Legacy)* | ข้อมูลห้องแบบ 1 doc/room (ไม่ใช้แล้ว แต่ยังมี rules อยู่) |
| `projectSummary` | *(Reserved)* | สรุปโครงการ (อาจไม่ได้ใช้ active) |

### Schema: buildingRooms (Mega-Document)
```javascript
{
  project: "กอล์ฟวิว",
  building: "A1",
  updatedAt: Timestamp,
  rooms: [
    {
      roomNo: "A1101",        // เลขห้อง (ตึก+ชั้น+เลขห้อง)
      status: "ห้องว่าง",      // สถานะ: ห้องว่าง|ห้องจอง|ไม่ว่าง|ปรับปรุง|ห้องออกคืนประกัน|ห้องตัดหนี
      roomType: "Standard",   // ประเภทห้อง (จาก settings)
      moveInDate: "2025-03-15", // วันที่เข้าอยู่ (YYYY-MM-DD)
      remark: "",              // หมายเหตุ
      isSampleRoom: false,     // ห้องตัวอย่าง
      bookingDate: "",         // วันที่ทำจอง
      bookingDuration: "30",   // ระยะจอง (วัน): 30|45|60|180
      noBookingExpiry: false,  // ไม่กำหนดวันหมดจอง
      oldDocId: null           // Reference เก่า (จาก migration)
    }
    // ... more rooms
  ]
}
```

### Schema: users
```javascript
{
  username: "admin",
  email: "admin@example.com",
  role: "Admin",              // "Admin" | "Project User"
  access: ["กอล์ฟวิว", "กอล์ฟซิตี้"],  // โครงการที่เข้าถึงได้ (Admin เข้าได้ทั้งหมด)
  status: "Active",           // "Active" | "Inactive"
  createdAt: Timestamp
}
```

### Schema: settings (Room Types)
```javascript
{
  project: "กอล์ฟวิว",
  name: "Standard",           // ชื่อประเภท
  price: "3,500",             // ราคา
  detail: "ห้องเปล่า ไม่มีเฟอร์นิเจอร์",
  color: "gray",              // สีสำหรับแสดงผล (Tailwind color name)
  category: "Standard"        // หมวดหมู่ (ใช้จัดกลุ่มบน Dashboard)
}
```

### Schema: roomStatuses
```javascript
{
  project: "กอล์ฟวิว",
  name: "ห้องว่าง",
  colorType: "predefined",    // "predefined" | "hex"
  color: "emerald"            // Tailwind name หรือ "#FF5733" ถ้า hex
}
```

### Schema: layouts (Floor Layout Template)
```javascript
{
  project: "กอล์ฟวิว",
  building: "A1",
  layoutJSON: {
    "1": {                     // Floor number (String key)
      topRow: ["01", "02", "03", "STAIR", "04", "05"],
      bottomRow: ["10", "09", "08", "LIFT", "07", "06"],
      suiteRooms: ["01"],      // ห้อง Suite (ใช้ 2 columns)
      specialSlots: {          // ช่องพิเศษ
        "STAIR": { type: "stair", label: "บันได" },
        "LIFT": { type: "lift", label: "ลิฟท์" }
      }
    },
    "2": { /* ... */ }
  },
  updatedAt: Timestamp
}
```

### Schema: summaryCards (Custom Summary Cards)
```javascript
{
  project: "กอล์ฟวิว",
  title: "ห้องว่างรวม",          // ชื่อการ์ด
  color: "teal",               // สี Tailwind หรือ Hex Code
  colorType: "predefined",     // "predefined" | "hex"
  icon: "fa-layer-group",      // ไอคอน Font Awesome
  statuses: ["ห้องว่าง", "ห้องตัดหนี", "ห้องออกคืนประกัน", "ปรับปรุง", "ส่งห้องซ่อม"], // สถานะที่นำมารวม
  enabled: true,               // เปิด/ปิดการแสดงผล
  order: 0,
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

---

## 🔑 ระบบ Auth & Session

### Flow การ Login
1. ผู้ใช้กรอก **username** + **password**
2. ระบบค้น `users` collection ด้วย username → ได้ email
3. ใช้ `auth.signInWithEmailAndPassword(email, password)` 
4. **JIT Migration**: ถ้ายังไม่มีใน Firebase Auth แต่มี password ตรงใน Firestore → สร้าง Auth account อัตโนมัติ
5. บันทึก session ลง `localStorage` ผ่าน `SafeStorage` wrapper

### Session Management
- **SafeStorage**: wrapper สำหรับ localStorage ที่ fallback เป็น in-memory ถ้าอยู่ใน Incognito
- Session หมดอายุหลัง **3 วัน** (`THREE_DAYS_MS`)
- เก็บ keys: `dms_user`, `dms_login_time`, `dms_lastProject`, `dms_data_{project}`

### User Roles
| Role | สิทธิ์ |
|------|-------|
| **Admin** | เข้าถึงทุกโครงการ, จัดการผู้ใช้, Audit Logs, Backup, ใบจองกอล์ฟวิว |
| **Project User** | เข้าถึงเฉพาะโครงการใน `access` array |

---

## 📊 STATE Object (Global State)

ตัวแปร `STATE` ใน `app.js` เป็น Single Source of Truth:

```javascript
const STATE = {
  user: null,                    // { id, name, role, projects[] }
  currentProject: null,          // ชื่อโครงการที่เลือกอยู่ เช่น "กอล์ฟวิว"
  data: [],                      // ข้อมูลห้องทั้งหมดของโครงการปัจจุบัน
  allSettings: [],               // ประเภทห้องทุกโครงการ
  projectRoomTypes: [],          // ประเภทห้องของโครงการปัจจุบัน
  allRoomStatuses: [],           // สถานะห้องทุกโครงการ
  projectRoomStatuses: [],       // สถานะห้องของโครงการปัจจุบัน
  currentView: 'dashboard',     // View ปัจจุบัน: dashboard|visual_map|room_list|settings|...
  currentBuildingFilter: null,   // ตึกที่กรองอยู่
  currentFloor: null,            // ชั้นที่เลือก
  roomListViewMode: 'floor_plan',
  layouts: {},                   // Floor layout templates per building
  buildingStripes: {},           // สีแถบตึก
  cardGroups: {},                // กลุ่มตึกบน Dashboard
  _dashCols: 4,                  // จำนวนคอลัมน์ Dashboard grid
  logsDate: Date,                // วันที่ดู Logs
  logsFilter: { project, search }
};
```

---

## 🖥️ Views & Navigation

### 1. Dashboard (`dashboard.js` → `renderDashboard()`)
- **สถิติการ์ด**: แสดง 6 สถานะ + การ์ด "ทั้งหมด" (dynamic จาก `projectRoomStatuses`)
- **ห้องว่างตามประเภท**: Grid แสดงแยกตาม roomType + category grouping
- **Expired Booking Alert**: ตรวจจับห้องจองที่เกินกำหนด → แจ้งเตือน
- Card grouping: ใช้ `cardGroups` จาก Firestore กำหนดว่าแต่ละการ์ดจะจัดกลุ่มตึกยังไง

### 2. Visual Map (`map.js` → `renderVisualMap()`)
- แสดงผังตึกแบบ **Zone** (A, B, C, D, F, M, N, U, อื่นๆ)
- แต่ละตึกแสดงเป็น compact card: สี stripe + สถิติห้อง + คลิกเข้า Room List
- **Building Stripe Editor**: กำหนดสีแถบตึก (predefined หรือ hex)
- ค้นหาห้องด้วย Room Search

### 3. Room List (`rooms.js` → `renderRoomList()`)
- **Floor Plan View**: แสดงห้องเป็น 2 แถว (บน/ล่าง) จำลองทางเดิน
- รองรับ **Layout Template**: Suite rooms (span 2), Special slots (บันได, ลิฟท์, ร้านค้า)
- คลิกห้อง → เปิด Modal แก้ไขข้อมูล
- Dynamic sizing ตามจำนวนห้องต่อชั้นและจำนวนชั้น

### 4. Settings (`settings.js` → `renderSettings()`)
- **ประเภทห้องพัก**: CRUD room types (name, price, detail, color, category)
- **สถานะห้อง**: CRUD room statuses (name, color — predefined/hex)
- **กลุ่มตัวเลขการ์ด**: จัดกลุ่มตึกสำหรับแต่ละ Dashboard card
- **Floor Layout Editor**: กำหนดการจัดเรียงห้อง (topRow/bottomRow, suite, special)
- **จัดการผู้ใช้** (Admin only): CRUD users
- **สำรองข้อมูล** (Admin only): Export ทุกโครงการเป็น Excel

### 5. Audit Logs (`app.js` → `renderLogs()`)
- แสดงประวัติการทำงาน (Admin only)
- กรองตามวันที่, โครงการ, คำค้น
- ข้อมูลจาก `logs` collection

---

## 🔄 Data Flow & Real-time

### การโหลดข้อมูล
```
selectProject(project)
  ├── fetchLayouts(project)           → STATE.layouts
  ├── fetchBuildingStripes(project)    → STATE.buildingStripes
  ├── fetchCardGroups(project)        → STATE.cardGroups
  └── fetchProjectData(project)       → STATE.data
       ├── ตรวจ localStorage cache ก่อน → render ทันที
       └── callApi('getProjectData')
            └── handleGetProjectDataFirebase()
                 └── onSnapshot(buildingRooms)  ← Real-time listener
                      └── dispatch 'roomsDataUpdated' event
                           └── Re-render current view
```

### Real-time Update Flow
1. `db.js` ตั้ง `onSnapshot` listener บน `buildingRooms` collection
2. เมื่อมีการเปลี่ยนแปลง → aggregate ห้องจากทุก building doc → `projectDataCache[project]`
3. Dispatch `CustomEvent('roomsDataUpdated')` → `app.js` listener
4. `app.js` อัปเดต `STATE.data` + re-render view ปัจจุบัน

### Quota Optimization
- **ฟังแค่โครงการเดียว**: เมื่อสลับโครงการ จะ unsubscribe listener ของโครงการเก่า
- **Mega-Document**: ลด reads (แทนที่จะอ่าน 1000 doc อ่านแค่ ~20 doc ต่อโครงการ)
- **Offline persistence ปิดอยู่**: หลีกเลี่ยง IndexedDB bugs (`INTERNAL ASSERTION FAILED`)

---

## 🔧 API Layer — `callApi()` → `firebaseApiHandler()`

| Action | Function ใน db.js | คำอธิบาย |
|--------|-------------------|---------|
| `login` | `handleLoginFirebase()` | Login ด้วย username+password |
| `register` | `handleRegisterFirebase()` | ลงทะเบียนผู้ใช้ใหม่ |
| `getProjectData` | `handleGetProjectDataFirebase()` | ดึงข้อมูลห้อง + ตั้ง real-time listener |
| `saveRoomData` | `handleSaveRoomDataFirebase()` | บันทึกข้อมูลห้อง (ใช้ transaction) |
| `addRoom` | `handleAddRoomFirebase()` | เพิ่มห้องใหม่ |
| `getSettings` | `handleGetSettingsFirebase()` | ดึงประเภทห้อง |
| `saveSettings` | `handleSaveSettingsFirebase()` | บันทึกประเภทห้อง (delete all + re-add) |
| `getRoomStatuses` | `handleGetRoomStatusesFirebase()` | ดึงสถานะห้อง |
| `saveRoomStatuses` | `handleSaveRoomStatusesFirebase()` | บันทึกสถานะห้อง |
| `getUsers` | `handleGetUsersFirebase()` | ดึงรายชื่อผู้ใช้ (Admin) |
| `manageUser` | `handleManageUserFirebase()` | CRUD ผู้ใช้ (Admin) |
| `getLayouts` | `handleGetLayoutsFirebase()` | ดึง floor layout |
| `saveLayout` | `handleSaveLayoutFirebase()` | บันทึก floor layout |
| `deleteLayout` | `handleDeleteLayoutFirebase()` | ลบ floor layout |
| `getBuildingStripes` | `handleGetBuildingStripesFirebase()` | ดึงสีแถบตึก |
| `saveBuildingStripes` | `handleSaveBuildingStripesFirebase()` | บันทึกสีแถบตึก |
| `getCardGroups` | `handleGetCardGroupsFirebase()` | ดึงกลุ่มการ์ด |
| `saveCardGroups` | `handleSaveCardGroupsFirebase()` | บันทึกกลุ่มการ์ด |
| `getSummaryCards` | `handleGetSummaryCardsFirebase()` | ดึงการ์ดสรุปยอดรวม |
| `saveSummaryCard` | `handleSaveSummaryCardFirebase()` | บันทึกการ์ดสรุปยอดรวม |
| `deleteSummaryCard` | `handleDeleteSummaryCardFirebase()` | ลบการ์ดสรุปยอดรวม |

### Return Format
ทุก API คืนค่ารูปแบบ `{ success: true/false, message?, data? }` — เหมือนระบบเดิม (Google Apps Script)

---

## 🏠 ข้อมูลเลขห้อง (Room Number Convention)

### โครงสร้างเลขห้อง
```
A1 1 01
│  │ │
│  │ └── เลขห้อง (2 ตัวท้าย)
│  └──── ชั้น (ตัวที่ 3 จากท้าย)
└─────── ชื่อตึก (ที่เหลือข้างหน้า)
```

**ตัวอย่าง:**
- `A1101` → ตึก A1, ชั้น 1, ห้อง 01
- `B3205` → ตึก B3, ชั้น 2, ห้อง 05
- `M1803` → ตึก M1, ชั้น 8, ห้อง 03

### Function: `parseRoomInfo(roomNo)` (ใน `utils.js`)
```javascript
parseRoomInfo("A1101") 
// → { building: "A1", floor: 1, roomIndex: "01", full: "A1101" }
```

### Function: `parseRoomInfoForDb(roomNo)` (ใน `db.js`)
ใช้สำหรับหา building name เพื่อสร้าง Mega-Document ID:
```javascript
parseRoomInfoForDb("A1101") 
// → { building: "A1", full: "A1101" }
```

---

## 🏢 โครงการ (Projects)

ระบบรองรับ 5 โครงการ (hardcode ใน `firebase-config.js`):
```javascript
const PROJECTS = ["กอล์ฟวิว", "กอล์ฟซิตี้", "กอล์ฟแมนชั่น", "เมเปิลซิตี้", "เมเปิลแมนชั่น"];
```

### Zone Config (เฉพาะ Visual Map)
กอล์ฟวิว มีโครงสร้าง Zone:
- **Zone A**: A1-A8
- **Zone B**: B1-B8
- **Zone C**: C1-C8
- **Zone D**: D1-D8
- **Zone F**: F1-F2
- **Zone M**: M, M1-M8
- **Zone N**: N, N1-N8
- **Zone U**: U1-U8

---

## 🎨 สถานะห้อง (Room Statuses)

### สถานะ Default (6 สถานะหลัก)
| สถานะ | สี (Tailwind) | Icon |
|-------|-------------|------|
| ห้องว่าง | emerald | `fa-door-open` |
| ไม่ว่าง | red | `fa-user-check` |
| ห้องจอง | yellow | `fa-calendar-check` |
| ห้องออกคืนประกัน | cyan | `fa-money-bill-transfer` |
| ห้องตัดหนี | purple | `fa-user-slash` |
| ปรับปรุง | gray | `fa-screwdriver-wrench` |

### Legacy Status Mapping
ระบบจัดการ status เก่าที่อาจมาจาก migration:
- `ว่าง` → `ห้องว่าง`
- `จอง` → `ห้องจอง`
- `รอซ่อม` / `ชำรุด` → `ปรับปรุง`
- `คืนประกัน` → `ห้องออกคืนประกัน`
- `ตัดหนี` → `ห้องตัดหนี`

### Custom Statuses
Admin สามารถเพิ่ม/แก้ไขสถานะผ่านหน้า Settings → รองรับทั้ง predefined color และ hex color

---

## 📱 UI Components (Modals & Elements)

### Room Modal (`#roomModal`)
- เปิดด้วย `openModal(rowIndex)` — แสดง form แก้ไขห้อง
- Fields: เลขห้อง (disabled), ประเภท, สถานะ, ระยะจอง, วันที่เข้าอยู่, หมายเหตุ, ห้องตัวอย่าง
- บันทึกด้วย `saveRoomData()` → `callApi('saveRoomData')`

### Report Modal (`#reportModal`)
- เปิดด้วย `openReportModal()` — ตั้งค่าการ Export
- Filters: สถานะ, ประเภท, ตึก, ชั้น, ช่วงวันที่/รายเดือน
- Export: Excel (SheetJS) หรือ PDF (html2pdf)

### Toast Notification (`#toast`)
- `showToast(title, message, type)` — type: 'success' | 'error'
- Auto-dismiss หลัง 3 วินาที

### Confirm Modal (`#alertModal`)
- `showConfirmModal(title, msg, onConfirm, iconClass, iconBgClass)`

### Loading Overlay (`#loadingOverlay`)
- `showLoading(true/false)` — spinner overlay

---

## 🔔 ระบบแจ้งเตือน (Notification System)

### Expired Booking Detection
- ตรวจสอบห้อง `ห้องจอง` ที่จองเกินกำหนด (default 30 วัน, configurable 30/45/60/180)
- คำนวณจาก `bookingDate` หรือ `moveInDate` + `bookingDuration`
- `noBookingExpiry = true` → ไม่ตรวจสอบ
- เก็บ log การแจ้งเตือนใน localStorage (`dms_notification_log`)
- แจ้งเตือนครั้งเดียวต่อห้อง (tracked ด้วย `dms_notified_expired_{project}`)

---

## 🔐 Firestore Security Rules

```
users       → read: true (for username lookup), write: true
buildingRooms → read/write: authenticated only
settings     → read/write: authenticated only
roomStatuses → read/write: authenticated only
layouts      → read/write: authenticated only
buildingStripes → read/write: authenticated only
cardGroups   → read/write: authenticated only
logs         → read: authenticated, create: authenticated (no update/delete)
```

> **หมายเหตุ**: Rules ปัจจุบันค่อนข้างเปิดกว้าง — Admin check ทำฝั่ง application code เป็นหลัก

---

## 🔧 Firebase Configuration

```javascript
const firebaseConfig = {
    apiKey: "AIzaSyClcPbCNBNZGF3u2bffl7jzMzsy0IH2Jnk",
    authDomain: "smartcourt-gvsport.firebaseapp.com",
    projectId: "smartcourt-gvsport",
    storageBucket: "smartcourt-gvsport.firebasestorage.app",
    messagingSenderId: "1098274282918",
    appId: "1:1098274282918:web:241e878678db797ad84367"
};
```

- **Firebase Project ID**: `smartcourt-gvsport`
- **Hosting Site**: `pinehurst-dorm`
- **Firestore Region**: `asia-southeast1`
- **SDK**: v10.12.0 (Compat mode)

---

## ⚡ Deploy & Commands

```bash
# Deploy ทั้งหมด
firebase deploy

# Deploy เฉพาะ Hosting
firebase deploy --only hosting

# Deploy เฉพาะ Firestore Rules
firebase deploy --only firestore:rules
```

---

## 🐛 Known Issues & Workarounds

### 1. INTERNAL ASSERTION FAILED
- **สาเหตุ**: IndexedDB cache corruption จาก multi-tab หรือ schema change
- **แก้ไข**: Global error handler ใน `firebase-config.js` ดักจับ → ลบ IndexedDB + reload
- **Prevention**: Offline persistence ปิดอยู่

### 2. Duplicate Function Declaration
- `handleGetRoomStatusesFirebase()` และ `handleSaveRoomStatusesFirebase()` ถูกประกาศ 2 ครั้งใน `db.js` (บรรทัด ~462 และ ~567) — ตัวหลังจะ override ตัวแรก

### 3. Firebase Quota Limitation
- Spark Plan: 50K reads/day, 20K writes/day
- ข้อมูล migration ยังค้างเนื่องจาก quota

### 4. Legacy Data
- ระบบอาจมี status เก่า (`ว่าง`, `จอง`, `รอซ่อม`) → มี mapping logic ใน dashboard, map, rooms

---

## 🔗 External Links (ยังใช้ GAS อยู่)

| Link | ใช้ที่ | คำอธิบาย |
|------|-------|---------|
| ใบจองกอล์ฟวิว | Sidebar + Mobile nav | Google Apps Script URL (แสดงเฉพาะ Admin/ผู้มีสิทธิ์กอล์ฟวิว) |
| ร้านค้า | Sidebar + Mobile nav | Google Apps Script URL (แสดงทุกคน) |

> **ห้ามแก้ไข URL เหล่านี้** จนกว่าจะได้รับคำสั่งจากผู้ใช้

---

## 📝 Key Functions Quick Reference

### Core (app.js)
| Function | คำอธิบาย |
|----------|---------|
| `checkSession()` | ตรวจ Firebase Auth state + localStorage fallback |
| `initApp()` | เริ่มต้นหลัง login สำเร็จ — แสดง main view, fetch settings |
| `selectProject(p)` | เลือกโครงการ → โหลด layouts, stripes, cardGroups, data |
| `fetchProjectData(project)` | โหลดข้อมูลห้อง + ตั้ง real-time listener |
| `callApi(action, payload)` | API caller wrapper พร้อม loading overlay |
| `openModal(rowIndex)` | เปิด Room Modal สำหรับแก้ไขห้อง |
| `saveRoomData()` | อ่านค่าจาก Modal → บันทึกลง Firestore |
| `getStatusColor(status)` | คืนค่า hex color ของสถานะ (ใช้สำหรับ inline style) |
| `getStatusConfig(status)` | คืนค่า config object ของสถานะ (colorType, color, name) |

### Data Layer (db.js)
| Function | คำอธิบาย |
|----------|---------|
| `firebaseApiHandler(request)` | Central API dispatcher |
| `handleGetProjectDataFirebase(project)` | ดึงข้อมูล + onSnapshot listener |
| `handleSaveRoomDataFirebase(project, rowIndex, data, userName)` | บันทึกด้วย Transaction |
| `logAction(userName, project, room, action, info, status)` | เขียน Audit Log |

### Utilities (utils.js)
| Function | คำอธิบาย |
|----------|---------|
| `parseRoomInfo(roomNo)` | แยกเลขห้อง → building, floor, roomIndex |
| `formatDateThai(dateStr)` | แปลง YYYY-MM-DD → DD/MM/พ.ศ. |
| `showLoading(bool)` | แสดง/ซ่อน loading overlay |
| `showToast(title, msg, type)` | แจ้งเตือน toast |
| `showConfirmModal(...)` | แสดง confirm dialog |
| `confirmExport(type)` | ส่งออก Excel/PDF ตาม filter |

---

## 🔄 Migration Context

- ระบบนี้ **ย้ายมาจาก Google Apps Script (GAS) + Google Sheets**
- `db.js` ออกแบบเป็น **drop-in replacement** ของ `code.js` (GAS backend) — คืนค่ารูปแบบเดียวกัน
- เลขห้องเดิมเก็บใน `oldDocId` field สำหรับ backward compatibility
- บางเมนูยังเชื่อมต่อ GAS (ใบจอง, ร้านค้า) → คง URL ไว้ตามเดิม
- ไฟล์ `migrate.html` ใช้สำหรับดึงข้อมูลจาก Excel ขึ้น Firestore → **ห้ามลบ**

---

## 💡 Tips สำหรับ AI ที่จะแก้ไขระบบ

1. **Script Loading Order สำคัญมาก**: `firebase-config.js` → `db.js` → `utils.js` → `app.js` → views (dashboard, map, rooms, settings)
2. **ทุก function เป็น global**: ไม่มี modules/import — ระวังชื่อซ้ำ
3. **Tailwind CDN**: class ที่ใช้ใน JS ต้องมี hidden element ใน `index.html` (safelist trick ท้ายไฟล์) เพื่อให้ Tailwind compile
4. **Cache busting**: ใช้ `?v=27` ท้าย script src — ต้องเพิ่มเลข version เมื่อแก้ไขไฟล์
5. **Transaction**: การแก้ไขห้องใช้ Firestore Transaction เพื่อป้องกัน race condition
6. **สถานะ Default**: `ensureDefaultRoomStatuses()` จะ inject 6 สถานะ default ถ้ายังไม่มี
7. **ห้ามใช้ Firestore offline persistence**: จะทำให้เกิด INTERNAL ASSERTION FAILED
