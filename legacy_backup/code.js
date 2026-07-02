/**
 * Smart Dormitory Management System - Backend (Final Simplified)
 */

const ADMIN_EMAIL = "reportrepair.gv10@gmail.com";
const PROJECTS = ["กอล์ฟวิว", "กอล์ฟซิตี้", "กอล์ฟแมนชั่น", "เมเปิลซิตี้", "เมเปิลแมนชั่น"];

function doGet(e) {
  return HtmlService.createTemplateFromFile('index')
    .evaluate()
    .setTitle('ผังห้องว่าง')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

function apiHandler(request) {
  const { action, payload } = request;
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  try {
    switch (action) {
      case 'login': return handleLogin(ss, payload);
      case 'register': return handleRegister(ss, payload);
      case 'getProjectData': return handleGetProjectData(ss, payload);
      case 'saveRoomData': return handleSaveRoomData(ss, payload);
      case 'addRoom': return handleAddRoom(ss, payload);
      case 'getSettings': return handleGetSettings(ss);
      case 'saveSettings': return handleSaveSettings(ss, payload);
      case 'getUsers': return handleGetUsers(ss, payload);
      case 'manageUser': return handleManageUser(ss, payload);
      case 'getLayouts': return handleGetLayouts(ss, payload);
      case 'saveLayout': return handleSaveLayout(ss, payload);
      case 'deleteLayout': return handleDeleteLayout(ss, payload);
      case 'getBuildingStripes': return handleGetBuildingStripes(ss, payload);
      case 'saveBuildingStripes': return handleSaveBuildingStripes(ss, payload);
      case 'getCardGroups': return handleGetCardGroups(ss, payload);
      case 'saveCardGroups': return handleSaveCardGroups(ss, payload);
      default: throw new Error("Invalid Action");
    }
  } catch (error) {
    return { success: false, message: error.message };
  }
}

// --- AUTH ---
function handleLogin(ss, { username, password }) {
  const usersSheet = ss.getSheetByName('Users');
  const users = usersSheet.getDataRange().getValues().slice(1);
  // Robust matching: Convert both to String
  const user = users.find(u => String(u[1]) === String(username) && String(u[2]) === String(password)); 
  
  if (!user) return { success: false, message: "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง" };
  if (user[6] !== 'Active') return { success: false, message: "บัญชีของคุณยังไม่ได้รับการอนุมัติ" };
  
  return {
    success: true,
    user: { 
      id: user[0], 
      name: user[1], 
      role: user[4], 
      projects: user[4] === 'Admin' ? PROJECTS : String(user[5] || "").split(',').map(p => p.trim()).filter(p => p)
    }
  };
}

function handleRegister(ss, { username, password, email }) {
  const usersSheet = ss.getSheetByName('Users');
  if (usersSheet.getDataRange().getValues().some(u => String(u[1]) === String(username))) return { success: false, message: "ชื่อผู้ใช้นี้ถูกใช้ไปแล้ว" };
  
  const newId = 'U' + new Date().getTime();
  // Default to 'Active' for immediate use
  usersSheet.appendRow([newId, username, password, email, 'Project User', PROJECTS.join(','), 'Active']); 
  return { success: true, message: "ลงทะเบียนสำเร็จ เข้าสู่ระบบได้ทันที" };
}

// --- USER MANAGEMENT (Admin Only) ---
function handleGetUsers(ss, { user }) {
  if (!user || user.role !== 'Admin') return { success: false, message: "Access Denied" };

  const usersSheet = ss.getSheetByName('Users');
  const data = usersSheet.getDataRange().getValues();
  if (data.length <= 1) return { success: true, users: [] };

  const users = data.slice(1).map(r => ({
    id: r[0],
    username: r[1],
    // password: r[2], // Secure: Do not send password back
    email: r[3],
    role: r[4],
    access: r[5],
    status: r[6]
  }));

  return { success: true, users: users };
}

function handleManageUser(ss, { action, userData, user }) {
  if (!user || user.role !== 'Admin') return { success: false, message: "Access Denied" };

  const sheet = ss.getSheetByName('Users');
  const allData = sheet.getDataRange().getValues();
  
  if (action === 'add') {
    // Check Duplicate
    if (allData.some(r => String(r[1]) === String(userData.username))) {
      return { success: false, message: "ชื่อผู้ใช้นี้มีอยู่แล้ว" };
    }
    const newId = 'U' + new Date().getTime();
    sheet.appendRow([
      newId, 
      userData.username, 
      userData.password, 
      userData.email || '', 
      userData.role, 
      userData.access || '', 
      userData.status || 'Active'
    ]);
    return { success: true, message: "เพิ่มผู้ใช้เรียบร้อย" };

  } else if (action === 'edit') {
    const rowIdx = allData.findIndex(r => String(r[0]) === String(userData.id));
    if (rowIdx === -1) return { success: false, message: "ไม่พบผู้ใช้" };
    
    // Row is 1-indexed, so rowIdx (0-based from slice or find) + 1. 
    // BUT allData includes header, so findIndex returns exact array index. 
    // Sheet row = index + 1
    const targetRow = rowIdx + 1;
    
    // Update fields (Username, Password if changed, Email, Role, Access, Status)
    // Preservation logic for password if empty
    let currentPwd = allData[rowIdx][2];
    let newPwd = userData.password ? userData.password : currentPwd;

    // [ID, User, Pass, Email, Role, Access, Status]
    const updatedRow = [
      userData.id,
      userData.username,
      newPwd,
      userData.email,
      userData.role,
      userData.access,
      userData.status
    ];
    
    sheet.getRange(targetRow, 1, 1, 7).setValues([updatedRow]);
    return { success: true, message: "แก้ไขข้อมูลเรียบร้อย" };

  } else if (action === 'delete') {
    const rowIdx = allData.findIndex(r => String(r[0]) === String(userData.id));
    if (rowIdx === -1) return { success: false, message: "ไม่พบผู้ใช้" };
    
    sheet.deleteRow(rowIdx + 1);
    return { success: true, message: "ลบผู้ใช้เรียบร้อย" };
  }
  
  return { success: false, message: "Invalid action" };
}

// --- DATA ---
function handleGetProjectData(ss, { project }) {
  const sheet = ss.getSheetByName(project);
  if (!sheet) throw new Error("ไม่พบข้อมูลโครงการ");
  
  const lastRow = sheet.getLastRow();
  if (lastRow < 5) return { success: true, data: [] };
  
  // Fetch up to Column M (13 columns)
  const data = sheet.getRange(5, 1, lastRow - 4, 13).getValues();
  
  const formatted = data.map((r, i) => {
    let dateStr = "";
    if (r[8] instanceof Date) {
      dateStr = Utilities.formatDate(r[8], "GMT+7", "yyyy-MM-dd");
    } else {
      dateStr = r[8] ? String(r[8]) : ""; 
    }

    // Column M: bookingDate (วันที่ทำจอง)
    let bookingDateStr = "";
    if (r[12] instanceof Date) {
      bookingDateStr = Utilities.formatDate(r[12], "GMT+7", "yyyy-MM-dd");
    } else {
      bookingDateStr = r[12] ? String(r[12]) : "";
    }

    return {
      rowIndex: i + 5,
      roomNo: r[0],
      status: r[7],
      moveInDate: dateStr,
      roomType: r[9] || 'Standard',
      remark: r[10] || '', // Column K
      isSampleRoom: r[11] === 'Y', // Column L
      bookingDate: bookingDateStr // Column M
    };
  });
  
  return { success: true, data: formatted };
}

function handleSaveRoomData(ss, { project, rowIndex, data, user }) {
  const sheet = ss.getSheetByName(project);
  let targetRow = rowIndex;
  let action = "Edit";

  if (!rowIndex) {
    action = "Add";
    targetRow = sheet.getLastRow() + 1;
    if(targetRow < 5) targetRow = 5;
  }
  
  // Auto-fill bookingDate (Column M) when status is "ห้องจอง"
  let bookingDate = "";
  if (data.status === 'ห้องจอง') {
    if (rowIndex) {
      // Edit: preserve existing bookingDate if already set
      const currentVal = sheet.getRange(targetRow, 13).getValue();
      if (currentVal instanceof Date) {
        bookingDate = Utilities.formatDate(currentVal, "GMT+7", "yyyy-MM-dd");
      } else if (currentVal && String(currentVal).trim()) {
        bookingDate = String(currentVal);
      } else {
        // No existing value, auto-fill with today
        bookingDate = Utilities.formatDate(new Date(), "GMT+7", "yyyy-MM-dd");
      }
    } else {
      // New row: auto-fill with today
      bookingDate = Utilities.formatDate(new Date(), "GMT+7", "yyyy-MM-dd");
    }
  }
  // If status is NOT "ห้องจอง", bookingDate stays "" (cleared)
  
  const rowData = [
    data.roomNo, 
    "", "", "", "", "", "", 
    data.status,            
    data.moveInDate,        
    data.roomType,
    data.remark || "", // Column K
    data.isSampleRoom ? "Y" : "", // Column L
    bookingDate // Column M: วันที่ทำจอง
  ];
  
  if(!rowIndex) sheet.appendRow(rowData);
  else sheet.getRange(targetRow, 1, 1, 13).setValues([rowData]);
  
  logAction(ss, user, project, data.roomNo, action, "Update Status/Date/Remark", data.status);
  return { success: true };
}

function logAction(ss, user, project, room, action, before, after) {
  let logsSheet = ss.getSheetByName('Logs');
  if(!logsSheet) { logsSheet = ss.insertSheet('Logs'); logsSheet.appendRow(['Timestamp', 'User', 'Project', 'Room', 'Action', 'Info', 'Status']); }
  logsSheet.appendRow([new Date(), user, project, room, action, before, after]);
}

function handleGetSettings(ss) {
  let sheet = ss.getSheetByName('Settings');
  if (!sheet) {
    setupDatabase();
    sheet = ss.getSheetByName('Settings');
  }
  
  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return { success: true, roomTypes: [] };
  
  // Format: Project, RoomType, Price, Detail, Color, Category
  // Filter out header
  const roomTypes = data.slice(1).map(r => ({
    project: r[0],
    name: r[1],
    price: r[2],
    detail: r[3],
    color: r[4],
    category: r[5] ? String(r[5]).trim() : String(r[1]).trim() // Fallback to name if no category
  }));
  
  return { success: true, roomTypes: roomTypes };
}

function handleSaveSettings(ss, { roomTypes }) {
  let sheet = ss.getSheetByName('Settings');
  if (!sheet) sheet = ss.insertSheet('Settings').appendRow(['Project', 'RoomType', 'Price', 'Detail', 'Color', 'Category']);
  
  sheet.clear();
  sheet.appendRow(['Project', 'RoomType', 'Price', 'Detail', 'Color', 'Category']);
  
  if (roomTypes && roomTypes.length > 0) {
    const rows = roomTypes.map(rt => [rt.project, rt.name, rt.price, rt.detail, rt.color, rt.category || rt.name]);
    sheet.getRange(2, 1, rows.length, 6).setValues(rows);
  }
  
  return { success: true };
}

function setupDatabase() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  if (!ss.getSheetByName('Users')) ss.insertSheet('Users').appendRow(['UserID', 'Username', 'Password', 'Email', 'Role', 'Access', 'Status']);
  if (!ss.getSheetByName('Logs')) ss.insertSheet('Logs').appendRow(['Timestamp', 'User', 'Project', 'Room', 'Action', 'Info', 'Status']);
  if (!ss.getSheetByName('Settings')) {
     const s = ss.insertSheet('Settings');
     s.appendRow(['Project', 'RoomType', 'Price', 'Detail', 'Color', 'Category']);
     // Default Data
     PROJECTS.forEach(p => {
        s.appendRow([p, 'Standard', '3000', 'ห้องมาตรฐาน', 'gray', 'Standard']);
        s.appendRow([p, 'VIP', '5000', 'ห้องใหญ่พิเศษ', 'purple', 'VIP']);
     });
  }
  if (!ss.getSheetByName('Layouts')) {
     ss.insertSheet('Layouts').appendRow(['Project', 'Building', 'LayoutJSON', 'UpdatedAt']);
  }
  
  PROJECTS.forEach(p => {
    if (!ss.getSheetByName(p)) {
      const s = ss.insertSheet(p);
      s.getRange("A1").setValue("Project: " + p);
      s.getRange("A4:M4").setValues([['เลขห้อง', 'ชื่อ', 'โทร', 'บัตร', 'ที่อยู่', 'Mate', 'Mateโทร', 'สถานะ', 'วันที่เข้าอยู่', 'ประเภท', 'หมายเหตุ', 'ห้องตัวอย่าง', 'วันที่ทำจอง']]);
      s.setFrozenRows(4);
    }
  });
}

