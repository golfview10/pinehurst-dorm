// --- Helper: Parse Room Number (New Logic) ---
function parseRoomInfo(roomNo) {
    let cleanRoomNo = roomNo.toString().trim();
    if (cleanRoomNo.length < 3) return { building: 'Main', floor: 1, roomIndex: cleanRoomNo, full: cleanRoomNo };

    // กฎจับคู่เลขนำหน้าห้อง (Prefix) กับชื่อตึก (Building) สำหรับ City Condo
    const prefixToBuildingMap = {
        "337": "69/337",
        "338": "70/338",
        "339": "71/339",
        "340": "72/340",
        "363": "81/363",
        "364": "88/364",
        "362": "90/362",
        "365": "92/365",
        "369": "95/369",
        "367": "96/367",
        "360": "106/360"
    };

    // Support Custom Format: "337/1" -> prefix=337, suffix=1
    if (cleanRoomNo.includes('/')) {
        const parts = cleanRoomNo.split('/');
        const prefix = parts[0];
        const roomIndex = parts[1];

        // ค้นหาว่า prefix นี้ตรงกับตึกอะไร ถ้าไม่มีใน map ให้ใช้ตัว prefix เป็นชื่อตึกแทน
        const building = prefixToBuildingMap[prefix] || prefix;

        let floor = 1;
        const num = parseInt(roomIndex);
        if (!isNaN(num) && num > 0) {
            // Assuming 14 rooms per floor
            floor = Math.ceil(num / 14);
        }

        return {
            building: building,
            floor: floor,
            roomIndex: roomIndex,
            full: cleanRoomNo
        };
    }

    // Support Custom Format: "Building-Room" (เผื่อไว้กรณีเก่า)
    if (cleanRoomNo.includes('-')) {
        const parts = cleanRoomNo.split('-');
        const building = parts[0];
        const roomPart = parts.slice(1).join('-');
        let floor = 1;
        let roomIndex = roomPart;
        if (roomPart.includes('/')) {
            const num = parseInt(roomPart.split('/')[1]);
            if (!isNaN(num) && num > 0) floor = Math.ceil(num / 14);
            roomIndex = roomPart;
        }
        return { building, floor, roomIndex, full: cleanRoomNo };
    }

    // Standard Logic: A1101 -> Building: A1, Floor: 1, Room: 01
    const len = cleanRoomNo.length;
    const roomIndex = cleanRoomNo.substring(len - 2); // 2 ตัวท้าย
    const floorChar = cleanRoomNo.substring(len - 3, len - 2); // ตัวที่ 3 จากท้าย
    const building = cleanRoomNo.substring(0, len - 3); // ที่เหลือข้างหน้า

    return {
        building: building || 'Main',
        floor: parseInt(floorChar) || 1, // 0, 1, 2...
        roomIndex: roomIndex,
        full: cleanRoomNo
    };
}

// --- Helpers ---
function formatDateThai(dateStr) {
    if (!dateStr || dateStr === '-') return '-';
    const parts = dateStr.split('-');
    if (parts.length === 3) {
        const year = parseInt(parts[0]) + 543;
        return `${parts[2]}/${parts[1]}/${year}`;
    }
    return dateStr;
}

function showLoading(l) { document.getElementById('loadingOverlay').classList[l ? 'remove' : 'add']('hidden'); }
function showToast(t, m, y) {
    const el = document.getElementById('toast');
    document.getElementById('toastTitle').innerText = t; document.getElementById('toastMsg').innerText = m;
    const icon = document.getElementById('toastIcon');
    icon.innerHTML = (y === 'success') ? '<i class="fa-solid fa-check-circle text-emerald-500"></i>' : '<i class="fa-solid fa-circle-exclamation text-red-500"></i>';
    el.classList.remove('hidden', 'translate-y-[-20px]', 'opacity-0');
    setTimeout(() => { el.classList.add('translate-y-[-20px]', 'opacity-0'); setTimeout(() => el.classList.add('hidden'), 300); }, 3000);
}

