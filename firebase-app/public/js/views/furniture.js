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
                            <h2 class="font-bold text-xl text-gray-800 flex items-center"><i class="fa-solid fa-couch mr-2 text-amber-500"></i> ผังเฟอร์นิเจอร์</h2>
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
                            <i class="fa-solid fa-building-columns mr-2 text-indigo-500"></i>ยอดสต็อกส่วนกลาง
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
                    <div class="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl p-4 border border-emerald-100 shadow-sm">
                        <h3 class="font-bold text-sm text-emerald-800 mb-3 flex items-center">
                            <i class="fa-solid fa-truck-fast mr-2 text-emerald-500"></i>ยอดที่เบิกออกจากส่วนกลาง
                        </h3>
                        <div class="flex flex-wrap gap-2">
                            ${Object.keys(transferred).length === 0 ? '<span class="text-xs text-gray-500">ยังไม่มีการเบิกออก</span>' : ''}
                            ${Object.entries(transferred).map(([name, qty]) => {
                                const icon = itemMap[name] ? itemMap[name].icon : 'fa-couch';
                                return `<div class="bg-white rounded px-2 py-1 flex items-center shadow-sm border border-emerald-50">
                                    <i class="fa-solid ${icon} text-emerald-400 mr-1.5 text-[10px]"></i>
                                    <span class="text-xs font-medium text-gray-600 mr-1.5">${name}</span>
                                    <span class="text-xs font-bold text-emerald-700 bg-emerald-50 px-1 rounded">${qty}</span>
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
                            <div class="flex overflow-x-auto space-x-3 pb-2 scrollbar-hide">
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
                        <div class="flex overflow-x-auto space-x-3 pb-2 scrollbar-hide">
                            ${otherBuildings.map(bldg => generateFurnitureBuildingCard(bldg)).join('')}
                        </div>
                    </div>
                `;
            }

            html += `</div></div>`;
            document.getElementById('mainContent').innerHTML = html;
            updateActiveNav(2);
        }

        /**
         * สร้าง Building Card แสดงจำนวนเฟอร์ต่อตึก
         */
        function generateFurnitureBuildingCard(bldg) {
            const rooms = STATE.data.filter(r => parseRoomInfo(r.roomNo).building === bldg);
            const totalRooms = rooms.length;
            const buildingFurniture = STATE.roomFurniture[bldg] || {};

            // Aggregate furniture counts across all rooms in this building
            const furnitureCounts = {};
            rooms.forEach(r => {
                const roomItems = buildingFurniture[r.roomNo] || {};
                Object.keys(roomItems).forEach(name => {
                    if (!furnitureCounts[name]) furnitureCounts[name] = 0;
                    furnitureCounts[name]++;
                });
            });

            // Get furniture items for icons
            const itemMap = {};
            STATE.furnitureItems.forEach(fi => { itemMap[fi.name] = fi; });

            const furnitureNames = Object.keys(furnitureCounts);

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
                    const item = itemMap[name];
                    const icon = item ? item.icon : 'fa-couch';
                    const isComplete = count === totalRooms;
                    const bgColor = isComplete ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700';

                    cellsHtml += `
                        <div class="text-center p-1.5 rounded-lg ${bgColor}">
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
                     class="min-w-[160px] max-w-[200px] bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md hover:-translate-y-0.5 cursor-pointer transition-all duration-200 flex-shrink-0 overflow-hidden">
                    <div class="bg-gray-800 text-white text-center py-2 font-bold text-lg tracking-wide">${bldg}</div>
                    <div class="text-center text-[11px] text-gray-500 py-1 border-b border-gray-100">ทั้งหมด ${totalRooms} ห้อง</div>
                    <div class="p-2">
                        ${cellsHtml}
                    </div>
                </div>
            `;
        }

        /**
         * แสดงรายละเอียดเฟอร์ต่อห้องในตึก
         */
        function renderFurnitureRoomDetail(building) {
            STATE.currentView = 'furniture_detail';
            const rooms = STATE.data.filter(r => parseRoomInfo(r.roomNo).building === building);
            rooms.sort((a, b) => a.roomNo.localeCompare(b.roomNo, undefined, { numeric: true }));
            const buildingFurniture = STATE.roomFurniture[building] || {};

            // Get all unique furniture names for this building
            const allFurNames = new Set();
            STATE.furnitureItems.forEach(fi => {
                const at = fi.assignTo;
                if (at && (at.type === 'all' || (at.type === 'buildings' && at.targets && at.targets.includes(building)))) {
                    allFurNames.add(fi.name);
                }
            });
            rooms.forEach(r => {
                const roomItems = buildingFurniture[r.roomNo] || {};
                Object.keys(roomItems).forEach(n => allFurNames.add(n));
            });
            const furNames = Array.from(allFurNames);

            // Get item map for icons
            const itemMap = {};
            STATE.furnitureItems.forEach(fi => { itemMap[fi.name] = fi; });

            let html = `
                <div class="flex flex-col h-full bg-white relative overflow-hidden">
                    <div class="px-4 py-3 border-b border-gray-200 flex justify-between items-center bg-gray-50 shrink-0 z-20">
                        <div class="flex items-center font-bold text-base text-gray-800">
                            <button onclick="renderFurnitureMap()" class="mr-3 text-gray-500 hover:text-amber-600 bg-white p-1 rounded-full shadow w-8 h-8 flex items-center justify-center transition hover:bg-gray-50">
                                <i class="fa-solid fa-arrow-left"></i>
                            </button>
                            <i class="fa-solid fa-couch text-amber-500 mr-2"></i> เฟอร์นิเจอร์ ตึก ${building}
                        </div>
                        <div class="flex space-x-2">
                            <button onclick="openTransferToCentralModal('${building}')" class="bg-indigo-500 text-white px-3 py-1.5 rounded-lg hover:bg-indigo-600 transition text-xs font-medium">
                                <i class="fa-solid fa-truck mr-1"></i> เบิกไปส่วนกลาง
                            </button>
                        </div>
                    </div>
                    <div class="p-3 flex-1 overflow-y-auto pb-24">
            `;

            if (furNames.length === 0) {
                html += `<div class="text-center text-gray-400 py-10"><i class="fa-solid fa-couch text-4xl mb-3"></i><p>ยังไม่มีรายการเฟอร์นิเจอร์</p></div>`;
            } else {
                // Table view
                html += `
                    <div class="overflow-x-auto">
                        <table class="w-full text-sm border-collapse">
                            <thead>
                                <tr class="bg-gray-100">
                                    <th class="text-left py-2 px-3 font-semibold text-gray-700 sticky left-0 bg-gray-100 z-10 border-b border-gray-200">ห้อง</th>
                                    ${furNames.map(n => {
                                        const icon = itemMap[n] ? itemMap[n].icon : 'fa-couch';
                                        return `<th class="text-center py-2 px-2 font-semibold text-gray-700 border-b border-gray-200 whitespace-nowrap">
                                            <i class="fa-solid ${icon} mr-1"></i>${n}
                                        </th>`;
                                    }).join('')}
                                    <th class="text-center py-2 px-3 font-semibold text-gray-700 border-b border-gray-200">จัดการ</th>
                                </tr>
                            </thead>
                            <tbody>
                `;

                rooms.forEach((r, idx) => {
                    const roomItems = buildingFurniture[r.roomNo] || {};
                    const rowBg = idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50';

                    html += `<tr class="${rowBg} hover:bg-amber-50/30 transition">`;
                    html += `<td class="py-2 px-3 font-mono font-bold text-gray-800 sticky left-0 ${rowBg} z-10 border-b border-gray-100">${r.roomNo}</td>`;

                    furNames.forEach(name => {
                        const qty = roomItems[name] || 0;
                        const cellClass = qty > 0
                            ? 'text-emerald-600 font-bold'
                            : 'text-gray-300';
                        const cellIcon = qty > 0 ? '✓' : '—';
                        html += `<td class="text-center py-2 px-2 border-b border-gray-100 ${cellClass}">
                            ${qty > 0 ? `<span class="bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full text-xs font-bold">${qty}</span>` : `<span class="text-gray-300">—</span>`}
                        </td>`;
                    });

                    html += `<td class="text-center py-2 px-3 border-b border-gray-100">
                        <div class="flex justify-center space-x-1">
                            <button onclick="openReturnFurnitureModal('${r.roomNo}')" class="text-red-500 hover:text-red-700 hover:bg-red-50 p-1 rounded transition" title="คืนเฟอร์">
                                <i class="fa-solid fa-arrow-right-from-bracket text-xs"></i>
                            </button>
                            <button onclick="openAddFurnitureModal('${r.roomNo}')" class="text-emerald-500 hover:text-emerald-700 hover:bg-emerald-50 p-1 rounded transition" title="เพิ่มเฟอร์">
                                <i class="fa-solid fa-plus text-xs"></i>
                            </button>
                        </div>
                    </td>`;
                    html += `</tr>`;
                });

                html += `</tbody></table></div>`;
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

            showLoading(true);
            try {
                for (const cb of checkboxes) {
                    const name = cb.value;
                    const qtyInput = document.getElementById(`fur_ret_qty_${name.replace(/\s/g, '_')}`);
                    const qty = parseInt(qtyInput?.value || '1');

                    const res = await callApi('returnFurniture', {
                        project: STATE.currentProject,
                        roomNo,
                        furnitureName: name,
                        quantity: qty,
                        userName: STATE.user.name,
                        remark
                    }, { silent: true });

                    if (!res.success) {
                        showToast('ผิดพลาด', res.message, 'error');
                        showLoading(false);
                        return;
                    }
                }

                showLoading(false);
                document.getElementById('furnitureActionModal')?.remove();
                showToast('สำเร็จ', 'คืนเฟอร์นิเจอร์เรียบร้อย', 'success');

                // Refresh stock and wait for it
                await fetchFurnitureData(STATE.currentProject);

                // Re-render current view
                const info = parseRoomInfo(roomNo);
                if (STATE.currentView === 'furniture_detail') {
                    renderFurnitureRoomDetail(info.building);
                } else if (STATE.currentView === 'furniture_stock') {
                    renderFurnitureStockPanel();
                } else if (STATE.currentView === 'furniture_map') {
                    renderFurnitureMap();
                }
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

            showLoading(true);
            try {
                for (const cb of checkboxes) {
                    const name = cb.value;
                    const qtyInput = document.getElementById(`fur_add_qty_${name.replace(/\s/g, '_')}`);
                    const qty = parseInt(qtyInput?.value || '1');

                    const res = await callApi('addFurnitureToRoom', {
                        project: STATE.currentProject,
                        roomNo,
                        furnitureName: name,
                        quantity: qty,
                        userName: STATE.user.name,
                        remark
                    }, { silent: true });

                    if (!res.success) {
                        showToast('ผิดพลาด', res.message, 'error');
                        showLoading(false);
                        return;
                    }
                }

                showLoading(false);
                document.getElementById('furnitureActionModal')?.remove();
                showToast('สำเร็จ', 'เพิ่มเฟอร์นิเจอร์เรียบร้อย', 'success');

                await fetchFurnitureData(STATE.currentProject);

                const info = parseRoomInfo(roomNo);
                if (STATE.currentView === 'furniture_detail') {
                    renderFurnitureRoomDetail(info.building);
                } else if (STATE.currentView === 'furniture_stock') {
                    renderFurnitureStockPanel();
                } else if (STATE.currentView === 'furniture_map') {
                    renderFurnitureMap();
                }
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

            showLoading(true);
            try {
                for (const cb of checkboxes) {
                    const name = cb.value;
                    const qtyInput = document.getElementById(`fur_xfer_qty_${name.replace(/\s/g, '_')}`);
                    const qty = parseInt(qtyInput?.value || '1');

                    const res = await callApi('transferToCentral', {
                        project: STATE.currentProject,
                        building,
                        furnitureName: name,
                        quantity: qty,
                        userName: STATE.user.name,
                        remark
                    }, { silent: true });

                    if (!res.success) {
                        showToast('ผิดพลาด', res.message, 'error');
                        showLoading(false);
                        return;
                    }
                }

                showLoading(false);
                document.getElementById('furnitureActionModal')?.remove();
                showToast('สำเร็จ', 'เบิกเฟอร์ไปส่วนกลางเรียบร้อย', 'success');

                await fetchFurnitureData(STATE.currentProject);

                if (STATE.currentView === 'furniture_detail') {
                    renderFurnitureRoomDetail(building);
                } else if (STATE.currentView === 'furniture_stock') {
                    renderFurnitureStockPanel();
                } else if (STATE.currentView === 'furniture_map') {
                    renderFurnitureMap();
                }
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
                    <h3 class="font-bold text-lg text-indigo-800 mb-4 flex items-center">
                        <i class="fa-solid fa-building-columns mr-2 text-indigo-500"></i>สต๊อกส่วนกลาง
                    </h3>
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

            let optionsHtml = furNames.map(name => {
                const item = STATE.furnitureItems.find(fi => fi.name === name);
                const icon = item ? item.icon : 'fa-couch';
                return `
                    <label class="flex items-center space-x-2 p-2 rounded-lg border border-gray-200 hover:bg-amber-50 cursor-pointer transition text-sm">
                        <input type="checkbox" name="fur_report" value="${name}" checked class="rounded text-amber-500">
                        <i class="fa-solid ${icon} text-gray-500"></i>
                        <span class="font-medium text-gray-700">${name}</span>
                    </label>
                `;
            }).join('');

            const modalHtml = `
                <div id="furnitureReportModal" class="fixed inset-0 bg-black/40 backdrop-blur-sm z-[90] flex items-center justify-center p-4" onclick="if(event.target===this)this.remove()">
                    <div class="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[80vh] overflow-hidden" onclick="event.stopPropagation()">
                        <div class="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-amber-50">
                            <h3 class="font-bold text-lg text-amber-700"><i class="fa-solid fa-file-excel mr-2"></i>รายงานเฟอร์นิเจอร์</h3>
                            <button onclick="document.getElementById('furnitureReportModal').remove()" class="text-gray-400 hover:text-gray-600"><i class="fa-solid fa-xmark text-xl"></i></button>
                        </div>
                        <div class="p-6 space-y-4 overflow-y-auto max-h-[50vh]">
                            <p class="text-sm text-gray-600">เลือกเฟอร์ที่ต้องการดูรายงาน:</p>
                            <div class="grid grid-cols-2 gap-2">
                                ${optionsHtml}
                            </div>
                        </div>
                        <div class="p-4 border-t border-gray-100 flex space-x-3">
                            <button onclick="generateFurnitureReport('view')" class="flex-1 bg-amber-500 text-white py-3 rounded-xl font-bold hover:bg-amber-600 transition">
                                <i class="fa-solid fa-eye mr-2"></i>ดูรายงาน
                            </button>
                            <button onclick="generateFurnitureReport('excel')" class="flex-1 bg-emerald-500 text-white py-3 rounded-xl font-bold hover:bg-emerald-600 transition">
                                <i class="fa-solid fa-file-excel mr-2"></i>Export Excel
                            </button>
                        </div>
                    </div>
                </div>
            `;

            document.body.insertAdjacentHTML('beforeend', modalHtml);
        }

        function generateFurnitureReport(mode) {
            const checkboxes = document.querySelectorAll('input[name="fur_report"]:checked');
            const selectedFur = Array.from(checkboxes).map(cb => cb.value);

            if (selectedFur.length === 0) {
                showToast('เลือกเฟอร์', 'กรุณาเลือกเฟอร์อย่างน้อย 1 รายการ', 'error');
                return;
            }

            // Build report data
            const reportData = [];
            STATE.data.forEach(r => {
                const info = parseRoomInfo(r.roomNo);
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
                                <div class="bg-emerald-50 rounded-xl p-4 text-center border border-emerald-100">
                                    <div class="text-2xl font-bold text-emerald-700">${roomsWithFur.length}</div>
                                    <div class="text-xs text-emerald-600">ห้องที่มี</div>
                                </div>
                                <div class="bg-red-50 rounded-xl p-4 text-center border border-red-100">
                                    <div class="text-2xl font-bold text-red-700">${roomsWithout.length}</div>
                                    <div class="text-xs text-red-600">ห้องที่ไม่มี</div>
                                </div>
                                <div class="bg-gray-50 rounded-xl p-4 text-center border border-gray-100">
                                    <div class="text-2xl font-bold text-gray-700">${reportData.length}</div>
                                    <div class="text-xs text-gray-600">ทั้งหมด</div>
                                </div>
                            </div>
                            <div class="overflow-x-auto">
                                <table class="w-full text-sm border-collapse">
                                    <thead>
                                        <tr class="bg-gray-100">
                                            <th class="text-left py-2 px-3 font-semibold border-b">ห้อง</th>
                                            <th class="text-left py-2 px-3 font-semibold border-b">ตึก</th>
                                            <th class="text-center py-2 px-3 font-semibold border-b">สถานะ</th>
                                            ${selectedFur.map(n => `<th class="text-center py-2 px-3 font-semibold border-b">${n}</th>`).join('')}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        ${reportData.map((r, i) => `
                                            <tr class="${i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'} hover:bg-amber-50/30">
                                                <td class="py-1.5 px-3 font-mono font-bold border-b border-gray-100">${r.roomNo}</td>
                                                <td class="py-1.5 px-3 border-b border-gray-100">${r.building}</td>
                                                <td class="py-1.5 px-3 text-center border-b border-gray-100"><span class="text-xs px-2 py-0.5 rounded-full bg-gray-100">${r.status}</span></td>
                                                ${selectedFur.map(n => {
                                                    const v = r[n] || 0;
                                                    return `<td class="py-1.5 px-3 text-center border-b border-gray-100 ${v > 0 ? 'text-emerald-600 font-bold' : 'text-gray-300'}">${v > 0 ? v : '—'}</td>`;
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