// --- LAYOUTS ---
function handleGetLayouts(ss, { project }) {
  let sheet = ss.getSheetByName('Layouts');
  if (!sheet) return { success: true, layouts: [] };
  
  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return { success: true, layouts: [] };
  
  const layouts = [];
  data.slice(1)
    .filter(r => !project || String(r[0]) === String(project))
    .forEach(r => {
      try {
        const layout = typeof r[2] === 'string' ? JSON.parse(r[2]) : r[2];
        layouts.push({
          project: String(r[0]),
          building: String(r[1]),
          layout: layout,
          updatedAt: r[3] instanceof Date ? r[3].toISOString() : String(r[3] || '')
        });
      } catch (e) {
        Logger.log('Error parsing layout for building ' + r[1] + ': ' + e.message);
      }
    });
  
  return { success: true, layouts: layouts };
}

function handleSaveLayout(ss, { project, building, layout }) {
  if (!project || !building || !layout) return { success: false, message: "Missing data" };
  
  let sheet = ss.getSheetByName('Layouts');
  if (!sheet) {
    sheet = ss.insertSheet('Layouts');
    sheet.appendRow(['Project', 'Building', 'LayoutJSON', 'UpdatedAt']);
  }
  
  const data = sheet.getDataRange().getValues();
  const rowIdx = data.findIndex(r => String(r[0]) === String(project) && String(r[1]) === String(building));
  const layoutJSON = JSON.stringify(layout);
  const now = new Date();
  
  if (rowIdx > 0) {
    // Update existing
    sheet.getRange(rowIdx + 1, 3, 1, 2).setValues([[layoutJSON, now]]);
  } else {
    // Add new
    sheet.appendRow([project, building, layoutJSON, now]);
  }
  
  return { success: true, message: "บันทึก Layout เรียบร้อย" };
}