function showConfirmModal(title, msg, onConfirm, iconClass = 'fa-solid fa-triangle-exclamation text-red-500', iconBgClass = 'bg-red-50') {
    const modal = document.getElementById('alertModal');
    document.getElementById('alertModalTitle').innerText = title;
    document.getElementById('alertModalMsg').innerHTML = msg;

    const iconBg = document.getElementById('alertModalIconBg');
    iconBg.className = `w-10 h-10 rounded-full flex items-center justify-center ${iconBgClass}`;
    document.getElementById('alertModalIcon').className = `text-lg ${iconClass}`;

    const btnCancel = document.getElementById('alertModalBtnCancel');
    const btnOk = document.getElementById('alertModalBtnOk');

    btnCancel.classList.remove('hidden');

    // Clean up previous event listeners by cloning
    const newBtnOk = btnOk.cloneNode(true);
    btnOk.parentNode.replaceChild(newBtnOk, btnOk);

    const newBtnCancel = btnCancel.cloneNode(true);
    btnCancel.parentNode.replaceChild(newBtnCancel, btnCancel);

    newBtnOk.onclick = () => {
        closeAlertModal();
        if (onConfirm) onConfirm();
    };

    newBtnCancel.onclick = () => {
        closeAlertModal();
    };

    modal.classList.remove('hidden');
    // Trigger reflow
    void modal.offsetWidth;
    modal.classList.remove('opacity-0');
    document.getElementById('alertModalContent').classList.remove('scale-95');
}

function closeAlertModal() {
    const modal = document.getElementById('alertModal');
    modal.classList.add('opacity-0');
    document.getElementById('alertModalContent').classList.add('scale-95');
    setTimeout(() => {
        modal.classList.add('hidden');
    }, 300);
}

function cleanupModals() {
    // Remove any dynamically injected action modals from DOM
    const modalIds = ['furnitureActionModal', 'furnitureReportModal', 'addCentralStockModal', 'roomFurnitureHistoryModal'];
    modalIds.forEach(id => {
        document.querySelectorAll(`#${id}`).forEach(el => el.remove());
    });
}

// --- Report Export Functions ---
function confirmExport(type) {
    const statusFilters = Array.from(document.querySelectorAll('input[name="rpt_status"]:checked')).map(c => c.value);
    const typeFilters = Array.from(document.querySelectorAll('input[name="rpt_type"]:checked')).map(c => c.value);
    const floorFilter = document.getElementById('rpt_floor').value;
    const dateMode = document.getElementById('rpt_date_mode') ? document.getElementById('rpt_date_mode').value : 'all';

    let filtered = STATE.data.filter(item => {
        let s = item.status || 'ห้องว่าง';
        if (s === 'ว่าง') s = 'ห้องว่าง';
        let t = item.roomType || 'Standard';

        // Status and Type Filters
        let mappedS = s;
        if (s === 'จอง') mappedS = 'ห้องจอง';
        if (s === 'รอซ่อม' || s === 'ชำรุด') mappedS = 'ปรับปรุง';
        if (s === 'คืนประกัน') mappedS = 'ห้องออกคืนประกัน';
        if (s === 'ตัดหนี') mappedS = 'ห้องตัดหนี';

        if (!statusFilters.includes(mappedS) || !typeFilters.includes(t)) {
            return false;
        }

        // Date Filtering Logic
        // Use bookingDate for ห้องจอง, moveInDate for other statuses
        const relevantDate = (s === 'ห้องจอง' && item.bookingDate) ? item.bookingDate : item.moveInDate;

        if (dateMode === 'range') {
            const startVal = document.getElementById('rpt_start_date').value;
            const endVal = document.getElementById('rpt_end_date').value;
            if (!relevantDate) return false;
            if (startVal && relevantDate < startVal) return false;
            if (endVal && relevantDate > endVal) return false;
        } else if (dateMode === 'month') {
            const monthVal = document.getElementById('rpt_month_select').value;
            if (!monthVal) return true;
            if (!relevantDate) return false;
            if (!relevantDate.startsWith(monthVal)) return false;
        }

        return true;
    });

    // Filter by Building (from dropdown)
    const buildingFilter = document.getElementById('rpt_building').value;
    let scopeName = "AllBuildings";
    if (buildingFilter !== 'All') {
        filtered = filtered.filter(item => parseRoomInfo(item.roomNo).building === buildingFilter);
        scopeName = buildingFilter;
    }

    // Filter by Floor
    if (floorFilter !== 'All') {
        filtered = filtered.filter(item => parseRoomInfo(item.roomNo).floor == floorFilter);
        scopeName += `_F${floorFilter}`;
    }

    // Sort by Date (Oldest to Newest), fallback to RoomNo
    filtered.sort((a, b) => {
        const dateA = (a.status === 'ห้องจอง' && a.bookingDate) ? a.bookingDate : (a.moveInDate || '');
        const dateB = (b.status === 'ห้องจอง' && b.bookingDate) ? b.bookingDate : (b.moveInDate || '');

        if (!dateA && !dateB) return String(a.roomNo).localeCompare(String(b.roomNo), undefined, { numeric: true });
        if (!dateA) return 1; // Put empty dates at the end
        if (!dateB) return -1;

        if (dateA === dateB) {
            return String(a.roomNo).localeCompare(String(b.roomNo), undefined, { numeric: true });
        }
        return String(dateA).localeCompare(String(dateB));
    });

    if (filtered.length === 0) { showToast('Warning', 'ไม่พบข้อมูลตามเงื่อนไข', 'error'); return; }

    // Construct date label subtitle
    let dateSub = '';
    if (dateMode === 'range') {
        const startVal = document.getElementById('rpt_start_date').value;
        const endVal = document.getElementById('rpt_end_date').value;
        if (startVal && endVal) {
            dateSub = `ช่วงวันที่ ${formatDateThai(startVal)} ถึง ${formatDateThai(endVal)}`;
        } else if (startVal) {
            dateSub = `ตั้งแต่วันที่ ${formatDateThai(startVal)}`;
        } else if (endVal) {
            dateSub = `ถึงวันที่ ${formatDateThai(endVal)}`;
        }
    } else if (dateMode === 'month') {
        const monthSelect = document.getElementById('rpt_month_select');
        if (monthSelect && monthSelect.value) {
            const monthText = monthSelect.options[monthSelect.selectedIndex].text;
            dateSub = `ประจำเดือน ${monthText}`;
        }
    }

    if (type === 'excel') exportExcelFile(filtered, scopeName, statusFilters, dateSub);
    else exportPDFFile(filtered, scopeName, statusFilters, dateSub);
    closeReportModal();
}

