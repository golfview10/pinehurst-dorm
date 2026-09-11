        // --- Settings View ---
        function renderSettings() {
            STATE.currentView = 'settings';
            let html = `
                <div class="max-w-5xl mx-auto p-6 fade-in-up">
                    <h2 class="text-3xl font-bold text-[#1D1D1F] mb-8 tracking-tight flex items-center">
                        <div class="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center mr-3 shadow-sm border border-gray-200/50">
                            <i class="fa-solid fa-cog text-gray-700 text-lg"></i>
                        </div>
                        ตั้งค่าระบบ
                    </h2>
                    
                    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                        
                        <!-- Room Types -->
                        <div onclick="renderSettingsRoomTypes()" class="bg-white p-6 rounded-[20px] shadow-[0_2px_10px_rgba(0,0,0,0.02)] border border-gray-100 hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)] hover:-translate-y-1 cursor-pointer transition-all duration-300 group flex flex-col relative overflow-hidden">
                            <div class="w-12 h-12 rounded-2xl bg-blue-50 text-apple-blue mb-4 flex items-center justify-center group-hover:bg-apple-blue group-hover:text-white transition-colors duration-300">
                                <i class="fa-solid fa-tags text-xl"></i>
                            </div>
                            <h3 class="font-semibold text-lg text-[#1D1D1F] mb-1">ประเภทห้องพัก</h3>
                            <p class="text-sm text-gray-500 leading-relaxed">จัดการชื่อประเภท ราคาเริ่มต้น และรายละเอียดของห้องพักในแต่ละโครงการ</p>
                        </div>
                        
                        <!-- Room Statuses -->
                        <div onclick="renderSettingsRoomStatuses()" class="bg-white p-6 rounded-[20px] shadow-[0_2px_10px_rgba(0,0,0,0.02)] border border-gray-100 hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)] hover:-translate-y-1 cursor-pointer transition-all duration-300 group flex flex-col relative overflow-hidden">
                            <div class="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-500 mb-4 flex items-center justify-center group-hover:bg-emerald-500 group-hover:text-white transition-colors duration-300">
                                <i class="fa-solid fa-palette text-xl"></i>
                            </div>
                            <h3 class="font-semibold text-lg text-[#1D1D1F] mb-1">จัดการสถานะห้องพัก</h3>
                            <p class="text-sm text-gray-500 leading-relaxed">เพิ่มสถานะห้องใหม่ กำหนดสีการแสดงผล และปรับแต่งสีสถานะด้วย HTML Hex Code</p>
                        </div>
                        
                        <!-- Card Groups -->
                        <div onclick="renderSettingsCardGroups()" class="bg-white p-6 rounded-[20px] shadow-[0_2px_10px_rgba(0,0,0,0.02)] border border-gray-100 hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)] hover:-translate-y-1 cursor-pointer transition-all duration-300 group flex flex-col relative overflow-hidden">
                            <div class="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-500 mb-4 flex items-center justify-center group-hover:bg-indigo-500 group-hover:text-white transition-colors duration-300">
                                <i class="fa-solid fa-layer-group text-xl"></i>
                            </div>
                            <h3 class="font-semibold text-lg text-[#1D1D1F] mb-1">ตั้งค่ากลุ่มตัวเลขการ์ด</h3>
                            <p class="text-sm text-gray-500 leading-relaxed">ตั้งกลุ่มตึกสำหรับการ์ด เช่น แยกการ์ด 'ห้องว่าง' ตามกลุ่มตึก</p>
                        </div>

                        <!-- Summary Cards -->
                        <div onclick="renderSettingsSummaryCards()" class="bg-white p-6 rounded-[20px] shadow-[0_2px_10px_rgba(0,0,0,0.02)] border border-gray-100 hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)] hover:-translate-y-1 cursor-pointer transition-all duration-300 group flex flex-col relative overflow-hidden">
                            <div class="w-12 h-12 rounded-2xl bg-teal-50 text-teal-600 mb-4 flex items-center justify-center group-hover:bg-teal-600 group-hover:text-white transition-colors duration-300">
                                <i class="fa-solid fa-calculator text-xl"></i>
                            </div>
                            <h3 class="font-semibold text-lg text-[#1D1D1F] mb-1">การ์ดสรุปยอดรวม (Summary Cards)</h3>
                            <p class="text-sm text-gray-500 leading-relaxed">สร้างการ์ดรวมหลายสถานะบน Dashboard เช่น ห้องว่างรวม (ว่าง+ตัดหนี+ออกคืน+ปรับปรุง+ส่งซ่อม)</p>
                        </div>

                        <!-- Card Ordering -->
                        <div onclick="renderSettingsCardOrder()" class="bg-white p-6 rounded-[20px] shadow-[0_2px_10px_rgba(0,0,0,0.02)] border border-gray-100 hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)] hover:-translate-y-1 cursor-pointer transition-all duration-300 group flex flex-col relative overflow-hidden">
                            <div class="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 mb-4 flex items-center justify-center group-hover:bg-amber-600 group-hover:text-white transition-colors duration-300">
                                <i class="fa-solid fa-arrow-down-up-across-line text-xl"></i>
                            </div>
                            <h3 class="font-semibold text-lg text-[#1D1D1F] mb-1">จัดเรียงลำดับการ์ด (Card Ordering)</h3>
                            <p class="text-sm text-gray-500 leading-relaxed">สลับและจัดลำดับการ์ดบน Dashboard ได้ตามต้องการ เช่น ย้ายห้องว่างรวม หรือห้องจอง</p>
                        </div>
                        
                        <!-- Layout Editor -->
                        <div onclick="renderLayoutEditor()" class="bg-white p-6 rounded-[20px] shadow-[0_2px_10px_rgba(0,0,0,0.02)] border border-gray-100 hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)] hover:-translate-y-1 cursor-pointer transition-all duration-300 group flex flex-col relative overflow-hidden">
                            <div class="w-12 h-12 rounded-2xl bg-purple-50 text-purple-500 mb-4 flex items-center justify-center group-hover:bg-purple-500 group-hover:text-white transition-colors duration-300">
                                <i class="fa-solid fa-grip text-xl"></i>
                            </div>
                            <h3 class="font-semibold text-lg text-[#1D1D1F] mb-1">จัดเรียงห้อง (Floor Layout)</h3>
                            <p class="text-sm text-gray-500 leading-relaxed">กำหนดรูปแบบการจัดเรียงห้องในแต่ละตึก สูท บันได ลิฟท์</p>
                        </div>
                        
                        <!-- User Management (Admin Only) -->
                        <div onclick="if(STATE.user.role === 'Admin') renderSettingsUsers(); else showToast('Access Denied', 'สำหรับ Admin เท่านั้น', 'error');" 
                             class="bg-white p-6 rounded-[20px] shadow-[0_2px_10px_rgba(0,0,0,0.02)] border border-gray-100 ${STATE.user.role === 'Admin' ? 'hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)] hover:-translate-y-1 cursor-pointer' : 'opacity-60 cursor-not-allowed grayscale-[30%]'} transition-all duration-300 group flex flex-col relative overflow-hidden">
                            ${STATE.user.role !== 'Admin' ? '<div class="absolute top-5 right-5 text-gray-300 text-lg"><i class="fa-solid fa-lock"></i></div>' : ''}
                            <div class="w-12 h-12 rounded-2xl bg-orange-50 text-orange-500 mb-4 flex items-center justify-center ${STATE.user.role === 'Admin' ? 'group-hover:bg-orange-500 group-hover:text-white' : ''} transition-colors duration-300">
                                <i class="fa-solid fa-users text-xl"></i>
                            </div>
                            <h3 class="font-semibold text-lg text-[#1D1D1F] mb-1">จัดการผู้ใช้</h3>
                            <p class="text-sm text-gray-500 leading-relaxed">เพิ่มลบผู้ใช้ กำหนดสิทธิ์ และรหัสผ่านสำหรับเข้าสู่ระบบ <span class="text-[10px] font-bold text-orange-500 uppercase tracking-wider ml-1 bg-orange-50 px-2 py-0.5 rounded-md">Admin Only</span></p>
                        </div>

                        <!-- Backup Database (Admin Only) -->
                        <div onclick="backupFullDatabase()" id="btn_backup_db" class="hidden bg-white p-6 rounded-[20px] shadow-[0_2px_10px_rgba(0,0,0,0.02)] border border-gray-100 hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)] hover:-translate-y-1 cursor-pointer transition-all duration-300 group flex flex-col relative overflow-hidden">
                            <div class="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-500 mb-4 flex items-center justify-center group-hover:bg-emerald-500 group-hover:text-white transition-colors duration-300">
                                <i class="fa-solid fa-database text-xl"></i>
                            </div>
                            <h3 class="font-semibold text-lg text-[#1D1D1F] mb-1">สำรองข้อมูล (Backup)</h3>
                            <p class="text-sm text-gray-500 leading-relaxed">ดาวน์โหลดข้อมูลห้องทุกโครงการเป็นไฟล์ Excel (.xlsx)</p>
                        </div>
                    </div>
                </div>
                        `;
            document.getElementById('mainContent').innerHTML = html;
            updateActiveNav(3);
            
            // Show Admin tools if role is admin
            if (STATE.user && STATE.user.role === 'Admin') {
                const btnBackup = document.getElementById('btn_backup_db');
                if (btnBackup) btnBackup.classList.remove('hidden');
            }
        }

        // --- Settings: Card Groups ---
        function renderSettingsCardGroups(targetProject = null, selectedCard = null) {
            STATE.currentView = 'settings_card_groups';
            const project = targetProject || (document.getElementById('cg_project_select') && document.getElementById('cg_project_select').value) || STATE.currentProject;
            const cardKey = selectedCard || (document.getElementById('cg_card_select') && document.getElementById('cg_card_select').value) || 'vacant';

            // Ensure project data is loaded
            if (!project) return showToast('Error', 'กรุณาเลือกโครงการก่อน');

            const allBuildings = [...new Set(STATE.data.map(r => parseRoomInfo(r.roomNo).building))].sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }));

            const hasCustoms = STATE.projectRoomStatuses && STATE.projectRoomStatuses.length > 0;
            let CARD_OPTIONS = [];
            if (hasCustoms) {
                const keyMapReverse = {
                    'ห้องว่าง': 'vacant', 'ว่าง': 'vacant',
                    'ห้องจอง': 'reserved', 'จอง': 'reserved',
                    'ปรับปรุง': 'repair', 'รอซ่อม': 'repair', 'ชำรุด': 'repair',
                    'ห้องออกคืนประกัน': 'refund', 'คืนประกัน': 'refund',
                    'ห้องตัดหนี': 'writeoff', 'ตัดหนี': 'writeoff',
                    'ไม่ว่าง': 'occupied'
                };
                CARD_OPTIONS = STATE.projectRoomStatuses.map(s => ({
                    key: keyMapReverse[s.name] || s.name,
                    label: s.name
                }));
            } else {
                CARD_OPTIONS = [
                    { key: 'vacant', label: 'ห้องว่าง' },
                    { key: 'occupied', label: 'ไม่ว่าง' },
                    { key: 'reserved', label: 'ห้องจอง' },
                    { key: 'refund', label: 'ออกคืนประกัน' },
                    { key: 'writeoff', label: 'ตัดหนี' },
                    { key: 'repair', label: 'ปรับปรุง' }
                ];
            }
            CARD_OPTIONS.push({ key: 'all', label: 'ทั้งหมด' });

            // If cardKey is vacant but vacant is not in options, map it to the first option
            let activeCardKey = cardKey;
            if (!CARD_OPTIONS.find(o => o.key === activeCardKey)) {
                activeCardKey = CARD_OPTIONS[0].key;
            }

            const cfg = STATE.cardGroups && STATE.cardGroups[activeCardKey] ? STATE.cardGroups[activeCardKey] : { enabled: false, groups: [] };

            let html = `
                <div class="max-w-5xl mx-auto p-6 fade-in-up">
                    <button onclick="renderSettings()" class="mb-6 text-gray-500 hover:text-apple-blue flex items-center text-sm font-semibold transition-colors w-fit"><i class="fa-solid fa-arrow-left mr-2"></i> กลับไปหน้าตั้งค่ารวม</button>
                    
                    <h2 class="text-3xl font-bold text-[#1D1D1F] mb-8 tracking-tight flex items-center">
                        <div class="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center mr-3 shadow-sm border border-indigo-100/50">
                            <i class="fa-solid fa-layer-group text-indigo-500 text-lg"></i>
                        </div>
                        ตั้งค่ากลุ่มตัวเลขการ์ด
                    </h2>

                    <div class="bg-white rounded-[24px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 p-8">
                        <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8 pb-6 border-b border-gray-100">
                            <div class="flex flex-wrap items-center gap-4">
                                <div class="flex items-center gap-2 bg-[#F5F5F7] p-1.5 rounded-[14px]">
                                    <label class="text-xs text-gray-500 font-bold uppercase tracking-wider pl-2">โครงการ</label>
                                    <select id="cg_project_select" onchange="renderSettingsCardGroups(this.value, '${cardKey}')" class="bg-white border-0 rounded-lg px-3 py-1.5 text-sm font-semibold text-[#1D1D1F] shadow-sm outline-none cursor-pointer focus:ring-2 focus:ring-apple-blue/20">
                                        ${STATE.user.projects.map(p => `<option value="${p}" ${p === project ? 'selected' : ''}>${p}</option>`).join('')}
                                    </select>
                                </div>
                                <div class="flex items-center gap-2 bg-[#F5F5F7] p-1.5 rounded-[14px]">
                                    <label class="text-xs text-gray-500 font-bold uppercase tracking-wider pl-2">การ์ด</label>
                                    <select id="cg_card_select" onchange="renderSettingsCardGroups(null, this.value)" class="bg-white border-0 rounded-lg px-3 py-1.5 text-sm font-semibold text-[#1D1D1F] shadow-sm outline-none cursor-pointer focus:ring-2 focus:ring-apple-blue/20">
                                        ${CARD_OPTIONS.map(o => `<option value="${o.key}" ${o.key === activeCardKey ? 'selected' : ''}>${o.label}</option>`).join('')}
                                    </select>
                                </div>
                            </div>
                            
                            <label class="relative inline-flex items-center cursor-pointer select-none">
                                <div class="relative w-11 h-6">
                                    <input id="cg_enabled" type="checkbox" ${cfg.enabled ? 'checked' : ''} class="sr-only peer">
                                    <div class="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:bg-apple-blue shadow-inner transition-colors"></div>
                                    <div class="absolute top-[2px] left-[2px] bg-white border-gray-300 border rounded-full h-5 w-5 transition-transform peer-checked:translate-x-full peer-checked:border-white shadow-sm"></div>
                                </div>
                                <span class="ml-3 text-sm font-semibold text-gray-700">แยกตัวเลขตามกลุ่มตึก</span>
                            </label>
                        </div>

                        <div id="cg_groups_container" class="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                            ${cfg.groups && cfg.groups.length > 0 ? cfg.groups.map((g, idx) => renderCardGroupRowHtml(idx, g, allBuildings)).join('') : renderCardGroupRowHtml(0, { name: 'กลุ่ม 1', buildings: [] }, allBuildings)}
                        </div>

                        <div class="pt-6 flex flex-col sm:flex-row justify-between items-center gap-4 border-t border-gray-100 mt-6">
                            <div class="text-xs text-gray-400 font-medium flex items-center bg-gray-50 px-3 py-1.5 rounded-lg">
                                <i class="fa-solid fa-circle-info mr-2 text-gray-400"></i> ตึกเดียวกันไม่ควรอยู่มากกว่า 1 กลุ่ม
                            </div>
                            <div class="flex items-center gap-3 w-full sm:w-auto">
                                <button onclick="addCardGroupRow()" class="flex-1 sm:flex-none px-5 py-2.5 bg-gray-100 text-gray-700 hover:bg-gray-200 font-semibold rounded-xl transition-colors text-sm"><i class="fa-solid fa-plus mr-1"></i> เพิ่มกลุ่ม</button>
                                <button onclick="saveCardGroups()" class="flex-1 sm:flex-none px-6 py-2.5 bg-apple-blue text-white hover:bg-blue-600 font-semibold rounded-xl shadow-[0_4px_12px_rgba(0,122,255,0.3)] transition-all active:scale-[0.98] text-sm">บันทึกการตั้งค่า</button>
                            </div>
                        </div>
                    </div>
                </div>
            `;

            document.getElementById('mainContent').innerHTML = html;
            updateActiveNav(3);

            function renderCardGroupRowHtml(idx, g, allBuildings) {
                const selected = Array.isArray(g.buildings) ? g.buildings : [];
                return `
                    <div class="cardgroup-row p-5 border border-gray-100 rounded-2xl bg-[#FBFBFD] shadow-sm relative group" data-idx="${idx}">
                        <div class="flex justify-between items-center mb-4 pb-4 border-b border-gray-100">
                            <input value="${escapeHtml(g.name || '')}" class="cg_name bg-transparent border-0 font-bold text-lg text-[#1D1D1F] outline-none placeholder-gray-300 w-full" placeholder="ชื่อกลุ่ม (เช่น ตึก 8 ชั้น)" />
                            <button onclick="this.closest('.cardgroup-row').remove();" class="text-xs font-semibold text-red-500 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-lg transition-colors flex-shrink-0 opacity-0 group-hover:opacity-100"><i class="fa-solid fa-trash mr-1"></i> ลบ</button>
                        </div>
                        <div class="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-8 lg:grid-cols-10 gap-2.5 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                            ${allBuildings.map(b => {
                                const isSel = selected.includes(b);
                                return `
                                <label class="flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border ${isSel ? 'bg-blue-50 border-blue-200 text-apple-blue font-bold shadow-sm' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-gray-300 font-medium'} cursor-pointer transition-all duration-200 select-none">
                                    <input type="checkbox" class="cg_building hidden" value="${b}" ${isSel ? 'checked' : ''} onchange="
                                        if(this.checked) {
                                            this.parentElement.className = 'flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border bg-blue-50 border-blue-200 text-apple-blue font-bold shadow-sm cursor-pointer transition-all duration-200 select-none';
                                        } else {
                                            this.parentElement.className = 'flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border bg-white border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-gray-300 font-medium cursor-pointer transition-all duration-200 select-none';
                                        }
                                    " />
                                    <span class="text-sm tracking-wide">${b}</span>
                                </label>
                                `;
                            }).join('')}
                        </div>
                    </div>
                `;
            }

            // Helper to escape
            function escapeHtml(str) { return String(str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
        }

        function addCardGroupRow() {
            const container = document.getElementById('cg_groups_container');
            if (!container) return;
            // Recompute buildings
            const allBuildings = [...new Set(STATE.data.map(r => parseRoomInfo(r.roomNo).building))].sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }));
            const idx = container.querySelectorAll('.cardgroup-row').length;
            const div = document.createElement('div');
            div.className = 'cardgroup-row p-5 border border-gray-100 rounded-2xl bg-[#FBFBFD] shadow-sm relative group mt-4';
            div.dataset.idx = idx;
            div.innerHTML = `
                <div class="flex justify-between items-center mb-4 pb-4 border-b border-gray-100">
                    <input value="กลุ่ม ${idx + 1}" class="cg_name bg-transparent border-0 font-bold text-lg text-[#1D1D1F] outline-none placeholder-gray-300 w-full" placeholder="ชื่อกลุ่ม (เช่น ตึก 8 ชั้น)" />
                    <button onclick="this.closest('.cardgroup-row').remove();" class="text-xs font-semibold text-red-500 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-lg transition-colors flex-shrink-0 opacity-0 group-hover:opacity-100"><i class="fa-solid fa-trash mr-1"></i> ลบ</button>
                </div>
                <div class="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-8 lg:grid-cols-10 gap-2.5 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                    ${allBuildings.map(b => `
                        <label class="flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border bg-white border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-gray-300 font-medium cursor-pointer transition-all duration-200 select-none">
                            <input type="checkbox" class="cg_building hidden" value="${b}" onchange="
                                if(this.checked) {
                                    this.parentElement.className = 'flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border bg-blue-50 border-blue-200 text-apple-blue font-bold shadow-sm cursor-pointer transition-all duration-200 select-none';
                                } else {
                                    this.parentElement.className = 'flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border bg-white border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-gray-300 font-medium cursor-pointer transition-all duration-200 select-none';
                                }
                            " />
                            <span class="text-sm tracking-wide">${b}</span>
                        </label>
                    `).join('')}
                </div>
            `;
            container.appendChild(div);
        }

        function saveCardGroups() {
            const project = document.getElementById('cg_project_select').value;
            const cardKey = document.getElementById('cg_card_select').value;
            const enabled = !!document.getElementById('cg_enabled').checked;

            const rows = Array.from(document.querySelectorAll('.cardgroup-row'));
            const groups = rows.map(r => {
                const nameEl = r.querySelector('.cg_name');
                const name = nameEl ? nameEl.value.trim() : '';
                const buildings = Array.from(r.querySelectorAll('.cg_building:checked')).map(c => c.value);
                return { name, buildings };
            }).filter(g => g.name && g.buildings && g.buildings.length > 0);

            // Validate no duplicate building across groups
            const used = new Set();
            for (let g of groups) {
                for (let b of g.buildings) {
                    if (used.has(b)) return showToast('Validation', `ตึก ${b} ถูกเลือกซ้ำในหลายกลุ่ม`, 'error');
                    used.add(b);
                }
            }

            callApi('saveCardGroups', { project, cardKey, enabled, groups }).then(res => {
                if (res && res.success) {
                    showToast('สำเร็จ', res.message || 'บันทึกเรียบร้อย', 'success');
                    // reload
                    fetchCardGroups(project);
                } else showToast('ผิดพลาด', res.message || 'ไม่สามารถบันทึกได้', 'error');
            }).catch(err => showToast('Error', err.message, 'error'));
        }

        function renderSettingsRoomTypes(targetProject = null) {
            STATE.currentView = 'settings_room_types';
            const editProject = targetProject || STATE.currentProject;

            // Filter displayed rows
            const displayTypes = STATE.allSettings.filter(s => s.project === editProject);

            let html = `
                <div class="max-w-5xl mx-auto p-6 fade-in-up">
                    <button onclick="renderSettings()" class="mb-4 text-gray-500 hover:text-emerald-600 flex items-center text-sm font-bold"><i class="fa-solid fa-arrow-left mr-2"></i> กลับไปหน้าตั้งค่ารวม</button>
                    
                    <h2 class="text-2xl font-bold text-gray-800 mb-6 flex items-center"><i class="fa-solid fa-tags mr-2 text-emerald-600"></i> จัดการประเภทห้องพัก</h2>
                    
                    <!-- Room Types Section -->
                        <div class="bg-white rounded-[24px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 p-8 mb-6">
                            <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 pb-6 border-b border-gray-100">
                                <div class="flex items-center gap-2 bg-[#F5F5F7] p-1.5 rounded-[14px]">
                                    <label class="text-xs text-gray-500 font-bold uppercase tracking-wider pl-2">โครงการ</label>
                                    <select onchange="renderSettingsRoomTypes(this.value)" class="bg-white border-0 rounded-lg px-3 py-1.5 text-sm font-semibold text-[#1D1D1F] shadow-sm outline-none cursor-pointer focus:ring-2 focus:ring-emerald-500">
                                        ${STATE.user.projects.map(p => `<option value="${p}" ${p === editProject ? 'selected' : ''}>${p}</option>`).join('')}
                                    </select>
                                </div>

                                <button onclick="openRoomTypeModal(null, '${editProject}')" class="text-sm bg-emerald-600 text-white px-5 py-2.5 rounded-xl hover:bg-emerald-700 font-semibold shadow-[0_4px_12px_rgba(16,185,129,0.3)] flex items-center transition-all active:scale-[0.98] w-full sm:w-auto justify-center"><i class="fa-solid fa-plus mr-2"></i> เพิ่มประเภทห้องใหม่</button>
                            </div>

                            <div class="bg-indigo-50 border border-indigo-200 rounded-xl p-4 mb-8 flex items-start gap-3 shadow-sm">
                                <div class="bg-white rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 mt-0.5 shadow-sm">
                                    <i class="fa-solid fa-circle-info text-indigo-500"></i>
                                </div>
                                <div class="text-sm text-indigo-800 leading-relaxed">
                                    <span class="font-bold">หมวดหมู่ (Category)</span> — ใช้จัดกลุ่มประเภทที่ชื่อคล้ายกันแต่ราคาต่างกัน เช่น ตั้ง Category เป็น <span class="font-bold">"HISO"</span> ให้ทั้ง <span class="bg-white px-1 py-0.5 rounded text-indigo-600 text-xs">"HISO (TV)"</span> และ <span class="bg-white px-1 py-0.5 rounded text-indigo-600 text-xs">"HISO (ธรรมดา)"</span> → จะถูกนำไปรวมคำนวณเป็นกลุ่มเดียวในหน้า Dashboard
                                </div>
                            </div>
                            
                            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                ${displayTypes.map(rt => `
                                    <div class="bg-white rounded-2xl shadow-[0_2px_10px_rgba(0,0,0,0.04)] border border-gray-100 p-6 flex flex-col hover:shadow-lg transition-all duration-300 relative group overflow-hidden">
                                        <div class="flex justify-between items-start mb-4">
                                            <span class="bg-indigo-50 text-indigo-600 border border-indigo-100 text-xs px-3 py-1 rounded-lg font-semibold tracking-wide flex items-center shadow-sm">
                                                <i class="fa-solid fa-layer-group mr-1.5 opacity-70"></i> ${rt.category || rt.name}
                                            </span>
                                            <div class="text-lg font-black text-emerald-600 bg-emerald-50 px-3 py-1 rounded-lg border border-emerald-100 shadow-sm flex items-center">
                                                <span class="text-[10px] uppercase tracking-wider text-emerald-500 mr-1 opacity-80 mt-0.5">ราคา</span>
                                                ${rt.price ? rt.price.toString().replace(/\\B(?=(\\d{3})+(?!\\d))/g, ",") : '-'}
                                            </div>
                                        </div>
                                        
                                        <h3 class="text-xl font-extrabold text-[#1D1D1F] mb-3 truncate pr-2" title="${rt.name}">${rt.name}</h3>
                                        
                                        <div class="bg-[#F5F5F7] rounded-xl p-3 mb-6 flex-1 border border-gray-100 shadow-inner overflow-hidden">
                                            <p class="text-[13px] text-gray-600 line-clamp-3 whitespace-pre-wrap leading-relaxed">${rt.detail || '<span class="italic text-gray-400">ไม่มีรายละเอียด</span>'}</p>
                                        </div>
                                        
                                        <div class="flex items-center justify-end gap-2 pt-4 border-t border-gray-100 mt-auto">
                                            <button onclick='openRoomTypeModal(${JSON.stringify(rt).replace(/'/g, "&#39;")}, "${editProject}")' class="flex items-center justify-center px-4 py-2 bg-gray-50 text-gray-700 rounded-lg text-sm font-semibold hover:bg-emerald-50 hover:text-emerald-600 transition-colors">
                                                <i class="fa-solid fa-pen-to-square mr-2"></i> แก้ไข
                                            </button>
                                            <button onclick='deleteRoomType("${rt.name.replace(/'/g, "\\'")}", "${editProject}")' class="flex items-center justify-center px-3 py-2 bg-gray-50 text-gray-500 rounded-lg text-sm hover:bg-red-50 hover:text-red-600 transition-colors" title="ลบประเภทห้อง">
                                                <i class="fa-solid fa-trash-can"></i>
                                            </button>
                                        </div>
                                    </div>
                                `).join('')}
                                
                                ${displayTypes.length === 0 ? `
                                    <div class="col-span-full py-16 text-center flex flex-col items-center bg-gray-50 rounded-2xl border border-dashed border-gray-300">
                                        <div class="w-16 h-16 bg-white rounded-full flex items-center justify-center mb-4 shadow-sm border border-gray-100">
                                            <i class="fa-solid fa-tags text-2xl text-gray-400"></i>
                                        </div>
                                        <h3 class="text-lg font-bold text-gray-700 mb-1">ยังไม่มีประเภทห้องพัก</h3>
                                        <p class="text-sm text-gray-500 mb-4 max-w-sm">เริ่มจัดการห้องพักของคุณโดยการกดปุ่ม "เพิ่มประเภทห้องใหม่" ด้านบนได้เลย</p>
                                        <button onclick="openRoomTypeModal(null, '${editProject}')" class="text-sm bg-white border border-gray-200 text-gray-700 px-5 py-2 rounded-xl hover:bg-gray-50 font-semibold shadow-sm transition-all"><i class="fa-solid fa-plus mr-2 text-emerald-500"></i> สร้างประเภทแรก</button>
                                    </div>
                                ` : ''}
                            </div>
                        </div>
                </div>
            `;
            document.getElementById('mainContent').innerHTML = html;
        }

        // --- Floor Layout Editor (Per-Floor) ---
        let _layoutCurrentBuilding = null;

        function renderLayoutEditor() {
            STATE.currentView = 'layout_editor';
            _layoutCurrentBuilding = null;
            const buildings = [...new Set(STATE.data.map(r => parseRoomInfo(r.roomNo).building))].sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

            let html = `
                <div class="max-w-5xl mx-auto p-6 fade-in-up">
                    <button onclick="renderSettings()" class="mb-4 text-gray-500 hover:text-emerald-600 flex items-center text-sm font-bold"><i class="fa-solid fa-arrow-left mr-2"></i> กลับไปหน้าตั้งค่ารวม</button>
                    <h2 class="text-2xl font-bold text-gray-800 mb-2 flex items-center"><i class="fa-solid fa-grip mr-2 text-purple-600"></i> จัดเรียงห้อง (Floor Layout)</h2>
                    <p class="text-sm text-gray-500 mb-6">กำหนดรูปแบบการจัดเรียงห้องแต่ละชั้นของแต่ละตึก</p>
                    
                    <div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                        ${buildings.map(b => {
                const bLayouts = STATE.layouts[b];
                const configuredCount = bLayouts ? Object.keys(bLayouts).length : 0;
                return `
                                <div onclick="renderBuildingFloors('${b}')" class="bg-white p-4 rounded-xl shadow-sm border ${configuredCount > 0 ? 'border-purple-300 bg-purple-50' : 'border-gray-200'} hover:shadow-md hover:border-purple-400 cursor-pointer transition group text-center">
                                    <div class="text-3xl font-bold ${configuredCount > 0 ? 'text-purple-600' : 'text-gray-700'} group-hover:text-purple-600 transition mb-2">${b}</div>
                                    <div class="text-xs ${configuredCount > 0 ? 'text-purple-500 font-bold' : 'text-gray-400'}">
                                        ${configuredCount > 0 ? `<i class="fa-solid fa-check-circle mr-1"></i>${configuredCount} ชั้นตั้งค่าแล้ว` : '<i class="fa-solid fa-plus-circle mr-1"></i>ยังไม่ได้ตั้งค่า'}
                                    </div>
                                </div>`;
            }).join('')}
                    </div>
                </div>`;
            document.getElementById('mainContent').innerHTML = html;
        }

        // Show floors of a building for per-floor config
        function renderBuildingFloors(building) {
            STATE.currentView = 'layout_building_floors';
            _layoutCurrentBuilding = building;
            const buildingRooms = STATE.data.filter(r => parseRoomInfo(r.roomNo).building === building);
            const floorMap = {};
            buildingRooms.forEach(r => {
                const f = parseRoomInfo(r.roomNo).floor;
                if (!floorMap[f]) floorMap[f] = 0;
                floorMap[f]++;
            });
            const sortedFloors = Object.keys(floorMap).sort((a, b) => Number(a) - Number(b));
            const bLayouts = STATE.layouts[building] || {};

            let html = `
                <div class="max-w-5xl mx-auto p-6 fade-in-up">
                    <button onclick="renderLayoutEditor()" class="mb-4 text-gray-500 hover:text-purple-600 flex items-center text-sm font-bold"><i class="fa-solid fa-arrow-left mr-2"></i> กลับไปรายการตึก</button>
                    <h2 class="text-2xl font-bold text-gray-800 mb-2 flex items-center"><i class="fa-solid fa-building mr-2 text-purple-600"></i> ตึก ${building} — เลือกชั้นที่จะจัดเรียง</h2>
                    <p class="text-sm text-gray-500 mb-6">แต่ละชั้นตั้งค่าอิสระ ไม่เกี่ยวกัน</p>

                    <div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                        ${sortedFloors.map(f => {
                const hasLayout = !!bLayouts[f];
                const roomCount = floorMap[f];
                return `
                            <div onclick="openLayoutDesigner('${building}', '${f}')" class="bg-white p-4 rounded-xl shadow-sm border ${hasLayout ? 'border-purple-300 bg-purple-50' : 'border-gray-200'} hover:shadow-md hover:border-purple-400 cursor-pointer transition group text-center">
                                <div class="text-2xl font-bold ${hasLayout ? 'text-purple-600' : 'text-gray-700'} group-hover:text-purple-600 transition mb-1">FL.${f}</div>
                                <div class="text-xs text-gray-500 mb-1">${roomCount} ห้อง</div>
                                <div class="text-[10px] ${hasLayout ? 'text-purple-500 font-bold' : 'text-gray-400'}">
                                    ${hasLayout ? '<i class="fa-solid fa-check-circle mr-1"></i>ตั้งค่าแล้ว' : '<i class="fa-solid fa-plus-circle mr-1"></i>ยังไม่ตั้ง'}
                                </div>
                            </div>`;
            }).join('')}
                    </div>

                    ${Object.keys(bLayouts).length > 0 ? `
                    <div class="mt-6 pt-4 border-t border-gray-100">
                        <button onclick="deleteAllBuildingLayouts('${building}')" class="text-red-500 hover:text-red-700 text-sm flex items-center"><i class="fa-solid fa-trash-can mr-2"></i>ลบ Layout ทั้งหมดของตึก ${building}</button>
                    </div>` : ''}
                </div>`;
            document.getElementById('mainContent').innerHTML = html;
        }

        // Layout Designer - temp state for editing
        let _layoutDesignerState = { topRow: [], bottomRow: [], suites: [], specials: [] };

        function openLayoutDesigner(building, floor) {
            STATE.currentView = 'layout_designer';
            _layoutCurrentBuilding = building;
            const floorRooms = STATE.data.filter(r => {
                const info = parseRoomInfo(r.roomNo);
                return info.building === building && info.floor == floor;
            });
            floorRooms.sort((a, b) => parseInt(parseRoomInfo(a.roomNo).roomIndex) - parseInt(parseRoomInfo(b.roomNo).roomIndex));

            // Extract room suffixes
            const roomSuffixes = floorRooms.map(r => {
                const info = parseRoomInfo(r.roomNo);
                return { suffix: String(info.roomIndex).padStart(2, '0'), roomNo: r.roomNo, status: r.status };
            });

            // Load existing layout for THIS FLOOR or create default (ensure string key)
            const floorKey = String(floor);
            const existing = STATE.layouts[building] && STATE.layouts[building][floorKey];
            if (existing) {
                _layoutDesignerState = JSON.parse(JSON.stringify(existing));
                // Remove suffixes that no longer exist in actual data
                const validSuffixes = new Set(roomSuffixes.map(r => r.suffix));
                _layoutDesignerState.topRow = _layoutDesignerState.topRow.filter(s => s.startsWith('_') || validSuffixes.has(s));
                _layoutDesignerState.bottomRow = _layoutDesignerState.bottomRow.filter(s => s.startsWith('_') || validSuffixes.has(s));
            } else {
                // Default: split in half
                const half = Math.ceil(roomSuffixes.length / 2);
                _layoutDesignerState = {
                    topRow: roomSuffixes.slice(0, half).map(r => r.suffix),
                    bottomRow: roomSuffixes.slice(half).reverse().map(r => r.suffix),
                    suites: [],
                    specials: []
                };
            }

            _renderLayoutDesignerUI(building, floor, roomSuffixes);
        }

        function _renderLayoutDesignerUI(building, sampleFloor, roomSuffixes) {
            const st = _layoutDesignerState;
            const allSuffixes = roomSuffixes.map(r => r.suffix);

            // Find unplaced rooms
            const placedSet = new Set([...st.topRow.filter(s => !s.startsWith('_')), ...st.bottomRow.filter(s => !s.startsWith('_'))]);
            const unplaced = allSuffixes.filter(s => !placedSet.has(s));

            const renderCell = (suffix, rowName, idx) => {
                const isSuite = st.suites.includes(suffix);
                const isSpecial = suffix.startsWith('_');
                let special = null;
                if (isSpecial) {
                    special = st.specials.find(s => s.id === suffix) || { id: suffix, type: 'stairs', label: 'บันได', icon: 'fa-stairs' };
                }
                const spanW = isSuite ? 'col-span-2' : '';

                if (isSpecial) {
                    const specialClasses = special.type === 'store' ? 'bg-orange-100 border-orange-400 text-orange-600' : special.type === 'lounge' ? 'bg-teal-100 border-teal-400 text-teal-600' : special.type === 'custom' ? 'bg-blue-100 border-blue-400 text-blue-600' : 'bg-gray-200 border-gray-400 text-gray-500';
                    return `<div class="${specialClasses} border-2 border-dashed rounded-lg p-2 flex flex-col items-center justify-center min-h-[60px] ${spanW} relative group cursor-move" data-suffix="${suffix}" data-row="${rowName}" data-idx="${idx}"
                        draggable="true" 
                        ondragstart="event.dataTransfer.setData('text/plain', JSON.stringify({suffix:'${suffix}',fromRow:'${rowName}',fromIdx:${idx}}))">
                        <i class="fa-solid ${special.icon} text-lg"></i>
                        <span class="text-[10px] mt-1 font-bold">${special.label}</span>
                        <div class="absolute -top-2 -right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition">
                            <button onclick="_layoutMoveToOtherRow('${suffix}', '${rowName}', ${idx}, '${building}', '${sampleFloor}')" class="bg-blue-500 text-white rounded-full w-5 h-5 text-[9px] flex items-center justify-center" title="ย้ายแถว"><i class="fa-solid fa-arrows-up-down"></i></button>
                            <button onclick="_layoutRemoveItem('${rowName}', ${idx}, '${building}', '${sampleFloor}')" class="bg-red-500 text-white rounded-full w-5 h-5 text-[10px] flex items-center justify-center" title="นำออก"><i class="fa-solid fa-xmark"></i></button>
                        </div>
                    </div>`;
                }

                const roomLabel = `${sampleFloor}${suffix}`;
                return `<div class="bg-purple-100 border-2 border-purple-300 rounded-lg p-2 flex flex-col items-center justify-center min-h-[60px] ${spanW} relative group cursor-move ${isSuite ? 'bg-amber-100 border-amber-400' : ''}" 
                    draggable="true" 
                    ondragstart="event.dataTransfer.setData('text/plain', JSON.stringify({suffix:'${suffix}',fromRow:'${rowName}',fromIdx:${idx}}))"
                    data-suffix="${suffix}" data-row="${rowName}" data-idx="${idx}">
                    <span class="font-bold text-lg ${isSuite ? 'text-amber-700' : 'text-purple-700'}">${roomLabel}</span>
                    ${isSuite ? '<span class="text-[9px] text-amber-600 font-bold">สูท (2x)</span>' : ''}
                    <div class="absolute -top-2 -right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition">
                        <button onclick="_layoutToggleSuite('${suffix}', '${building}', '${sampleFloor}')" class="${isSuite ? 'bg-gray-500' : 'bg-amber-500'} text-white rounded-full w-5 h-5 text-[9px] flex items-center justify-center" title="${isSuite ? 'ยกเลิกสูท' : 'กำหนดเป็นสูท'}"><i class="fa-solid ${isSuite ? 'fa-compress' : 'fa-expand'}"></i></button>
                        <button onclick="_layoutMoveToOtherRow('${suffix}', '${rowName}', ${idx}, '${building}', '${sampleFloor}')" class="bg-blue-500 text-white rounded-full w-5 h-5 text-[9px] flex items-center justify-center" title="ย้ายแถว"><i class="fa-solid fa-arrows-up-down"></i></button>
                        <button onclick="_layoutRemoveItem('${rowName}', ${idx}, '${building}', '${sampleFloor}')" class="bg-red-500 text-white rounded-full w-5 h-5 text-[10px] flex items-center justify-center" title="นำออก"><i class="fa-solid fa-xmark"></i></button>
                    </div>
                </div>`;
            };

            const renderRow = (items, rowName, label, icon) => {
                return `<div class="mb-4">
                    <div class="text-sm font-bold text-gray-600 mb-2 flex items-center"><i class="fa-solid ${icon} mr-2 text-purple-500"></i>${label}</div>
                    <div class="grid grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-2 p-3 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300 min-h-[80px]"
                        ondragover="event.preventDefault(); this.classList.add('border-purple-400','bg-purple-50')" 
                        ondragleave="this.classList.remove('border-purple-400','bg-purple-50')" 
                        ondrop="_layoutHandleDrop(event, '${rowName}', '${building}', '${sampleFloor}')">
                        ${items.map((s, i) => renderCell(s, rowName, i)).join('')}
                        ${items.length === 0 ? '<div class="col-span-full text-center text-gray-400 text-sm py-4">ลากห้องมาวางที่นี่</div>' : ''}
                    </div>
                </div>`;
            };

            let html = `
                <div class="max-w-6xl mx-auto p-6 fade-in-up">
                    <button onclick="renderBuildingFloors('${building}')" class="mb-4 text-gray-500 hover:text-purple-600 flex items-center text-sm font-bold"><i class="fa-solid fa-arrow-left mr-2"></i> กลับไปรายการชั้น ตึก ${building}</button>
                    
                    <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <div class="flex justify-between items-center mb-4 flex-wrap gap-4">
                            <div>
                                <h2 class="text-xl font-bold text-gray-800 flex items-center"><i class="fa-solid fa-grip mr-2 text-purple-600"></i> ตึก ${building} ชั้น ${sampleFloor} — จัดเรียงห้อง</h2>
                                <p class="text-xs text-gray-500 mt-1">${roomSuffixes.length} ห้องในชั้นนี้ — ตั้งค่าเฉพาะชั้นนี้</p>
                            </div>
                            <div class="flex gap-2">
                                <button onclick="_layoutAddSpecial('stairs', '${building}', '${sampleFloor}')" class="bg-gray-100 text-gray-700 px-3 py-2 rounded-lg hover:bg-gray-200 transition text-sm flex items-center"><i class="fa-solid fa-stairs mr-2"></i>บันได</button>
                                <button onclick="_layoutAddSpecial('elevator', '${building}', '${sampleFloor}')" class="bg-gray-100 text-gray-700 px-3 py-2 rounded-lg hover:bg-gray-200 transition text-sm flex items-center"><i class="fa-solid fa-elevator mr-2"></i>ลิฟท์</button>
                                <button onclick="_layoutAddSpecial('gap', '${building}', '${sampleFloor}')" class="bg-gray-100 text-gray-700 px-3 py-2 rounded-lg hover:bg-gray-200 transition text-sm flex items-center"><i class="fa-solid fa-grip-lines-vertical mr-2"></i>ช่องว่าง</button>
                                <button onclick="_layoutAddSpecial('store', '${building}', '${sampleFloor}')" class="bg-orange-100 text-orange-700 px-3 py-2 rounded-lg hover:bg-orange-200 transition text-sm flex items-center"><i class="fa-solid fa-store mr-2"></i>ร้านค้า</button>
                                <button onclick="_layoutAddSpecial('lounge', '${building}', '${sampleFloor}')" class="bg-teal-100 text-teal-700 px-3 py-2 rounded-lg hover:bg-teal-200 transition text-sm flex items-center"><i class="fa-solid fa-couch mr-2"></i>ห้องรับรอง</button>
                                <button onclick="_layoutAddSpecial('custom', '${building}', '${sampleFloor}')" class="bg-blue-100 text-blue-700 px-3 py-2 rounded-lg hover:bg-blue-200 transition text-sm flex items-center"><i class="fa-solid fa-pen mr-2"></i>กำหนดเอง</button>
                            </div>
                        </div>

                        <!-- Layout Grid -->
                        ${renderRow(st.topRow, 'topRow', 'แถวบน (ฝั่งซ้าย/บน)', 'fa-arrow-up')}
                        ${renderRow(st.bottomRow, 'bottomRow', 'แถวล่าง (ฝั่งขวา/ล่าง)', 'fa-arrow-down')}

                        <!-- Unplaced Rooms -->
                        ${unplaced.length > 0 ? `
                        <div class="mb-4">
                            <div class="text-sm font-bold text-red-500 mb-2 flex items-center"><i class="fa-solid fa-exclamation-triangle mr-2"></i>ห้องที่ยังไม่ได้จัด (${unplaced.length})</div>
                            <div class="flex flex-wrap gap-2 p-3 bg-red-50 rounded-xl border border-red-200">
                                ${unplaced.map(s => `
                                    <div class="bg-white border border-red-300 rounded-lg px-3 py-2 cursor-pointer hover:bg-purple-100 transition text-sm font-bold text-red-600" 
                                        draggable="true" 
                                        ondragstart="event.dataTransfer.setData('text/plain', JSON.stringify({suffix:'${s}',fromRow:'unplaced',fromIdx:-1}))"
                                        onclick="_layoutAddToRow('${s}', 'topRow', '${building}', '${sampleFloor}')">
                                        ${sampleFloor}${s}
                                    </div>
                                `).join('')}
                            </div>
                        </div>` : ''}

                        <!-- Legend -->
                        <div class="flex flex-wrap gap-4 text-xs text-gray-500 mt-4 border-t border-gray-100 pt-4">
                            <span><span class="inline-block w-3 h-3 bg-purple-100 border border-purple-300 rounded mr-1"></span>ห้องปกติ</span>
                            <span><span class="inline-block w-3 h-3 bg-amber-100 border border-amber-400 rounded mr-1"></span>ห้องสูท (2x)</span>
                            <span><span class="inline-block w-3 h-3 bg-gray-200 border border-gray-400 rounded mr-1"></span>บันได/ลิฟท์/ช่องว่าง</span>
                            <span><span class="inline-block w-3 h-3 bg-orange-100 border border-orange-400 rounded mr-1"></span>ร้านค้า</span>
                            <span><span class="inline-block w-3 h-3 bg-teal-100 border border-teal-400 rounded mr-1"></span>ห้องรับรอง</span>
                            <span><span class="inline-block w-3 h-3 bg-blue-100 border border-blue-400 rounded mr-1"></span>กำหนดเอง</span>
                            <span>💡 ลากห้องเพื่อจัดลำดับ | กดปุ่มบนห้องเพื่อตั้งค่า</span>
                        </div>

                        <!-- Action Buttons -->
                        <div class="mt-6 flex justify-between items-center pt-4 border-t border-gray-100">
                            <div>
                                ${(STATE.layouts[building] && STATE.layouts[building][sampleFloor]) ? `<button onclick="deleteFloorLayout('${building}', '${sampleFloor}')" class="text-red-500 hover:text-red-700 text-sm flex items-center"><i class="fa-solid fa-trash-can mr-2"></i>ลบ Layout ชั้นนี้</button>` : ''}
                            </div>
                            <button onclick="saveLayoutConfig('${building}', '${sampleFloor}')" class="bg-purple-600 text-white px-6 py-2.5 rounded-xl hover:bg-purple-700 transition shadow-lg flex items-center font-bold"><i class="fa-solid fa-save mr-2"></i> บันทึก Layout ชั้น ${sampleFloor}</button>
                        </div>
                    </div>
                </div>`;
            document.getElementById('mainContent').innerHTML = html;
        }

        // Layout Editor Helper Functions
        function _layoutHandleDrop(event, targetRow, building, floor) {
            event.preventDefault();
            event.currentTarget.classList.remove('border-purple-400', 'bg-purple-50');
            try {
                const data = JSON.parse(event.dataTransfer.getData('text/plain'));
                const st = _layoutDesignerState;
                if (data.fromRow === 'topRow') st.topRow.splice(data.fromIdx, 1);
                else if (data.fromRow === 'bottomRow') st.bottomRow.splice(data.fromIdx, 1);
                st[targetRow].push(data.suffix);
                _refreshLayoutDesigner(building, floor);
            } catch (e) { console.error(e); }
        }

        function _layoutMoveToOtherRow(suffix, currentRow, idx, building, floor) {
            const st = _layoutDesignerState;
            st[currentRow].splice(idx, 1);
            const otherRow = currentRow === 'topRow' ? 'bottomRow' : 'topRow';
            st[otherRow].push(suffix);
            _refreshLayoutDesigner(building, floor);
        }

        function _layoutRemoveItem(rowName, idx, building, floor) {
            const st = _layoutDesignerState;
            const removed = st[rowName].splice(idx, 1)[0];
            if (removed && removed.startsWith('_')) {
                st.specials = st.specials.filter(s => s.id !== removed);
            }
            st.suites = st.suites.filter(s => s !== removed);
            _refreshLayoutDesigner(building, floor);
        }

        function _layoutToggleSuite(suffix, building, floor) {
            const st = _layoutDesignerState;
            if (st.suites.includes(suffix)) {
                st.suites = st.suites.filter(s => s !== suffix);
            } else {
                st.suites.push(suffix);
            }
            _refreshLayoutDesigner(building, floor);
        }

        function _layoutAddSpecial(type, building, floor) {
            const st = _layoutDesignerState;
            const icons = { stairs: 'fa-stairs', elevator: 'fa-elevator', gap: 'fa-grip-lines-vertical', store: 'fa-store', lounge: 'fa-couch', custom: 'fa-pen' };
            const labels = { stairs: 'บันได', elevator: 'ลิฟท์', gap: 'ช่องว่าง', store: 'ร้านค้า', lounge: 'ห้องรับรอง', custom: 'กำหนดเอง' };
            let label = labels[type] || type;
            let icon = icons[type] || 'fa-question';
            if (type === 'custom') {
                _showCustomLabelModal(building, floor);
                return;
            }
            const id = `_${type}_${Date.now()}`;
            st.specials.push({ id, type, label, icon });
            st.bottomRow.push(id);
            _refreshLayoutDesigner(building, floor);
        }

        function _showCustomLabelModal(building, floor) {
            const existing = document.getElementById('customLabelModal');
            if (existing) existing.remove();
            const html = `
                <div id="customLabelModal" class="fixed inset-0 bg-gray-900/60 z-[60] flex items-center justify-center p-4 backdrop-blur-sm" onclick="if(event.target===this) _closeCustomLabelModal()">
                    <div class="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden fade-in-up">
                        <div class="bg-gradient-to-r from-blue-600 to-indigo-600 p-5 text-white">
                            <div class="flex items-center justify-between">
                                <div class="flex items-center">
                                    <div class="bg-white/20 p-2.5 rounded-xl mr-3">
                                        <i class="fa-solid fa-pen text-lg"></i>
                                    </div>
                                    <div>
                                        <h3 class="font-bold text-lg">ช่องกำหนดเอง</h3>
                                        <p class="text-blue-100 text-xs">ระบุชื่อที่ต้องการแสดงบนผัง</p>
                                    </div>
                                </div>
                                <button onclick="_closeCustomLabelModal()" class="text-white/70 hover:text-white transition rounded-full w-8 h-8 flex items-center justify-center hover:bg-white/10"><i class="fa-solid fa-times"></i></button>
                            </div>
                        </div>
                        <div class="p-6">
                            <label class="block text-sm font-bold text-gray-700 mb-2">ชื่อช่อง</label>
                            <input type="text" id="customLabelInput" class="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-base focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none transition placeholder-gray-400 font-medium" placeholder="เช่น ห้องพักผ่อน, ห้องน้ำ, ห้องเก็บของ" autofocus>
                            <div class="flex gap-3 mt-5">
                                <button onclick="_closeCustomLabelModal()" class="flex-1 px-4 py-2.5 bg-gray-100 text-gray-600 rounded-xl hover:bg-gray-200 transition font-medium text-sm">ยกเลิก</button>
                                <button onclick="_confirmCustomLabel('${building}', '${floor}')" class="flex-1 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition font-bold text-sm shadow-lg shadow-blue-200 flex items-center justify-center"><i class="fa-solid fa-check mr-2"></i>เพิ่มช่อง</button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            document.body.insertAdjacentHTML('beforeend', html);
            setTimeout(() => document.getElementById('customLabelInput').focus(), 100);
            document.getElementById('customLabelInput').addEventListener('keydown', (e) => {
                if (e.key === 'Enter') _confirmCustomLabel(building, floor);
                if (e.key === 'Escape') _closeCustomLabelModal();
            });
        }

        function _closeCustomLabelModal() {
            const el = document.getElementById('customLabelModal');
            if (el) el.remove();
        }

        function _confirmCustomLabel(building, floor) {
            const input = document.getElementById('customLabelInput');
            const label = input ? input.value.trim() : '';
            if (!label) {
                input.classList.add('border-red-400', 'ring-4', 'ring-red-100');
                input.focus();
                setTimeout(() => input.classList.remove('border-red-400', 'ring-4', 'ring-red-100'), 1500);
                return;
            }
            _closeCustomLabelModal();
            const st = _layoutDesignerState;
            const id = `_custom_${Date.now()}`;
            st.specials.push({ id, type: 'custom', label, icon: 'fa-pen' });
            st.bottomRow.push(id);
            _refreshLayoutDesigner(building, floor);
        }

        function _layoutAddToRow(suffix, rowName, building, floor) {
            _layoutDesignerState[rowName].push(suffix);
            _refreshLayoutDesigner(building, floor);
        }

        function _refreshLayoutDesigner(building, floor) {
            const floorRooms = STATE.data.filter(r => {
                const info = parseRoomInfo(r.roomNo);
                return info.building === building && info.floor == floor;
            });
            floorRooms.sort((a, b) => parseInt(parseRoomInfo(a.roomNo).roomIndex) - parseInt(parseRoomInfo(b.roomNo).roomIndex));
            const roomSuffixes = floorRooms.map(r => {
                const info = parseRoomInfo(r.roomNo);
                return { suffix: String(info.roomIndex).padStart(2, '0'), roomNo: r.roomNo, status: r.status };
            });
            _renderLayoutDesignerUI(building, floor, roomSuffixes);
        }

        function saveLayoutConfig(building, floor) {
            const floorKey = String(floor);
            const floorLayout = JSON.parse(JSON.stringify(_layoutDesignerState));
            if (!STATE.layouts[building]) STATE.layouts[building] = {};
            STATE.layouts[building][floorKey] = floorLayout;
            const fullBuildingLayout = JSON.parse(JSON.stringify(STATE.layouts[building]));
            showLoading(true);
            callApi('saveLayout', { project: STATE.currentProject, building, layout: fullBuildingLayout }).then(res => {
                showLoading(false);
                if (res.success) {
                    showToast('Success', `บันทึก Layout ตึก ${building} ชั้น ${floor} เรียบร้อย`, 'success');
                    renderBuildingFloors(building);
                } else {
                    showToast('Error', res.message, 'error');
                }
            });
        }

        function deleteFloorLayout(building, floor) {
            const floorKey = String(floor);
            if (!confirm(`ยืนยันการลบ Layout ตึก ${building} ชั้น ${floor}?`)) return;
            if (STATE.layouts[building]) {
                delete STATE.layouts[building][floorKey];
                if (Object.keys(STATE.layouts[building]).length === 0) {
                    delete STATE.layouts[building];
                    showLoading(true);
                    callApi('deleteLayout', { project: STATE.currentProject, building }).then(res => {
                        showLoading(false);
                        if (res.success) showToast('Success', 'ลบ Layout เรียบร้อย', 'success');
                        renderBuildingFloors(building);
                    });
                } else {
                    showLoading(true);
                    callApi('saveLayout', { project: STATE.currentProject, building, layout: JSON.parse(JSON.stringify(STATE.layouts[building])) }).then(res => {
                        showLoading(false);
                        if (res.success) showToast('Success', `ลบ Layout ชั้น ${floor} เรียบร้อย`, 'success');
                        renderBuildingFloors(building);
                    });
                }
            }
        }

        function deleteAllBuildingLayouts(building) {
            if (!confirm(`ยืนยันการลบ Layout ทั้งหมดของตึก ${building}?`)) return;
            showLoading(true);
            callApi('deleteLayout', { project: STATE.currentProject, building }).then(res => {
                showLoading(false);
                if (res.success) {
                    delete STATE.layouts[building];
                    showToast('Success', `ลบ Layout ตึก ${building} ทั้งหมดเรียบร้อย`, 'success');
                    renderBuildingFloors(building);
                }
            });
        }

        // Apply Layout Template when rendering room list floors
        function applyLayoutTemplate(template, floorRooms, floorNum) {
            const roomMap = {};
            floorRooms.forEach(r => {
                const suffix = String(parseRoomInfo(r.roomNo).roomIndex).padStart(2, '0');
                roomMap[suffix] = r;
            });

            const processRow = (rowItems) => {
                const result = [];
                rowItems.forEach(suffix => {
                    if (suffix.startsWith('_')) {
                        // Special item
                        const special = template.specials.find(s => s.id === suffix);
                        result.push({
                            _isSpecial: true,
                            _specialType: special ? special.type : '',
                            _specialLabel: special ? special.label : '?',
                            _specialIcon: special ? special.icon : 'fa-question',
                            _isSuite: false
                        });
                    } else if (roomMap[suffix]) {
                        const room = { ...roomMap[suffix] };
                        room._isSuite = template.suites.includes(suffix);
                        room._isSpecial = false;
                        result.push(room);
                    }
                });
                return result;
            };

            return {
                topRow: processRow(template.topRow),
                bottomRow: processRow(template.bottomRow)
            };
        }

        // --- Room Statuses Settings ---
        function renderSettingsRoomStatuses() {
            STATE.currentView = 'settings_room_statuses';
            let statuses = STATE.projectRoomStatuses || [];
            
            // If empty, we can show some defaults that can be overridden
            const hasCustoms = statuses.length > 0;
            
            let html = `
                <div class="max-w-5xl mx-auto p-6 fade-in-up">
                    <button onclick="renderSettings()" class="mb-6 text-gray-500 hover:text-emerald-600 flex items-center text-sm font-semibold transition-colors"><i class="fa-solid fa-arrow-left mr-2"></i> กลับไปหน้าตั้งค่ารวม</button>
                    
                    <div class="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                        <h2 class="text-3xl font-bold text-[#1D1D1F] tracking-tight flex items-center">
                            <div class="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center mr-3 shadow-sm border border-emerald-100/50">
                                <i class="fa-solid fa-palette text-emerald-500 text-lg"></i>
                            </div>
                            จัดการสถานะห้องพัก
                        </h2>
                        <button onclick="openRoomStatusModal()" class="px-5 py-2.5 bg-emerald-600 text-white font-semibold rounded-xl shadow-[0_4px_12px_rgba(16,185,129,0.3)] hover:bg-emerald-700 hover:shadow-[0_6px_16px_rgba(16,185,129,0.4)] transition-all active:scale-[0.98] text-sm flex items-center">
                            <i class="fa-solid fa-plus mr-2"></i> เพิ่มสถานะใหม่
                        </button>
                    </div>

                    ${!hasCustoms ? `
                    <div class="bg-blue-50 text-blue-700 p-4 rounded-xl mb-6 flex items-start text-sm">
                        <i class="fa-solid fa-info-circle mt-0.5 mr-3 text-blue-500"></i>
                        <div>
                            <strong>ยังไม่มีการตั้งค่าสถานะที่กำหนดเองสำหรับโครงการนี้</strong><br>
                            ระบบจะใช้สถานะพื้นฐาน (ว่าง, ไม่ว่าง, จอง, ซ่อม ฯลฯ) หากคุณเพิ่มสถานะใหม่ สถานะเหล่านั้นจะไปแทนที่รายการในดรอปดาวน์ โปรดเพิ่มสถานะพื้นฐานกลับเข้าไปด้วยหากต้องการใช้งานต่อ
                        </div>
                    </div>` : ''}

                    <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
                        ${statuses.map(s => {
                            let colorStyle = '';
                            let tailwindClass = 'bg-gray-100 text-gray-700';
                            
                            if (s.colorType === 'hex') {
                                colorStyle = `background-color: ${s.color}; color: white;`;
                                tailwindClass = '';
                            } else {
                                tailwindClass = `bg-${s.color}-500 text-white`;
                            }

                            return `
                                <div class="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex flex-col justify-between hover:shadow-md transition">
                                    <div class="flex items-center justify-between mb-4">
                                        <div class="flex items-center gap-3">
                                            <div class="w-10 h-10 rounded-full flex items-center justify-center shadow-sm ${tailwindClass}" style="${colorStyle}">
                                                <i class="fa-solid fa-tag"></i>
                                            </div>
                                            <h3 class="font-bold text-gray-800 text-lg">${s.name}</h3>
                                        </div>
                                    </div>
                                    <div class="text-xs text-gray-500 mb-4 bg-gray-50 px-2 py-1 rounded inline-block w-max">
                                        ${s.colorType === 'hex' ? `Custom HEX: ${s.color}` : `Tailwind: ${s.color}`}
                                    </div>
                                    <div class="flex justify-end gap-2 border-t border-gray-50 pt-3">
                                        <button onclick="openRoomStatusModal('${s.name}')" class="px-3 py-1.5 bg-blue-50 text-blue-600 rounded hover:bg-blue-100 transition text-xs font-semibold">แก้ไข</button>
                                        <button onclick="deleteRoomStatus('${s.name}')" class="px-3 py-1.5 bg-red-50 text-red-600 rounded hover:bg-red-100 transition text-xs font-semibold">ลบ</button>
                                    </div>
                                </div>
                            `;
                        }).join('')}
                    </div>
                </div>
            `;
            document.getElementById('mainContent').innerHTML = html;
        }

        function openRoomStatusModal(statusName = null) {
            let isEdit = !!statusName;
            let name = '', colorType = 'predefined', color = 'emerald';
            
            if (isEdit) {
                const s = STATE.projectRoomStatuses.find(x => x.name === statusName);
                if (s) {
                    name = s.name;
                    colorType = s.colorType || 'predefined';
                    color = s.color;
                }
            }

            const colorOptions = ['red', 'orange', 'yellow', 'emerald', 'cyan', 'blue', 'indigo', 'purple', 'pink', 'gray'];

            const modalHtml = `
                <div id="roomStatusModal" class="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
                    <div class="bg-white rounded-2xl shadow-2xl w-[450px] max-w-[90vw] overflow-hidden transform transition-all animate-slide-up">
                        <div class="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                            <h3 class="text-xl font-bold text-gray-800 flex items-center">
                                ${isEdit ? '<i class="fa-solid fa-pen-to-square text-emerald-500 mr-3"></i> แก้ไขสถานะ' : '<i class="fa-solid fa-plus text-emerald-500 mr-3"></i> เพิ่มสถานะใหม่'}
                            </h3>
                            <button onclick="closeRoomStatusModal()" class="text-gray-400 hover:text-gray-600 hover:bg-gray-100 w-8 h-8 rounded-full flex items-center justify-center transition-colors">
                                <i class="fa-solid fa-xmark text-lg"></i>
                            </button>
                        </div>
                        
                        <div class="p-6 space-y-4">
                            <input type="hidden" id="rsOriginalName" value="${name}">
                            
                            <div>
                                <label class="block text-sm font-bold text-gray-700 mb-1.5">ชื่อสถานะ <span class="text-red-500">*</span></label>
                                <input type="text" id="rsName" value="${name}" class="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all font-medium text-gray-800" placeholder="เช่น VIP, ซ่อมด่วน">
                            </div>

                            <div>
                                <label class="block text-sm font-bold text-gray-700 mb-1.5">รูปแบบสี</label>
                                <div class="flex gap-4">
                                    <label class="flex items-center gap-2 cursor-pointer">
                                        <input type="radio" name="rsColorType" value="predefined" ${colorType === 'predefined' ? 'checked' : ''} onchange="toggleColorType('predefined')" class="text-emerald-600 focus:ring-emerald-500">
                                        <span class="text-sm">สีมาตรฐาน</span>
                                    </label>
                                    <label class="flex items-center gap-2 cursor-pointer">
                                        <input type="radio" name="rsColorType" value="hex" ${colorType === 'hex' ? 'checked' : ''} onchange="toggleColorType('hex')" class="text-emerald-600 focus:ring-emerald-500">
                                        <span class="text-sm">ระบุ Hex Code เอง</span>
                                    </label>
                                </div>
                            </div>

                            <div id="rsPredefinedWrapper" class="${colorType === 'predefined' ? '' : 'hidden'}">
                                <label class="block text-sm font-bold text-gray-700 mb-2">เลือกสี</label>
                                <div class="flex flex-wrap gap-2">
                                    ${colorOptions.map(c => `
                                        <label class="cursor-pointer relative">
                                            <input type="radio" name="rsColorPredefined" value="${c}" class="peer sr-only" ${(colorType==='predefined' && color===c) ? 'checked' : ''}>
                                            <div class="w-8 h-8 rounded-full bg-${c}-500 peer-checked:ring-4 peer-checked:ring-gray-300 peer-checked:ring-offset-2 transition-all shadow-sm"></div>
                                        </label>
                                `).join('')}
                                </div>
                            </div>

                            <div id="rsHexWrapper" class="${colorType === 'hex' ? '' : 'hidden'}">
                                <label class="block text-sm font-bold text-gray-700 mb-1.5">HTML Hex Code</label>
                                <div class="flex items-center gap-3">
                                    <input type="color" id="rsColorPicker" value="${colorType === 'hex' ? color : '#10b981'}" class="w-12 h-12 rounded cursor-pointer border-0 p-0" oninput="document.getElementById('rsColorHex').value = this.value">
                                    <input type="text" id="rsColorHex" value="${colorType === 'hex' ? color : '#10b981'}" class="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500 outline-none" oninput="if(this.value.match(/^#[0-9a-fA-F]{6}$/)) document.getElementById('rsColorPicker').value = this.value" placeholder="#RRGGBB">
                                </div>
                            </div>
                        </div>
                        
                        <div class="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
                            <button onclick="closeRoomStatusModal()" class="px-5 py-2.5 text-sm font-bold text-gray-600 hover:bg-gray-200 rounded-xl transition-colors">ยกเลิก</button>
                            <button onclick="saveRoomStatusSettings()" class="px-6 py-2.5 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-[0_4px_12px_rgba(16,185,129,0.2)] transition-all flex items-center active:scale-[0.98]">
                                <i class="fa-solid fa-save mr-2"></i> บันทึก
                            </button>
                        </div>
                    </div>
                </div>
            `;
            document.body.insertAdjacentHTML('beforeend', modalHtml);
            // Default check for predefined if adding new
            if (!isEdit) {
                const firstColorRadio = document.querySelector('input[name="rsColorPredefined"]');
                if (firstColorRadio) firstColorRadio.checked = true;
            }
        }

        function toggleColorType(type) {
            document.getElementById('rsPredefinedWrapper').classList[type === 'predefined' ? 'remove' : 'add']('hidden');
            document.getElementById('rsHexWrapper').classList[type === 'hex' ? 'remove' : 'add']('hidden');
        }

        function closeRoomStatusModal() {
            const modal = document.getElementById('roomStatusModal');
            if (modal) modal.remove();
        }

        function saveRoomStatusSettings() {
            const originalName = document.getElementById('rsOriginalName').value;
            const name = document.getElementById('rsName').value.trim();
            const colorType = document.querySelector('input[name="rsColorType"]:checked').value;
            let color = '';

            if (colorType === 'predefined') {
                const checkedColor = document.querySelector('input[name="rsColorPredefined"]:checked');
                if (checkedColor) color = checkedColor.value;
                else color = 'gray';
            } else {
                color = document.getElementById('rsColorHex').value.trim();
                // Validate Hex
                if (!/^#[0-9A-Fa-f]{6}$/.test(color)) {
                    showToast('Invalid Hex', 'กรุณาระบุ Hex code ให้ถูกต้อง (เช่น #FF0000)', 'error');
                    return;
                }
            }

            if (!name) {
                showToast('ข้อมูลไม่ครบ', 'กรุณาระบุชื่อสถานะ', 'error');
                return;
            }

            // Check duplicates in THIS project
            const project = STATE.currentProject;
            if (name !== originalName && STATE.projectRoomStatuses.some(s => s.name === name)) {
                showToast('ข้อมูลซ้ำ', 'สถานะนี้มีอยู่แล้ว', 'error');
                return;
            }

            const newStatus = { project, name, colorType, color };
            let updated = [...STATE.allRoomStatuses];

            if (originalName) {
                const index = updated.findIndex(s => s.project === project && s.name === originalName);
                if (index !== -1) updated[index] = newStatus;
            } else {
                updated.push(newStatus);
            }

            showLoading(true);
            callApi('saveRoomStatuses', { statuses: updated }).then(res => {
                showLoading(false);
                if (res.success) {
                    STATE.allRoomStatuses = updated;
                    STATE.projectRoomStatuses = updated.filter(s => s.project === project);
                    closeRoomStatusModal();
                    renderSettingsRoomStatuses();
                    showToast('สำเร็จ', 'บันทึกสถานะเรียบร้อย', 'success');
                } else {
                    showToast('Error', res.message || 'ไม่สามารถบันทึกสถานะได้', 'error');
                }
            });
        }

        function deleteRoomStatus(name) {
            if (!confirm(`ยืนยันการลบสถานะ "${name}" ใช่หรือไม่?`)) return;
            
            const project = STATE.currentProject;
            const updated = STATE.allRoomStatuses.filter(s => !(s.project === project && s.name === name));
            
            showLoading(true);
            callApi('saveRoomStatuses', { statuses: updated }).then(res => {
                showLoading(false);
                if (res.success) {
                    STATE.allRoomStatuses = updated;
                    STATE.projectRoomStatuses = updated.filter(s => s.project === project);
                    renderSettingsRoomStatuses();
                    showToast('ลบสำเร็จ', 'ลบสถานะเรียบร้อย', 'success');
                }
            });
        }

        // =====================================================
        // --- Summary Cards Settings (การ์ดสรุปยอดรวม) ---
        // =====================================================

        function renderSettingsSummaryCards(targetProject = null) {
            STATE.currentView = 'settings_summary_cards';
            const project = targetProject || (document.getElementById('sc_project_select') && document.getElementById('sc_project_select').value) || STATE.currentProject;

            if (!project) return showToast('Error', 'กรุณาเลือกโครงการก่อน');

            // Available projects for dropdown
            const projects = (STATE.user && STATE.user.projects && STATE.user.projects.length > 0) ? STATE.user.projects : (typeof PROJECTS !== 'undefined' ? PROJECTS : [project]);

            // Filter summary cards for this project
            const cards = (STATE.summaryCards || []).filter(c => c.project === project);

            let html = `
                <div class="max-w-5xl mx-auto p-6 fade-in-up">
                    <button onclick="renderSettings()" class="mb-6 text-gray-500 hover:text-teal-600 flex items-center text-sm font-semibold transition-colors"><i class="fa-solid fa-arrow-left mr-2"></i> กลับไปหน้าตั้งค่ารวม</button>
                    
                    <div class="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                        <div>
                            <h2 class="text-3xl font-bold text-[#1D1D1F] tracking-tight flex items-center">
                                <div class="w-10 h-10 rounded-xl bg-teal-50 flex items-center justify-center mr-3 shadow-sm border border-teal-100/50">
                                    <i class="fa-solid fa-calculator text-teal-600 text-lg"></i>
                                </div>
                                การ์ดสรุปยอดรวม (Summary Cards)
                            </h2>
                            <p class="text-sm text-gray-500 mt-1 ml-13">รวมหลายสถานะห้องเข้าด้วยกัน เช่น การ์ด "ห้องว่างรวม" (ว่าง + ตัดหนี + ออกคืน + ปรับปรุง + ส่งซ่อม)</p>
                        </div>

                        <div class="flex items-center gap-3 w-full md:w-auto">
                            <!-- Project Select -->
                            <div class="flex items-center bg-white border border-gray-200 rounded-xl px-3 py-1.5 shadow-sm">
                                <span class="text-xs font-bold text-gray-400 mr-2 uppercase">โครงการ:</span>
                                <select id="sc_project_select" onchange="renderSettingsSummaryCards(this.value)" class="text-sm font-bold text-gray-700 bg-transparent border-0 outline-none cursor-pointer">
                                    ${projects.map(p => `<option value="${p}" ${p === project ? 'selected' : ''}>${p}</option>`).join('')}
                                </select>
                            </div>

                            <button onclick="openSummaryCardModal()" class="px-5 py-2.5 bg-teal-600 text-white font-semibold rounded-xl shadow-[0_4px_12px_rgba(13,148,136,0.3)] hover:bg-teal-700 hover:shadow-[0_6px_16px_rgba(13,148,136,0.4)] transition-all active:scale-[0.98] text-sm flex items-center shrink-0">
                                <i class="fa-solid fa-plus mr-2"></i> เพิ่มการ์ดสรุปยอด
                            </button>
                        </div>
                    </div>

                    ${cards.length === 0 ? `
                        <div class="bg-white rounded-2xl p-12 text-center border border-gray-100 shadow-sm">
                            <div class="w-16 h-16 rounded-2xl bg-teal-50 text-teal-500 mx-auto flex items-center justify-center text-2xl mb-4">
                                <i class="fa-solid fa-calculator"></i>
                            </div>
                            <h3 class="text-lg font-bold text-gray-800 mb-2">ยังไม่มีการ์ดสรุปยอดในโครงการ ${project}</h3>
                            <p class="text-sm text-gray-500 max-w-md mx-auto mb-6">สร้างการ์ดที่รวมหลายสถานะเข้าด้วยกัน เช่น "ห้องว่างรวม" เพื่อดูยอดรวมของห้องว่าง ตัดหนี ออกคืน ปรับปรุง และส่งซ่อม ในจุดเดียว</p>
                            <button onclick="openSummaryCardModal()" class="px-5 py-2.5 bg-teal-600 text-white font-semibold rounded-xl shadow hover:bg-teal-700 transition text-sm inline-flex items-center">
                                <i class="fa-solid fa-plus mr-2"></i> สร้างการ์ดใบแรก
                            </button>
                        </div>
                    ` : `
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
                            ${cards.map(c => {
                                const isHex = c.colorType === 'hex';
                                const colorStyle = isHex ? `background-color: ${c.color}; color: white;` : '';
                                const bgClass = isHex ? '' : `bg-${c.color}-500 text-white`;
                                const isEnabled = c.enabled !== false;

                                return `
                                    <div class="bg-white rounded-2xl p-6 shadow-sm border ${isEnabled ? 'border-gray-100' : 'border-dashed border-gray-300 opacity-75'} hover:shadow-md transition-all flex flex-col justify-between">
                                        <div>
                                            <div class="flex items-start justify-between mb-4">
                                                <div class="flex items-center gap-3">
                                                    <div class="w-12 h-12 rounded-xl flex items-center justify-center shadow-sm ${bgClass}" style="${colorStyle}">
                                                        <i class="fa-solid ${c.icon || 'fa-layer-group'} text-xl"></i>
                                                    </div>
                                                    <div>
                                                        <div class="flex items-center gap-2">
                                                            <h3 class="font-bold text-gray-800 text-lg">${c.title}</h3>
                                                            <span class="text-[10px] font-bold px-2 py-0.5 rounded-full ${isEnabled ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-gray-100 text-gray-500'}">${isEnabled ? 'แสดงบน Dashboard' : 'ซ่อนอยู่'}</span>
                                                        </div>
                                                        <span class="text-xs text-gray-400">รวมทั้งหมด ${c.statuses.length} สถานะ</span>
                                                    </div>
                                                </div>

                                                <!-- Enable/Disable Switch -->
                                                <label class="relative inline-flex items-center cursor-pointer select-none">
                                                    <input type="checkbox" ${isEnabled ? 'checked' : ''} onchange="toggleSummaryCardEnabled('${c.id}')" class="sr-only peer">
                                                    <div class="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-teal-600"></div>
                                                </label>
                                            </div>

                                            <!-- Status Badges -->
                                            <div class="mb-4">
                                                <div class="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">สถานะที่นำมารวม:</div>
                                                <div class="flex flex-wrap gap-1.5">
                                                    ${c.statuses.map(st => `
                                                        <span class="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold bg-gray-100 text-gray-700 border border-gray-200/60">
                                                            <i class="fa-solid fa-check text-[10px] text-teal-600 mr-1.5"></i> ${st}
                                                        </span>
                                                    `).join('')}
                                                </div>
                                            </div>
                                        </div>

                                        <div class="flex justify-end gap-2 border-t border-gray-50 pt-4 mt-2">
                                            <button onclick="openSummaryCardModal('${c.id}')" class="px-3.5 py-1.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition text-xs font-semibold flex items-center">
                                                <i class="fa-solid fa-pen mr-1.5"></i> แก้ไข
                                            </button>
                                            <button onclick="deleteSummaryCardConfig('${c.id}')" class="px-3.5 py-1.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition text-xs font-semibold flex items-center">
                                                <i class="fa-solid fa-trash mr-1.5"></i> ลบ
                                            </button>
                                        </div>
                                    </div>
                                `;
                            }).join('')}
                        </div>
                    `}
                </div>
            `;
            document.getElementById('mainContent').innerHTML = html;
        }

        function openSummaryCardModal(cardId = null) {
            const project = (document.getElementById('sc_project_select') && document.getElementById('sc_project_select').value) || STATE.currentProject;
            const existing = cardId ? (STATE.summaryCards || []).find(c => c.id === cardId) : null;
            const isEdit = !!existing;

            const title = existing ? existing.title : '';
            const colorType = existing ? (existing.colorType || 'predefined') : 'predefined';
            const color = existing ? existing.color : 'teal';
            const icon = existing ? (existing.icon || 'fa-layer-group') : 'fa-layer-group';
            const selectedStatuses = existing ? (existing.statuses || []) : ['ห้องว่าง', 'ห้องตัดหนี', 'ห้องออกคืนประกัน', 'ปรับปรุง', 'ส่งห้องซ่อม'];
            const enabled = existing ? (existing.enabled !== false) : true;

            // Get all unique room statuses available for this project
            const statusNamesSet = new Set();
            if (STATE.projectRoomStatuses && STATE.projectRoomStatuses.length > 0) {
                STATE.projectRoomStatuses.forEach(s => statusNamesSet.add(s.name));
            } else {
                ['ห้องว่าง', 'ไม่ว่าง', 'ห้องจอง', 'ห้องตัดหนี', 'ห้องออกคืนประกัน', 'ปรับปรุง'].forEach(s => statusNamesSet.add(s));
            }
            if (STATE.data && STATE.data.length > 0) {
                STATE.data.forEach(r => { if (r.status) statusNamesSet.add(r.status); });
            }
            const allAvailableStatuses = Array.from(statusNamesSet).filter(Boolean);

            const colorOptions = ['teal', 'emerald', 'blue', 'indigo', 'purple', 'rose', 'amber', 'orange', 'cyan', 'gray'];
            const iconOptions = ['fa-layer-group', 'fa-door-open', 'fa-calculator', 'fa-boxes-stacked', 'fa-warehouse', 'fa-chart-pie', 'fa-wrench', 'fa-bell', 'fa-bolt', 'fa-circle-check'];

            const modalHtml = `
                <div id="summaryCardModal" class="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in p-4">
                    <div class="bg-white rounded-2xl shadow-2xl w-[520px] max-w-full max-h-[92vh] flex flex-col overflow-hidden transform transition-all animate-slide-up">
                        <div class="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50 shrink-0">
                            <h3 class="text-xl font-bold text-gray-800 flex items-center">
                                ${isEdit ? '<i class="fa-solid fa-pen-to-square text-teal-600 mr-2.5"></i> แก้ไขการ์ดสรุปยอด' : '<i class="fa-solid fa-plus text-teal-600 mr-2.5"></i> เพิ่มการ์ดสรุปยอด'}
                            </h3>
                            <button onclick="closeSummaryCardModal()" class="text-gray-400 hover:text-gray-600 hover:bg-gray-100 w-8 h-8 rounded-full flex items-center justify-center transition-colors">
                                <i class="fa-solid fa-xmark text-lg"></i>
                            </button>
                        </div>

                        <div class="p-6 space-y-5 overflow-y-auto custom-scrollbar flex-1">
                            <input type="hidden" id="scCardId" value="${existing ? existing.id : ''}">
                            <input type="hidden" id="scProject" value="${project}">

                            <!-- Title -->
                            <div>
                                <label class="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">ชื่อการ์ดสรุปยอด <span class="text-red-500">*</span></label>
                                <input type="text" id="scTitle" value="${title}" placeholder="เช่น ห้องว่างรวม, ห้องรอซ่อมแซม" 
                                       class="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none text-sm font-semibold transition" />
                            </div>

                            <!-- Color Picker -->
                            <div>
                                <label class="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">สีของการ์ด</label>
                                <div class="grid grid-cols-5 gap-2 mb-3">
                                    ${colorOptions.map(c => `
                                        <button type="button" onclick="_scSelectColor('predefined', '${c}')" 
                                                class="sc-color-btn h-9 rounded-xl flex items-center justify-center border-2 transition ${colorType === 'predefined' && color === c ? 'border-gray-800 scale-105 shadow-sm' : 'border-transparent hover:scale-102'} bg-${c}-500 text-white" 
                                                data-type="predefined" data-color="${c}">
                                            ${colorType === 'predefined' && color === c ? '<i class="fa-solid fa-check text-xs"></i>' : ''}
                                        </button>
                                    `).join('')}
                                </div>
                                <div class="flex items-center gap-2">
                                    <span class="text-xs text-gray-500 font-medium">หรือกำหนดสี HEX:</span>
                                    <input type="color" id="scHexColorInput" value="${colorType === 'hex' ? color : '#0d9488'}" 
                                           onchange="_scSelectColor('hex', this.value)"
                                           class="w-8 h-8 rounded-lg cursor-pointer border-0 p-0 bg-transparent" />
                                    <input type="text" id="scHexColorText" value="${colorType === 'hex' ? color : ''}" 
                                           placeholder="#0d9488" 
                                           oninput="_scSelectColor('hex', this.value)"
                                           class="w-28 px-3 py-1 text-xs border border-gray-200 rounded-lg outline-none font-mono" />
                                </div>
                                <input type="hidden" id="scColorType" value="${colorType}">
                                <input type="hidden" id="scColor" value="${color}">
                            </div>

                            <!-- Icon Picker -->
                            <div>
                                <label class="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">ไอคอน (Font Awesome)</label>
                                <div class="flex flex-wrap gap-2 mb-2">
                                    ${iconOptions.map(ic => `
                                        <button type="button" onclick="_scSelectIcon('${ic}')" 
                                                class="sc-icon-btn w-9 h-9 rounded-xl flex items-center justify-center border transition ${icon === ic ? 'bg-teal-600 text-white border-teal-600 shadow-sm' : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'}" 
                                                data-icon="${ic}">
                                            <i class="fa-solid ${ic}"></i>
                                        </button>
                                    `).join('')}
                                </div>
                                <input type="text" id="scIconInput" value="${icon}" placeholder="fa-layer-group" 
                                       oninput="_scSelectIcon(this.value)"
                                       class="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-xs font-mono outline-none" />
                            </div>

                            <!-- Statuses Checkboxes -->
                            <div>
                                <div class="flex items-center justify-between mb-2">
                                    <label class="block text-xs font-bold text-gray-700 uppercase tracking-wider">เลือกสถานะห้องที่ต้องการรวม <span class="text-red-500">*</span></label>
                                    <div class="space-x-2">
                                        <button type="button" onclick="_scToggleAllStatuses(true)" class="text-[11px] text-teal-600 hover:underline font-semibold">เลือกทั้งหมด</button>
                                        <span class="text-gray-300">|</span>
                                        <button type="button" onclick="_scToggleAllStatuses(false)" class="text-[11px] text-gray-500 hover:underline font-semibold">ล้าง</button>
                                    </div>
                                </div>
                                <div class="border border-gray-200 rounded-xl p-3 bg-gray-50/50 space-y-2 max-h-48 overflow-y-auto custom-scrollbar">
                                    ${allAvailableStatuses.map(st => {
                                        const isChecked = selectedStatuses.includes(st);
                                        return `
                                            <label class="flex items-center justify-between p-2 rounded-lg bg-white border border-gray-100 hover:bg-teal-50/40 hover:border-teal-200 cursor-pointer transition select-none">
                                                <span class="text-sm font-semibold text-gray-700">${st}</span>
                                                <input type="checkbox" value="${st}" class="sc-status-cb w-4 h-4 text-teal-600 rounded border-gray-300 focus:ring-teal-500" ${isChecked ? 'checked' : ''} />
                                            </label>
                                        `;
                                    }).join('')}
                                </div>
                            </div>

                            <!-- Enabled Option -->
                            <div class="pt-2">
                                <label class="flex items-center gap-3 cursor-pointer select-none">
                                    <input type="checkbox" id="scEnabled" ${enabled ? 'checked' : ''} class="w-4 h-4 text-teal-600 rounded border-gray-300 focus:ring-teal-500" />
                                    <span class="text-sm font-semibold text-gray-700">เปิดแสดงผลการ์ดนี้บน Dashboard</span>
                                </label>
                            </div>
                        </div>

                        <div class="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3 shrink-0">
                            <button type="button" onclick="closeSummaryCardModal()" class="px-4 py-2 bg-white text-gray-700 border border-gray-200 rounded-xl hover:bg-gray-50 text-sm font-semibold transition">ยกเลิก</button>
                            <button type="button" onclick="saveSummaryCardConfig()" class="px-5 py-2 bg-teal-600 text-white rounded-xl hover:bg-teal-700 text-sm font-semibold shadow-md transition">บันทึกการ์ด</button>
                        </div>
                    </div>
                </div>
            `;

            document.body.insertAdjacentHTML('beforeend', modalHtml);
        }

        function closeSummaryCardModal() {
            const el = document.getElementById('summaryCardModal');
            if (el) el.remove();
        }

        function _scSelectColor(type, val) {
            document.getElementById('scColorType').value = type;
            document.getElementById('scColor').value = val;
            if (type === 'hex') {
                document.getElementById('scHexColorText').value = val;
                document.getElementById('scHexColorInput').value = val.startsWith('#') ? val : ('#' + val);
                document.querySelectorAll('.sc-color-btn').forEach(btn => {
                    btn.classList.remove('border-gray-800', 'scale-105');
                    btn.innerHTML = '';
                });
            } else {
                document.querySelectorAll('.sc-color-btn').forEach(btn => {
                    if (btn.dataset.color === val) {
                        btn.classList.add('border-gray-800', 'scale-105');
                        btn.innerHTML = '<i class="fa-solid fa-check text-xs"></i>';
                    } else {
                        btn.classList.remove('border-gray-800', 'scale-105');
                        btn.innerHTML = '';
                    }
                });
            }
        }

        function _scSelectIcon(iconClass) {
            document.getElementById('scIconInput').value = iconClass;
            document.querySelectorAll('.sc-icon-btn').forEach(btn => {
                if (btn.dataset.icon === iconClass) {
                    btn.className = 'sc-icon-btn w-9 h-9 rounded-xl flex items-center justify-center border transition bg-teal-600 text-white border-teal-600 shadow-sm';
                } else {
                    btn.className = 'sc-icon-btn w-9 h-9 rounded-xl flex items-center justify-center border transition bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100';
                }
            });
        }

        function _scToggleAllStatuses(selectAll) {
            document.querySelectorAll('.sc-status-cb').forEach(cb => { cb.checked = selectAll; });
        }

        function saveSummaryCardConfig() {
            const project = document.getElementById('scProject').value;
            const id = document.getElementById('scCardId').value;
            const title = (document.getElementById('scTitle').value || '').trim();
            const colorType = document.getElementById('scColorType').value;
            const color = document.getElementById('scColor').value;
            const icon = (document.getElementById('scIconInput').value || '').trim() || 'fa-layer-group';
            const enabled = document.getElementById('scEnabled').checked;

            if (!title) {
                return showToast('แจ้งเตือน', 'กรุณากรอกชื่อการ์ดสรุปยอด', 'error');
            }

            const checkedStatuses = Array.from(document.querySelectorAll('.sc-status-cb:checked')).map(cb => cb.value);
            if (checkedStatuses.length === 0) {
                return showToast('แจ้งเตือน', 'กรุณาเลือกสถานะห้องอย่างน้อย 1 สถานะ', 'error');
            }

            const cardData = {
                id: id || undefined,
                title: title,
                colorType: colorType,
                color: color,
                icon: icon,
                statuses: checkedStatuses,
                enabled: enabled
            };

            showLoading(true);
            callApi('saveSummaryCard', { project, card: cardData }).then(res => {
                showLoading(false);
                if (res && res.success) {
                    showToast('สำเร็จ', 'บันทึกการ์ดสรุปยอดเรียบร้อย', 'success');
                    closeSummaryCardModal();
                    // Refresh summary cards
                    fetchSummaryCards(project).then(() => {
                        renderSettingsSummaryCards(project);
                    });
                } else {
                    showToast('Error', (res && res.message) || 'ไม่สามารถบันทึกได้', 'error');
                }
            }).catch(err => {
                showLoading(false);
                showToast('Error', err.message, 'error');
            });
        }

        function deleteSummaryCardConfig(cardId) {
            const project = (document.getElementById('sc_project_select') && document.getElementById('sc_project_select').value) || STATE.currentProject;
            showConfirmModal(
                'ลบการ์ดสรุปยอด',
                'คุณแน่ใจหรือไม่ว่าต้องการลบการ์ดสรุปยอดนี้? การดำเนินการนี้ไม่สามารถยกเลิกได้',
                () => {
                    showLoading(true);
                    callApi('deleteSummaryCard', { cardId }).then(res => {
                        showLoading(false);
                        if (res && res.success) {
                            showToast('ลบสำเร็จ', 'ลบการ์ดสรุปยอดเรียบร้อย', 'success');
                            fetchSummaryCards(project).then(() => {
                                renderSettingsSummaryCards(project);
                            });
                        } else {
                            showToast('Error', (res && res.message) || 'ไม่สามารถลบได้', 'error');
                        }
                    }).catch(err => {
                        showLoading(false);
                        showToast('Error', err.message, 'error');
                    });
                },
                'fa-trash',
                'bg-red-50 text-red-600'
            );
        }

        function toggleSummaryCardEnabled(cardId) {
            const project = (document.getElementById('sc_project_select') && document.getElementById('sc_project_select').value) || STATE.currentProject;
            const card = (STATE.summaryCards || []).find(c => c.id === cardId);
            if (!card) return;

            const updatedCard = { ...card, enabled: !card.enabled };
            callApi('saveSummaryCard', { project, card: updatedCard }, { silent: true }).then(res => {
                if (res && res.success) {
                    card.enabled = updatedCard.enabled;
                    renderSettingsSummaryCards(project);
                    showToast('สำเร็จ', updatedCard.enabled ? 'เปิดแสดงการ์ดแล้ว' : 'ซ่อนการ์ดแล้ว', 'success');
                }
            });
        }

        // =====================================================
        // --- Card Ordering Settings (จัดเรียงลำดับการ์ด) ---
        // =====================================================

        function renderSettingsCardOrder(targetProject = null) {
            STATE.currentView = 'settings_card_order';
            const project = targetProject || (document.getElementById('co_project_select') && document.getElementById('co_project_select').value) || STATE.currentProject;

            if (!project) return showToast('Error', 'กรุณาเลือกโครงการก่อน');

            const projects = (STATE.user && STATE.user.projects && STATE.user.projects.length > 0) ? STATE.user.projects : (typeof PROJECTS !== 'undefined' ? PROJECTS : [project]);

            // 1. Collect all available cards for this project
            const cards = [];

            // A. Standard / Custom Room Statuses
            const statuses = (STATE.allRoomStatuses || []).filter(s => s.project === project);
            if (statuses.length > 0) {
                statuses.forEach(s => {
                    cards.push({
                        id: s.name,
                        label: s.name,
                        color: s.color,
                        isHex: s.colorType === 'hex',
                        icon: getIconForStatus(s.name),
                        type: 'status'
                    });
                });
            } else {
                [
                    { id: 'occupied', label: 'ไม่ว่าง', color: 'red', icon: 'fa-user-check', type: 'status' },
                    { id: 'vacant', label: 'ห้องว่าง', color: 'emerald', icon: 'fa-door-open', type: 'status' },
                    { id: 'reserved', label: 'ห้องจอง', color: 'yellow', icon: 'fa-calendar-check', type: 'status' },
                    { id: 'refund', label: 'ห้องออกคืนประกัน', color: 'cyan', icon: 'fa-money-bill-transfer', type: 'status' },
                    { id: 'writeoff', label: 'ห้องตัดหนี', color: 'purple', icon: 'fa-user-slash', type: 'status' },
                    { id: 'repair', label: 'ปรับปรุง', color: 'gray', icon: 'fa-screwdriver-wrench', type: 'status' }
                ].forEach(c => cards.push(c));
            }

            // B. Active Summary Cards
            const activeSummaryCards = (STATE.summaryCards || []).filter(c => c.project === project && c.enabled !== false);
            activeSummaryCards.forEach(sc => {
                cards.push({
                    id: 'summary_' + sc.id,
                    label: sc.title,
                    color: sc.color || 'teal',
                    isHex: sc.colorType === 'hex',
                    icon: sc.icon || 'fa-layer-group',
                    type: 'summary',
                    badge: 'สรุปยอด'
                });
            });

            // C. 'all' card
            cards.push({
                id: 'all',
                label: 'ทั้งหมด',
                color: 'blue',
                isHex: false,
                icon: 'fa-border-all',
                type: 'all'
            });

            // 2. Sort cards according to saved order or default
            const savedOrder = (STATE.cardOrder && STATE.cardOrder[project]) || [];
            if (Array.isArray(savedOrder) && savedOrder.length > 0) {
                cards.sort((a, b) => {
                    const idxA = savedOrder.indexOf(a.id) !== -1 ? savedOrder.indexOf(a.id) : (savedOrder.indexOf(a.label) !== -1 ? savedOrder.indexOf(a.label) : 999);
                    const idxB = savedOrder.indexOf(b.id) !== -1 ? savedOrder.indexOf(b.id) : (savedOrder.indexOf(b.label) !== -1 ? savedOrder.indexOf(b.label) : 999);
                    if (idxA !== idxB) return idxA - idxB;
                    return 0;
                });
            } else {
                const defaultOrder = ['ไม่ว่าง', 'occupied', 'ห้องว่าง', 'vacant', 'ห้องจอง', 'reserved', 'ห้องตัดหนี', 'writeoff', 'ห้องออกคืนประกัน', 'refund', 'ปรับปรุง', 'repair'];
                cards.sort((a, b) => {
                    if (a.id === 'all') return 1;
                    if (b.id === 'all') return -1;
                    const idxA = defaultOrder.indexOf(a.id) !== -1 ? defaultOrder.indexOf(a.id) : 99;
                    const idxB = defaultOrder.indexOf(b.id) !== -1 ? defaultOrder.indexOf(b.id) : 99;
                    return idxA - idxB;
                });
            }

            window._cardOrderState = cards;
            window._cardOrderProject = project;

            _renderCardOrderPageHtml(project, projects);
        }

        function _renderCardOrderPageHtml(project, projects) {
            let html = `
                <div class="max-w-4xl mx-auto p-6 fade-in-up">
                    <button onclick="renderSettings()" class="mb-6 text-gray-500 hover:text-amber-600 flex items-center text-sm font-semibold transition-colors"><i class="fa-solid fa-arrow-left mr-2"></i> กลับไปหน้าตั้งค่ารวม</button>
                    
                    <div class="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                        <div>
                            <h2 class="text-3xl font-bold text-[#1D1D1F] tracking-tight flex items-center">
                                <div class="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center mr-3 shadow-sm border border-amber-100/50">
                                    <i class="fa-solid fa-arrow-down-up-across-line text-amber-600 text-lg"></i>
                                </div>
                                จัดเรียงลำดับการ์ด (Card Ordering)
                            </h2>
                            <p class="text-sm text-gray-500 mt-1 ml-13">ลากสลับตำแหน่ง หรือกดปุ่ม ▲ / ▼ เพื่อจัดเรียงลำดับการ์ดบน Dashboard</p>
                        </div>

                        <div class="flex items-center gap-3 w-full md:w-auto">
                            <!-- Project Select -->
                            <div class="flex items-center bg-white border border-gray-200 rounded-xl px-3 py-1.5 shadow-sm">
                                <span class="text-xs font-bold text-gray-400 mr-2 uppercase">โครงการ:</span>
                                <select id="co_project_select" onchange="renderSettingsCardOrder(this.value)" class="text-sm font-bold text-gray-700 bg-transparent border-0 outline-none cursor-pointer">
                                    ${projects.map(p => `<option value="${p}" ${p === project ? 'selected' : ''}>${p}</option>`).join('')}
                                </select>
                            </div>
                        </div>
                    </div>

                    <div class="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-6">
                        <div class="flex justify-between items-center mb-4 pb-3 border-b border-gray-100">
                            <span class="text-xs font-bold uppercase tracking-wider text-gray-400">ลำดับการ์ดที่แสดงผลบน Dashboard (จากซ้ายไปขวา / บนลงล่าง)</span>
                            <span class="text-xs text-gray-400 font-medium"><i class="fa-solid fa-hand-pointer mr-1"></i> ลากเพื่อสลับ หรือกดปุ่มลูกศร</span>
                        </div>

                        <div id="co_list_container" class="space-y-2.5">
                            <!-- Rows rendered dynamically -->
                        </div>

                        <div class="pt-6 flex flex-col sm:flex-row justify-between items-center gap-4 border-t border-gray-100 mt-6">
                            <button onclick="_resetCardOrderDefault()" class="px-4 py-2.5 bg-gray-100 text-gray-600 hover:bg-gray-200 font-semibold rounded-xl transition-colors text-sm flex items-center">
                                <i class="fa-solid fa-rotate-left mr-2"></i> คืนค่าลำดับเริ่มต้น
                            </button>
                            <div class="flex items-center gap-3 w-full sm:w-auto">
                                <button onclick="renderDashboard()" class="flex-1 sm:flex-none px-5 py-2.5 bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 font-semibold rounded-xl transition text-sm">
                                    ยกเลิก
                                </button>
                                <button onclick="_saveCardOrder()" class="flex-1 sm:flex-none px-6 py-2.5 bg-amber-500 text-white hover:bg-amber-600 font-semibold rounded-xl shadow-[0_4px_12px_rgba(245,158,11,0.3)] transition-all active:scale-[0.98] text-sm flex items-center justify-center">
                                    <i class="fa-solid fa-check mr-2"></i> บันทึกลำดับการ์ด
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            `;

            document.getElementById('mainContent').innerHTML = html;
            _renderCardOrderRows();
        }

        function _renderCardOrderRows() {
            const container = document.getElementById('co_list_container');
            if (!container) return;

            const cards = window._cardOrderState || [];
            container.innerHTML = cards.map((c, idx) => {
                const isHex = c.isHex;
                const colorStyle = isHex ? `background-color: ${c.color}; color: white;` : '';
                const bgClass = isHex ? '' : `bg-${c.color}-500 text-white`;

                return `
                    <div class="co-row flex items-center justify-between p-3.5 bg-[#FBFBFD] border border-gray-200/70 rounded-xl hover:border-amber-300 hover:bg-amber-50/20 transition-all select-none group"
                         draggable="true" 
                         data-idx="${idx}"
                         ondragstart="_coDragStart(event, ${idx})"
                         ondragover="_coDragOver(event)"
                         ondragenter="_coDragEnter(event)"
                         ondragleave="_coDragLeave(event)"
                         ondrop="_coDrop(event, ${idx})">
                        
                        <div class="flex items-center gap-3.5">
                            <!-- Drag Handle -->
                            <div class="cursor-grab active:cursor-grabbing text-gray-300 group-hover:text-amber-500 transition-colors p-1">
                                <i class="fa-solid fa-grip-vertical text-base"></i>
                            </div>

                            <!-- Position Index -->
                            <span class="w-6 h-6 rounded-lg bg-gray-200/70 group-hover:bg-amber-100 group-hover:text-amber-700 text-gray-600 font-bold text-xs flex items-center justify-center transition-colors">
                                ${idx + 1}
                            </span>

                            <!-- Card Icon -->
                            <div class="w-9 h-9 rounded-lg flex items-center justify-center shadow-xs ${bgClass}" style="${colorStyle}">
                                <i class="fa-solid ${c.icon || 'fa-tag'} text-sm"></i>
                            </div>

                            <!-- Card Label & Type Badge -->
                            <div class="flex items-center gap-2">
                                <span class="font-bold text-gray-800 text-base">${c.label}</span>
                                ${c.badge ? `<span class="text-[9px] font-extrabold text-teal-700 bg-teal-50 border border-teal-200 px-1.5 py-0.2 rounded-full">${c.badge}</span>` : ''}
                                ${c.type === 'all' ? `<span class="text-[9px] font-bold text-blue-600 bg-blue-50 border border-blue-100 px-1.5 py-0.2 rounded-full">การ์ดรวมทั้งหมด</span>` : ''}
                            </div>
                        </div>

                        <!-- Arrow Buttons -->
                        <div class="flex items-center gap-1">
                            <button type="button" onclick="_moveCardOrder(${idx}, -1)" ${idx === 0 ? 'disabled' : ''} 
                                    class="w-8 h-8 rounded-lg flex items-center justify-center ${idx === 0 ? 'text-gray-200 cursor-not-allowed' : 'text-gray-500 hover:bg-gray-200/80 hover:text-gray-800 active:scale-95'} transition">
                                <i class="fa-solid fa-arrow-up text-xs"></i>
                            </button>
                            <button type="button" onclick="_moveCardOrder(${idx}, 1)" ${idx === cards.length - 1 ? 'disabled' : ''} 
                                    class="w-8 h-8 rounded-lg flex items-center justify-center ${idx === cards.length - 1 ? 'text-gray-200 cursor-not-allowed' : 'text-gray-500 hover:bg-gray-200/80 hover:text-gray-800 active:scale-95'} transition">
                                <i class="fa-solid fa-arrow-down text-xs"></i>
                            </button>
                        </div>
                    </div>
                `;
            }).join('');
        }

        function _moveCardOrder(idx, delta) {
            const targetIdx = idx + delta;
            const cards = window._cardOrderState || [];
            if (targetIdx < 0 || targetIdx >= cards.length) return;

            const item = cards.splice(idx, 1)[0];
            cards.splice(targetIdx, 0, item);
            _renderCardOrderRows();
        }

        let _coDragSrcIdx = null;

        function _coDragStart(e, idx) {
            _coDragSrcIdx = idx;
            e.dataTransfer.effectAllowed = 'move';
            e.dataTransfer.setData('text/plain', idx);
            e.currentTarget.classList.add('opacity-40');
        }

        function _coDragOver(e) {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
        }

        function _coDragEnter(e) {
            e.currentTarget.classList.add('border-amber-400', 'bg-amber-50/40');
        }

        function _coDragLeave(e) {
            e.currentTarget.classList.remove('border-amber-400', 'bg-amber-50/40');
        }

        function _coDrop(e, targetIdx) {
            e.preventDefault();
            e.currentTarget.classList.remove('border-amber-400', 'bg-amber-50/40');
            document.querySelectorAll('.co-row').forEach(r => r.classList.remove('opacity-40'));

            if (_coDragSrcIdx === null || _coDragSrcIdx === targetIdx) return;
            const cards = window._cardOrderState || [];
            const item = cards.splice(_coDragSrcIdx, 1)[0];
            cards.splice(targetIdx, 0, item);
            _coDragSrcIdx = null;
            _renderCardOrderRows();
        }

        function _saveCardOrder() {
            const project = window._cardOrderProject || STATE.currentProject;
            const cards = window._cardOrderState || [];
            const order = cards.map(c => c.id);

            showLoading(true);
            callApi('saveCardOrder', { project, order }).then(res => {
                showLoading(false);
                if (res && res.success) {
                    if (!STATE.cardOrder) STATE.cardOrder = {};
                    STATE.cardOrder[project] = order;
                    showToast('สำเร็จ', 'บันทึกลำดับการ์ดเรียบร้อย', 'success');
                } else {
                    showToast('Error', (res && res.message) || 'ไม่สามารถบันทึกได้', 'error');
                }
            }).catch(err => {
                showLoading(false);
                showToast('Error', err.message, 'error');
            });
        }

        function _resetCardOrderDefault() {
            const defaultOrder = ['ไม่ว่าง', 'occupied', 'ห้องว่าง', 'vacant', 'ห้องจอง', 'reserved', 'ห้องตัดหนี', 'writeoff', 'ห้องออกคืนประกัน', 'refund', 'ปรับปรุง', 'repair'];
            const cards = window._cardOrderState || [];
            cards.sort((a, b) => {
                if (a.id === 'all') return 1;
                if (b.id === 'all') return -1;
                const idxA = defaultOrder.indexOf(a.id) !== -1 ? defaultOrder.indexOf(a.id) : 99;
                const idxB = defaultOrder.indexOf(b.id) !== -1 ? defaultOrder.indexOf(b.id) : 99;
                return idxA - idxB;
            });
            _renderCardOrderRows();
            showToast('รีเซ็ต', 'คืนค่าลำดับเริ่มต้นแล้ว (อย่าลืมกดบันทึก)', 'info');
        }