function handleDeleteLayout(ss, { project, building }) {
  let sheet = ss.getSheetByName('Layouts');
  if (!sheet) return { success: false, message: "ไม่พบข้อมูล Layout" };
  
  const data = sheet.getDataRange().getValues();
  const rowIdx = data.findIndex(r => String(r[0]) === String(project) && String(r[1]) === String(building));
  
  if (rowIdx <= 0) return { success: false, message: "ไม่พบ Layout ของตึกนี้" };
  
  sheet.deleteRow(rowIdx + 1);
  return { success: true, message: "ลบ Layout เรียบร้อย" };
}

// --- ADD ROOM ---
function handleAddRoom(ss, { project, roomNo, roomType, status }) {
  if (!project || !roomNo) return { success: false, message: "Missing Data" };
  
  const sheet = ss.getSheetByName(project);
  if (!sheet) return { success: false, message: "Project Sheet Not Found" };
  
  // Check Duplicate
  const data = sheet.getDataRange().getValues();
  // Col A = Room No
  if (data.some(r => String(r[0]) === String(roomNo))) {
    return { success: false, message: "เลขห้องนี้มีอยู่แล้ว" };
  }
  
  // Append
  // Columns: Room No, Room Type, Status, Tenant, CheckIn, CheckOut, Price, Meter, Remark
  sheet.appendRow([roomNo, roomType, status || 'ห้องว่าง', '', '', '', '', '', '']);
  
  return { success: true, message: "เพิ่มห้องสำเร็จ" };
}