function getReportConfig(statusFilters, dateMode = 'all') {
    let showDate = false;
    let dateLabel = '';
    let title = 'รายงานสถานะห้องพัก';

    if (statusFilters && statusFilters.length === 1) {
        const s = statusFilters[0];
        if (s === 'ห้องว่าง') {
            title = 'รายงานห้องว่าง';
            showDate = false;
        } else if (s === 'ห้องจอง') {
            title = 'รายงานห้องจอง';
            showDate = true;
            dateLabel = 'วันที่จอง';
        } else if (s === 'ไม่ว่าง') {
            title = 'รายงานห้องพัก (ไม่ว่าง)';
            showDate = true;
            dateLabel = 'วันที่เข้าอยู่';
        } else if (s === 'ปรับปรุง') {
            title = 'รายงานห้องชำรุด';
            showDate = false;
        } else if (s === 'ห้องออกคืนประกัน') {
            title = 'รายงานห้องออกคืนประกัน';
            showDate = true;
            dateLabel = 'วันที่คืนประกัน';
        } else if (s === 'ห้องตัดหนี') {
            title = 'รายงานห้องตัดหนี';
            showDate = true;
            dateLabel = 'วันที่ตัดหนี';
        }
    } else {
        const hasDates = statusFilters.some(s => ['ห้องจอง', 'ไม่ว่าง', 'ห้องออกคืนประกัน', 'ห้องตัดหนี'].includes(s));
        if (hasDates || dateMode !== 'all') {
            showDate = true;
            dateLabel = 'วันที่บันทึก';
        }
    }

    if (dateMode !== 'all') {
        showDate = true;
        if (!dateLabel) dateLabel = 'วันที่เข้าอยู่/ตัดหนี/จอง';
    }

    return { title, showDate, dateLabel };
}

function formatBuildingName(bldg) {
    if (!bldg || bldg === 'AllBuildings') return 'ทุกตึก';
    if (bldg.startsWith('AllBuildings_')) {
        return 'ทุกตึก ' + bldg.replace('AllBuildings_', '').replace('_', ' ');
    }
    return bldg.replace('_', ' ');
}

