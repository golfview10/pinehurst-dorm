        // --- Helper: Parse Room Number (New Logic) ---
        function parseRoomInfo(roomNo) {
            // Logic: A1101 -> Building: A1, Floor: 1, Room: 01
            // ตัด 3 ตัวท้ายออก ส่วนที่เหลือคือ "ชื่อตึก"
            // ตัวที่ 3 จากท้ายคือ "ชั้น"
            // 2 ตัวท้ายคือ "เลขห้อง"

            let cleanRoomNo = roomNo.toString().trim();
            if (cleanRoomNo.length < 3) return { building: 'Main', floor: 1, roomIndex: cleanRoomNo, full: cleanRoomNo };

            const len = cleanRoomNo.length;
            const roomIndex = cleanRoomNo.substring(len - 2); // 2 ตัวท้าย
            const floorChar = cleanRoomNo.substring(len - 3, len - 2); // ตัวที่ 3 จากท้าย
            const building = cleanRoomNo.substring(0, len - 3); // ที่เหลือข้างหน้า

            return {
                building: building || 'Main',
                floor: parseInt(floorChar), // 0, 1, 2...
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