// --- BUILDING STRIPES ---
function handleGetBuildingStripes(ss, { project }) {
  if (!project) return { success: false, message: "Missing project" };
  
  let sheet = ss.getSheetByName('BuildingStripes');
  if (!sheet) return { success: true, stripes: {} };
  
  const data = sheet.getDataRange().getValues();
  const row = data.find(r => String(r[0]) === String(project));
  
  if (!row || !row[1]) return { success: true, stripes: {} };
  
  try {
    return { success: true, stripes: JSON.parse(row[1]) };
  } catch (e) {
    return { success: true, stripes: {} };
  }
}

function handleSaveBuildingStripes(ss, { project, stripes }) {
  if (!project) return { success: false, message: "Missing project" };
  
  let sheet = ss.getSheetByName('BuildingStripes');
  if (!sheet) {
    sheet = ss.insertSheet('BuildingStripes');
    sheet.appendRow(['Project', 'StripesJSON', 'UpdatedAt']);
  }
  
  const data = sheet.getDataRange().getValues();
  const rowIdx = data.findIndex(r => String(r[0]) === String(project));
  const stripesJSON = JSON.stringify(stripes || {});
  const now = new Date();
  
  if (rowIdx > 0) {
    sheet.getRange(rowIdx + 1, 2, 1, 2).setValues([[stripesJSON, now]]);
  } else {
    sheet.appendRow([project, stripesJSON, now]);
  }
  
  return { success: true, message: "บันทึกแถบสีตึกเรียบร้อย" };
}

