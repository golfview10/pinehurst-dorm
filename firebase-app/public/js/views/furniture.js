        // =====================================================
        // Furniture Management View (ผังเฟอร์นิเจอร์)
        // =====================================================

        /**
         * Render Furniture Zone Map — คล้าย Visual Map แต่แสดงจำนวนเฟอร์ต่อตึก
         */
        function renderFurnitureMap() {
            STATE.currentView = 'furniture_map';

            // Identify Buildings
            const buildings = new Set();
            STATE.data.forEach(r => {
                const info = parseRoomInfo(r.roomNo);
                buildings.add(info.building);
            });
            const allBuildings = Array.from(buildings);

            // Reuse Zone Config from map.js
            const genSeries = (prefix, n) => Array.from({ length: n }, (_, i) => `${prefix}${i + 1}`);
            const ZONES_CONFIG = [
                { id: 'U', title: 'Zone U', match: ['U3', ...genSeries('U', 8)] },
                { id: 'A', title: 'Zone A', match: genSeries('A', 8) },
                { id: 'B', title: 'Zone B', match: genSeries('B', 8) },
                { id: 'C', title: 'Zone C', match: genSeries('C', 8) },
                { id: 'D', title: 'Zone D', match: genSeries('D', 8) },
                { id: 'F', title: 'Zone F', match: genSeries('F', 2) },
                { id: 'M', title: 'Zone M', match: ['M', ...genSeries('M', 8)] },
                { id: 'N', title: 'Zone N', match: ['N', ...genSeries('N', 8)] }
            ];

            let html = `
                <div class="flex flex-col h-full fade-in-up relative">
                    <div class="px-6 pt-6 pb-4 bg-white shadow-sm flex flex-col md:flex-row md:justify-between md:items-center sticky top-0 z-30 gap-4 border-b border-gray-100">
                        <div class="flex items-center justify-between w-full md:w-auto">
                            <h2 class="font-bold text-xl text-gray-800 flex items-center"><i class="fa-solid fa-couch mr-2 text-amber-500"></i> ผังเฟอร์นิเจอร์(ไม่รวมห้องรายวัน)</h2>
                        </div>
                        <div class="flex items-center space-x-2">
                            <button onclick="openFurnitureReportModal()" class="bg-gray-600 text-white px-3 py-2 rounded-lg hover:bg-gray-700 transition text-xs font-medium">
                                <i class="fa-solid fa-file-excel mr-1"></i> รายงาน
                            </button>
                            <button onclick="renderFurnitureStockPanel()" class="bg-amber-500 text-white px-3 py-2 rounded-lg hover:bg-amber-600 transition text-xs font-medium">
                                <i class="fa-solid fa-warehouse mr-1"></i> สต๊อก
                            </button>
                        </div>
                    </div>
                    <div class="p-6 space-y-6 pb-24 overflow-y-auto">
            `;

            // Calculate Stock Summaries
            const centralStock = STATE.furnitureStock?.central || {};
            const buildingStock = STATE.furnitureStock?.buildings || {};
            const transferred = {};
            
            // 1. Add building stock (transferred to buildings but not in rooms)
            for (const items of Object.values(buildingStock)) {
                for (const [name, qty] of Object.entries(items)) {
                    transferred[name] = (transferred[name] || 0) + qty;
                }
            }


            const itemMap = {};
            STATE.furnitureItems.forEach(fi => { itemMap[fi.name] = fi; });
            const allItemNames = [...new Set([...Object.keys(centralStock), ...Object.keys(transferred)])];
            
            let summaryHtml = '';
            if (allItemNames.length > 0) {
                summaryHtml = `
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <!-- Central Stock -->
                    <div class="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-4 border border-indigo-100 shadow-sm">
                        <h3 class="font-bold text-sm text-indigo-800 mb-3 flex items-center">
                            <i class="fa-solid fa-building-columns mr-2 text-indigo-500"></i>จำนวนเครื่องใช้ไฟฟ้าที่ไม่มีในระบบ
                        </h3>
                        <div class="flex flex-wrap gap-2">
                            ${Object.keys(centralStock).length === 0 ? '<span class="text-xs text-gray-500">ไม่มีสต็อกส่วนกลาง</span>' : ''}
                            ${Object.entries(centralStock).map(([name, qty]) => {
                                const icon = itemMap[name] ? itemMap[name].icon : 'fa-couch';
                                return `<div class="bg-white rounded px-2 py-1 flex items-center shadow-sm border border-indigo-50">
                                    <i class="fa-solid ${icon} text-indigo-400 mr-1.5 text-[10px]"></i>
                                    <span class="text-xs font-medium text-gray-600 mr-1.5">${name}</span>
                                    <span class="text-xs font-bold text-indigo-700 bg-indigo-50 px-1 rounded">${qty}</span>
                                </div>`;
                            }).join('')}
                        </div>
                    </div>
                    
                    <!-- Transferred -->
                    <div class="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl p-4 border border-emerald-100 shadow-sm relative">
                        <div class="flex justify-between items-start mb-3">
                            <h3 class="font-bold text-sm text-emerald-800 flex items-center">
                                <i class="fa-solid fa-truck-fast mr-2 text-emerald-500"></i>ยอดคืนเครื่องใช้ไฟฟ้าที่มีในสต๊อก
                            </h3>
                            <button onclick="openReturnedInStockReportModal()" class="bg-emerald-600 text-white px-2 py-1 rounded hover:bg-emerald-700 transition text-[10px] font-medium shadow-sm flex items-center">
                                <i class="fa-solid fa-file-excel mr-1"></i> รายงาน
                            </button>
                        </div>
                        <div class="flex flex-wrap gap-2">
                            ${Object.keys(transferred).length === 0 ? '<span class="text-xs text-gray-500">ยังไม่มีการเบิกออก</span>' : ''}
                            ${Object.entries(transferred).map(([name, qty]) => {
                                const icon = itemMap[name] ? itemMap[name].icon : 'fa-couch';
                                return `<div onclick="showStockItemHistory('${name}', ${qty})" class="bg-white rounded px-2 py-1 flex items-center shadow-sm border border-emerald-50 cursor-pointer hover:bg-emerald-50 transition">
                                    <i class="fa-solid ${icon} text-emerald-400 mr-1.5 text-[10px]"></i>
                                    <span class="text-xs font-medium text-gray-600 mr-1.5">${name}</span>
                                    <span class="text-xs font-bold text-emerald-700 bg-emerald-100 px-1 rounded">${qty}</span>
                                </div>`;
                            }).join('')}
                        </div>
                    </div>
                </div>`;
            }
            html += summaryHtml;

            const usedBuildings = new Set();

            // Render Zones
            ZONES_CONFIG.forEach(zone => {
                const zoneBuildings = allBuildings.filter(b => zone.match.includes(b));
                if (zoneBuildings.length > 0) {
                    zoneBuildings.forEach(b => usedBuildings.add(b));
                    zoneBuildings.sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }));

                    html += `
                        <div class="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
                            <h3 class="text-base font-bold text-gray-700 mb-3 border-l-4 border-amber-400 pl-3 flex items-center bg-amber-50 py-2 rounded-r-lg">
                                <i class="fa-solid fa-couch mr-2 text-amber-400"></i>${zone.title}
                                <span class="text-xs text-gray-400 font-normal ml-2">(${zoneBuildings.length} ตึก)</span>
                            </h3>
                            <div class="flex flex-wrap gap-3">
                                ${zoneBuildings.map(bldg => generateFurnitureBuildingCard(bldg)).join('')}
                            </div>
                        </div>
                    `;
                }
            });

            // Others
            const otherBuildings = allBuildings.filter(b => !usedBuildings.has(b));
            if (otherBuildings.length > 0) {
                otherBuildings.sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }));
                html += `
                    <div class="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
                        <h3 class="text-base font-bold text-gray-700 mb-3 border-l-4 border-amber-400 pl-3 flex items-center bg-amber-50 py-2 rounded-r-lg">
                            <i class="fa-solid fa-couch mr-2 text-amber-400"></i>อื่นๆ
                        </h3>
                        <div class="flex flex-wrap gap-3">
                            ${otherBuildings.map(bldg => generateFurnitureBuildingCard(bldg)).join('')}
                        </div>
                    </div>
                `;
            }

            html += `</div></div>`;
            document.getElementById('mainContent').innerHTML = html;
            updateActiveNav(2);
        }

        window.openReturnedInStockReportModal = function() {
            const today = new Date().toISOString().split('T')[0];
            const modalHtml = `
                <div id="returnedInStockReportModal" class="fixed inset-0 bg-black/40 backdrop-blur-sm z-[90] flex items-center justify-center p-4" onclick="if(event.target===this)this.remove()">
                    <div class="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col" onclick="event.stopPropagation()">
                        <div class="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-emerald-50 shrink-0">
                            <h3 class="font-bold text-lg text-emerald-800"><i class="fa-solid fa-file-excel mr-2 text-emerald-500"></i>รายงานยอดคืนเครื่องใช้ไฟฟ้าที่มีในสต๊อก</h3>
                            <button onclick="document.getElementById('returnedInStockReportModal').remove()" class="text-gray-400 hover:text-gray-600"><i class="fa-solid fa-xmark text-xl"></i></button>
                        </div>
                        
                        <div class="p-4 border-b border-gray-100 bg-gray-50 shrink-0">
                            <div class="flex flex-wrap gap-4 items-end">
                                <div>
                                    <label class="block text-xs font-bold text-gray-700 mb-1">ตั้งแต่วันที่</label>
                                    <input type="date" id="ret_stock_start_date" class="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-emerald-500 outline-none">
                                </div>
                                <div>
                                    <label class="block text-xs font-bold text-gray-700 mb-1">ถึงวันที่</label>
                                    <input type="date" id="ret_stock_end_date" value="${today}" class="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-emerald-500 outline-none">
                                </div>
                                <div class="ml-2 flex flex-col space-y-2">
                                    <label class="flex items-center space-x-2 text-xs cursor-pointer">
                                        <input type="radio" name="ret_stock_mode" value="instock" checked class="text-emerald-500">
                                        <span class="text-gray-700 font-medium">เฉพาะยอดที่ยังอยู่ในสต๊อกปัจจุบัน</span>
                                    </label>
                                    <label class="flex items-center space-x-2 text-xs cursor-pointer">
                                        <input type="radio" name="ret_stock_mode" value="all" class="text-emerald-500">
                                        <span class="text-gray-700 font-medium">ประวัติการคืนทั้งหมดในช่วงเวลา</span>
                                    </label>
                                </div>
                                <button onclick="fetchReturnedInStockReport()" class="bg-emerald-500 text-white px-4 py-2 rounded-lg hover:bg-emerald-600 transition font-medium text-sm shadow-sm ml-4 shrink-0">
                                    <i class="fa-solid fa-magnifying-glass mr-1"></i> ค้นหา
                                </button>
                                <div id="ret_stock_export_btns" class="hidden ml-auto flex space-x-2 shrink-0">
                                    <button onclick="exportReturnedInStockReport('excel')" class="bg-amber-500 text-white px-4 py-2 rounded-lg hover:bg-amber-600 transition font-medium text-sm shadow-sm">
                                        <i class="fa-solid fa-file-excel mr-1"></i> Excel
                                    </button>
                                    <button onclick="exportReturnedInStockReport('pdf')" class="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition font-medium text-sm shadow-sm">
                                        <i class="fa-solid fa-file-pdf mr-1"></i> PDF
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div class="p-0 flex-1 overflow-y-auto bg-white" id="ret_stock_report_container">
                            <div class="flex flex-col items-center justify-center h-full text-gray-400 py-10">
                                <i class="fa-solid fa-calendar-days text-4xl mb-3"></i>
                                <p>เลือกช่วงวันที่และเงื่อนไข จากนั้นกดค้นหา</p>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            cleanupModals();
            document.body.insertAdjacentHTML('beforeend', modalHtml);
        }

        window.retStockReportData = [];

        window.fetchReturnedInStockReport = async function() {
            const startDate = document.getElementById('ret_stock_start_date').value;
            const endDate = document.getElementById('ret_stock_end_date').value;
            const mode = document.querySelector('input[name="ret_stock_mode"]:checked').value;
            
            const container = document.getElementById('ret_stock_report_container');
            container.innerHTML = '<div class="p-10 text-center text-emerald-500"><i class="fa-solid fa-circle-notch fa-spin text-3xl mb-3"></i><p class="font-medium">กำลังโหลดข้อมูล...</p></div>';
            
            // Fetch ALL return logs
            const res = await callApi('getFurnitureLogs', { project: STATE.currentProject, filters: { action: 'return' } });
            
            if (!res.success) {
                container.innerHTML = `<div class="p-10 text-center text-red-500"><i class="fa-solid fa-circle-exclamation text-3xl mb-2"></i><p>${res.message}</p></div>`;
                return;
            }
            
            const allLogs = res.data; // Ordered by timestamp desc
            let targetLogs = [];

            if (mode === 'instock') {
                // Calculate current stock for each item
                const buildingStock = STATE.furnitureStock?.buildings || {};
                const transferred = {};
                for (const items of Object.values(buildingStock)) {
                    for (const [name, qty] of Object.entries(items)) {
                        transferred[name] = (transferred[name] || 0) + qty;
                    }
                }

                Object.entries(transferred).forEach(([itemName, stockQty]) => {
                    const itemLogs = allLogs.filter(l => l.furnitureName === itemName);
                    let remainingQty = stockQty;
                    
                    for (const log of itemLogs) {
                        if (remainingQty <= 0) break;
                        const logQty = log.quantity || 1;
                        const takeQty = Math.min(logQty, remainingQty);
                        targetLogs.push({
                            ...log,
                            displayQuantity: takeQty
                        });
                        remainingQty -= takeQty;
                    }
                });
            } else {
                targetLogs = allLogs.map(log => ({ ...log, displayQuantity: log.quantity || 1 }));
            }

            // Apply date filter
            const startStr = startDate ? startDate + 'T00:00:00' : null;
            const endStr = endDate ? endDate + 'T23:59:59' : null;
            
            let filteredLogs = targetLogs;
            if (startStr || endStr) {
                filteredLogs = targetLogs.filter(log => {
                    if (!log.timestamp) return false;
                    const logDate = log.timestamp;
                    if (startStr && logDate < startStr) return false;
                    if (endStr && logDate > endStr) return false;
                    return true;
                });
            }
            
            filteredLogs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
            window.retStockReportData = filteredLogs;

            if (filteredLogs.length === 0) {
                container.innerHTML = `<div class="flex flex-col items-center justify-center h-full text-gray-400 py-10">
                    <i class="fa-solid fa-folder-open text-4xl mb-3"></i>
                    <p>ไม่พบข้อมูลในช่วงวันที่เลือก</p>
                </div>`;
                document.getElementById('ret_stock_export_btns').classList.add('hidden');
                return;
            }

            document.getElementById('ret_stock_export_btns').classList.remove('hidden');

            const tbody = filteredLogs.map(l => {
                const date = new Date(l.timestamp);
                const dateStr = date.toLocaleString('th-TH', { dateStyle: 'short', timeStyle: 'short' });
                return `
                    <tr class="border-b border-gray-100 hover:bg-gray-50 text-xs">
                        <td class="p-3 text-center whitespace-nowrap text-gray-500">${dateStr}</td>
                        <td class="p-3 font-bold text-gray-800 text-center">${l.roomNo || l.building || '-'}</td>
                        <td class="p-3 text-emerald-600 font-bold">${l.furnitureName}</td>
                        <td class="p-3 text-center text-amber-600 font-bold text-sm bg-amber-50/50">${l.displayQuantity}</td>
                        <td class="p-3 truncate max-w-[120px]" title="${l.userName || '-'}">${l.userName || '-'}</td>
                        <td class="p-3 text-gray-500 truncate max-w-[150px]" title="${l.remark || '-'}">${l.remark || '-'}</td>
                    </tr>
                `;
            }).join('');

            container.innerHTML = `
                <table class="w-full text-left bg-white">
                    <thead class="bg-gray-100 text-gray-600 text-[11px] uppercase sticky top-0 shadow-sm z-10">
                        <tr>
                            <th class="p-3 text-center whitespace-nowrap">วันที่-เวลา</th>
                            <th class="p-3 text-center">ห้อง/ตึก</th>
                            <th class="p-3">รายการเฟอร์นิเจอร์</th>
                            <th class="p-3 text-center">จำนวน</th>
                            <th class="p-3">ผู้ดำเนินการ</th>
                            <th class="p-3">หมายเหตุ</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${tbody}
                    </tbody>
                </table>
            `;
        }

        window.exportReturnedInStockReport = function(type = 'excel') {
            if (!window.retStockReportData || window.retStockReportData.length === 0) return;
            
            const modeText = document.querySelector('input[name="ret_stock_mode"]:checked').value === 'instock' ? 'เฉพาะที่อยู่ในสต๊อก' : 'ประวัติทั้งหมด';
            const filenameDate = new Date().toISOString().split('T')[0];
            
            if (type === 'excel') {
                const headers = ['วันที่-เวลา', 'ห้อง/ตึก', 'รายการเฟอร์นิเจอร์', 'จำนวน', 'ผู้ดำเนินการ', 'หมายเหตุ'];
                const rows = window.retStockReportData.map(l => {
                    const date = new Date(l.timestamp);
                    const dateStr = date.toLocaleString('th-TH', { dateStyle: 'short', timeStyle: 'short' });
                    return [
                        dateStr,
                        l.roomNo || l.building || '-',
                        l.furnitureName,
                        l.displayQuantity,
                        l.userName || '-',
                        l.remark || '-'
                    ];
                });

                const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
                const wb = XLSX.utils.book_new();
                XLSX.utils.book_append_sheet(wb, ws, 'Returned Stock');
                XLSX.writeFile(wb, `returned_stock_${modeText}_${STATE.currentProject}_${filenameDate}.xlsx`);
                showToast('สำเร็จ', 'Export Excel เรียบร้อย', 'success');
            } else if (type === 'pdf') {
                let content = `
                <div id="pdf-container" style="padding: 15px; font-family: 'Sarabun', sans-serif; background: white; width: 100%; box-sizing: border-box;">
                    <h2 style="text-align:center; font-size: 20px; font-weight: bold; margin:0; padding:0;">รายงานยอดคืนเครื่องใช้ไฟฟ้า (${modeText})</h2>
                    <p style="text-align:center; font-size: 13px; color: #4b5563; margin: 10px 0 20px 0;">โครงการ: ${STATE.currentProject} &nbsp;|&nbsp; วันที่ออกรายงาน: ${new Date().toLocaleDateString('th-TH')}</p>
                    <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
                        <thead style="display: table-header-group;">
                            <tr style="background-color: #f3f4f6;">
                                <th style="border: 1px solid #d1d5db; padding: 8px; font-weight: bold; text-align: center;">วันที่-เวลา</th>
                                <th style="border: 1px solid #d1d5db; padding: 8px; font-weight: bold; text-align: center;">ห้อง/ตึก</th>
                                <th style="border: 1px solid #d1d5db; padding: 8px; font-weight: bold; text-align: left;">รายการเฟอร์นิเจอร์</th>
                                <th style="border: 1px solid #d1d5db; padding: 8px; font-weight: bold; text-align: center;">จำนวน</th>
                                <th style="border: 1px solid #d1d5db; padding: 8px; font-weight: bold; text-align: left;">ผู้ดำเนินการ</th>
                                <th style="border: 1px solid #d1d5db; padding: 8px; font-weight: bold; text-align: left;">หมายเหตุ</th>
                            </tr>
                        </thead>
                        <tbody style="display: table-row-group;">`;

                window.retStockReportData.forEach((l, index) => {
                    const bg = index % 2 === 0 ? '#ffffff' : '#f9fafb';
                    const date = new Date(l.timestamp);
                    const dateStr = date.toLocaleString('th-TH', { dateStyle: 'short', timeStyle: 'short' });
                    
                    content += `<tr style="background-color: ${bg}; page-break-inside: avoid;">
                        <td style="border: 1px solid #d1d5db; padding: 6px 8px; text-align: center;">${dateStr}</td>
                        <td style="border: 1px solid #d1d5db; padding: 6px 8px; text-align: center; font-weight: bold;">${l.roomNo || l.building || '-'}</td>
                        <td style="border: 1px solid #d1d5db; padding: 6px 8px;">${l.furnitureName}</td>
                        <td style="border: 1px solid #d1d5db; padding: 6px 8px; text-align: center;">${l.displayQuantity}</td>
                        <td style="border: 1px solid #d1d5db; padding: 6px 8px;">${l.userName || '-'}</td>
                        <td style="border: 1px solid #d1d5db; padding: 6px 8px;">${l.remark || '-'}</td>
                    </tr>`;
                });
                
                content += `</tbody></table></div>`;

                const opt = {
                    margin: [10, 10, 15, 10], // top, left, bottom, right
                    filename: `returned_stock_${modeText}_${STATE.currentProject}_${filenameDate}.pdf`,
                    image: { type: 'jpeg', quality: 0.98 },
                    html2canvas: { scale: 2, useCORS: true, scrollY: 0 },
                    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
                    pagebreak: { mode: ['css', 'legacy'] }
                };

                showLoading(true);
                html2pdf().set(opt).from(content).toPdf().get('pdf').then(function (pdf) {
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
                    showToast('สำเร็จ', 'Export PDF เรียบร้อย', 'success');
                });
            }
        }

        /**
         * แสดงประวัติของเฟอร์นิเจอร์ที่อยู่ในสต๊อก
         */
        window.showStockItemHistory = async function(itemName, currentStockQty) {
            showLoading(true);
            
            const res = await callApi('getFurnitureLogs', { project: STATE.currentProject, filters: { furnitureName: itemName, action: 'return' } });
            showLoading(false);
            
            if (!res.success) {
                showToast('ข้อผิดพลาด', res.message, 'error');
                return;
            }
            
            let logs = res.data;
            
            if (currentStockQty !== undefined && currentStockQty > 0) {
                const currentLogs = [];
                let remainingQty = currentStockQty;
                
                for (const log of logs) {
                    if (remainingQty <= 0) break;
                    
                    const logQty = log.quantity || 1;
                    const takeQty = Math.min(logQty, remainingQty);
                    currentLogs.push({
                        ...log,
                        displayQuantity: takeQty
                    });
                    remainingQty -= takeQty;
                }
                logs = currentLogs;
            }

            if (logs.length === 0) {
                showToast('ไม่มีประวัติ', `ไม่พบประวัติการถอด ${itemName} ออกจากห้อง`, 'info');
                return;
            }
            
            const tbody = logs.map(l => {
                const date = new Date(l.timestamp);
                const dateStr = date.toLocaleString('th-TH', { dateStyle: 'short', timeStyle: 'short' });
                const qtyToDisplay = l.displayQuantity !== undefined ? l.displayQuantity : (l.quantity || 1);
                return `
                    <tr class="border-b border-gray-100 hover:bg-gray-50 text-xs">
                        <td class="p-2 text-center whitespace-nowrap text-gray-500">${dateStr}</td>
                        <td class="p-2 font-bold text-gray-800 text-center">${l.roomNo || l.building || '-'}</td>
                        <td class="p-2 text-center text-amber-600 font-bold">${qtyToDisplay}</td>
                        <td class="p-2 truncate max-w-[100px]" title="${l.userName}">${l.userName}</td>
                        <td class="p-2 truncate max-w-[120px] text-gray-500" title="${l.remark || '-'}">${l.remark || '-'}</td>
                    </tr>
                `;
            }).join('');
            
            const modalHtml = `
                <div id="stockItemHistoryModal" class="fixed inset-0 bg-black/40 backdrop-blur-sm z-[90] flex items-center justify-center p-4" onclick="if(event.target===this)this.remove()">
                    <div class="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col" onclick="event.stopPropagation()">
                        <div class="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-emerald-50 shrink-0">
                            <h3 class="font-bold text-lg text-emerald-800"><i class="fa-solid fa-clock-rotate-left mr-2 text-emerald-500"></i>ประวัติที่มาของ ${itemName}</h3>
                            <button onclick="document.getElementById('stockItemHistoryModal').remove()" class="text-gray-400 hover:text-gray-600"><i class="fa-solid fa-xmark text-xl"></i></button>
                        </div>
                        <div class="p-4 flex-1 overflow-y-auto">
                            <table class="w-full text-left bg-white border border-gray-200">
                                <thead class="bg-gray-100 text-gray-600 text-[11px] uppercase sticky top-0 shadow-sm z-10">
                                    <tr>
                                        <th class="p-2 text-center whitespace-nowrap">วันที่-เวลา</th>
                                        <th class="p-2 text-center">ห้อง/ตึก</th>
                                        <th class="p-2 text-center">จำนวน</th>
                                        <th class="p-2">ผู้ดำเนินการ</th>
                                        <th class="p-2">หมายเหตุ</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${tbody}
                                </tbody>
                            </table>
                            <div class="text-[10px] text-gray-400 text-left mt-3">* แสดงประวัติที่มาของ <b>${itemName}</b> เฉพาะที่อยู่ในสต๊อกปัจจุบัน (อ้างอิงจากการคืนล่าสุด)</div>
                        </div>
                    </div>
                </div>
            `;
            
            cleanupModals();
            document.body.insertAdjacentHTML('beforeend', modalHtml);
        };

        /**
         * สร้าง Building Card แสดงจำนวนเฟอร์ต่อตึก
         */
        function generateFurnitureBuildingCard(bldg) {
            const rooms = STATE.data.filter(r => {
                if (parseRoomInfo(r.roomNo).building !== bldg) return false;
                if (r.roomType && r.roomType.includes('รายวัน')) return false;
                if (r.status && r.status.includes('รายวัน')) return false;
                return true;
            });
            const totalRooms = rooms.length;
            const buildingFurniture = STATE.roomFurniture[bldg] || {};

            // Aggregate furniture counts across all rooms in this building
            const furnitureCounts = {};
            const roomsWithItemCount = {};
            rooms.forEach(r => {
                const roomItems = buildingFurniture[r.roomNo] || {};
                Object.keys(roomItems).forEach(name => {
                    if (roomItems[name] > 0) {
                        if (!furnitureCounts[name]) {
                            furnitureCounts[name] = 0;
                            roomsWithItemCount[name] = 0;
                        }
                        furnitureCounts[name] += roomItems[name];
                        roomsWithItemCount[name]++;
                    }
                });
            });

            // Get furniture items for icons
            const itemMap = {};
            STATE.furnitureItems.forEach(fi => { itemMap[fi.name] = fi; });

            const furnitureNames = Object.keys(furnitureCounts).sort((a, b) => a.localeCompare(b, 'th'));

            // Build cells
            let cellsHtml = '';
            if (furnitureNames.length === 0) {
                cellsHtml = `<div class="text-center text-gray-400 text-xs py-3">ยังไม่มีเฟอร์</div>`;
            } else {
                // Grid layout for furniture counts
                const cols = Math.min(furnitureNames.length, 3);
                cellsHtml = `<div class="grid grid-cols-${cols} gap-1 mt-2">`;
                furnitureNames.forEach(name => {
                    const count = furnitureCounts[name];
                    const roomsWithItem = roomsWithItemCount[name];
                    const item = itemMap[name];
                    const icon = item ? item.icon : 'fa-couch';
                    const isComplete = roomsWithItem === totalRooms;
                    const bgColor = isComplete ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700';

                    cellsHtml += `
                        <div onclick="event.stopPropagation(); renderFurnitureRoomDetail('${bldg}', '${name}')" class="text-center p-1.5 rounded-lg ${bgColor} hover:brightness-95 cursor-pointer transition">
                            <div class="text-lg font-bold">${count}</div>
                            <div class="text-[10px] leading-tight truncate" title="${name}">
                                <i class="fa-solid ${icon} mr-0.5"></i>${name}
                            </div>
                        </div>
                    `;
                });
                cellsHtml += `</div>`;
            }

            return `
                <div onclick="updateActiveNav(1); renderRoomList('${bldg}')" 
                     class="w-44 bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md hover:-translate-y-0.5 cursor-pointer transition-all duration-200 overflow-hidden">
                    <div class="bg-gray-800 text-white text-center py-2 font-bold text-lg tracking-wide">${bldg}</div>
                    <div class="text-center text-[11px] text-gray-500 py-1 border-b border-gray-100">ทั้งหมด ${totalRooms} ห้อง</div>
                    <div class="p-2">
                        ${cellsHtml}
                    </div>
                </div>
            `;
        }

        // Filter state for detail view
        STATE.furnitureDetailFilter = STATE.furnitureDetailFilter || {
            buildings: [],
            items: [],
            statuses: [],
            itemMode: 'has', // 'has' or 'missing'
            collapsed: false
        };

        window.toggleFurnitureDetailFilters = function() {
            STATE.furnitureDetailFilter.collapsed = !STATE.furnitureDetailFilter.collapsed;
            renderFurnitureRoomDetail();
        };

        window.applyFurnitureDetailFilter = function() {
            const bldgs = Array.from(document.querySelectorAll('.fur-bldg-filter:checked')).map(cb => cb.value);
            const items = Array.from(document.querySelectorAll('.fur-item-filter:checked')).map(cb => cb.value);
            const statuses = Array.from(document.querySelectorAll('.fur-status-filter:checked')).map(cb => cb.value);
            const itemModeEl = document.getElementById('furItemMode');
            const itemMode = itemModeEl ? itemModeEl.value : 'has';

            STATE.furnitureDetailFilter.buildings = bldgs;
            STATE.furnitureDetailFilter.items = items;
            STATE.furnitureDetailFilter.statuses = statuses;
            STATE.furnitureDetailFilter.itemMode = itemMode;
            renderFurnitureRoomDetail(); // call without args to use state
        };

        /**
         * แสดงรายละเอียดเฟอร์ต่อห้อง พร้อมตัวกรองตึกและชนิดเฟอร์นิเจอร์
         */
        function renderFurnitureRoomDetail(building = null, filterFurniture = null) {
            STATE.currentView = 'furniture_detail';
            
            if (building) {
                STATE.furnitureDetailFilter.buildings = [building];
            }
            if (filterFurniture) {
                STATE.furnitureDetailFilter.items = [filterFurniture];
            } else if (building) {
                STATE.furnitureDetailFilter.items = []; // reset item filter if only building is clicked
            }

            const selectedBldgs = STATE.furnitureDetailFilter.buildings;
            const selectedItems = STATE.furnitureDetailFilter.items;
            const selectedStatuses = STATE.furnitureDetailFilter.statuses || [];
            const itemMode = STATE.furnitureDetailFilter.itemMode || 'has';

            let rooms = STATE.data.filter(r => {
                const info = parseRoomInfo(r.roomNo);
                const status = r.status || 'ห้องว่าง';
                if (selectedBldgs.length > 0 && !selectedBldgs.includes(info.building)) return false;
                if (selectedStatuses.length > 0 && !selectedStatuses.includes(status)) return false;
                return true;
            });
            rooms.sort((a, b) => a.roomNo.localeCompare(b.roomNo, undefined, { numeric: true }));

            if (selectedItems.length > 0) {
                rooms = rooms.filter(r => {
                    const info = parseRoomInfo(r.roomNo);
                    const roomItems = (STATE.roomFurniture[info.building] || {})[r.roomNo] || {};
                    if (itemMode === 'missing') {
                        // Room must miss at least one of the selected items
                        return selectedItems.some(item => !roomItems[item] || roomItems[item] === 0);
                    } else {
                        // Room must have at least one of the selected items
                        return selectedItems.some(item => roomItems[item] > 0);
                    }
                });
            }

            // Get item map for icons
            const itemMap = {};
            STATE.furnitureItems.forEach(fi => { itemMap[fi.name] = fi; });

            // Calculate totals based on filtered rooms
            const totals = {};
            rooms.forEach(r => {
                const info = parseRoomInfo(r.roomNo);
                const roomItems = (STATE.roomFurniture[info.building] || {})[r.roomNo] || {};
                Object.keys(roomItems).forEach(itemName => {
                    totals[itemName] = (totals[itemName] || 0) + roomItems[itemName];
                });
            });

            // If selectedItems filter is applied, only show totals for those items
            let itemsToShowTotals = Object.keys(totals).sort();
            if (selectedItems.length > 0) {
                itemsToShowTotals = itemsToShowTotals.filter(item => selectedItems.includes(item));
            }

            // Build filter UI checkboxes
            const allBuildings = Array.from(new Set(STATE.data.map(r => parseRoomInfo(r.roomNo).building))).sort((a, b) => a.localeCompare(b, undefined, {numeric: true}));
            const bldgCheckboxesHtml = allBuildings.map(b => `
                <label class="inline-flex items-center space-x-1.5 p-1.5 px-3 rounded-full border ${selectedBldgs.includes(b) ? 'bg-blue-50 border-blue-200 text-blue-700 font-bold' : 'bg-white border-gray-200 text-gray-600'} hover:bg-blue-50 cursor-pointer transition text-xs shrink-0 shadow-sm">
                    <input type="checkbox" value="${b}" class="hidden fur-bldg-filter" ${selectedBldgs.includes(b) ? 'checked' : ''} onchange="applyFurnitureDetailFilter()">
                    <span>ตึก ${b}</span>
                </label>
            `).join('');

            const allFurNames = STATE.furnitureItems.map(fi => fi.name);
            const furCheckboxesHtml = allFurNames.map(f => {
                const item = itemMap[f];
                const icon = item ? item.icon : 'fa-couch';
                const isSelected = selectedItems.includes(f);
                return `
                <label class="inline-flex items-center space-x-1.5 p-1.5 px-3 rounded-full border ${isSelected ? 'bg-amber-50 border-amber-200 text-amber-700 font-bold' : 'bg-white border-gray-200 text-gray-600'} hover:bg-amber-50 cursor-pointer transition text-xs shrink-0 shadow-sm">
                    <input type="checkbox" value="${f}" class="hidden fur-item-filter" ${isSelected ? 'checked' : ''} onchange="applyFurnitureDetailFilter()">
                    <i class="fa-solid ${icon} ${isSelected ? 'text-amber-500' : 'text-gray-400'}"></i>
                    <span>${f}</span>
                </label>
                `;
            }).join('');

            const allStatuses = Array.from(new Set(STATE.data.map(r => r.status || 'ห้องว่าง'))).filter(Boolean).sort();
            const statusCheckboxesHtml = allStatuses.map(s => {
                const isSelected = selectedStatuses.includes(s);
                return `
                <label class="inline-flex items-center space-x-1.5 p-1.5 px-3 rounded-full border ${isSelected ? 'bg-emerald-50 border-emerald-200 text-emerald-700 font-bold' : 'bg-white border-gray-200 text-gray-600'} hover:bg-emerald-50 cursor-pointer transition text-xs shrink-0 shadow-sm">
                    <input type="checkbox" value="${s}" class="hidden fur-status-filter" ${isSelected ? 'checked' : ''} onchange="applyFurnitureDetailFilter()">
                    <span>${s}</span>
                </label>
                `;
            }).join('');

            const isCollapsed = STATE.furnitureDetailFilter.collapsed;

            let html = `
                <div class="flex flex-col h-full bg-white relative overflow-hidden">
                    <div class="px-4 py-3 border-b border-gray-200 flex justify-between items-center bg-gray-50 shrink-0 z-20">
                        <div class="flex items-center font-bold text-base text-gray-800">
                            <button onclick="renderFurnitureMap()" class="mr-3 text-gray-500 hover:text-amber-600 bg-white p-1 rounded-full shadow w-8 h-8 flex items-center justify-center transition hover:bg-gray-50">
                                <i class="fa-solid fa-arrow-left"></i>
                            </button>
                            <i class="fa-solid fa-couch text-amber-500 mr-2"></i> รายละเอียดเฟอร์นิเจอร์
                        </div>
                        <div class="flex space-x-2 items-center">
                            <button onclick="openFurnitureReportModal()" class="bg-gray-600 text-white px-3 py-1.5 rounded-lg hover:bg-gray-700 transition text-xs font-medium flex items-center shadow-sm">
                                <i class="fa-solid fa-file-excel mr-1"></i> รายงาน
                            </button>
                            ${selectedBldgs.length === 1 ? `
                            <button onclick="openTransferToCentralModal('${selectedBldgs[0]}')" class="bg-indigo-500 text-white px-3 py-1.5 rounded-lg hover:bg-indigo-600 transition text-xs font-medium flex items-center shadow-sm">
                                <i class="fa-solid fa-truck mr-1"></i> เบิกไปส่วนกลาง
                            </button>
                            ` : ''}
                        </div>
                    </div>
                    
                    <!-- Filters & Totals Section -->
                    <div class="bg-white border-b border-gray-100 p-3 shrink-0 z-10 shadow-sm flex items-start justify-between">
                        <!-- Left: Filter Rows -->
                        <div class="flex-1 overflow-hidden transition-all duration-300 ${isCollapsed ? 'max-h-12' : 'max-h-96'}">
                            ${isCollapsed ? `
                                <div class="flex flex-wrap items-center gap-1.5 text-xs text-gray-500 py-1">
                                    <span class="font-bold mr-1"><i class="fa-solid fa-filter mr-1"></i>กำลังกรอง:</span>
                                    ${[
                                        ...selectedBldgs.map(b => `<span class="bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full border border-blue-200">ตึก ${b}</span>`),
                                        ...selectedItems.map(i => `<span class="bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full border border-amber-200">${i}</span>`),
                                        ...selectedStatuses.map(s => `<span class="bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full border border-emerald-200">${s}</span>`)
                                    ].join('')}
                                    ${(selectedBldgs.length===0 && selectedItems.length===0 && selectedStatuses.length===0) ? '<span>ทั้งหมด</span>' : ''}
                                </div>
                            ` : `
                                <div class="flex flex-col space-y-2">
                                    <div class="flex items-center">
                                        <span class="text-xs font-bold text-gray-500 mr-2 whitespace-nowrap"><i class="fa-regular fa-building mr-1"></i>ตึก:</span>
                                        <div class="flex overflow-x-auto space-x-2 pb-1 scrollbar-hide flex-1">
                                            ${bldgCheckboxesHtml}
                                        </div>
                                    </div>
                                    <div class="flex items-center">
                                        <span class="text-xs font-bold text-gray-500 mr-2 whitespace-nowrap"><i class="fa-solid fa-couch mr-1"></i>เฟอร์ฯ:</span>
                                        <select id="furItemMode" onchange="applyFurnitureDetailFilter()" class="text-xs bg-gray-50 border border-gray-200 rounded-lg py-1 px-2 outline-none focus:ring-1 focus:ring-amber-500 mr-3 shadow-sm font-medium text-gray-600">
                                            <option value="has" ${STATE.furnitureDetailFilter.itemMode === 'has' ? 'selected' : ''}>ห้องที่มี</option>
                                            <option value="missing" ${STATE.furnitureDetailFilter.itemMode === 'missing' ? 'selected' : ''}>ห้องที่ไม่มี</option>
                                        </select>
                                        <div class="flex overflow-x-auto space-x-2 pb-1 scrollbar-hide flex-1">
                                            ${furCheckboxesHtml}
                                        </div>
                                    </div>
                                    <div class="flex items-center">
                                        <span class="text-xs font-bold text-gray-500 mr-2 whitespace-nowrap"><i class="fa-solid fa-tag mr-1"></i>สถานะห้อง:</span>
                                        <div class="flex overflow-x-auto space-x-2 pb-1 scrollbar-hide flex-1">
                                            ${statusCheckboxesHtml}
                                        </div>
                                    </div>
                                </div>
                            `}
                        </div>
                        
                        <!-- Right: Totals & Toggle -->
                        <div class="flex flex-col items-end pl-4 ml-4 border-l border-gray-100 shrink-0 min-w-[120px]">
                            <button onclick="toggleFurnitureDetailFilters()" class="text-[11px] text-gray-400 hover:text-gray-700 font-medium flex items-center mb-1.5 transition">
                                <i class="fa-solid ${isCollapsed ? 'fa-chevron-down' : 'fa-chevron-up'} mr-1"></i> 
                                ${isCollapsed ? 'ขยายตัวกรอง' : 'ย่อตัวกรอง'}
                            </button>
                            
                            <!-- Totals -->
                            <div class="flex ${isCollapsed ? 'flex-row space-x-2' : 'flex-col space-y-1'} items-end justify-end flex-wrap">
                                ${itemsToShowTotals.map(item => {
                                    const icon = itemMap[item] ? itemMap[item].icon : 'fa-couch';
                                    if (isCollapsed) {
                                        return `<span class="text-[10px] text-gray-500 flex items-center"><i class="fa-solid ${icon} text-amber-500/70 mr-1"></i>${item} <span class="ml-1 text-amber-600 font-bold">${totals[item]}</span></span>`;
                                    } else {
                                        return `<span class="text-xs font-bold text-gray-700 flex items-center bg-amber-50/50 px-2 py-0.5 rounded border border-amber-100/50"><i class="fa-solid ${icon} text-amber-500 mr-1"></i>${item} <span class="ml-1 text-amber-600 bg-amber-100 px-1.5 py-0.5 rounded">${totals[item]}</span></span>`;
                                    }
                                }).join('')}
                                ${itemsToShowTotals.length === 0 ? `<span class="text-[10px] text-gray-400">ไม่มียอด</span>` : ''}
                            </div>
                        </div>
                    </div>

                    <div class="p-3 flex-1 overflow-y-auto pb-24 bg-gray-50/30">
            `;

            if (allFurNames.length === 0) {
                html += `<div class="text-center text-gray-400 py-10"><i class="fa-solid fa-couch text-4xl mb-3"></i><p>ยังไม่มีรายการเฟอร์นิเจอร์</p></div>`;
            } else if (rooms.length === 0) {
                html += `<div class="text-center text-gray-400 py-10"><i class="fa-regular fa-folder-open text-4xl mb-3"></i><p>ไม่พบห้องตามเงื่อนไข</p></div>`;
            } else {
                html += `<div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">`;

                rooms.forEach(r => {
                    const info = parseRoomInfo(r.roomNo);
                    const roomItems = (STATE.roomFurniture[info.building] || {})[r.roomNo] || {};

                    html += `
                    <div class="bg-white p-3 rounded-xl shadow-sm border border-gray-200 hover:shadow-lg hover:border-amber-400 transition group relative overflow-hidden flex flex-col">
                        <div class="absolute -right-4 -top-4 w-14 h-14 bg-amber-50 rounded-full group-hover:bg-amber-100 transition"></div>
                        <div class="relative z-10 flex justify-between items-start mb-2">
                            <div>
                                <div class="font-bold text-xl text-gray-800 mb-0.5 group-hover:text-amber-600 transition cursor-pointer" onclick="openModal('${r.rowIndex}')">${r.roomNo} <span class="text-xs bg-gray-100 px-1 py-0.5 rounded text-gray-500 font-normal ml-1">${info.building}</span></div>
                                <div class="text-xs text-gray-500 flex items-center"><i class="fa-regular fa-building mr-1"></i> FL.${info.floor}</div>
                            </div>
                            <div class="flex flex-col space-y-1">
                                <button onclick="openAddFurnitureModal('${r.roomNo}')" class="text-emerald-500 hover:text-emerald-700 p-1 bg-emerald-50 rounded w-6 h-6 flex justify-center items-center transition" title="เพิ่มเฟอร์">
                                    <i class="fa-solid fa-plus text-[10px]"></i>
                                </button>
                                <button onclick="openReturnFurnitureModal('${r.roomNo}')" class="text-red-500 hover:text-red-700 p-1 bg-red-50 rounded w-6 h-6 flex justify-center items-center transition" title="คืนเฟอร์">
                                    <i class="fa-solid fa-arrow-right-from-bracket text-[10px]"></i>
                                </button>
                            </div>
                        </div>
                        
                        <div class="flex flex-wrap gap-1 mt-auto pt-2 border-t border-gray-50">
                    `;

                    let hasAnyFurniture = false;
                    allFurNames.forEach(name => {
                        const qty = roomItems[name] || 0;
                        if (qty > 0) {
                            hasAnyFurniture = true;
                            const icon = itemMap[name] ? itemMap[name].icon : 'fa-couch';
                            const isFiltered = selectedItems.length > 0 && selectedItems.includes(name);
                            const highlightClass = isFiltered ? 'bg-amber-100 text-amber-700 border-amber-200 shadow-sm font-bold' : 'bg-gray-50 border-gray-200 text-gray-600';
                            const iconClass = isFiltered ? 'text-amber-600' : 'text-gray-400';
                            
                            html += `<div class="${highlightClass} border px-2 py-0.5 rounded-md text-[10px] flex items-center transition">
                                        <i class="fa-solid ${icon} mr-1 ${iconClass}"></i><span class="truncate max-w-[60px]" title="${name}">${name}</span> <span class="ml-1 font-bold">x${qty}</span>
                                    </div>`;
                        }
                    });

                    if (!hasAnyFurniture) {
                        html += `<div class="text-[10px] text-gray-400 italic w-full text-center py-1">ไม่มีเฟอร์นิเจอร์</div>`;
                    }

                    html += `
                        </div>
                    </div>`;
                });

                html += `</div>`;
            }

            html += `</div></div>`;
            document.getElementById('mainContent').innerHTML = html;
            updateActiveNav(2);
        }

        // =====================================================
        // Furniture Modals
        // =====================================================

        /**
         * Modal คืนเฟอร์จากห้อง
         */
        function openReturnFurnitureModal(roomNo) {
            const info = parseRoomInfo(roomNo);
            const buildingFurniture = STATE.roomFurniture[info.building] || {};
            const roomItems = buildingFurniture[roomNo] || {};
            const itemNames = Object.keys(roomItems);

            if (itemNames.length === 0) {
                showToast('ไม่มีเฟอร์', `ห้อง ${roomNo} ไม่มีเฟอร์นิเจอร์ให้คืน`, 'error');
                return;
            }

            const itemMap = {};
            STATE.furnitureItems.forEach(fi => { itemMap[fi.name] = fi; });

            let optionsHtml = itemNames.map(name => {
                const qty = roomItems[name];
                const icon = itemMap[name] ? itemMap[name].icon : 'fa-couch';
                return `
                    <label class="flex items-center space-x-3 p-3 rounded-lg border border-gray-200 hover:bg-red-50 cursor-pointer transition">
                        <input type="checkbox" name="fur_return" value="${name}" class="rounded text-red-500">
                        <i class="fa-solid ${icon} text-gray-500"></i>
                        <span class="flex-1 font-medium text-gray-700">${name}</span>
                        <div class="flex items-center space-x-1">
                            <span class="text-xs text-gray-400">จำนวน:</span>
                            <input type="number" min="1" max="${qty}" value="1" 
                                   class="w-14 text-center border border-gray-300 rounded px-1 py-0.5 text-sm" 
                                   id="fur_ret_qty_${name.replace(/\s/g, '_')}">
                            <span class="text-xs text-gray-400">/ ${qty}</span>
                        </div>
                    </label>
                `;
            }).join('');

            const modalHtml = `
                <div id="furnitureActionModal" class="fixed inset-0 bg-black/40 backdrop-blur-sm z-[90] flex items-center justify-center p-4" onclick="if(event.target===this)this.remove()">
                    <div class="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[80vh] overflow-hidden" onclick="event.stopPropagation()">
                        <div class="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-red-50">
                            <h3 class="font-bold text-lg text-red-700"><i class="fa-solid fa-arrow-right-from-bracket mr-2"></i>คืนเฟอร์ — ห้อง ${roomNo}</h3>
                            <button onclick="document.getElementById('furnitureActionModal').remove()" class="text-gray-400 hover:text-gray-600"><i class="fa-solid fa-xmark text-xl"></i></button>
                        </div>
                        <div class="p-6 space-y-3 overflow-y-auto max-h-[50vh]">
                            ${optionsHtml}
                        </div>
                        <div class="p-4 border-t border-gray-100">
                            <textarea id="fur_return_remark" placeholder="หมายเหตุ (ถ้ามี)" class="w-full border border-gray-300 rounded-lg p-2 text-sm mb-3" rows="2"></textarea>
                            <button onclick="executeReturnFurniture('${roomNo}')" class="w-full bg-red-500 text-white py-3 rounded-xl font-bold hover:bg-red-600 transition">
                                <i class="fa-solid fa-check mr-2"></i>ยืนยันคืนเฟอร์
                            </button>
                        </div>
                    </div>
                </div>
            `;

            cleanupModals();
            document.body.insertAdjacentHTML('beforeend', modalHtml);
        }

        /**
         * ดำเนินการคืนเฟอร์
         */
        async function executeReturnFurniture(roomNo) {
            const checkboxes = document.querySelectorAll('input[name="fur_return"]:checked');
            if (checkboxes.length === 0) {
                showToast('เลือกเฟอร์', 'กรุณาเลือกเฟอร์ที่ต้องการคืน', 'error');
                return;
            }

            const remark = document.getElementById('fur_return_remark')?.value || '';

            const items = Array.from(checkboxes).map(cb => {
                const name = cb.value;
                const qtyInput = document.getElementById(`fur_ret_qty_${name.replace(/\s/g, '_')}`);
                return { name, qty: parseInt(qtyInput?.value || '1') };
            });

            showLoading(true);
            try {
                const res = await callApi('returnFurniture', {
                    project: STATE.currentProject,
                    roomNo,
                    items,
                    userName: STATE.user.name,
                    remark
                }, { silent: true });

                if (!res.success) {
                    showToast('ผิดพลาด', res.message, 'error');
                    showLoading(false);
                    return;
                }

                showLoading(false);
                document.getElementById('furnitureActionModal')?.remove();
                showToast('สำเร็จ', 'คืนเฟอร์นิเจอร์เรียบร้อย', 'success');

                // Note: fetchFurnitureData and UI re-rendering are now handled automatically 
                // by the real-time onSnapshot listeners in app.js
            } catch (error) {
                showLoading(false);
                showToast('ผิดพลาด', error.message, 'error');
            }
        }

        /**
         * Modal เพิ่มเฟอร์เข้าห้อง
         */
        function openAddFurnitureModal(roomNo) {
            const info = parseRoomInfo(roomNo);
            const buildingStock = STATE.furnitureStock.buildings[info.building] || {};
            const stockNames = Object.keys(buildingStock);

            if (stockNames.length === 0) {
                showToast('ไม่มีสต๊อก', `สต๊อกตึก ${info.building} ว่างเปล่า ไม่มีเฟอร์ให้เพิ่ม`, 'error');
                return;
            }

            const itemMap = {};
            STATE.furnitureItems.forEach(fi => { itemMap[fi.name] = fi; });

            let optionsHtml = stockNames.map(name => {
                const stockQty = buildingStock[name];
                const icon = itemMap[name] ? itemMap[name].icon : 'fa-couch';
                return `
                    <label class="flex items-center space-x-3 p-3 rounded-lg border border-gray-200 hover:bg-emerald-50 cursor-pointer transition">
                        <input type="checkbox" name="fur_add" value="${name}" class="rounded text-emerald-500">
                        <i class="fa-solid ${icon} text-gray-500"></i>
                        <span class="flex-1 font-medium text-gray-700">${name}</span>
                        <div class="flex items-center space-x-1">
                            <span class="text-xs text-gray-400">จำนวน:</span>
                            <input type="number" min="1" max="${stockQty}" value="1" 
                                   class="w-14 text-center border border-gray-300 rounded px-1 py-0.5 text-sm" 
                                   id="fur_add_qty_${name.replace(/\s/g, '_')}">
                            <span class="text-xs text-gray-400">/ ${stockQty}</span>
                        </div>
                    </label>
                `;
            }).join('');

            const modalHtml = `
                <div id="furnitureActionModal" class="fixed inset-0 bg-black/40 backdrop-blur-sm z-[90] flex items-center justify-center p-4" onclick="if(event.target===this)this.remove()">
                    <div class="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[80vh] overflow-hidden" onclick="event.stopPropagation()">
                        <div class="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-emerald-50">
                            <h3 class="font-bold text-lg text-emerald-700"><i class="fa-solid fa-plus mr-2"></i>เพิ่มเฟอร์ — ห้อง ${roomNo}</h3>
                            <button onclick="document.getElementById('furnitureActionModal').remove()" class="text-gray-400 hover:text-gray-600"><i class="fa-solid fa-xmark text-xl"></i></button>
                        </div>
                        <div class="p-6 space-y-3 overflow-y-auto max-h-[50vh]">
                            <p class="text-xs text-gray-500 mb-2"><i class="fa-solid fa-info-circle mr-1"></i>เฟอร์จะถูกเบิกจากสต๊อกตึก ${info.building}</p>
                            ${optionsHtml}
                        </div>
                        <div class="p-4 border-t border-gray-100">
                            <textarea id="fur_add_remark" placeholder="หมายเหตุ (ถ้ามี)" class="w-full border border-gray-300 rounded-lg p-2 text-sm mb-3" rows="2"></textarea>
                            <button onclick="executeAddFurniture('${roomNo}')" class="w-full bg-emerald-500 text-white py-3 rounded-xl font-bold hover:bg-emerald-600 transition">
                                <i class="fa-solid fa-check mr-2"></i>ยืนยันเพิ่มเฟอร์
                            </button>
                        </div>
                    </div>
                </div>
            `;

            cleanupModals();
            document.body.insertAdjacentHTML('beforeend', modalHtml);
        }

        /**
         * ดำเนินการเพิ่มเฟอร์เข้าห้อง
         */
        async function executeAddFurniture(roomNo) {
            const checkboxes = document.querySelectorAll('input[name="fur_add"]:checked');
            if (checkboxes.length === 0) {
                showToast('เลือกเฟอร์', 'กรุณาเลือกเฟอร์ที่ต้องการเพิ่ม', 'error');
                return;
            }

            const remark = document.getElementById('fur_add_remark')?.value || '';

            const items = Array.from(checkboxes).map(cb => {
                const name = cb.value;
                const qtyInput = document.getElementById(`fur_add_qty_${name.replace(/\s/g, '_')}`);
                return { name, qty: parseInt(qtyInput?.value || '1') };
            });

            showLoading(true);
            try {
                const res = await callApi('addFurnitureToRoom', {
                    project: STATE.currentProject,
                    roomNo,
                    items,
                    userName: STATE.user.name,
                    remark
                }, { silent: true });

                if (!res.success) {
                    showToast('ผิดพลาด', res.message, 'error');
                    showLoading(false);
                    return;
                }

                showLoading(false);
                document.getElementById('furnitureActionModal')?.remove();
                showToast('สำเร็จ', 'เพิ่มเฟอร์นิเจอร์เรียบร้อย', 'success');

                // Note: UI re-rendering is now handled automatically by real-time onSnapshot listeners
            } catch (error) {
                showLoading(false);
                showToast('ผิดพลาด', error.message, 'error');
            }
        }

        /**
         * Modal เบิกเฟอร์ไปส่วนกลาง
         */
        function openTransferToCentralModal(building) {
            const buildingStock = STATE.furnitureStock.buildings[building] || {};
            const stockNames = Object.keys(buildingStock);

            if (stockNames.length === 0) {
                showToast('ไม่มีสต๊อก', `สต๊อกตึก ${building} ว่างเปล่า`, 'error');
                return;
            }

            const itemMap = {};
            STATE.furnitureItems.forEach(fi => { itemMap[fi.name] = fi; });

            let optionsHtml = stockNames.map(name => {
                const stockQty = buildingStock[name];
                const icon = itemMap[name] ? itemMap[name].icon : 'fa-couch';
                return `
                    <label class="flex items-center space-x-3 p-3 rounded-lg border border-gray-200 hover:bg-indigo-50 cursor-pointer transition">
                        <input type="checkbox" name="fur_transfer" value="${name}" class="rounded text-indigo-500">
                        <i class="fa-solid ${icon} text-gray-500"></i>
                        <span class="flex-1 font-medium text-gray-700">${name}</span>
                        <div class="flex items-center space-x-1">
                            <span class="text-xs text-gray-400">จำนวน:</span>
                            <input type="number" min="1" max="${stockQty}" value="${stockQty}" 
                                   class="w-14 text-center border border-gray-300 rounded px-1 py-0.5 text-sm" 
                                   id="fur_xfer_qty_${name.replace(/\s/g, '_')}">
                            <span class="text-xs text-gray-400">/ ${stockQty}</span>
                        </div>
                    </label>
                `;
            }).join('');

            const modalHtml = `
                <div id="furnitureActionModal" class="fixed inset-0 bg-black/40 backdrop-blur-sm z-[90] flex items-center justify-center p-4" onclick="if(event.target===this)this.remove()">
                    <div class="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[80vh] overflow-hidden" onclick="event.stopPropagation()">
                        <div class="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-indigo-50">
                            <h3 class="font-bold text-lg text-indigo-700"><i class="fa-solid fa-truck mr-2"></i>เบิกไปส่วนกลาง — ตึก ${building}</h3>
                            <button onclick="document.getElementById('furnitureActionModal').remove()" class="text-gray-400 hover:text-gray-600"><i class="fa-solid fa-xmark text-xl"></i></button>
                        </div>
                        <div class="p-6 space-y-3 overflow-y-auto max-h-[50vh]">
                            ${optionsHtml}
                        </div>
                        <div class="p-4 border-t border-gray-100">
                            <textarea id="fur_xfer_remark" placeholder="หมายเหตุ (ถ้ามี)" class="w-full border border-gray-300 rounded-lg p-2 text-sm mb-3" rows="2"></textarea>
                            <button onclick="executeTransferToCentral('${building}')" class="w-full bg-indigo-500 text-white py-3 rounded-xl font-bold hover:bg-indigo-600 transition">
                                <i class="fa-solid fa-check mr-2"></i>ยืนยันเบิกไปส่วนกลาง
                            </button>
                        </div>
                    </div>
                </div>
            `;

            cleanupModals();
            document.body.insertAdjacentHTML('beforeend', modalHtml);
        }

        /**
         * ดำเนินการเบิกเฟอร์ไปส่วนกลาง
         */
        async function executeTransferToCentral(building) {
            const checkboxes = document.querySelectorAll('input[name="fur_transfer"]:checked');
            if (checkboxes.length === 0) {
                showToast('เลือกเฟอร์', 'กรุณาเลือกเฟอร์ที่ต้องการเบิก', 'error');
                return;
            }

            const remark = document.getElementById('fur_xfer_remark')?.value || '';

            const items = Array.from(checkboxes).map(cb => {
                const name = cb.value;
                const qtyInput = document.getElementById(`fur_xfer_qty_${name.replace(/\s/g, '_')}`);
                return { name, qty: parseInt(qtyInput?.value || '1') };
            });

            showLoading(true);
            try {
                const res = await callApi('transferToCentral', {
                    project: STATE.currentProject,
                    building,
                    items,
                    userName: STATE.user.name,
                    remark
                }, { silent: true });

                if (!res.success) {
                    showToast('ผิดพลาด', res.message, 'error');
                    showLoading(false);
                    return;
                }

                showLoading(false);
                document.getElementById('furnitureActionModal')?.remove();
                showToast('สำเร็จ', 'เบิกเฟอร์ไปส่วนกลางเรียบร้อย', 'success');

                // Note: UI re-rendering is handled by onSnapshot
            } catch (error) {
                showLoading(false);
                showToast('ผิดพลาด', error.message, 'error');
            }
        }

        /**
         * Modal เบิกเฟอร์จากส่วนกลางไปตึก
         */
        function openTransferFromCentralModal() {
            const centralStock = STATE.furnitureStock.central || {};
            const stockNames = Object.keys(centralStock);

            if (stockNames.length === 0) {
                showToast('ไม่มีสต๊อก', 'สต๊อกส่วนกลางว่างเปล่า', 'error');
                return;
            }

            const itemMap = {};
            STATE.furnitureItems.forEach(fi => { itemMap[fi.name] = fi; });

            const allBuildings = Array.from(new Set(STATE.data.map(r => parseRoomInfo(r.roomNo).building))).sort();
            const buildingOptions = allBuildings.map(b => `<option value="${b}">ตึก ${b}</option>`).join('');

            let optionsHtml = stockNames.map(name => {
                const stockQty = centralStock[name];
                const icon = itemMap[name] ? itemMap[name].icon : 'fa-couch';
                return `
                    <label class="flex items-center space-x-3 p-3 rounded-lg border border-gray-200 hover:bg-indigo-50 cursor-pointer transition">
                        <input type="checkbox" name="fur_transfer_from_central" value="${name}" class="rounded text-indigo-500">
                        <i class="fa-solid ${icon} text-gray-500"></i>
                        <span class="flex-1 font-medium text-gray-700">${name}</span>
                        <div class="flex items-center space-x-1">
                            <span class="text-xs text-gray-400">จำนวน:</span>
                            <input type="number" min="1" max="${stockQty}" value="${stockQty}" 
                                   class="w-14 text-center border border-gray-300 rounded px-1 py-0.5 text-sm" 
                                   id="fur_xfer_from_qty_${name.replace(/\s/g, '_')}">
                            <span class="text-xs text-gray-400">/ ${stockQty}</span>
                        </div>
                    </label>
                `;
            }).join('');

            const modalHtml = `
                <div id="furnitureActionModal" class="fixed inset-0 bg-black/40 backdrop-blur-sm z-[90] flex items-center justify-center p-4" onclick="if(event.target===this)this.remove()">
                    <div class="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[80vh] overflow-hidden flex flex-col" onclick="event.stopPropagation()">
                        <div class="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-indigo-50 shrink-0">
                            <h3 class="font-bold text-lg text-indigo-700"><i class="fa-solid fa-truck mr-2"></i>เบิกกลับไปตึก</h3>
                            <button onclick="document.getElementById('furnitureActionModal').remove()" class="text-gray-400 hover:text-gray-600"><i class="fa-solid fa-xmark text-xl"></i></button>
                        </div>
                        <div class="p-6 space-y-4 overflow-y-auto flex-1">
                            <div>
                                <label class="block text-sm font-bold text-gray-700 mb-2">เลือกตึกปลายทาง <span class="text-red-500">*</span></label>
                                <select id="fur_xfer_target_building" class="w-full border border-gray-300 rounded-lg p-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500">
                                    <option value="">-- กรุณาเลือกตึก --</option>
                                    ${buildingOptions}
                                </select>
                            </div>
                            <div class="space-y-3">
                                <label class="block text-sm font-bold text-gray-700 mb-1">เลือกเฟอร์นิเจอร์</label>
                                ${optionsHtml}
                            </div>
                        </div>
                        <div class="p-4 border-t border-gray-100 shrink-0">
                            <textarea id="fur_xfer_from_remark" placeholder="หมายเหตุ (ถ้ามี)" class="w-full border border-gray-300 rounded-lg p-2 text-sm mb-3" rows="2"></textarea>
                            <button onclick="executeTransferFromCentral()" class="w-full bg-indigo-500 text-white py-3 rounded-xl font-bold hover:bg-indigo-600 transition">
                                <i class="fa-solid fa-check mr-2"></i>ยืนยันเบิกไปตึก
                            </button>
                        </div>
                    </div>
                </div>
            `;

            cleanupModals();
            document.body.insertAdjacentHTML('beforeend', modalHtml);
        }

        async function executeTransferFromCentral() {
            const building = document.getElementById('fur_xfer_target_building').value;
            if (!building) {
                showToast('เลือกตึก', 'กรุณาเลือกตึกปลายทาง', 'error');
                return;
            }

            const checkboxes = document.querySelectorAll('input[name="fur_transfer_from_central"]:checked');
            if (checkboxes.length === 0) {
                showToast('เลือกเฟอร์', 'กรุณาเลือกเฟอร์ที่ต้องการเบิก', 'error');
                return;
            }

            const remark = document.getElementById('fur_xfer_from_remark')?.value || '';

            const items = Array.from(checkboxes).map(cb => {
                const name = cb.value;
                const qtyInput = document.getElementById(`fur_xfer_from_qty_${name.replace(/\s/g, '_')}`);
                return { name, qty: parseInt(qtyInput?.value || '1') };
            });

            showLoading(true);
            try {
                const res = await callApi('transferFromCentral', {
                    project: STATE.currentProject,
                    building,
                    items,
                    userName: STATE.user.name,
                    remark
                }, { silent: true });

                if (!res.success) {
                    showToast('ผิดพลาด', res.message, 'error');
                    showLoading(false);
                    return;
                }

                showLoading(false);
                document.getElementById('furnitureActionModal')?.remove();
                showToast('สำเร็จ', 'เบิกเฟอร์กลับไปตึกเรียบร้อย', 'success');

                // Note: UI re-rendering is handled by onSnapshot
            } catch (error) {
                showLoading(false);
                showToast('ผิดพลาด', error.message, 'error');
            }
        }

        // =====================================================
        // Stock Panel
        // =====================================================

        /**
         * แสดงหน้ารวมสต๊อกเฟอร์ (ตึก + ส่วนกลาง)
         */
        function renderFurnitureStockPanel() {
            STATE.currentView = 'furniture_stock';

            const itemMap = {};
            STATE.furnitureItems.forEach(fi => { itemMap[fi.name] = fi; });

            // Building stocks
            const buildingStocks = STATE.furnitureStock.buildings || {};
            const centralStock = STATE.furnitureStock.central || {};

            let html = `
                <div class="flex flex-col h-full fade-in-up">
                    <div class="px-6 pt-6 pb-4 bg-white shadow-sm flex items-center justify-between sticky top-0 z-30 border-b border-gray-100">
                        <div class="flex items-center">
                            <button onclick="renderFurnitureMap()" class="mr-3 text-gray-500 hover:text-amber-600 bg-gray-100 p-2 rounded-full transition hover:bg-gray-200">
                                <i class="fa-solid fa-arrow-left"></i>
                            </button>
                            <h2 class="font-bold text-xl text-gray-800"><i class="fa-solid fa-warehouse mr-2 text-amber-500"></i>สต๊อกเฟอร์นิเจอร์</h2>
                        </div>
                    </div>
                    <div class="p-6 space-y-6 pb-24 overflow-y-auto">
            `;

            // Central Stock
            html += `
                <div class="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-2xl p-5 border border-indigo-100 shadow-sm">
                    <div class="flex items-center justify-between mb-4">
                        <h3 class="font-bold text-lg text-indigo-800 flex items-center">
                            <i class="fa-solid fa-building-columns mr-2 text-indigo-500"></i>สต๊อกส่วนกลาง
                        </h3>
                        <div class="flex space-x-2">
                            ${STATE.user && STATE.user.role === 'Admin' ? `
                            <button onclick="openAddCentralStockModal()" class="text-xs text-emerald-500 hover:text-emerald-700 transition font-bold bg-white px-3 py-1.5 rounded-lg border border-emerald-100 shadow-sm">
                                <i class="fa-solid fa-plus mr-1"></i>เพิ่มเข้าสต๊อก
                            </button>
                            ` : ''}
                            ${Object.keys(centralStock).length > 0 ? `
                                ${STATE.user && STATE.user.role === 'Admin' ? `
                                <button onclick="openDisposeCentralStockModal()" class="text-xs text-red-500 hover:text-red-700 transition font-bold bg-white px-3 py-1.5 rounded-lg border border-red-100 shadow-sm">
                                    <i class="fa-solid fa-trash-can mr-1"></i>ตัดสต๊อก
                                </button>
                                ` : ''}
                                <button onclick="openTransferFromCentralModal()" class="text-xs text-indigo-500 hover:text-indigo-700 transition font-bold bg-white px-3 py-1.5 rounded-lg border border-indigo-100 shadow-sm">
                                    <i class="fa-solid fa-truck mr-1"></i>เบิกกลับไปตึก
                                </button>
                            ` : ''}
                        </div>
                    </div>
            `;

            const centralNames = Object.keys(centralStock);
            if (centralNames.length === 0) {
                html += `<p class="text-gray-400 text-sm text-center py-4">ว่างเปล่า</p>`;
            } else {
                html += `<div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">`;
                centralNames.forEach(name => {
                    const qty = centralStock[name];
                    const icon = itemMap[name] ? itemMap[name].icon : 'fa-couch';
                    html += `
                        <div class="bg-white rounded-xl p-3 text-center shadow-sm border border-indigo-100">
                            <i class="fa-solid ${icon} text-xl text-indigo-500 mb-2"></i>
                            <div class="text-2xl font-bold text-indigo-700">${qty}</div>
                            <div class="text-xs text-gray-500 truncate" title="${name}">${name}</div>
                        </div>
                    `;
                });
                html += `</div>`;
            }
            html += `</div>`;

            // Building Stocks
            const buildingNames = Object.keys(buildingStocks).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
            if (buildingNames.length > 0) {
                html += `
                    <div class="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                        <h3 class="font-bold text-lg text-gray-800 mb-4 flex items-center">
                            <i class="fa-solid fa-warehouse mr-2 text-amber-500"></i>สต๊อกตามตึก
                        </h3>
                        <div class="space-y-3">
                `;

                buildingNames.forEach(bldg => {
                    const items = buildingStocks[bldg];
                    const itemNames = Object.keys(items);
                    if (itemNames.length === 0) return;

                    html += `
                        <div class="bg-gray-50 rounded-xl p-3">
                            <div class="flex items-center justify-between mb-2">
                                <span class="font-bold text-gray-700">ตึก ${bldg}</span>
                                <button onclick="openTransferToCentralModal('${bldg}')" class="text-xs text-indigo-500 hover:text-indigo-700 transition">
                                    <i class="fa-solid fa-truck mr-1"></i>เบิกไปส่วนกลาง
                                </button>
                            </div>
                            <div class="flex flex-wrap gap-2">
                    `;

                    itemNames.forEach(name => {
                        const qty = items[name];
                        const icon = itemMap[name] ? itemMap[name].icon : 'fa-couch';
                        html += `
                            <span class="inline-flex items-center bg-white px-3 py-1.5 rounded-lg border border-gray-200 text-sm">
                                <i class="fa-solid ${icon} text-amber-500 mr-1.5"></i>
                                <span class="text-gray-700">${name}</span>
                                <span class="ml-2 bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full text-xs font-bold">${qty}</span>
                            </span>
                        `;
                    });

                    html += `</div></div>`;
                });

                html += `</div></div>`;
            }

            html += `</div></div>`;
            document.getElementById('mainContent').innerHTML = html;
            updateActiveNav(2);
        }

        // =====================================================
        // Furniture Report
        // =====================================================

        function openFurnitureReportModal() {
            const furNames = STATE.furnitureItems.map(fi => fi.name);

            if (furNames.length === 0) {
                showToast('ไม่มีรายการ', 'ยังไม่มีรายการเฟอร์นิเจอร์ในระบบ', 'error');
                return;
            }

            // Read active filters if available
            const activeBldgFilter = (STATE.furnitureDetailFilter && STATE.furnitureDetailFilter.buildings) ? STATE.furnitureDetailFilter.buildings : [];
            const activeItemFilter = (STATE.furnitureDetailFilter && STATE.furnitureDetailFilter.items) ? STATE.furnitureDetailFilter.items : [];

            let optionsHtml = furNames.map(name => {
                const item = STATE.furnitureItems.find(fi => fi.name === name);
                const icon = item ? item.icon : 'fa-couch';
                const isChecked = activeItemFilter.length > 0 ? activeItemFilter.includes(name) : true;
                return `
                    <label class="flex items-center space-x-2 p-2 rounded-lg border border-gray-200 hover:bg-amber-50 cursor-pointer transition text-sm">
                        <input type="checkbox" name="fur_report" value="${name}" ${isChecked ? 'checked' : ''} class="rounded text-amber-500">
                        <i class="fa-solid ${icon} text-gray-500"></i>
                        <span class="font-medium text-gray-700">${name}</span>
                    </label>
                `;
            }).join('');

            const allBuildings = Array.from(new Set(STATE.data.map(r => parseRoomInfo(r.roomNo).building))).sort((a, b) => a.localeCompare(b, undefined, {numeric: true}));
            let bldgOptionsHtml = allBuildings.map(bldg => {
                const isChecked = activeBldgFilter.length > 0 ? activeBldgFilter.includes(bldg) : true;
                return `
                    <label class="flex items-center space-x-2 p-2 rounded-lg border border-gray-200 hover:bg-blue-50 cursor-pointer transition text-sm">
                        <input type="checkbox" name="bldg_report" value="${bldg}" ${isChecked ? 'checked' : ''} class="rounded text-blue-500 bldg-checkbox">
                        <span class="font-medium text-gray-700">ตึก ${bldg}</span>
                    </label>
                `;
            }).join('');

            const modalHtml = `
                <div id="furnitureReportModal" class="fixed inset-0 bg-black/40 backdrop-blur-sm z-[90] flex items-center justify-center p-4" onclick="if(event.target===this)this.remove()">
                    <div class="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col" onclick="event.stopPropagation()">
                        <div class="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-amber-50 shrink-0">
                            <h3 class="font-bold text-lg text-amber-700"><i class="fa-solid fa-file-excel mr-2"></i>รายงานเฟอร์นิเจอร์</h3>
                            <button onclick="document.getElementById('furnitureReportModal').remove()" class="text-gray-400 hover:text-gray-600"><i class="fa-solid fa-xmark text-xl"></i></button>
                        </div>
                        <div class="p-6 space-y-6 overflow-y-auto flex-1">
                            <div>
                                <div class="flex items-center justify-between mb-2">
                                    <p class="text-sm font-bold text-gray-700">1. เลือกตึกที่ต้องการดูรายงาน:</p>
                                    <label class="flex items-center space-x-1 cursor-pointer">
                                        <input type="checkbox" checked onchange="document.querySelectorAll('.bldg-checkbox').forEach(cb => cb.checked = this.checked)" class="rounded text-blue-500">
                                        <span class="text-xs text-blue-600 font-medium">เลือกทั้งหมด</span>
                                    </label>
                                </div>
                                <div class="grid grid-cols-3 gap-2">
                                    ${bldgOptionsHtml}
                                </div>
                            </div>
                            <hr class="border-gray-100">
                            <div>
                                <p class="text-sm font-bold text-gray-700 mb-2">2. เลือกเฟอร์ที่ต้องการดูรายงาน:</p>
                                <div class="grid grid-cols-2 gap-2">
                                    ${optionsHtml}
                                </div>
                            </div>
                            <hr class="border-gray-100">
                            <div>
                                <p class="text-sm font-bold text-gray-700 mb-2">3. เลือกเงื่อนไขห้องที่ต้องการ:</p>
                                <div class="space-y-2">
                                    <label class="flex items-center space-x-2 p-2 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer transition text-sm">
                                        <input type="radio" name="fur_condition" value="all" checked class="text-gray-600 focus:ring-gray-500">
                                        <span class="font-medium text-gray-700">ดึงข้อมูลทั้งหมด (All Rooms)</span>
                                    </label>
                                    <label class="flex items-center space-x-2 p-2 rounded-lg border border-gray-200 hover:bg-emerald-50 cursor-pointer transition text-sm">
                                        <input type="radio" name="fur_condition" value="has" class="text-emerald-500 focus:ring-emerald-500">
                                        <span class="font-medium text-gray-700">เฉพาะห้องที่มีเฟอร์นิเจอร์ (ที่เลือกด้านบน)</span>
                                    </label>
                                    <label class="flex items-center space-x-2 p-2 rounded-lg border border-gray-200 hover:bg-red-50 cursor-pointer transition text-sm">
                                        <input type="radio" name="fur_condition" value="none" class="text-red-500 focus:ring-red-500">
                                        <span class="font-medium text-gray-700">เฉพาะห้องที่ไม่มีเฟอร์นิเจอร์ (ที่เลือกด้านบน)</span>
                                    </label>
                                </div>
                            </div>
                        </div>
                        <div class="p-4 border-t border-gray-100 flex space-x-3 shrink-0 bg-gray-50">
                            <button onclick="generateFurnitureReport('view')" class="flex-1 bg-amber-500 text-white py-3 rounded-xl font-bold hover:bg-amber-600 transition shadow-sm hover:shadow">
                                <i class="fa-solid fa-eye mr-2"></i>ดูรายงาน
                            </button>
                            <button onclick="generateFurnitureReport('excel')" class="flex-1 bg-emerald-500 text-white py-3 rounded-xl font-bold hover:bg-emerald-600 transition shadow-sm hover:shadow">
                                <i class="fa-solid fa-file-excel mr-2"></i>Export Excel
                            </button>
                        </div>
                    </div>
                </div>
            `;

            cleanupModals();
            document.body.insertAdjacentHTML('beforeend', modalHtml);
        }

        function generateFurnitureReport(mode) {
            const bldgCheckboxes = document.querySelectorAll('input[name="bldg_report"]:checked');
            const selectedBldgs = Array.from(bldgCheckboxes).map(cb => cb.value);

            if (selectedBldgs.length === 0) {
                showToast('เลือกตึก', 'กรุณาเลือกตึกอย่างน้อย 1 ตึก', 'error');
                return;
            }

            const checkboxes = document.querySelectorAll('input[name="fur_report"]:checked');
            const selectedFur = Array.from(checkboxes).map(cb => cb.value);

            if (selectedFur.length === 0) {
                showToast('เลือกเฟอร์', 'กรุณาเลือกเฟอร์อย่างน้อย 1 รายการ', 'error');
                return;
            }

            const conditionRadio = document.querySelector('input[name="fur_condition"]:checked');
            const condition = conditionRadio ? conditionRadio.value : 'all';

            // Build report data
            const reportData = [];
            STATE.data.forEach(r => {
                const info = parseRoomInfo(r.roomNo);
                
                // Filter by building
                if (!selectedBldgs.includes(info.building)) return;

                const buildingFur = STATE.roomFurniture[info.building] || {};
                const roomItems = buildingFur[r.roomNo] || {};

                const row = {
                    roomNo: r.roomNo,
                    building: info.building,
                    floor: info.floor,
                    status: r.status
                };

                let hasAny = false;
                selectedFur.forEach(name => {
                    const qty = roomItems[name] || 0;
                    row[name] = qty;
                    if (qty > 0) hasAny = true;
                });

                if (condition === 'has' && !hasAny) return;
                if (condition === 'none' && hasAny) return;

                row._hasAny = hasAny;
                reportData.push(row);
            });

            document.getElementById('furnitureReportModal')?.remove();

            if (mode === 'excel') {
                // Export Excel
                const headers = ['เลขห้อง', 'ตึก', 'ชั้น', 'สถานะ', ...selectedFur];
                const rows = reportData.map(r => [
                    r.roomNo, r.building, r.floor, r.status,
                    ...selectedFur.map(n => r[n] || 0)
                ]);

                const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
                const wb = XLSX.utils.book_new();
                XLSX.utils.book_append_sheet(wb, ws, 'Furniture Report');
                XLSX.writeFile(wb, `furniture_report_${STATE.currentProject}_${new Date().toISOString().split('T')[0]}.xlsx`);
                showToast('สำเร็จ', 'Export Excel เรียบร้อย', 'success');
            } else {
                // View in UI
                const roomsWithFur = reportData.filter(r => r._hasAny);
                const roomsWithout = reportData.filter(r => !r._hasAny);

                let html = `
                    <div class="flex flex-col h-full bg-white">
                        <div class="px-4 py-3 border-b border-gray-200 flex items-center bg-gray-50 shrink-0 z-20">
                            <button onclick="renderFurnitureMap()" class="mr-3 text-gray-500 hover:text-amber-600 bg-white p-1 rounded-full shadow w-8 h-8 flex items-center justify-center transition">
                                <i class="fa-solid fa-arrow-left"></i>
                            </button>
                            <h3 class="font-bold text-gray-800"><i class="fa-solid fa-chart-bar mr-2 text-amber-500"></i>รายงานเฟอร์: ${selectedFur.join(', ')}</h3>
                        </div>
                        <div class="p-4 flex-1 overflow-y-auto pb-24">
                            <div class="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
                                <div id="report_stat_has" onclick="filterFurnitureReport('has')" class="report-stat-card opacity-75 bg-emerald-50 rounded-xl p-4 text-center border border-emerald-100 cursor-pointer hover:bg-emerald-100 transition">
                                    <div class="text-2xl font-bold text-emerald-700">${roomsWithFur.length}</div>
                                    <div class="text-xs text-emerald-600">ห้องที่มี</div>
                                </div>
                                <div id="report_stat_none" onclick="filterFurnitureReport('none')" class="report-stat-card opacity-75 bg-red-50 rounded-xl p-4 text-center border border-red-100 cursor-pointer hover:bg-red-100 transition">
                                    <div class="text-2xl font-bold text-red-700">${roomsWithout.length}</div>
                                    <div class="text-xs text-red-600">ห้องที่ไม่มี</div>
                                </div>
                                <div id="report_stat_all" onclick="filterFurnitureReport('all')" class="report-stat-card ring-2 ring-offset-2 ring-gray-400 opacity-100 bg-gray-50 rounded-xl p-4 text-center border border-gray-100 cursor-pointer hover:bg-gray-200 transition">
                                    <div class="text-2xl font-bold text-gray-700">${reportData.length}</div>
                                    <div class="text-xs text-gray-600">ทั้งหมด</div>
                                </div>
                            </div>
                            <!-- Mobile View (Cards) -->
                            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 md:hidden">
                                ${reportData.map(r => `
                                    <div class="report-row bg-white p-3 rounded-xl border border-gray-200 shadow-sm" data-has-fur="${r._hasAny}">
                                        <div class="flex justify-between items-center mb-2 border-b border-gray-50 pb-2">
                                            <div class="font-bold text-gray-800 text-lg">${r.roomNo} <span class="text-xs font-normal text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded ml-1">${r.building}</span></div>
                                            <span class="text-[10px] px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 font-medium">${r.status}</span>
                                        </div>
                                        <div class="grid grid-cols-2 gap-2 text-xs">
                                            ${selectedFur.map(n => {
                                                const v = r[n] || 0;
                                                return `
                                                    <div class="flex justify-between items-center bg-gray-50 p-1.5 rounded">
                                                        <span class="text-gray-500 truncate mr-2" title="${n}">${n}</span>
                                                        <span class="${v > 0 ? 'text-emerald-600 font-bold' : 'text-gray-300'}">${v > 0 ? v : '—'}</span>
                                                    </div>
                                                `;
                                            }).join('')}
                                        </div>
                                    </div>
                                `).join('')}
                            </div>
                            
                            <!-- Desktop View (Table) -->
                            <div class="hidden md:block overflow-x-auto bg-white rounded-xl border border-gray-200 shadow-sm">
                                <table class="w-full text-sm border-collapse">
                                    <thead>
                                        <tr class="bg-gray-50">
                                            <th class="text-left py-3 px-4 font-semibold border-b text-gray-700">ห้อง</th>
                                            <th class="text-left py-3 px-4 font-semibold border-b text-gray-700">ตึก</th>
                                            <th class="text-center py-3 px-4 font-semibold border-b text-gray-700">สถานะ</th>
                                            ${selectedFur.map(n => `<th class="text-center py-3 px-4 font-semibold border-b text-gray-700">${n}</th>`).join('')}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        ${reportData.map((r, i) => `
                                            <tr class="report-row ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'} hover:bg-amber-50/30 transition" data-has-fur="${r._hasAny}">
                                                <td class="py-2.5 px-4 font-mono font-bold border-b border-gray-100 text-gray-800">${r.roomNo}</td>
                                                <td class="py-2.5 px-4 border-b border-gray-100 text-gray-600">${r.building}</td>
                                                <td class="py-2.5 px-4 text-center border-b border-gray-100"><span class="text-xs px-2 py-1 rounded-md bg-gray-100 text-gray-600">${r.status}</span></td>
                                                ${selectedFur.map(n => {
                                                    const v = r[n] || 0;
                                                    return `<td class="py-2.5 px-4 text-center border-b border-gray-100 ${v > 0 ? 'text-emerald-600 font-bold' : 'text-gray-300'}">${v > 0 ? v : '—'}</td>`;
                                                }).join('')}
                                            </tr>
                                        `).join('')}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                `;

                document.getElementById('mainContent').innerHTML = html;
            }
        }

        // =====================================================
        // Add Central Stock (Admin Only)
        // =====================================================
        
        window.filterFurnitureReport = function(type) {
            // Update active state of the cards
            document.querySelectorAll('.report-stat-card').forEach(el => {
                el.classList.remove('ring-2', 'ring-offset-2', 'ring-emerald-400', 'ring-red-400', 'ring-gray-400', 'opacity-100');
                el.classList.add('opacity-75');
            });
            const activeCard = document.getElementById(`report_stat_${type}`);
            if (activeCard) {
                activeCard.classList.add('ring-2', 'ring-offset-2', 'opacity-100');
                activeCard.classList.remove('opacity-75');
                if (type === 'has') activeCard.classList.add('ring-emerald-400');
                if (type === 'none') activeCard.classList.add('ring-red-400');
                if (type === 'all') activeCard.classList.add('ring-gray-400');
            }
            
            // Filter mobile cards and table rows
            document.querySelectorAll('.report-row').forEach(row => {
                const hasFur = row.getAttribute('data-has-fur') === 'true';
                if (type === 'all') {
                    row.style.display = '';
                } else if (type === 'has') {
                    row.style.display = hasFur ? '' : 'none';
                } else if (type === 'none') {
                    row.style.display = hasFur ? 'none' : '';
                }
            });
        };

        function openAddCentralStockModal() {
            if (!STATE.user || STATE.user.role !== 'Admin') {
                showToast('ไม่มีสิทธิ์', 'เฉพาะ Admin เท่านั้นที่สามารถเพิ่มสต๊อกได้', 'error');
                return;
            }

            const itemMap = {};
            STATE.furnitureItems.forEach(fi => { itemMap[fi.name] = fi; });
            const allItems = STATE.furnitureItems.map(fi => fi.name);

            if (allItems.length === 0) {
                showToast('ไม่มีรายการเฟอร์นิเจอร์', 'กรุณาตั้งค่าประเภทเฟอร์นิเจอร์ก่อน', 'error');
                return;
            }

            let optionsHtml = allItems.map(name => {
                const icon = itemMap[name] ? itemMap[name].icon : 'fa-couch';
                return `
                    <label class="flex items-center space-x-3 p-3 rounded-lg border border-gray-200 hover:bg-emerald-50 cursor-pointer transition">
                        <input type="checkbox" name="fur_add_central" value="${name}" class="rounded text-emerald-500" onchange="document.getElementById('add_central_qty_${name}').disabled = !this.checked; if(this.checked) document.getElementById('add_central_qty_${name}').focus();">
                        <i class="fa-solid ${icon} text-gray-500"></i>
                        <span class="flex-1 font-medium text-gray-700">${name}</span>
                        <div class="flex items-center space-x-1">
                            <input type="number" id="add_central_qty_${name}" min="1" max="999" value="1" disabled
                                class="w-16 px-2 py-1 text-center border border-gray-300 rounded focus:ring-2 focus:ring-emerald-500 outline-none disabled:bg-gray-100 disabled:text-gray-400">
                            <span class="text-xs text-gray-500">ชิ้น</span>
                        </div>
                    </label>
                `;
            }).join('');

            const modalHtml = `
                <div id="addCentralStockModal" class="fixed inset-0 bg-black/40 backdrop-blur-sm z-[90] flex items-center justify-center p-4" onclick="if(event.target===this)this.remove()">
                    <div class="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col" onclick="event.stopPropagation()">
                        <div class="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-emerald-50 rounded-t-2xl shrink-0">
                            <div>
                                <h3 class="font-bold text-lg text-emerald-800"><i class="fa-solid fa-plus mr-2 text-emerald-600"></i>เพิ่มเข้าสต๊อกส่วนกลาง</h3>
                                <p class="text-xs text-emerald-600/80">เฉพาะ Admin</p>
                            </div>
                            <button onclick="document.getElementById('addCentralStockModal').remove()" class="text-gray-400 hover:text-gray-600 transition w-8 h-8 flex justify-center items-center rounded-full hover:bg-white/50"><i class="fa-solid fa-xmark text-xl"></i></button>
                        </div>

                        <div class="p-6 overflow-y-auto flex-1 space-y-4">
                            <div>
                                <label class="block text-sm font-bold text-gray-700 mb-2">เลือกเฟอร์นิเจอร์ที่ต้องการเพิ่มเข้าสต๊อกส่วนกลาง:</label>
                                <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                    ${optionsHtml}
                                </div>
                            </div>
                            
                            <div>
                                <label class="block text-sm font-bold text-gray-700 mb-2">หมายเหตุ <span class="text-red-500">*</span></label>
                                <textarea id="addCentralRemark" rows="2" class="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none resize-none" placeholder="ระบุเหตุผลในการเพิ่มสต๊อก (เช่น ซื้อใหม่, ได้รับเพิ่มเติม)"></textarea>
                            </div>
                        </div>

                        <div class="p-4 border-t border-gray-100 shrink-0 bg-gray-50 rounded-b-2xl">
                            <button onclick="executeAddCentralStock()" class="w-full bg-emerald-500 text-white py-3 rounded-xl font-bold hover:bg-emerald-600 transition shadow-[0_4px_12px_rgba(16,185,129,0.3)]">
                                <i class="fa-solid fa-save mr-2"></i>ยืนยันการเพิ่มสต๊อก
                            </button>
                        </div>
                    </div>
                </div>
            `;
            cleanupModals();
            document.body.insertAdjacentHTML('beforeend', modalHtml);
        }

        async function executeAddCentralStock() {
            const checkboxes = document.querySelectorAll('input[name="fur_add_central"]:checked');
            if (checkboxes.length === 0) {
                showToast('ระบุรายการ', 'กรุณาเลือกเฟอร์นิเจอร์ที่ต้องการเพิ่มอย่างน้อย 1 รายการ', 'error');
                return;
            }

            const remark = document.getElementById('addCentralRemark').value.trim();
            if (!remark) {
                showToast('ระบุหมายเหตุ', 'กรุณาระบุหมายเหตุหรือเหตุผลในการเพิ่มสต๊อก (จำเป็น)', 'error');
                document.getElementById('addCentralRemark').focus();
                return;
            }

            const items = Array.from(checkboxes).map(cb => {
                const name = cb.value;
                const qty = parseInt(document.getElementById(`add_central_qty_${name}`).value) || 0;
                return { name, qty };
            }).filter(item => item.qty > 0);

            if (items.length === 0) {
                showToast('ระบุจำนวน', 'กรุณาระบุจำนวนที่ถูกต้อง (มากกว่า 0)', 'error');
                return;
            }

            showConfirmModal('ยืนยันการเพิ่มสต๊อก', `คุณกำลังเพิ่มเฟอร์นิเจอร์เข้าสต๊อกส่วนกลางจำนวน ${items.length} รายการ ต้องการดำเนินการต่อหรือไม่?`, async () => {
                const modal = document.getElementById('addCentralStockModal');
                if (modal) modal.remove();

                showLoading(true);
                try {
                    const res = await callApi('addCentralStock', {
                        project: STATE.currentProject,
                        items,
                        userName: STATE.user ? STATE.user.username : 'Unknown',
                        remark: remark
                    }, { silent: true });
                    
                    if (res.success) {
                        showToast('สำเร็จ', `เพิ่มเข้าสต๊อกส่วนกลางเรียบร้อย`, 'success');
                        // Note: UI re-rendering is handled by onSnapshot
                    } else {
                        showToast('เกิดข้อผิดพลาด', res.message, 'error');
                    }
                } catch (error) {
                    showToast('เกิดข้อผิดพลาด', error.message, 'error');
                } finally {
                    showLoading(false);
                }
            });
        }

        // =====================================================
        // Dispose Central Stock (Admin Only)
        // =====================================================

        /**
         * Modal ตัดสต๊อกส่วนกลาง — เฉพาะ Admin
         * ใช้สำหรับลดยอดสต๊อกที่เกินจากของจริง (เช่น บางห้องไม่มีเฟอร์บางชิ้นแต่แรก)
         */
        function openDisposeCentralStockModal() {
            if (!STATE.user || STATE.user.role !== 'Admin') {
                showToast('ไม่มีสิทธิ์', 'เฉพาะ Admin เท่านั้นที่สามารถตัดสต๊อกได้', 'error');
                return;
            }

            const centralStock = STATE.furnitureStock.central || {};
            const stockNames = Object.keys(centralStock);

            if (stockNames.length === 0) {
                showToast('ไม่มีสต๊อก', 'สต๊อกส่วนกลางว่างเปล่า ไม่มีรายการให้ตัด', 'error');
                return;
            }

            const itemMap = {};
            STATE.furnitureItems.forEach(fi => { itemMap[fi.name] = fi; });

            let optionsHtml = stockNames.map(name => {
                const stockQty = centralStock[name];
                const icon = itemMap[name] ? itemMap[name].icon : 'fa-couch';
                return `
                    <label class="flex items-center space-x-3 p-3 rounded-lg border border-gray-200 hover:bg-red-50 cursor-pointer transition">
                        <input type="checkbox" name="fur_dispose" value="${name}" class="rounded text-red-500">
                        <i class="fa-solid ${icon} text-gray-500"></i>
                        <span class="flex-1 font-medium text-gray-700">${name}</span>
                        <div class="flex items-center space-x-1">
                            <span class="text-xs text-gray-400">จำนวน:</span>
                            <input type="number" min="1" max="${stockQty}" value="${stockQty}" 
                                   class="w-14 text-center border border-gray-300 rounded px-1 py-0.5 text-sm" 
                                   id="fur_dispose_qty_${name.replace(/\s/g, '_')}">
                            <span class="text-xs text-gray-400">/ ${stockQty}</span>
                        </div>
                    </label>
                `;
            }).join('');

            const modalHtml = `
                <div id="furnitureActionModal" class="fixed inset-0 bg-black/40 backdrop-blur-sm z-[90] flex items-center justify-center p-4" onclick="if(event.target===this)this.remove()">
                    <div class="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[80vh] overflow-hidden flex flex-col" onclick="event.stopPropagation()">
                        <div class="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-red-50 shrink-0">
                            <h3 class="font-bold text-lg text-red-700"><i class="fa-solid fa-trash-can mr-2"></i>ตัดสต๊อกส่วนกลาง</h3>
                            <button onclick="document.getElementById('furnitureActionModal').remove()" class="text-gray-400 hover:text-gray-600"><i class="fa-solid fa-xmark text-xl"></i></button>
                        </div>
                        <div class="p-6 space-y-4 overflow-y-auto flex-1">
                            <div class="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-800">
                                <i class="fa-solid fa-triangle-exclamation mr-1"></i>
                                <strong>คำเตือน:</strong> การตัดสต๊อกจะลดยอดออกจากระบบถาวร ไม่สามารถกู้คืนได้ ทุกรายการจะถูกบันทึกใน Audit Log
                            </div>
                            <div class="space-y-3">
                                <label class="block text-sm font-bold text-gray-700">เลือกรายการที่ต้องการตัด</label>
                                ${optionsHtml}
                            </div>
                        </div>
                        <div class="p-4 border-t border-gray-100 shrink-0">
                            <textarea id="fur_dispose_remark" placeholder="เหตุผลในการตัดสต๊อก (บังคับกรอก) *" class="w-full border border-red-300 rounded-lg p-2 text-sm mb-3 focus:ring-2 focus:ring-red-400 focus:border-red-400 outline-none" rows="2" required></textarea>
                            <button onclick="executeDisposeCentralStock()" class="w-full bg-red-500 text-white py-3 rounded-xl font-bold hover:bg-red-600 transition">
                                <i class="fa-solid fa-trash-can mr-2"></i>ยืนยันตัดสต๊อก
                            </button>
                        </div>
                    </div>
                </div>
            `;

            cleanupModals();
            document.body.insertAdjacentHTML('beforeend', modalHtml);
        }

        /**
         * ดำเนินการตัดสต๊อกส่วนกลาง
         */
        async function executeDisposeCentralStock() {
            if (!STATE.user || STATE.user.role !== 'Admin') {
                showToast('ไม่มีสิทธิ์', 'เฉพาะ Admin เท่านั้น', 'error');
                return;
            }

            const checkboxes = document.querySelectorAll('input[name="fur_dispose"]:checked');
            if (checkboxes.length === 0) {
                showToast('เลือกรายการ', 'กรุณาเลือกรายการที่ต้องการตัดสต๊อก', 'error');
                return;
            }

            const remark = document.getElementById('fur_dispose_remark')?.value?.trim() || '';
            if (!remark) {
                showToast('กรอกเหตุผล', 'กรุณาระบุเหตุผลในการตัดสต๊อก', 'error');
                document.getElementById('fur_dispose_remark')?.focus();
                return;
            }

            // Build summary for confirmation
            const items = [];
            for (const cb of checkboxes) {
                const name = cb.value;
                const qtyInput = document.getElementById(`fur_dispose_qty_${name.replace(/\s/g, '_')}`);
                const qty = parseInt(qtyInput?.value || '1');
                items.push({ name, qty });
            }
            const summary = items.map(i => `${i.name} x${i.qty}`).join(', ');

            showConfirmModal(
                'ยืนยันตัดสต๊อก',
                `ต้องการตัดสต๊อกออกจากส่วนกลาง:\n${summary}\n\nเหตุผล: ${remark}\n\nการกระทำนี้ไม่สามารถย้อนกลับได้`,
                async () => {
                    showLoading(true);
                    try {
                        const res = await callApi('disposeCentralStock', {
                            project: STATE.currentProject,
                            items,
                            userName: STATE.user.name,
                            remark
                        }, { silent: true });

                        if (!res.success) {
                            showToast('ผิดพลาด', res.message, 'error');
                            showLoading(false);
                            return;
                        }

                        showLoading(false);
                        document.getElementById('furnitureActionModal')?.remove();
                        showToast('สำเร็จ', 'ตัดสต๊อกส่วนกลางเรียบร้อย', 'success');

                        // Note: UI re-rendering is handled by onSnapshot
                    } catch (error) {
                        showLoading(false);
                        showToast('ผิดพลาด', error.message, 'error');
                    }
                },
                'fa-trash-can',
                'bg-red-100 text-red-600'
            );
        }
