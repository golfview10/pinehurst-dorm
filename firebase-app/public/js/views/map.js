        // --- Visual Map ---
        function renderVisualMap() {
            STATE.currentView = 'visual_map';

            // Identify Buildings
            const buildings = new Set();
            STATE.data.forEach(r => {
                const info = parseRoomInfo(r.roomNo);
                buildings.add(info.building);
            });
            const allBuildings = Array.from(buildings);

            // Define Zones
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
                            <h2 class="font-bold text-xl text-gray-800 flex items-center"><i class="fa-solid fa-map-location-dot mr-2 text-emerald-500"></i> ผังโครงการ</h2>
                        </div>
                        <div class="flex items-center w-full md:w-auto space-x-2">
                            <div class="relative flex-1 md:w-64">
                                <i class="fa-solid fa-search absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
                                <input type="text" id="mapRoomSearch" onkeyup="handleMapSearch(this.value)" placeholder="ค้นหาเบอร์ห้อง..." class="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition shadow-sm">
                            </div>
                        </div>
                    </div>
                    <div class="p-6 space-y-6 pb-24 overflow-y-auto">
                        <div id="mapSearchResults" class="hidden"></div>
                        <div id="mapDefaultContent" class="space-y-6">
                            <div class="bg-white rounded-xl p-3 border border-gray-100 shadow-sm flex flex-wrap items-center gap-3">
                                <span class="text-xs font-bold text-gray-500 mr-1"><i class="fa-solid fa-palette mr-1"></i>หมายเหตุสี:</span>
                                ${getBuildingStripeConfig().map(c => `<span class="inline-flex items-center text-[11px] font-bold"><span class="w-4 h-4 rounded mr-1.5 border" style="background:${c.color};border-color:${c.color}"></span><span class="text-gray-700">${c.label}</span></span>`).join('')}
                                <button onclick="openBuildingStripeEditor()" class="ml-auto text-gray-400 hover:text-pink-500 transition text-xs" title="แก้ไขแถบสีตึก"><i class="fa-solid fa-pen-to-square"></i></button>
                            </div>
            `;

            const usedBuildings = new Set();

            // Render Defined Zones
            ZONES_CONFIG.forEach(zone => {
                // Find buildings that match this zone
                const zoneBuildings = allBuildings.filter(b => zone.match.includes(b));

                if (zoneBuildings.length > 0) {
                    zoneBuildings.forEach(b => usedBuildings.add(b));
                    zoneBuildings.sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }));

                    html += `
                        <div class="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
                            <h3 class="text-base font-bold text-gray-700 mb-3 border-l-4 border-pink-400 pl-3 flex items-center bg-pink-50 py-2 rounded-r-lg"><i class="fa-solid fa-map-pin mr-2 text-pink-400"></i>${zone.title} <span class="text-xs text-gray-400 font-normal ml-2">(${zoneBuildings.length} ตึก)</span></h3>
                            <div class="flex overflow-x-auto space-x-3 pb-2 scrollbar-hide">
                                ${zoneBuildings.map(bldg => generateCompactBuildingCard(bldg)).join('')}
                            </div>
                        </div>
                    `;
                }
            });

            // Handle Others
            const otherBuildings = allBuildings.filter(b => !usedBuildings.has(b));
            if (otherBuildings.length > 0) {
                otherBuildings.sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }));
                html += `
                    <div class="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
                        <h3 class="text-base font-bold text-gray-700 mb-3 border-l-4 border-pink-400 pl-3 flex items-center bg-pink-50 py-2 rounded-r-lg"><i class="fa-solid fa-map-pin mr-2 text-pink-400"></i>อื่นๆ</h3>
                        <div class="flex overflow-x-auto space-x-3 pb-2 scrollbar-hide">
                            ${otherBuildings.map(bldg => generateCompactBuildingCard(bldg)).join('')}
                        </div>
                    </div>
                `;
            }

            html += `</div></div></div>`;
            document.getElementById('mainContent').innerHTML = html;
            updateActiveNav(1);
        }

        function generateCompactBuildingCard(bldg) {
            const rooms = STATE.data.filter(r => parseRoomInfo(r.roomNo).building === bldg);
            
            // Build dynamic statuses
            const statusesToRender = [];
            if (STATE.projectRoomStatuses && STATE.projectRoomStatuses.length > 0) {
                STATE.projectRoomStatuses.forEach(s => {
                    let cnt = rooms.filter(r => r.status === s.name || (s.name === 'ห้องว่าง' && (r.status === 'ว่าง' || !r.status))).length;
                    let isExpiring = false;
                    
                    if (s.name.includes('จอง')) {
                        // separate expired bookings
                        const expired = rooms.filter(r => (r.status === s.name) && isBookingExpired(r)).length;
                        cnt -= expired;
                        statusesToRender.push({ name: s.name, count: cnt, color: s.color, isHex: s.colorType === 'hex' });
                        if (expired > 0) statusesToRender.push({ name: 'หลุดจอง', count: expired, color: 'orange', isHex: false });
                    } else {
                        statusesToRender.push({ name: s.name, count: cnt, color: s.color, isHex: s.colorType === 'hex' });
                    }
                });
            } else {
                // fallbacks
                const vacant = rooms.filter(r => r.status === 'ห้องว่าง' || r.status === 'ว่าง' || !r.status).length;
                const reserved = rooms.filter(r => (r.status === 'ห้องจอง' || r.status === 'จอง') && !isBookingExpired(r)).length;
                const expired = rooms.filter(r => (r.status === 'ห้องจอง' || r.status === 'จอง') && isBookingExpired(r)).length;
                const occupied = rooms.filter(r => r.status === 'ไม่ว่าง').length;
                const refund = rooms.filter(r => r.status === 'ห้องออกคืนประกัน').length;
                const writeoff = rooms.filter(r => r.status === 'ห้องตัดหนี').length;
                const repair = rooms.filter(r => r.status === 'ปรับปรุง' || r.status === 'รอซ่อม').length;

                statusesToRender.push({ name: 'ว่าง', count: vacant, color: 'emerald', isHex: false });
                statusesToRender.push({ name: 'จอง', count: reserved, color: 'yellow', isHex: false });
                statusesToRender.push({ name: 'หลุดจอง', count: expired, color: 'orange', isHex: false });
                statusesToRender.push({ name: 'ไม่ว่าง', count: occupied, color: 'red', isHex: false });
                statusesToRender.push({ name: 'คืนประกัน', count: refund, color: 'cyan', isHex: false });
                statusesToRender.push({ name: 'ตัดหนี', count: writeoff, color: 'purple', isHex: false });
                statusesToRender.push({ name: 'ปรับปรุง', count: repair, color: 'gray', isHex: false });
            }

            // Get stripe config for this building
            const stripeMap = getBuildingStripeMap();
            const stripe = stripeMap[bldg];
            const headerStyle = stripe ? `style="background:${stripe.color}"` : '';
            const headerClass = stripe ? 'text-white py-2 font-bold text-xl transition flex items-center justify-center min-h-[44px]' : 'bg-gray-800 text-white py-2 font-bold text-xl group-hover:bg-emerald-600 transition flex items-center justify-center min-h-[44px]';

            let statusesHtml = `<div class="flex flex-wrap gap-1 w-full mt-1 justify-center">`;
            statusesToRender.forEach(st => {
                let bgStyle = '', textStyle = '', bgClass = '', textClass = '';
                if (st.isHex) {
                    bgStyle = `style="background-color: ${st.color}40;"`; // 40 is ~25% opacity in hex
                    textStyle = `style="color: ${st.color};"`;
                    bgClass = `bg-gray-100`; // fallback base
                    textClass = st.count > 0 ? '' : 'text-gray-400';
                } else {
                    bgClass = `bg-${st.color}-200`;
                    textClass = st.count > 0 ? `text-${st.color}-700` : `text-gray-400`;
                }
                
                let label = st.name === 'ห้องออกคืนประกัน' ? 'คืน' : st.name === 'ห้องตัดหนี' ? 'ตัดหนี' : st.name.replace('ห้อง', '');

                statusesHtml += `
                    <div class="flex flex-col items-center ${bgClass} rounded py-1 flex-1 min-w-[28%] max-w-[32%]" ${bgStyle}>
                        <span class="text-lg font-extrabold ${textClass}" ${st.isHex && st.count > 0 ? textStyle : ''}>${st.count}</span>
                        <span class="text-[9px] font-bold ${textClass}" ${st.isHex ? textStyle : ''}>${label}</span>
                    </div>
                `;
            });
            statusesHtml += `</div>`;

            return `
                <div onclick="filterTableByBuilding('${bldg}')" class="flex-shrink-0 w-40 bg-white rounded-xl shadow-sm cursor-pointer hover:shadow-md transition border border-gray-200 overflow-hidden text-center group transform hover:-translate-y-1 flex flex-col">
                    <div class="${headerClass}" ${headerStyle}>${bldg}</div>
                    
                    <div class="flex-1 flex flex-col justify-center items-center bg-gray-50 p-2">
                        <div class="text-[10px] text-gray-400 mb-1">ทั้งหมด ${rooms.length} ห้อง</div>
                        ${statusesHtml}
                    </div>
                </div>`;
        }

        function filterTableByBuilding(bldg) { renderRoomList(bldg, null); }

        // --- Building Stripe Config ---
        function fetchBuildingStripes(project) {
            callApi('getBuildingStripes', { project: project || STATE.currentProject }, { silent: true }).then(res => {
                if (res && res.success) {
                    STATE.buildingStripes = res.stripes || {};
                    if (STATE.currentView === 'visual_map') renderVisualMap();
                }
            }).catch(err => console.error('[fetchBuildingStripes] Error:', err));
        }

        // --- Card Groups ---
        function fetchCardGroups(project) {
            callApi('getCardGroups', { project: project || STATE.currentProject }, { silent: true }).then(res => {
                if (res && res.success) {
                    STATE.cardGroups = res.cardGroups || {};
                    if (STATE.currentView === 'dashboard') renderDashboard();
                }
            }).catch(err => console.error('[fetchCardGroups] Error:', err));
        }

        function getCardCountGroups(cardKey, filterFn) {
            const total = STATE.data.filter(filterFn).length;
            const keyMap = {
                'ห้องว่าง': 'vacant', 'ว่าง': 'vacant',
                'ห้องจอง': 'reserved', 'จอง': 'reserved',
                'ปรับปรุง': 'repair', 'รอซ่อม': 'repair', 'ชำรุด': 'repair',
                'ห้องออกคืนประกัน': 'refund', 'คืนประกัน': 'refund',
                'ห้องตัดหนี': 'writeoff', 'ตัดหนี': 'writeoff',
                'ไม่ว่าง': 'occupied', 'all': 'all'
            };
            const mappedKey = keyMap[cardKey] || cardKey;
            const config = STATE.cardGroups && (STATE.cardGroups[mappedKey] || STATE.cardGroups[cardKey]);

            if (!config || !config.enabled || !Array.isArray(config.groups) || config.groups.length === 0) {
                return { mode: 'single', total };
            }

            const groups = config.groups.map(g => {
                const name = g.name || '';
                const buildings = Array.isArray(g.buildings) ? g.buildings.map(x => String(x).trim().toLowerCase()) : [];
                const count = STATE.data.filter(r => {
                    try {
                        const b = String(parseRoomInfo(r.roomNo).building || '').trim().toLowerCase();
                        return filterFn(r) && buildings.includes(b);
                    } catch (e) {
                        return false;
                    }
                }).length;
                return { name, buildings: g.buildings || [], count };
            });

            return { mode: 'grouped', groups, total };
        }

        function getBuildingStripeMap() {
            return STATE.buildingStripes || {};
        }

        function getBuildingStripeConfig() {
            const map = getBuildingStripeMap();
            const seen = new Map();
            Object.values(map).forEach(v => {
                const key = `${v.color}_${v.label}`;
                if (!seen.has(key)) seen.set(key, v);
            });
            return [...seen.values()];
        }

        function saveBuildingStripeMap(map) {
            STATE.buildingStripes = map;
            callApi('saveBuildingStripes', { project: STATE.currentProject, stripes: map }).then(res => {
                if (!res || !res.success) {
                    showToast('Error', 'ไม่สามารถบันทึกแถบสีตึกได้', 'error');
                }
            }).catch(err => {
                showToast('Error', 'เกิดข้อผิดพลาดในการบันทึก', 'error');
            });
        }

        function openBuildingStripeEditor() {
            const allBuildings = [...new Set(STATE.data.map(r => parseRoomInfo(r.roomNo).building))].sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }));
            const stripeMap = getBuildingStripeMap();

            // Pre-defined color options
            const colorOptions = [
                { value: '', label: 'ไม่มีสี', css: '' },
                { value: '#ec4899', label: 'ชมพู (Pink)', css: 'bg-pink-100' },
                { value: '#f97316', label: 'ส้ม (Orange)', css: 'bg-orange-100' },
                { value: '#3b82f6', label: 'น้ำเงิน (Blue)', css: 'bg-blue-100' },
                { value: '#8b5cf6', label: 'ม่วง (Purple)', css: 'bg-purple-100' },
                { value: '#ef4444', label: 'แดง (Red)', css: 'bg-red-100' },
                { value: '#06b6d4', label: 'ฟ้า (Cyan)', css: 'bg-cyan-100' }
            ];

            let html = `
                <div id="stripeEditorModal" class="fixed inset-0 bg-gray-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
                    <div class="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden">
                        <div class="bg-gray-800 p-4 flex justify-between items-center text-white border-b-4 border-pink-400">
                            <h3 class="font-bold text-lg flex items-center"><i class="fa-solid fa-palette mr-2 text-pink-400"></i>ตั้งค่าแถบสีตึก</h3>
                            <button onclick="closeStripeEditor()" class="hover:text-gray-300 transition"><i class="fa-solid fa-times"></i></button>
                        </div>
                        <div class="p-4 space-y-2">
                            <p class="text-xs text-gray-500 mb-3">เลือกสีและระบุคำอธิบาย (เช่น ราคาห้อง) สำหรับแต่ละตึก</p>
                            <div class="max-h-[400px] overflow-y-auto space-y-2 pr-1">
                                ${allBuildings.map(b => {
                const current = stripeMap[b] || { color: '', label: '' };
                return `
                                        <div class="flex items-center gap-2 p-2 rounded-lg border border-gray-100 hover:bg-gray-50">
                                            <span class="font-bold text-gray-800 w-12 text-center">${b}</span>
                                            <select id="stripe_color_${b}" class="flex-1 border rounded-lg px-2 py-1.5 text-sm focus:ring-2 focus:ring-pink-500 outline-none">
                                                ${colorOptions.map(c => `<option value="${c.value}" ${current.color === c.value ? 'selected' : ''}>${c.label}</option>`).join('')}
                                            </select>
                                            <input type="text" id="stripe_label_${b}" value="${current.label || ''}" placeholder="คำอธิบาย (เช่น 2,900)" class="flex-1 border rounded-lg px-2 py-1.5 text-sm focus:ring-2 focus:ring-pink-500 outline-none">
                                        </div>
                                    `;
            }).join('')}
                            </div>
                            <div class="pt-3 flex justify-end space-x-3 border-t mt-3">
                                <button onclick="closeStripeEditor()" class="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition text-sm">ยกเลิก</button>
                                <button onclick="saveStripeEditor()" class="px-5 py-2 bg-pink-500 text-white font-bold rounded-lg hover:bg-pink-600 transition shadow-md text-sm"><i class="fa-solid fa-save mr-1"></i>บันทึก</button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            const existing = document.getElementById('stripeEditorModal');
            if (existing) existing.remove();
            document.body.insertAdjacentHTML('beforeend', html);
        }

        function closeStripeEditor() {
            const el = document.getElementById('stripeEditorModal');
            if (el) el.remove();
        }

        function saveStripeEditor() {
            const allBuildings = [...new Set(STATE.data.map(r => parseRoomInfo(r.roomNo).building))];
            const map = {};
            allBuildings.forEach(b => {
                const colorEl = document.getElementById(`stripe_color_${b}`);
                const labelEl = document.getElementById(`stripe_label_${b}`);
                if (colorEl && colorEl.value) {
                    map[b] = { color: colorEl.value, label: labelEl ? labelEl.value.trim() : '' };
                }
            });
            saveBuildingStripeMap(map);
            closeStripeEditor();
            showToast('Success', 'บันทึกแถบสีตึกเรียบร้อย', 'success');
            renderVisualMap();
        }

        function handleMapSearch(query) {
            query = query.trim().toLowerCase();
            const defaultContent = document.getElementById('mapDefaultContent');
            const searchResults = document.getElementById('mapSearchResults');

            if (!query) {
                defaultContent.classList.remove('hidden');
                searchResults.classList.add('hidden');
                searchResults.innerHTML = '';
                return;
            }

            defaultContent.classList.add('hidden');
            searchResults.classList.remove('hidden');

            const matchedRooms = STATE.data.filter(r => r.roomNo.toLowerCase().includes(query));
            matchedRooms.sort((a, b) => a.roomNo.localeCompare(b.roomNo, undefined, { numeric: true }));

            if (matchedRooms.length === 0) {
                searchResults.innerHTML = `
                    <div class="flex flex-col items-center justify-center py-12 text-gray-400 bg-white rounded-xl border border-gray-100 shadow-sm">
                        <i class="fa-solid fa-search text-4xl mb-3 opacity-30"></i>
                        <p class="text-sm">ไม่พบห้องค้นหา "${query}" ในโครงการนี้</p>
                    </div>`;
                return;
            }

            let resultHtml = `
                <div class="bg-white rounded-xl p-4 border border-gray-100 shadow-sm mb-6">
                    <h3 class="text-base font-bold text-gray-700 mb-4 border-l-4 border-emerald-500 pl-3 flex items-center">
                        ผลการค้นหา: "${query}" <span class="text-xs text-emerald-600 font-bold ml-2 bg-emerald-50 px-2 py-0.5 rounded-full">${matchedRooms.length} ห้อง</span>
                    </h3>
                    <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
            `;

            matchedRooms.forEach(item => {
                const info = parseRoomInfo(item.roomNo);
                let st = item.status || 'ว่าง';
                
                const statusConfig = getStatusConfig(st);
                let isHex = statusConfig.colorType === 'hex';
                let colorVal = statusConfig.color;

                let bgClass = '', textClass = '', borderClass = '', styleAttr = '', statusIcon = 'fa-tag';
                
                // Check expired booking
                if ((st === 'ห้องจอง' || st === 'จอง') && isBookingExpired(item)) {
                    isHex = false; colorVal = 'orange'; st = 'หลุดจอง'; statusIcon = 'fa-clock';
                } else if (st.includes('ไม่ว่าง')) statusIcon = 'fa-times-circle';
                else if (st.includes('จอง')) statusIcon = 'fa-clock';
                else if (st.includes('ซ่อม') || st.includes('ปรับปรุง')) statusIcon = 'fa-wrench';
                else if (st.includes('คืนประกัน')) statusIcon = 'fa-door-open';
                else if (st.includes('ตัดหนี')) statusIcon = 'fa-file-invoice-dollar';
                else if (st.includes('ว่าง')) statusIcon = 'fa-check-circle';

                if (isHex) {
                    styleAttr = `style="background-color: ${colorVal}1a; color: ${colorVal}; border-color: ${colorVal}40;"`;
                    bgClass = 'bg-white';
                } else {
                    bgClass = `bg-${colorVal}-50`;
                    textClass = `text-${colorVal}-700`;
                    borderClass = `border-${colorVal}-200`;
                }

                resultHtml += `
                    <div onclick="openModal('${item.rowIndex}')" class="bg-white border rounded-xl p-3 cursor-pointer hover:shadow-md transition group hover:border-gray-300 relative overflow-hidden flex flex-col justify-between h-24">
                        <div class="flex justify-between items-start mb-1">
                            <span class="font-bold text-lg text-gray-800 transition tracking-tight leading-none">${item.roomNo}</span>
                            <span class="${bgClass} ${textClass} border ${borderClass} text-[9px] px-1.5 py-0.5 rounded-full font-bold shadow-sm whitespace-nowrap flex items-center" ${styleAttr}>
                                <i class="fa-solid ${statusIcon} mr-1"></i> ${st}
                            </span>
                        </div>
                        <div class="text-[10px] text-gray-400 mt-auto flex items-center justify-between">
                            <span><i class="fa-solid fa-building mr-1"></i> ${info.building} <span class="mx-0.5">•</span> FL.${info.floor}</span>
                            <span class="truncate max-w-[60px] text-right" title="${item.roomType || '-'}">${item.roomType || '-'}</span>
                        </div>
                    </div>
                `;
            });

            resultHtml += `</div></div>`;
            searchResults.innerHTML = resultHtml;
        }