function exportExcelFile(data, bldg, statusFilters, dateSub = '') {
    const dateMode = document.getElementById('rpt_date_mode') ? document.getElementById('rpt_date_mode').value : 'all';
    const config = getReportConfig(statusFilters, dateMode);
    const bldgDisplay = formatBuildingName(bldg);
    const wb = XLSX.utils.book_new();
    const exportData = data.map((d, idx) => {
        const row = {
            "ลำดับ": idx + 1,
            "เลขห้อง": d.roomNo,
            "ประเภท": d.roomType,
            "สถานะ": d.status
        };
        if (config.showDate) {
            // Use bookingDate for ห้องจอง rooms, moveInDate for others
            const displayDate = (d.status === 'ห้องจอง' && d.bookingDate) ? d.bookingDate : d.moveInDate;
            row[config.dateLabel] = formatDateThai(displayDate);
            // If mixed statuses report, also show booking date for จอง
            if (statusFilters.length > 1 && d.status === 'ห้องจอง' && d.bookingDate) {
                row['วันที่จอง'] = formatDateThai(d.bookingDate);
            }
        }
        row["หมายเหตุ"] = d.remark || '-';
        return row;
    });
    const ws = XLSX.utils.json_to_sheet(exportData);
    XLSX.utils.book_append_sheet(wb, ws, "Report");

    let filename = `${config.title}_${STATE.currentProject}_${bldg}`;
    if (dateSub) {
        filename += `_${dateSub.replace(/[:\s\/]/g, '_')}`;
    }
    XLSX.writeFile(wb, `${filename}.xlsx`);
}

