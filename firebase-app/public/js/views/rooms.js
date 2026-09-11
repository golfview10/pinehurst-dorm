        // --- Room List ---
        // --- Room List (Redigned) ---
        function renderRoomList(filterBuilding = null, preferredFloor = null) {
            STATE.currentView = 'room_list';
            STATE.currentBuildingFilter = filterBuilding;
            let displayData = STATE.data;
            let backBtn = '';
            let title = "รายการห้องพัก";

            if (filterBuilding) {
                // Filter by Exact Building using new logic
                displayData = STATE.data.filter(r => parseRoomInfo(r.roomNo).building === filterBuilding);
                title = `ตึก ${filterBuilding}`;
                backBtn = `<button onclick="renderVisualMap()" class="mr-3 text-gray-500 hover:text-blue-600 bg-white p-1 rounded-full shadow w-8 h-8 flex items-center justify-center transition hover:bg-gray-50"><i class="fa-solid fa-arrow-left"></i></button>`;
            }

            const floorSet = new Set();
            displayData.forEach(item => {
                const info = parseRoomInfo(item.roomNo);
                floorSet.add(info.floor);
            });

            const sortedFloors = Array.from(floorSet).sort((a, b) => a - b);
            let activeFloor = preferredFloor;
            if (!activeFloor || !floorSet.has(parseInt(activeFloor))) activeFloor = sortedFloors[0] || 1;
            STATE.currentFloor = activeFloor;

            // Ultra-Compact View Mode
            let html = `
                <div class="flex flex-col h-full bg-white relative overflow-hidden">
                    <div class="px-2 py-2 border-b border-gray-200 flex justify-between items-center bg-gray-50 shrink-0 z-20">
                        <div class="flex items-center font-bold text-base text-gray-800">${backBtn}${title}</div>
                        <div class="flex space-x-1 items-center">
                             <button onclick="openReportModal()" class="bg-gray-600 text-white px-2 py-1 rounded hover:bg-gray-700 transition text-xs"><i class="fa-solid fa-print"></i></button>
                             <button onclick="openModal()" class="bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700 transition text-xs"><i class="fa-solid fa-plus"></i></button>
                        </div>
                    </div>
                    <div class="p-1 flex-1 overflow-y-auto" id="cardContainer">
                        <div class="flex flex-col space-y-1">
            `;

            sortedFloors.forEach(f => {
                const floorRooms = displayData.filter(r => parseRoomInfo(r.roomNo).floor === f);

                // Sort by Room Index (numeric)
                floorRooms.sort((a, b) => {
                    const idxA = parseInt(parseRoomInfo(a.roomNo).roomIndex);
                    const idxB = parseInt(parseRoomInfo(b.roomNo).roomIndex);
                    return idxA - idxB;
                });

                if (floorRooms.length > 0) {
                    // Check if this floor has a custom layout template (use String key for consistency)
                    const layoutTemplate = filterBuilding ? (STATE.layouts[filterBuilding] && STATE.layouts[filterBuilding][String(f)]) : null;
                    let row1, row2, half;

                    if (layoutTemplate) {
                        // Use custom layout template
                        const arranged = applyLayoutTemplate(layoutTemplate, floorRooms, f);
                        row1 = arranged.topRow;
                        row2 = arranged.bottomRow;
                        // Suites span 2 columns, so count effective column slots
                        const effectiveCols = (items) => items.reduce((sum, r) => sum + (r._isSuite ? 2 : 1), 0);
                        half = Math.max(effectiveCols(row1), effectiveCols(row2));
                    } else {
                        // Default: split in half
                        half = Math.ceil(floorRooms.length / 2);
                        row1 = floorRooms.slice(0, half);
                        row2 = floorRooms.slice(half).reverse();
                    }

                    // Dynamic Sizing Logic based on column count (half) AND total floors (sortedFloors.length)
                    let cardHeightClass = 'h-10';
                    let fontSizeClass = 'text-sm';

                    const isHighRise = sortedFloors.length >= 7; // U, M, N have 8 floors

                    if (half <= 6) {
                        cardHeightClass = isHighRise ? 'h-11' : 'h-16';
                        fontSizeClass = isHighRise ? 'text-2xl' : 'text-3xl';
                    } else if (half <= 10) {
                        cardHeightClass = isHighRise ? 'h-10' : 'h-14';
                        fontSizeClass = isHighRise ? 'text-lg' : 'text-xl';
                    } else if (half <= 15) {
                        cardHeightClass = isHighRise ? 'h-9' : 'h-12';
                        fontSizeClass = 'text-base';
                    } else {
                        // Very dense floors
                        cardHeightClass = 'h-8';
                        fontSizeClass = 'text-[10px]';
                    }

                    const gridStyle = `grid-template-columns: repeat(${half}, minmax(0, 1fr)) !important; width: 100%;`;

                    // Helper to render one row of items
                    const renderRowHtml = (items) => items.map(r => {
                        const spanClass = r._isSuite ? `grid-column: span 2;` : '';
                        if (r._isSpecial) {
                            const spClr = r._specialType === 'store' ? 'bg-orange-100 text-orange-600' : r._specialType === 'lounge' ? 'bg-teal-100 text-teal-600' : r._specialType === 'custom' ? 'bg-blue-100 text-blue-600' : 'bg-gray-200 text-gray-500';
                            return `<div class="${spClr} rounded shadow-sm flex flex-col items-center justify-center ${cardHeightClass}" style="${spanClass}" title="${r._specialLabel}">
                                <i class="fa-solid ${r._specialIcon} text-sm"></i>
                                <span class="text-[8px] mt-0.5">${r._specialLabel}</span>
                            </div>`;
                        }
                        return `<div style="${spanClass}">${generateCompactCardHtml(r, cardHeightClass, fontSizeClass)}</div>`;
                    }).join('');

                    html += `
                        <div class="flex items-center space-x-2 border-b border-gray-100 pb-1 last:border-0 relative">
                            <div class="w-8 shrink-0 text-center bg-gray-800 text-white text-[10px] font-bold rounded flex items-center justify-center self-stretch py-1">FL.${f}</div>
                            <div class="flex-1 overflow-visible pb-1">
                                <div class="grid gap-1 mb-0.5" style="${gridStyle}">
                                    ${renderRowHtml(row1)}
                                </div>
                                <div class="grid gap-1" style="${gridStyle}">
                                    ${renderRowHtml(row2)}
                                </div>
                            </div>
                        </div>
                    `;
                }
            });

            // Generate Dynamic Legend
            let legendHtml = '';
            if (STATE.projectRoomStatuses && STATE.projectRoomStatuses.length > 0) {
                STATE.projectRoomStatuses.forEach(s => {
                    let bgClass = '', styleAttr = '';
                    if (s.colorType === 'hex') {
                        styleAttr = `style="background-color: ${s.color}; border-color: ${s.color};"`;
                    } else {
                        bgClass = `bg-${s.color}-500 border border-${s.color}-600`;
                    }
                    legendHtml += `<div class="flex items-center"><span class="w-6 h-6 rounded mr-2 ${bgClass}" ${styleAttr}></span>${s.name.replace('ห้อง', '')}</div>`;
                });
                if (STATE.projectRoomStatuses.find(s => s.name.includes('จอง'))) {
                    legendHtml += `<div class="flex items-center"><span class="w-6 h-6 bg-orange-500 rounded mr-2 border border-orange-600"></span>หลุดจอง</div>`;
                }
            } else {
                legendHtml = `
                    <div class="flex items-center"><span class="w-6 h-6 bg-emerald-500 rounded mr-2 border border-emerald-600"></span>ว่าง</div>
                    <div class="flex items-center"><span class="w-6 h-6 bg-red-500 rounded mr-2 border border-red-600"></span>ไม่ว่าง</div>
                    <div class="flex items-center"><span class="w-6 h-6 bg-yellow-500 rounded mr-2 border border-yellow-600"></span>จอง</div>
                    <div class="flex items-center"><span class="w-6 h-6 bg-orange-500 rounded mr-2 border border-orange-600"></span>หลุดจอง</div>
                    <div class="flex items-center"><span class="w-6 h-6 bg-gray-700 rounded mr-2 border border-gray-800"></span>ซ่อม</div>
                    <div class="flex items-center"><span class="w-6 h-6 bg-cyan-500 rounded mr-2 border border-cyan-600"></span>คืนประกัน</div>
                    <div class="flex items-center"><span class="w-6 h-6 bg-purple-500 rounded mr-2 border border-purple-600"></span>ตัดหนี</div>
                `;
            }

            html += `
                <div class="mt-4 pt-4 border-t border-gray-100 flex flex-wrap justify-center gap-6 text-sm text-gray-700 pb-2">
                    ${legendHtml}
                </div>
            `;

            html += `</div></div></div>`;
            document.getElementById('mainContent').innerHTML = html;
        }

        function generateCompactCardHtml(item, heightClass = 'h-8', fontSizeClass = 'text-[12px]') {
            if (item.isDummy) return ``;

            let statusConfig = getStatusConfig(item.status);
            let isHex = statusConfig.colorType === 'hex';
            let colorVal = statusConfig.color;
            
            let bgClass = '';
            let styleAttr = '';
            let statusText = item.status || "ว่าง";
            
            // Handle Expired Booking (special override)
            if ((item.status === 'ห้องจอง' || item.status === 'จอง') && isBookingExpired(item)) {
                isHex = false;
                colorVal = 'orange';
                statusText = "หลุดจอง";
            }
            
            if (isHex) {
                styleAttr = `style="background-color: ${colorVal};"`;
            } else {
                bgClass = `bg-${colorVal}-500`;
            }

            // Fallback shortening for default labels
            if (statusText === 'ห้องออกคืนประกัน') statusText = 'คืน';
            if (statusText === 'ห้องตัดหนี') statusText = 'ตัดหนี';
            if (statusText === 'ห้องว่าง') statusText = 'ว่าง';
            if (statusText === 'ไม่ว่าง') statusText = 'ไม่ว่าง';
            if (statusText === 'ปรับปรุง' || statusText === 'รอซ่อม') statusText = 'ซ่อม';

            let sampleHtml = item.isSampleRoom ? `<div class="absolute top-0 right-0 w-3 h-3 bg-gradient-to-tr from-yellow-300 to-yellow-500 shadow-sm rounded-bl-full z-20" title="ห้องตัวอย่าง"></div>` : '';

            // Ultra Compact Card
            return `
                <div class="${bgClass} relative overflow-hidden rounded shadow-sm cursor-pointer hover:brightness-110 transition flex flex-col items-center justify-center text-white ${heightClass}" ${styleAttr} onclick="openModal('${item.rowIndex}')" title="ห้อง ${item.roomNo} (${item.status || 'ห้องว่าง'})">
                    ${sampleHtml}
                    <span class="font-extrabold ${fontSizeClass} leading-none text-center px-0.5 tracking-tight z-10">${item.roomNo}</span>
                </div>
            `;
        }

        function toggleSampleRoomStatus(isChecked) {
            const statusNode = document.getElementById('inp_status');
            if (isChecked) {
                statusNode.value = 'ห้องว่าง';
                statusNode.disabled = true;
            } else {
                statusNode.disabled = false;
            }
        }

        // --- Modal & Save ---
        window.toggleBookingDuration = function() {
            const status = document.getElementById('inp_status').value;
            const container = document.getElementById('bookingDurationContainer');
            const noExpiry = document.getElementById('inp_noBookingExpiry');
            const durationSelect = document.getElementById('inp_bookingDuration');
            if (container) {
                if (status === 'ห้องจอง' || status === 'จอง') {
                    container.classList.remove('hidden');
                    if (noExpiry && durationSelect) {
                        durationSelect.disabled = noExpiry.checked;
                    }
                } else {
                    container.classList.add('hidden');
                }
            }
        };

        function openModal(rowIndex = null) {
            document.getElementById('inp_roomNo').value = '';
            document.getElementById('inp_moveInDate').value = '';
            document.getElementById('inp_remark').value = '';
            document.getElementById('inp_isSampleRoom').checked = false;
            document.getElementById('inp_status').disabled = false;

            const typeSelect = document.getElementById('inp_roomType');
            // Populate Dynamic Types from Project Settings
            typeSelect.innerHTML = STATE.projectRoomTypes.map(rt => `<option value="${rt.name}">${rt.name}</option>`).join('');
            // Fallback if empty
            if (STATE.projectRoomTypes.length === 0) {
                typeSelect.innerHTML = `<option value="Standard">Standard</option>`;
            }

            const statusSelect = document.getElementById('inp_status');
            if (STATE.projectRoomStatuses && STATE.projectRoomStatuses.length > 0) {
                statusSelect.innerHTML = STATE.projectRoomStatuses.map(s => `<option value="${s.name}">${s.name}</option>`).join('');
            } else {
                // Fallback to defaults if no custom statuses defined
                statusSelect.innerHTML = `
                    <option value="ห้องว่าง">ห้องว่าง</option>
                    <option value="ห้องจอง">ห้องจอง</option>
                    <option value="ไม่ว่าง">ไม่ว่าง</option>
                    <option value="ปรับปรุง">ปรับปรุง</option>
                    <option value="ห้องออกคืนประกัน">ห้องออกคืนประกัน</option>
                    <option value="ห้องตัดหนี">ห้องตัดหนี</option>
                `;
            }

            const modal = document.getElementById('roomModal');
            if (rowIndex) {
                const item = STATE.data.find(r => r.rowIndex === rowIndex);
                document.getElementById('modalTitle').innerText = `ห้อง ${item.roomNo} `;
                document.getElementById('editRowIndex').value = rowIndex;
                document.getElementById('inp_roomNo').value = item.roomNo;

                let rType = item.roomType ? item.roomType.trim() : 'Standard';

                // Add option if not exists (legacy data)
                let exists = Array.from(typeSelect.options).some(o => o.value == rType);
                if (!exists) {
                    let opt = document.createElement('option');
                    opt.value = rType; opt.innerHTML = rType;
                    typeSelect.appendChild(opt);
                }
                typeSelect.value = rType;

                let st = item.status;
                if (!st || st === '') st = 'ห้องว่าง';

                // Add option if not exists
                let statusExists = Array.from(statusSelect.options).some(o => o.value == st);
                if (!statusExists) {
                    let opt = document.createElement('option');
                    opt.value = st; opt.innerHTML = st;
                    statusSelect.appendChild(opt);
                }

                document.getElementById('inp_status').value = st;
                document.getElementById('inp_moveInDate').value = item.moveInDate || '';
                document.getElementById('inp_remark').value = item.remark || '';
                if(document.getElementById('inp_bookingDuration')) {
                    document.getElementById('inp_bookingDuration').value = item.bookingDuration || '30';
                }
                if(document.getElementById('inp_noBookingExpiry')) {
                    document.getElementById('inp_noBookingExpiry').checked = !!item.noBookingExpiry;
                }

                const isSample = !!item.isSampleRoom;
                document.getElementById('inp_isSampleRoom').checked = isSample;

                if (isSample) {
                    document.getElementById('inp_status').value = 'ห้องว่าง';
                    document.getElementById('inp_status').disabled = true;
                } else {
                    document.getElementById('inp_status').disabled = false;
                }

                document.getElementById('inp_roomNo').disabled = true;
                // document.getElementById('inp_roomType').disabled = true; // Unlock Room Type Editing
            } else {
                document.getElementById('modalTitle').innerText = "เพิ่มห้องใหม่";
                document.getElementById('editRowIndex').value = "";
                document.getElementById('inp_status').value = "ห้องว่าง";
                if(document.getElementById('inp_bookingDuration')) {
                    document.getElementById('inp_bookingDuration').value = '30';
                }
                if(document.getElementById('inp_noBookingExpiry')) {
                    document.getElementById('inp_noBookingExpiry').checked = false;
                }
                if (typeSelect.options.length > 0) typeSelect.selectedIndex = 0;
                document.getElementById('inp_roomNo').disabled = false;
                // document.getElementById('inp_roomType').disabled = false;
            }
            window.toggleBookingDuration();
            document.getElementById('roomModal').classList.remove('hidden');
        }

        function closeModal() { document.getElementById('roomModal').classList.add('hidden'); }

        function saveRoomData() {
            const roomNo = document.getElementById('inp_roomNo').value.trim();
            if (!roomNo) { showToast('Warning', 'กรุณาระบุเลขห้อง', 'error'); return; }

            const rowIndex = document.getElementById('editRowIndex').value;
            const isSampleRoom = document.getElementById('inp_isSampleRoom').checked;
            let status = document.getElementById('inp_status').value;
            if (!status || isSampleRoom) status = 'ห้องว่าง';

            let bookingDuration = '';
            let noBookingExpiry = false;
            if (document.getElementById('inp_bookingDuration') && (status === 'ห้องจอง' || status === 'จอง')) {
                bookingDuration = document.getElementById('inp_bookingDuration').value;
                if (document.getElementById('inp_noBookingExpiry')) {
                    noBookingExpiry = document.getElementById('inp_noBookingExpiry').checked;
                }
            }

            const formPayload = {
                roomNo: roomNo,
                roomType: document.getElementById('inp_roomType').value.trim(),
                status: status,
                moveInDate: document.getElementById('inp_moveInDate').value,
                remark: document.getElementById('inp_remark').value.trim(),
                isSampleRoom: isSampleRoom,
                bookingDuration: bookingDuration,
                noBookingExpiry: noBookingExpiry
            };

            const serverPayload = {
                project: STATE.currentProject,
                rowIndex: rowIndex,
                user: STATE.user.name,
                data: formPayload
            };

            // Optimistic Update
            if (rowIndex) {
                const idx = STATE.data.findIndex(r => r.rowIndex == rowIndex);
                if (idx !== -1) {
                    STATE.data[idx] = { ...STATE.data[idx], ...formPayload };
                    if (STATE.currentView === 'dashboard') renderDashboard();
                    else if (STATE.currentView === 'room_list') renderRoomList(STATE.currentBuildingFilter, STATE.currentFloor);
                    else if (STATE.currentView === 'available_view') {
                        // Check if we need to remove it from view (if status changed to not vacant)
                        const currentType = document.getElementById('current_view_type') ? document.getElementById('current_view_type').value : null;
                        if (currentType) renderAvailableRoomsByType(currentType);
                    }
                    else if (STATE.currentView === 'status_view' && typeof renderRoomListByStatus === 'function') {
                        renderRoomListByStatus(STATE.currentStatusKey || document.getElementById('current_status_view_title')?.dataset?.status || 'reserved');
                    }
                }
            }
            closeModal();

            callApi('saveRoomData', serverPayload, { silent: true }).then(() => {
                showToast('Success', 'บันทึกเรียบร้อย', 'success');
                if (!rowIndex) fetchProjectData(STATE.currentProject, true, true);
            });
        }

        // --- Add Room Feature ---
        function renderAddRoom() {
            STATE.currentView = 'add_room';
            // Unique Buildings
            const buildings = Array.from(new Set(STATE.data.map(r => parseRoomInfo(r.roomNo).building))).sort();

            let html = `
                <div class="max-w-2xl mx-auto p-6 fade-in-up">
                    <button onclick="renderSettings()" class="mb-4 text-gray-500 hover:text-blue-600 flex items-center"><i class="fa-solid fa-arrow-left mr-2"></i> กลับไปตั้งค่า</button>
                    <div class="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
                        <div class="bg-purple-600 px-6 py-4 border-b border-purple-700">
                             <h2 class="text-xl font-bold text-white flex items-center"><i class="fa-solid fa-plus-circle mr-2"></i> เพิ่มห้องพักใหม่</h2>
                        </div>
                        <div class="p-6 space-y-4">
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-1">เลขห้อง (Room No)</label>
                                <input type="text" id="add_roomNo" class="w-full border-gray-300 rounded-lg shadow-sm focus:ring-purple-500 focus:border-purple-500" placeholder="เช่น A101, B205">
                                <p class="text-xs text-gray-400 mt-1">ระบบจะแยกตึกและชั้นจากเลขห้องโดยอัตโนมัติ</p>
                            </div>

                            <div class="grid grid-cols-2 gap-4">
                                <div>
                                    <label class="block text-sm font-medium text-gray-700 mb-1">ประเภทห้อง</label>
                                     <select id="add_roomType" class="w-full border-gray-300 rounded-lg shadow-sm focus:ring-purple-500 focus:border-purple-500">
                                        ${STATE.projectRoomTypes.map(t => `<option value="${t.name}">${t.name}</option>`).join('')}
                                    </select>
                                </div>
                                <div>
                                    <label class="block text-sm font-medium text-gray-700 mb-1">สถานะเริ่มต้น</label>
                                    <select id="add_status" class="w-full border-gray-300 rounded-lg shadow-sm focus:ring-purple-500 focus:border-purple-500">
                                        <option value="ห้องว่าง">ห้องว่าง</option>
                                        <option value="ปรับปรุง">ปรับปรุง</option>
                                        <option value="ไม่ว่าง">ไม่ว่าง</option>
                                    </select>
                                </div>
                            </div>

                            <div class="bg-blue-50 p-4 rounded-lg flex items-start">
                                <i class="fa-solid fa-info-circle text-blue-500 mt-1 mr-3"></i>
                                <div class="text-sm text-blue-700">
                                    <p class="font-bold">คำแนะนำ:</p>
                                    <ul class="list-disc pl-4 mt-1 space-y-1">
                                        <li>กรุณาตรวจสอบเลขห้องให้ถูกต้อง ห้ามซ้ำกับที่มีอยู่</li>
                                        <li>ข้อมูลอื่นๆ สามารถแก้ไขได้ภายหลังในหน้ารายการห้อง</li>
                                    </ul>
                                </div>
                            </div>
                            
                            <div class="pt-4 flex justify-end space-x-3 border-t border-gray-100 mt-4">
                                <button onclick="renderSettings()" class="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition">ยกเลิก</button>
                                <button onclick="handleAddRoomSubmit()" class="px-6 py-2 bg-purple-600 text-white font-bold rounded-lg shadow hover:bg-purple-700 transition transform hover:-translate-y-0.5">บันทึกห้องใหม่</button>
                            </div>
                        </div>
                    </div>
                </div>`;
            document.getElementById('mainContent').innerHTML = html;
        }

        function handleAddRoomSubmit() {
            const roomNo = document.getElementById('add_roomNo').value.trim();
            const roomType = document.getElementById('add_roomType').value;
            const status = document.getElementById('add_status').value;

            if (!roomNo) { showToast('Error', 'กรุณาระบุเลขห้อง', 'error'); return; }

            showLoading(true);
            callApi('addRoom', {
                project: STATE.currentProject,
                roomNo, roomType, status
            }).then(res => {
                showLoading(false);
                if (res.success) {
                    showToast('Success', 'เพิ่มห้องสำเร็จ', 'success');
                    fetchProjectData(STATE.currentProject, true); // Reload data
                    renderSettings();
                } else {
                    showToast('Error', res.message, 'error');
                }
            });
        }

        function openRoomTypeModal(roomType, project) {
            let category = '', name = '', price = '', detail = '';
            let isEdit = false;
            let originalName = '';

            if (roomType) {
                isEdit = true;
                category = roomType.category || roomType.name;
                name = roomType.name;
                price = roomType.price;
                detail = roomType.detail;
                originalName = roomType.name;
            }

            const modalHtml = `
                <div id="roomTypeModal" class="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
                    <div class="bg-white rounded-2xl shadow-2xl w-[500px] max-w-[90vw] overflow-hidden transform transition-all animate-slide-up">
                        <div class="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                            <h3 class="text-xl font-bold text-gray-800 flex items-center">
                                <div class="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mr-3">
                                    <i class="fa-solid ${isEdit ? 'fa-pen-to-square' : 'fa-plus'}"></i>
                                </div>
                                ${isEdit ? 'แก้ไขประเภทห้องพัก' : 'เพิ่มประเภทห้องใหม่'}
                            </h3>
                            <button onclick="closeRoomTypeModal()" class="text-gray-400 hover:text-gray-600 hover:bg-gray-100 w-8 h-8 rounded-full flex items-center justify-center transition-colors">
                                <i class="fa-solid fa-xmark text-lg"></i>
                            </button>
                        </div>
                        
                        <div class="p-6">
                            <input type="hidden" id="rtProject" value="${project}">
                            <input type="hidden" id="rtOriginalName" value="${originalName}">
                            <input type="hidden" id="rtIsEdit" value="${isEdit}">
                            
                            <div class="space-y-4">
                                <div>
                                    <label class="block text-sm font-bold text-gray-700 mb-1.5">ชื่อประเภทห้องพัก <span class="text-red-500">*</span></label>
                                    <input type="text" id="rtName" value="${name}" class="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all font-medium text-gray-800" placeholder="เช่น VIP, Standard">
                                </div>
                                
                                <div class="grid grid-cols-2 gap-4">
                                    <div>
                                        <label class="block text-sm font-bold text-gray-700 mb-1.5 flex items-center">หมวดหมู่ <i class="fa-solid fa-circle-info text-indigo-400 ml-1.5" title="ใช้จัดกลุ่มประเภทที่ชื่อคล้ายกันแต่ราคาต่างกัน เพื่อรวมเป็นกลุ่มเดียวใน Dashboard"></i></label>
                                        <input type="text" id="rtCategory" value="${category}" class="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-gray-700" placeholder="(เว้นว่างไว้จะใช้ชื่อประเภท)">
                                    </div>
                                    <div>
                                        <label class="block text-sm font-bold text-gray-700 mb-1.5">ราคาเริ่มต้น <span class="text-red-500">*</span></label>
                                        <div class="relative">
                                            <span class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-semibold">฿</span>
                                            <input type="number" id="rtPrice" value="${price}" class="w-full pl-8 pr-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all font-bold text-gray-800" placeholder="0">
                                        </div>
                                    </div>
                                </div>
                                
                                <div>
                                    <label class="block text-sm font-bold text-gray-700 mb-1.5">รายละเอียด / ขนาด</label>
                                    <textarea id="rtDetail" rows="3" class="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all text-gray-700 resize-none" placeholder="รายละเอียดเพิ่มเติมของห้องพัก...">${detail}</textarea>
                                </div>
                            </div>
                        </div>
                        
                        <div class="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
                            <button onclick="closeRoomTypeModal()" class="px-5 py-2.5 text-sm font-bold text-gray-600 hover:bg-gray-200 rounded-xl transition-colors">ยกเลิก</button>
                            <button onclick="saveRoomTypeSettings()" class="px-6 py-2.5 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-[0_4px_12px_rgba(16,185,129,0.2)] hover:shadow-[0_6px_16px_rgba(16,185,129,0.3)] transition-all flex items-center active:scale-[0.98]">
                                <i class="fa-solid fa-save mr-2"></i> บันทึก
                            </button>
                        </div>
                    </div>
                </div>
            `;
            document.body.insertAdjacentHTML('beforeend', modalHtml);
            document.getElementById('rtName').focus();
        }

        function closeRoomTypeModal() {
            const modal = document.getElementById('roomTypeModal');
            if (modal) modal.remove();
        }

        function saveRoomTypeSettings() {
            const project = document.getElementById('rtProject').value;
            const originalName = document.getElementById('rtOriginalName').value;
            const isEdit = document.getElementById('rtIsEdit').value === 'true';
            
            const name = document.getElementById('rtName').value.trim();
            const category = document.getElementById('rtCategory').value.trim();
            const price = document.getElementById('rtPrice').value.trim();
            const detail = document.getElementById('rtDetail').value.trim();

            if (!name || !price) {
                showToast('ข้อมูลไม่ครบ', 'กรุณากรอกชื่อประเภทและราคา', 'error');
                return;
            }

            // Check duplicate name
            if ((!isEdit || name !== originalName) && STATE.allSettings.some(s => s.project === project && s.name === name)) {
                showToast('ข้อมูลซ้ำ', 'ชื่อประเภทห้องนี้มีอยู่แล้วในโครงการ', 'error');
                return;
            }

            const newRoomType = { 
                project, 
                name, 
                price, 
                detail, 
                color: 'gray', 
                category: category || name 
            };

            let updatedSettings = [...STATE.allSettings];

            if (isEdit) {
                const index = updatedSettings.findIndex(s => s.project === project && s.name === originalName);
                if (index !== -1) updatedSettings[index] = newRoomType;
            } else {
                updatedSettings.push(newRoomType);
            }

            callApi('saveSettings', { roomTypes: updatedSettings }).then(res => {
                if (res.success) {
                    STATE.allSettings = updatedSettings;
                    if (STATE.currentProject === project) {
                        STATE.projectRoomTypes = updatedSettings.filter(s => s.project === project);
                    }
                    closeRoomTypeModal();
                    renderSettingsRoomTypes(project);
                    showToast('สำเร็จ', isEdit ? 'อัปเดตข้อมูลประเภทห้องพักเรียบร้อย' : 'เพิ่มประเภทห้องใหม่เรียบร้อย', 'success');
                }
            });
        }

        function deleteRoomType(name, project) {
            const modalHtml = `
                <div id="deleteConfirmModal" class="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
                    <div class="bg-white rounded-2xl shadow-2xl w-[400px] max-w-[90vw] overflow-hidden transform transition-all animate-slide-up">
                        <div class="p-6 text-center">
                            <div class="w-16 h-16 rounded-full bg-red-100 text-red-500 flex items-center justify-center mx-auto mb-4">
                                <i class="fa-solid fa-triangle-exclamation text-3xl"></i>
                            </div>
                            <h3 class="text-xl font-bold text-gray-800 mb-2">ยืนยันการลบ?</h3>
                            <p class="text-gray-500 mb-6">คุณต้องการลบประเภทห้อง <span class="font-bold text-gray-800">"${name}"</span> ใช่หรือไม่?</p>
                            
                            <div class="flex justify-center gap-3">
                                <button onclick="document.getElementById('deleteConfirmModal').remove()" class="px-5 py-2.5 text-sm font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors w-full">ยกเลิก</button>
                                <button onclick="executeDeleteRoomType('${name.replace(/'/g, "\\'")}', '${project.replace(/'/g, "\\'")}')" class="px-5 py-2.5 text-sm font-bold text-white bg-red-500 hover:bg-red-600 rounded-xl shadow-sm transition-colors w-full">ใช่, ลบเลย</button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            document.body.insertAdjacentHTML('beforeend', modalHtml);
        }

        function executeDeleteRoomType(name, project) {
            const modal = document.getElementById('deleteConfirmModal');
            if (modal) modal.remove();

            const updatedSettings = STATE.allSettings.filter(s => !(s.project === project && s.name === name));
            
            callApi('saveSettings', { roomTypes: updatedSettings }).then(res => {
                if (res.success) {
                    STATE.allSettings = updatedSettings;
                    if (STATE.currentProject === project) {
                        STATE.projectRoomTypes = updatedSettings.filter(s => s.project === project);
                    }
                    renderSettingsRoomTypes(project);
                    showToast('ลบสำเร็จ', 'ลบประเภทห้องพักเรียบร้อย', 'success');
                }
            });
        }