// --- CARD GROUPS (for dashboard card grouping) ---
function handleGetCardGroups(ss, { project }) {
  if (!project) return { success: false, message: 'Missing project' };

  let sheet = ss.getSheetByName('CardGroups');
  if (!sheet) return { success: true, cardGroups: {} };

  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return { success: true, cardGroups: {} };

  const rows = data.slice(1).filter(r => String(r[0]) === String(project));
  const map = {};
  rows.forEach(r => {
    try {
      const cardKey = String(r[1] || '').trim();
      const enabled = String(r[2] || '').toLowerCase() === 'true' || r[2] === true;
      const groups = r[3] ? (typeof r[3] === 'string' ? JSON.parse(r[3]) : r[3]) : [];
      map[cardKey] = { enabled: !!enabled, groups: groups };
    } catch (e) {
      // ignore invalid JSON rows
      Logger.log('Invalid GroupsJSON in CardGroups sheet: ' + e.message);
    }
  });

  return { success: true, cardGroups: map };
}

function handleSaveCardGroups(ss, { project, cardKey, enabled, groups }) {
  if (!project || !cardKey) return { success: false, message: 'Missing data' };

  let sheet = ss.getSheetByName('CardGroups');
  if (!sheet) {
    sheet = ss.insertSheet('CardGroups');
    sheet.appendRow(['Project', 'CardKey', 'Enabled', 'GroupsJSON', 'UpdatedAt']);
  }

  const data = sheet.getDataRange().getValues();
  const rowIdx = data.findIndex(r => String(r[0]) === String(project) && String(r[1]) === String(cardKey));
  const now = new Date();
  const groupsJSON = JSON.stringify(groups || []);

  if (rowIdx > 0) {
    // update Enabled, GroupsJSON, UpdatedAt
    sheet.getRange(rowIdx + 1, 3, 1, 3).setValues([[String(enabled), groupsJSON, now]]);
  } else {
    sheet.appendRow([project, cardKey, String(enabled), groupsJSON, now]);
  }

  return { success: true, message: 'บันทึกกลุ่มการ์ดเรียบร้อย' };
}