function exportPDFFile(data, bldg, statusFilters, dateSub = '') {
    const dateMode = document.getElementById('rpt_date_mode') ? document.getElementById('rpt_date_mode').value : 'all';
    const config = getReportConfig(statusFilters, dateMode);
    const bldgDisplay = formatBuildingName(bldg);

    let subtitle = `ตึก: ${bldgDisplay}`;
    if (dateSub) {
        subtitle += ` &nbsp;|&nbsp; ${dateSub}`;
    }
    subtitle += ` &nbsp;|&nbsp; วันที่ออกรายงาน: ${new Date().toLocaleDateString('th-TH')}`;

    let content = `
            <div id="pdf-container" style="padding: 15px; font-family: 'Sarabun', sans-serif; background: white; width: 100%; box-sizing: border-box;">
                <h2 style="text-align:center; font-size: 20px; font-weight: bold; margin:0; padding:0;">${config.title} ${STATE.currentProject}</h2>
                <p style="text-align:center; font-size: 13px; color: #4b5563; margin: 10px 0 20px 0;">${subtitle}</p>
                <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
                    <thead style="display: table-header-group;">
                        <tr style="background-color: #f3f4f6;">
                            <th style="border: 1px solid #d1d5db; padding: 8px; font-weight: bold; text-align: center; width: 40px;">ลำดับ</th>
                            <th style="border: 1px solid #d1d5db; padding: 8px; font-weight: bold; text-align: left;">ห้อง</th>
                            <th style="border: 1px solid #d1d5db; padding: 8px; font-weight: bold; text-align: left;">ประเภท</th>
                            <th style="border: 1px solid #d1d5db; padding: 8px; font-weight: bold; text-align: center;">สถานะ</th>
                            ${config.showDate ? `<th style="border: 1px solid #d1d5db; padding: 8px; font-weight: bold; text-align: center;">${config.dateLabel}</th>` : ''}
                            <th style="border: 1px solid #d1d5db; padding: 8px; font-weight: bold; text-align: left;">หมายเหตุ</th>
                        </tr>
                    </thead>
                    <tbody style="display: table-row-group;">`;

    data.forEach((d, index) => {
        const bg = index % 2 === 0 ? '#ffffff' : '#f9fafb';
        content += `<tr style="background-color: ${bg}; page-break-inside: avoid;">
                    <td style="border: 1px solid #d1d5db; padding: 6px 8px; text-align: center;">${index + 1}</td>
                    <td style="border: 1px solid #d1d5db; padding: 6px 8px; font-weight: bold;">${d.roomNo}</td>
                    <td style="border: 1px solid #d1d5db; padding: 6px 8px;">${d.roomType || 'Standard'}</td>
                    <td style="border: 1px solid #d1d5db; padding: 6px 8px; text-align: center;">${d.status}</td>
                    ${config.showDate ? `<td style="border: 1px solid #d1d5db; padding: 6px 8px; text-align: center;">${formatDateThai((d.status === 'ห้องจอง' && d.bookingDate) ? d.bookingDate : d.moveInDate)}</td>` : ''}
                    <td style="border: 1px solid #d1d5db; padding: 6px 8px;">${d.remark || '-'}</td>
                </tr>`;
    });
    content += `</tbody></table></div>`;

    let filename = `${config.title}_${STATE.currentProject}_${bldg}`;
    if (dateSub) {
        filename += `_${dateSub.replace(/[:\s\/]/g, '_')}`;
    }

    const opt = {
        margin: [10, 10, 15, 10], // top, left, bottom, right
        filename: `${filename}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: {
            scale: 2,
            useCORS: true,
            scrollY: 0
        },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
        pagebreak: { mode: ['css', 'legacy'] }
    };

    showLoading(true);
    html2pdf().set(opt).from(content).toPdf().get('pdf').then(function (pdf) {
        // Add page numbering
        const totalPages = pdf.internal.getNumberOfPages();
        for (let i = 1; i <= totalPages; i++) {
            pdf.setPage(i);
            pdf.setFontSize(10);
            pdf.setTextColor(100);
            const text = `หน้า ${i} / ${totalPages}`;
            const pageWidth = pdf.internal.pageSize.getWidth();
            const pageHeight = pdf.internal.pageSize.getHeight();
            pdf.text(text, pageWidth - 10, pageHeight - 8, { align: 'right' });
        }
    }).save().then(() => {
        showLoading(false);
    });
}


function escapeHtml(str) {
    return String(str || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}
window.escapeHtml = escapeHtml;

// =====================================================
// REAL-TIME CHAT SOUND & FLOATING TOAST NOTIFICATION
// =====================================================

/**
 * เล่นเสียงแจ้งเตือนข้อความใหม่ (Synthesized Web Audio Dual Chime)
 * ไม่ต้องดาวน์โหลดไฟล์ mp3 จากภายนอก ทำงานได้ 100% ทุกบราวเซอร์
 */
function playChatNotificationSound() {
    try {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (!AudioCtx) return;
        const ctx = new AudioCtx();
        if (ctx.state === 'suspended') {
            ctx.resume();
        }
        const now = ctx.currentTime;

        // โน้ตที่ 1: F5 (698.46 Hz) นุ่มนวล
        const osc1 = ctx.createOscillator();
        const gain1 = ctx.createGain();
        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(698.46, now);
        gain1.gain.setValueAtTime(0.12, now);
        gain1.gain.exponentialRampToValueAtTime(0.0001, now + 0.35);
        osc1.connect(gain1);
        gain1.connect(ctx.destination);
        osc1.start(now);
        osc1.stop(now + 0.35);

        // โน้ตที่ 2: C6 (1046.50 Hz) ไพเราะแบบ Apple/Slack chime
        const osc2 = ctx.createOscillator();
        const gain2 = ctx.createGain();
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(1046.50, now + 0.1);
        gain2.gain.setValueAtTime(0.15, now + 0.1);
        gain2.gain.exponentialRampToValueAtTime(0.0001, now + 0.55);
        osc2.connect(gain2);
        gain2.connect(ctx.destination);
        osc2.start(now + 0.1);
        osc2.stop(now + 0.55);
    } catch (e) {
        // Silently catch audio restrictions
        console.warn('[Chat Audio Chime]', e);
    }
}
window.playChatNotificationSound = playChatNotificationSound;

/**
 * แสดงการแจ้งเตือนข้อความใหม่ลอยอยู่มุมขวาล่าง (Bottom-Right Toast Popup)
 */
function showBottomRightChatNotification(data) {
    if (!data || !data.senderName) return;

    let container = document.getElementById('bottomRightChatNotifContainer');
    if (!container) {
        container = document.createElement('div');
        container.id = 'bottomRightChatNotifContainer';
        container.className = 'fixed bottom-5 right-5 z-[9999] flex flex-col gap-3 max-w-sm w-full pointer-events-none sm:max-w-md';
        document.body.appendChild(container);
    }

    // เล่นเสียงแจ้งเตือน
    playChatNotificationSound();

    const notifId = 'chat_notif_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
    const isSenderAdmin = data.senderRole === 'Admin';
    const senderName = String(data.senderName || 'ผู้ใช้');
    const initials = senderName.substring(0, 2).toUpperCase();
    const rawContent = data.content || '';
    const cleanContent = escapeHtml(rawContent.length > 120 ? rawContent.substring(0, 117) + '...' : rawContent);
    const convId = data.conversationId || '';

    const cardHtml = `
        <div id="${notifId}" 
            class="pointer-events-auto bg-white/95 backdrop-blur-md border border-gray-200/90 shadow-2xl rounded-2xl p-4 flex flex-col gap-2.5 transition-all duration-300 transform translate-y-6 opacity-0 hover:shadow-3xl ring-1 ring-black/5 max-w-sm w-full cursor-pointer group"
            onclick="handleChatNotifClick(event, '${convId}', '${escapeHtml(senderName)}', '${data.senderRole || 'User'}')">
            <div class="flex items-start justify-between gap-3">
                <div class="flex items-center gap-3 min-w-0">
                    <div class="relative shrink-0">
                        <div class="w-10 h-10 rounded-xl ${isSenderAdmin ? 'bg-gradient-to-br from-amber-500 to-orange-500' : 'bg-gradient-to-br from-blue-500 to-indigo-600'} text-white font-bold flex items-center justify-center text-sm shadow-xs">
                            ${initials}
                        </div>
                        <span class="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white ring-1 ring-emerald-400/50 animate-pulse" title="ออนไลน์"></span>
                    </div>
                    <div class="min-w-0">
                        <div class="flex items-center gap-1.5">
                            <span class="font-bold text-gray-900 text-sm truncate">${escapeHtml(senderName)}</span>
                            ${isSenderAdmin ? 
                                '<span class="text-[9px] bg-amber-100 text-amber-700 px-1.5 py-0.2 rounded font-bold uppercase">Admin</span>' : 
                                '<span class="text-[9px] bg-blue-100 text-blue-700 px-1.5 py-0.2 rounded font-bold uppercase">User</span>'}
                        </div>
                        <p class="text-[11px] text-gray-400">ส่งข้อความถึงคุณ • เมื่อสักครู่</p>
                    </div>
                </div>
                <button type="button" onclick="dismissChatNotif(event, '${notifId}')" class="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100 transition shrink-0" title="ปิด">
                    <i class="fa-solid fa-xmark text-xs"></i>
                </button>
            </div>
            
            <div class="bg-gray-50/90 rounded-xl px-3.5 py-2.5 text-xs text-gray-700 leading-relaxed border border-gray-100 break-words font-normal">
                ${cleanContent}
            </div>

            <div class="flex items-center justify-between text-xs pt-1 border-t border-gray-100">
                <span class="text-[11px] font-semibold text-apple-blue group-hover:text-blue-700 flex items-center gap-1.5 transition">
                    <i class="fa-regular fa-comment-dots"></i> คลิกเพื่อเปิดแชท / ตอบกลับ
                </span>
                <span class="text-[10px] text-gray-400 font-medium">กดที่นี่</span>
            </div>

            <!-- Progress bar timer -->
            <div class="w-full bg-gray-100 h-1 rounded-full overflow-hidden mt-0.5">
                <div class="chat-notif-progress bg-apple-blue h-full w-full rounded-full transition-all"></div>
            </div>
        </div>
    `;

    container.insertAdjacentHTML('beforeend', cardHtml);

    const el = document.getElementById(notifId);
    if (!el) return;

    // Trigger enter animation
    requestAnimationFrame(() => {
        el.classList.remove('translate-y-6', 'opacity-0');
        el.classList.add('translate-y-0', 'opacity-100');
    });

    const progressBar = el.querySelector('.chat-notif-progress');
    if (progressBar) {
        progressBar.style.transition = 'width 7.5s linear';
        requestAnimationFrame(() => {
            progressBar.style.width = '0%';
        });
    }

    // Auto dismiss after 7.5 seconds
    const timer = setTimeout(() => {
        dismissChatNotif(null, notifId);
    }, 7500);
    el._dismissTimer = timer;
}
window.showBottomRightChatNotification = showBottomRightChatNotification;

/**
 * ปิด Card แจ้งเตือนข้อความมุมขวาล่าง
 */
function dismissChatNotif(event, notifId) {
    if (event) {
        event.stopPropagation();
        event.preventDefault();
    }
    const el = document.getElementById(notifId);
    if (!el) return;
    if (el._dismissTimer) clearTimeout(el._dismissTimer);
    el.classList.remove('translate-y-0', 'opacity-100');
    el.classList.add('translate-y-4', 'opacity-0', 'scale-95');
    setTimeout(() => {
        if (el && el.parentNode) el.remove();
    }, 280);
}
window.dismissChatNotif = dismissChatNotif;

/**
 * คลิกที่ Card เพื่อเปิดห้องแชทกับผู้ส่งทันที
 */
function handleChatNotifClick(event, convId, senderName, senderRole) {
    if (event) event.stopPropagation();
    // Dismiss the notif
    const card = event ? event.currentTarget : null;
    if (card && card.id) {
        dismissChatNotif(null, card.id);
    }

    // Switch view to messaging and open conversation
    if (typeof openChatWithUser === 'function') {
        openChatWithUser(senderName, senderRole);
    } else if (typeof renderMessaging === 'function') {
        renderMessaging(senderName);
    }
}
window.handleChatNotifClick = handleChatNotifClick;

