        // --- Dashboard ---
        function isBookingExpired(item) {
            if (item.noBookingExpiry) return false;
            if (item.status !== 'ห้องจอง' && item.status !== 'จอง') return false;
            const relevantDate = item.bookingDate || item.moveInDate;
            if (!relevantDate) return false;
            
            const bookDate = new Date(relevantDate);
            if (isNaN(bookDate.getTime())) return false;
            
            const now = new Date();
            const diffDays = Math.floor((now - bookDate) / (1000 * 60 * 60 * 24));
            
            const maxDays = item.bookingDuration ? parseInt(item.bookingDuration) : 30;
            return diffDays > maxDays;
        }

        // Dashboard column count (persisted)
        STATE._dashCols = parseInt(window.SafeStorage.getItem('dms_dash_cols') || '4');

        function changeDashCols(delta) {
            STATE._dashCols = Math.min(6, Math.max(2, (STATE._dashCols || 4) + delta));
            window.SafeStorage.setItem('dms_dash_cols', STATE._dashCols);
            const grid = document.getElementById('dashTypeGrid');
            const label = document.getElementById('dashColLabel');
            if (grid) grid.style.gridTemplateColumns = `repeat(${STATE._dashCols}, minmax(0, 1fr))`;
            if (label) label.textContent = STATE._dashCols;
        }

        const getCardStyles = (color, isHex) => {
            if (isHex) {
                return {
                    iconBoxClass: 'text-white shadow-sm',
                    iconBoxStyle: `background-color: ${color};`,
                    glowClass: 'opacity-[0.04] group-hover:opacity-[0.08]',
                    glowStyle: `background-color: ${color};`,
                    textClass: '',
                    textStyle: `color: ${color};`,
                    hoverBorder: 'hover:border-gray-300',
                    itemHover: 'hover:bg-gray-50',
                };
            }
            const styles = {
                red: { iconBoxClass: 'bg-red-500 shadow-red-500/30 text-white', iconBoxStyle: '', glowClass: 'bg-red-500 opacity-[0.04] group-hover:opacity-[0.08]', glowStyle: '', textClass: 'text-red-600', textStyle: '', hoverBorder: 'hover:border-red-200', itemHover: 'hover:bg-red-50/50' },
                emerald: { iconBoxClass: 'bg-emerald-500 shadow-emerald-500/30 text-white', iconBoxStyle: '', glowClass: 'bg-emerald-500 opacity-[0.04] group-hover:opacity-[0.08]', glowStyle: '', textClass: 'text-emerald-600', textStyle: '', hoverBorder: 'hover:border-emerald-200', itemHover: 'hover:bg-emerald-50/50' },
                yellow: { iconBoxClass: 'bg-yellow-500 shadow-yellow-500/30 text-white', iconBoxStyle: '', glowClass: 'bg-yellow-500 opacity-[0.04] group-hover:opacity-[0.08]', glowStyle: '', textClass: 'text-yellow-600', textStyle: '', hoverBorder: 'hover:border-yellow-200', itemHover: 'hover:bg-yellow-50/50' },
                cyan: { iconBoxClass: 'bg-cyan-500 shadow-cyan-500/30 text-white', iconBoxStyle: '', glowClass: 'bg-cyan-500 opacity-[0.04] group-hover:opacity-[0.08]', glowStyle: '', textClass: 'text-cyan-600', textStyle: '', hoverBorder: 'hover:border-cyan-200', itemHover: 'hover:bg-cyan-50/50' },
                purple: { iconBoxClass: 'bg-purple-500 shadow-purple-500/30 text-white', iconBoxStyle: '', glowClass: 'bg-purple-500 opacity-[0.04] group-hover:opacity-[0.08]', glowStyle: '', textClass: 'text-purple-600', textStyle: '', hoverBorder: 'hover:border-purple-200', itemHover: 'hover:bg-purple-50/50' },
                gray: { iconBoxClass: 'bg-gray-500 shadow-gray-500/30 text-white', iconBoxStyle: '', glowClass: 'bg-gray-500 opacity-[0.04] group-hover:opacity-[0.08]', glowStyle: '', textClass: 'text-gray-600', textStyle: '', hoverBorder: 'hover:border-gray-200', itemHover: 'hover:bg-gray-50/50' },
                blue: { iconBoxClass: 'bg-blue-500 shadow-blue-500/30 text-white', iconBoxStyle: '', glowClass: 'bg-blue-500 opacity-[0.04] group-hover:opacity-[0.08]', glowStyle: '', textClass: 'text-blue-600', textStyle: '', hoverBorder: 'hover:border-blue-200', itemHover: 'hover:bg-blue-50/50' },
                orange: { iconBoxClass: 'bg-orange-500 shadow-orange-500/30 text-white', iconBoxStyle: '', glowClass: 'bg-orange-500 opacity-[0.04] group-hover:opacity-[0.08]', glowStyle: '', textClass: 'text-orange-600', textStyle: '', hoverBorder: 'hover:border-orange-200', itemHover: 'hover:bg-orange-50/50' },
                pink: { iconBoxClass: 'bg-pink-500 shadow-pink-500/30 text-white', iconBoxStyle: '', glowClass: 'bg-pink-500 opacity-[0.04] group-hover:opacity-[0.08]', glowStyle: '', textClass: 'text-pink-600', textStyle: '', hoverBorder: 'hover:border-pink-200', itemHover: 'hover:bg-pink-50/50' },
                indigo: { iconBoxClass: 'bg-indigo-500 shadow-indigo-500/30 text-white', iconBoxStyle: '', glowClass: 'bg-indigo-500 opacity-[0.04] group-hover:opacity-[0.08]', glowStyle: '', textClass: 'text-indigo-600', textStyle: '', hoverBorder: 'hover:border-indigo-200', itemHover: 'hover:bg-indigo-50/50' },
            };
            return styles[color] || styles['gray'];
        };

        function renderDashboard() {
            STATE.currentView = 'dashboard';
            const total = STATE.data.length;
            // Generate Dynamic CARD_DEFS based on STATE.projectRoomStatuses
            let CARD_DEFS = [];
            const hasCustoms = STATE.projectRoomStatuses && STATE.projectRoomStatuses.length > 0;
            
            if (hasCustoms) {
                CARD_DEFS = STATE.projectRoomStatuses.map(s => {
                    return {
                        id: s.name,
                        label: s.name,
                        color: s.color,
                        isHex: s.colorType === 'hex',
                        filterFn: r => {
                            if (r.status === s.name) return true;
                            if (s.name === 'ห้องว่าง' && (r.status === 'ว่าง' || !r.status)) return true;
                            if (s.name === 'ห้องจอง' && r.status === 'จอง') return true;
                            if (s.name === 'ห้องออกคืนประกัน' && r.status === 'คืนประกัน') return true;
                            if (s.name === 'ปรับปรุง' && r.status === 'รอซ่อม') return true;
                            return false;
                        },
                        icon: getIconForStatus(s.name)
                    };
                });
            } else {
                CARD_DEFS = [
                    { id: 'occupied', label: 'ไม่ว่าง', color: 'red', filterFn: r => r.status === 'ไม่ว่าง', icon: 'fa-user-check' },
                    { id: 'vacant', label: 'ห้องว่าง', color: 'emerald', filterFn: r => r.status === 'ห้องว่าง' || r.status === 'ว่าง' || !r.status, icon: 'fa-door-open' },
                    { id: 'reserved', label: 'ห้องจอง', color: 'yellow', filterFn: r => r.status === 'ห้องจอง' || r.status === 'จอง', icon: 'fa-calendar-check' },
                    { id: 'refund', label: 'ห้องออกคืนประกัน', color: 'cyan', filterFn: r => r.status === 'ห้องออกคืนประกัน', icon: 'fa-money-bill-transfer' },
                    { id: 'writeoff', label: 'ห้องตัดหนี', color: 'purple', filterFn: r => r.status === 'ห้องตัดหนี', icon: 'fa-user-slash' },
                    { id: 'repair', label: 'ปรับปรุง', color: 'gray', filterFn: r => r.status === 'ปรับปรุง' || r.status === 'รอซ่อม', icon: 'fa-screwdriver-wrench' }
                ];
            }
            
            // Sort CARD_DEFS
            const orderMap = {
                'ไม่ว่าง': 1,
                'occupied': 1,
                'ห้องว่าง': 2,
                'vacant': 2,
                'ห้องจอง': 3,
                'reserved': 3,
                'ห้องตัดหนี': 4,
                'writeoff': 4,
                'ห้องออกคืนประกัน': 5,
                'refund': 5,
                'ปรับปรุง': 6,
                'repair': 6
            };
            
            CARD_DEFS.sort((a, b) => {
                const orderA = orderMap[a.id] || orderMap[a.label] || 99;
                const orderB = orderMap[b.id] || orderMap[b.label] || 99;
                return orderA - orderB;
            });
            
            // Add active Summary Cards
            const activeSummaryCards = (STATE.summaryCards || []).filter(c => c.project === STATE.currentProject && c.enabled !== false);
            activeSummaryCards.forEach(sc => {
                CARD_DEFS.push({
                    id: 'summary_' + sc.id,
                    label: sc.title,
                    color: sc.color || 'teal',
                    isHex: sc.colorType === 'hex',
                    filterFn: r => {
                        const statuses = sc.statuses || [];
                        if (statuses.includes(r.status)) return true;
                        if (statuses.includes('ห้องว่าง') && (r.status === 'ว่าง' || !r.status)) return true;
                        if (statuses.includes('ห้องจอง') && r.status === 'จอง') return true;
                        if (statuses.includes('ห้องออกคืนประกัน') && r.status === 'คืนประกัน') return true;
                        if (statuses.includes('ปรับปรุง') && (r.status === 'รอซ่อม' || r.status === 'ชำรุด')) return true;
                        if (statuses.includes('ห้องตัดหนี') && r.status === 'ตัดหนี') return true;
                        return false;
                    },
                    icon: sc.icon || 'fa-layer-group',
                    isSummary: true
                });
            });

            // Always add 'all' at the end
            CARD_DEFS.push({ id: 'all', label: 'ทั้งหมด', color: 'blue', isHex: false, filterFn: r => true, icon: 'fa-border-all' });

            // Apply custom card order if configured
            const projectCardOrder = STATE.cardOrder && STATE.cardOrder[STATE.currentProject];
            if (Array.isArray(projectCardOrder) && projectCardOrder.length > 0) {
                CARD_DEFS.sort((a, b) => {
                    const idxA = projectCardOrder.indexOf(a.id) !== -1 ? projectCardOrder.indexOf(a.id) : 
                                 (projectCardOrder.indexOf(a.label) !== -1 ? projectCardOrder.indexOf(a.label) : 999);
                    const idxB = projectCardOrder.indexOf(b.id) !== -1 ? projectCardOrder.indexOf(b.id) : 
                                 (projectCardOrder.indexOf(b.label) !== -1 ? projectCardOrder.indexOf(b.label) : 999);
                    if (idxA !== idxB) return idxA - idxB;
                    return 0;
                });
            }

            // Helper to get reserved card for expired booking logic
            const reservedDef = CARD_DEFS.find(c => c.label.includes('จอง') || c.id === 'reserved') || CARD_DEFS[0];
            const reservedAll = STATE.data.filter(reservedDef.filterFn);
            const expiredBooking = reservedAll.filter(r => isBookingExpired(r)).length;

            function createDashCard(config) {
                const { id, color, icon, label, info, expiredCount, isHex, isSummary } = config;
                const s = getCardStyles(color, isHex);
                return `
                        <div onclick="renderRoomListByStatus('${id.replace(/'/g, "\\'")}')" class="bg-white p-4 sm:p-5 rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.03)] border ${isSummary ? 'border-teal-200 ring-1 ring-teal-400/20' : 'border-gray-100'} flex flex-col justify-between cursor-pointer hover:shadow-[0_8px_24px_rgba(0,0,0,0.06)] ${s.hoverBorder} hover:-translate-y-1 transition-all duration-300 group min-h-[160px] relative overflow-hidden">
                            <!-- Subtle Glow -->
                            <div class="absolute -right-12 -top-12 w-40 h-40 ${s.glowClass} rounded-full blur-2xl transition-opacity duration-500 pointer-events-none" ${s.glowStyle}></div>
                            
                            <div class="flex justify-between items-start mb-4 shrink-0 z-10 relative">
                                <div class="flex items-center gap-3">
                                    <div class="w-10 h-10 rounded-xl ${s.iconBoxClass} flex items-center justify-center group-hover:scale-105 transition-transform duration-300" ${s.iconBoxStyle}>
                                        <i class="fa-solid ${icon} text-lg"></i>
                                    </div>
                                    <div>
                                        <div class="flex items-center gap-1.5 flex-wrap">
                                            <span class="text-gray-600 text-sm font-bold tracking-wide">${label}</span>
                                            ${isSummary ? `<span class="text-[9px] font-extrabold text-teal-700 bg-teal-50 border border-teal-200 px-1.5 py-0.5 rounded-full">สรุปยอด</span>` : ''}
                                        </div>
                                    </div>
                                </div>
                                <div class="w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                    <i class="fa-solid fa-arrow-right text-[11px] text-gray-300 ${s.textClass}" ${s.textStyle}></i>
                                </div>
                            </div>

                            ${info.mode === 'single' ? `
                                <div class="flex flex-col justify-center flex-1 z-10 relative pb-2">
                                    <div class="flex items-baseline gap-2">
                                        <span class="text-5xl font-extrabold text-gray-800 tracking-tight">${info.total}</span>
                                        ${expiredCount > 0 ? `<span class="text-[11px] font-bold text-orange-600 bg-orange-50 border border-orange-100 px-2 py-0.5 rounded-full shadow-sm" title="หลุดจอง (เกินกำหนด)">${expiredCount} หลุด</span>` : ''}
                                    </div>
                                </div>
                            ` : `
                                <div class="flex-1 overflow-y-auto pr-1 space-y-1.5 scrollbar-hide mb-3 max-h-[120px] z-10 relative mt-1">
                                    ${info.groups.map(g => `
                                        <div onclick="event.stopPropagation(); renderRoomListByStatus('${id.replace(/'/g, "\\'")}', { groupName: '${g.name.replace(/'/g, "\\'")}' })" 
                                             class="flex items-center justify-between cursor-pointer bg-gray-50/50 ${s.itemHover} px-3 py-2 rounded-xl border border-transparent ${s.hoverBorder} transition-colors group/item">
                                            <span class="text-xs font-medium text-gray-500 group-hover/item:text-gray-700 transition-colors">${g.name}</span>
                                            <span class="text-sm font-bold text-gray-700 ${s.textClass} transition-colors leading-none" ${s.textStyle}>${g.count}</span>
                                        </div>
                                    `).join('')}
                                </div>
                                <div class="shrink-0 pt-3 border-t border-gray-50 flex items-center justify-between z-10 relative">
                                    <span class="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">รวมทั้งหมด</span>
                                    <div class="flex items-baseline gap-1.5">
                                        <span class="text-2xl font-extrabold text-gray-800 leading-none">${info.total}</span>
                                        ${expiredCount > 0 ? `<span class="text-[9px] font-bold text-orange-600 bg-orange-50 border border-orange-100 px-1.5 py-0.5 rounded-full">${expiredCount} หลุด</span>` : ''}
                                    </div>
                                </div>
                            `}
                        </div>
                `;
            }

            const definedTypes = STATE.projectRoomTypes;
            const definedNames = definedTypes.map(rt => rt.name);
            const dataNames = [...new Set(STATE.data.map(item => item.roomType || 'Standard'))];
            const allTypeNames = [...new Set([...definedNames, ...dataNames])].sort();

            // Build category groups
            const categoryMap = new Map(); // category -> [{name, price, detail, count}]
            allTypeNames.forEach(t => {
                const meta = STATE.projectRoomTypes.find(rt => rt.name === t) || { price: '-', detail: '', color: 'gray', category: t };
                const cat = meta.category || t;
                const count = STATE.data.filter(r => (r.status === 'ห้องว่าง' || r.status === 'ว่าง' || !r.status) && (r.roomType || 'Standard') === t).length;
                if (!categoryMap.has(cat)) categoryMap.set(cat, []);
                categoryMap.get(cat).push({ name: t, price: meta.price, detail: meta.detail, color: meta.color, count });
            });

            let typeHtml = '';
            if (categoryMap.size > 0) {
                // Sort categories: multi-type groups first, then single-type, alphabetically within each
                const sortedCats = [...categoryMap.keys()].sort((a, b) => {
                    const aMulti = categoryMap.get(a).length > 1 ? 0 : 1;
                    const bMulti = categoryMap.get(b).length > 1 ? 0 : 1;
                    if (aMulti !== bMulti) return aMulti - bMulti;
                    return a.localeCompare(b);
                });
                sortedCats.forEach(cat => {
                    const types = categoryMap.get(cat);
                    const totalCount = types.reduce((s, t) => s + t.count, 0);

                    if (types.length === 1) {
                        // Single type in category — show compact card like before
                        const t = types[0];
                        typeHtml += `
                        <div onclick="renderAvailableRoomsByType('${t.name.replace(/'/g, "\\'")}')" class="bg-white p-5 rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.03)] border border-gray-100 flex flex-col cursor-pointer hover:shadow-[0_8px_24px_rgba(0,0,0,0.06)] hover:border-emerald-200 hover:-translate-y-1 transition-all duration-300 group h-full min-h-[240px] relative overflow-hidden">
                            <div class="absolute -right-12 -top-12 w-40 h-40 bg-emerald-500 opacity-[0.03] group-hover:opacity-[0.08] rounded-full blur-2xl transition-opacity duration-500 pointer-events-none"></div>
                            
                            <div class="flex justify-between items-start mb-4 z-10 relative">
                                <div class="flex items-center gap-3 w-full">
                                    <div class="w-10 h-10 rounded-xl bg-emerald-500 text-white shadow-emerald-500/30 shadow-sm flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform duration-300">
                                        <i class="fa-solid fa-door-closed text-lg"></i>
                                    </div>
                                    <div class="flex-1 min-w-0">
                                        <h3 class="text-sm font-bold text-gray-700 group-hover:text-emerald-600 transition truncate">${t.name}</h3>
                                        <span class="inline-block text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100 mt-0.5">${t.price} ฿</span>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="flex flex-col items-center justify-center flex-1 my-2 z-10 relative">
                                <span class="text-5xl font-extrabold text-gray-800 tracking-tight group-hover:scale-105 transition-transform duration-300">${t.count}</span>
                                <span class="text-[10px] font-semibold text-gray-400 mt-1 uppercase tracking-widest">ว่าง</span>
                            </div>
                            
                            <div class="w-full mt-auto z-10 relative">
                                <div class="text-[11px] text-gray-500 line-clamp-2 min-h-[2.5em] bg-gray-50/50 p-2 rounded-lg border border-transparent group-hover:border-gray-100 transition-colors">
                                    ${t.detail || '-'}
                                </div>
                            </div>
                        </div>`;
                    } else {
                        // Multi-type category — grouped card
                        typeHtml += `
                        <div class="bg-white p-5 rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.03)] border border-gray-100 flex flex-col hover:shadow-[0_8px_24px_rgba(0,0,0,0.06)] hover:border-indigo-200 transition-all duration-300 h-full min-h-[240px] max-h-[280px] relative overflow-hidden group">
                            <div class="absolute -right-12 -top-12 w-40 h-40 bg-indigo-500 opacity-[0.03] group-hover:opacity-[0.08] rounded-full blur-2xl transition-opacity duration-500 pointer-events-none"></div>
                            
                            <div class="flex justify-between items-start mb-4 z-10 relative shrink-0">
                                <div class="flex items-center gap-3">
                                    <div class="w-10 h-10 rounded-xl bg-indigo-500 text-white shadow-indigo-500/30 shadow-sm flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform duration-300">
                                        <i class="fa-solid fa-layer-group text-lg"></i>
                                    </div>
                                    <div>
                                        <h3 class="text-sm font-bold text-gray-700 tracking-wide">${cat}</h3>
                                        <span class="inline-block text-[10px] font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100 mt-0.5">หมวดหมู่</span>
                                    </div>
                                </div>
                                <div class="flex flex-col items-end">
                                    <span class="text-2xl font-extrabold text-indigo-600 leading-none">${totalCount}</span>
                                    <span class="text-[9px] font-semibold text-gray-400 uppercase tracking-widest mt-1">ว่างรวม</span>
                                </div>
                            </div>
                            
                            <div class="flex-1 overflow-y-auto pr-1 space-y-2 scrollbar-hide z-10 relative">
                                ${types.map(t => `
                                <div onclick="renderAvailableRoomsByType('${t.name.replace(/'/g, "\\'")}')" class="cursor-pointer p-2.5 rounded-xl bg-gray-50/50 border border-transparent hover:border-indigo-200 hover:bg-indigo-50/30 transition-all group/sub flex flex-col justify-between">
                                    <div class="flex items-center justify-between mb-1">
                                        <span class="text-xs font-bold text-gray-700 group-hover/sub:text-indigo-600 transition truncate mr-2">${t.name}</span>
                                        <div class="flex items-center gap-2 shrink-0">
                                            <span class="text-[10px] font-semibold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded-md border border-indigo-100">${t.price} ฿</span>
                                            <span class="text-base font-extrabold ${t.count > 0 ? 'text-gray-800' : 'text-gray-300'} group-hover/sub:text-indigo-600 transition w-4 text-right">${t.count}</span>
                                        </div>
                                    </div>
                                    <div class="text-[10px] text-gray-400 truncate w-full">${t.detail || '-'}</div>
                                </div>`).join('')}
                            </div>
                        </div>`;
                    }
                });
            } else {
                typeHtml = '<div class="col-span-full text-center text-gray-400 py-4 text-sm">ไม่พบข้อมูลประเภทห้อง</div>';
            }

            document.getElementById('mainContent').innerHTML = `
                <div class="p-6 max-w-7xl mx-auto fade-in-up">
                    <div class="flex justify-between items-center mb-6 flex-wrap gap-4">
                        <h2 class="text-2xl font-bold text-gray-800">ภาพรวมโครงการ</h2>
                        <div class="flex items-center gap-2.5">
                            <button onclick="renderSettingsCardOrder()" class="bg-white border border-gray-200 text-gray-700 px-3.5 py-2 rounded-lg hover:bg-gray-50 transition text-sm font-semibold shadow-xs flex items-center hover:border-amber-300" title="จัดเรียงลำดับการ์ด">
                                <i class="fa-solid fa-arrow-down-up-across-line mr-2 text-amber-500"></i> จัดเรียงการ์ด
                            </button>
                            <button onclick="openReportModal()" class="bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition text-sm font-medium shadow flex items-center hover:shadow-md">
                                <i class="fa-solid fa-print mr-2"></i> รายงานภาพรวม
                            </button>
                        </div>
                    </div>
                    
                    <!-- Main Status Cards -->
                    <div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 mb-8">
                        ${CARD_DEFS.map(def => {
                            const info = getCardCountGroups(def.id, def.filterFn);
                            let expired = 0;
                            if (def.label.includes('จอง') || def.id === 'reserved') {
                                expired = expiredBooking;
                            }
                            return createDashCard({ 
                                id: def.id, 
                                color: def.color, 
                                icon: def.icon, 
                                label: def.label, 
                                info: info, 
                                expiredCount: expired,
                                isHex: def.isHex
                            });
                        }).join('')}
                    </div>

                    <!-- Vacant by Type -->
                    <div class="bg-gray-50 rounded-2xl p-6 border border-gray-200">
                        <div class="flex justify-between items-center mb-4 flex-wrap gap-2">
                            <h3 class="font-bold text-lg text-gray-700 flex items-center">
                                <i class="fa-solid fa-layer-group mr-2 text-emerald-500"></i> 
                                ห้องว่างแยกตามประเภท
                            </h3>
                            <div class="flex items-center gap-2">
                                <div class="flex items-center gap-1.5 bg-white border border-gray-200 rounded-lg px-2 py-1 shadow-sm">
                                    <i class="fa-solid fa-grip text-gray-400 text-xs"></i>
                                    <button onclick="changeDashCols(-1)" class="w-6 h-6 flex items-center justify-center rounded hover:bg-gray-100 text-gray-500 text-sm font-bold transition">−</button>
                                    <span id="dashColLabel" class="text-xs font-bold text-gray-600 w-4 text-center">${STATE._dashCols || 4}</span>
                                    <button onclick="changeDashCols(1)" class="w-6 h-6 flex items-center justify-center rounded hover:bg-gray-100 text-gray-500 text-sm font-bold transition">+</button>
                                </div>
                            </div>
                        </div>
                        <div id="dashTypeGrid" class="grid gap-4" style="grid-template-columns: repeat(${STATE._dashCols || 4}, minmax(0, 1fr));">
                            ${typeHtml}
                        </div>
                    </div>
                </div>
            `;
            updateActiveNav(0);

            // Smart Expired Booking Notification
            checkExpiredBookingNotifications();
        }

        // --- Available Rooms by Type View ---
        function renderAvailableRoomsByType(type) {
            STATE.currentView = 'available_view';
            const meta = STATE.projectRoomTypes.find(rt => rt.name === type) || { price: '-', detail: '-' };

            const allAvailable = STATE.data.filter(r => (r.status === 'ห้องว่าง' || r.status === 'ว่าง' || !r.status) && ((r.roomType || 'Standard') === type));
            const buildings = [...new Set(allAvailable.map(r => parseRoomInfo(r.roomNo).building))].sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }));

            let html = `
                <div class="flex flex-col h-full fade-in-up relative">
                    <div class="px-6 pt-6 pb-4 bg-white shadow-sm flex flex-col space-y-4 sticky top-0 z-30">
                        <div class="flex justify-between items-start flex-wrap gap-4">
                            <div class="flex items-start">
                                <button onclick="renderDashboard()" class="mr-3 text-gray-500 hover:text-emerald-600 bg-white p-1 rounded-full shadow w-8 h-8 flex items-center justify-center transition hover:bg-gray-50"><i class="fa-solid fa-arrow-left"></i></button>
                                <div>
                                    <h2 class="font-bold text-xl text-gray-800 flex items-center gap-2">
                                        <span class="bg-emerald-100 p-1 rounded text-emerald-600"><i class="fa-solid fa-tag text-sm"></i></span>
                                        ห้องว่างประเภท: ${type}
                                    </h2>
                                    <div class="flex items-center gap-3 mt-1">
                                         <span class="text-xs font-bold text-gray-600 bg-gray-100 px-2 py-0.5 rounded">ราคา: ${meta.price} ฿</span>
                                         <p class="text-xs text-gray-500">พบทั้งหมด <span class="font-bold text-emerald-600">${allAvailable.length}</span> ห้อง</p>
                                    </div>
                                </div>
                            </div>
                            <div class="flex items-center space-x-3">
                                 <input type="hidden" id="current_view_type" value="${type}">
                                 
                                 <!-- Search Input -->
                                 <div class="relative">
                                     <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                                         <i class="fa-solid fa-search"></i>
                                     </div>
                                     <input type="text" id="av_search_filter" onkeyup="filterAvailableRooms('${type}')" placeholder="ค้นหาเลขห้อง..." 
                                        class="bg-white border border-gray-200 text-gray-700 py-2 pl-10 pr-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm shadow-sm transition w-40 md:w-56">
                                 </div>

                                 <div class="relative group">
                                    <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                                        <i class="fa-solid fa-building"></i>
                                    </div>
                                    <select id="av_building_filter" onchange="filterAvailableRooms('${type}')" class="appearance-none bg-white border border-gray-200 text-gray-700 py-2 pl-10 pr-8 rounded-lg leading-tight focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm font-medium shadow-sm cursor-pointer hover:border-emerald-300 transition">
                                        <option value="All">ทุกตึก / ทั้งหมด</option>
                                        ${buildings.map(b => `<option value="${b}">ตึก ${b}</option>`).join('')}
                                    </select>
                                    <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
                                        <i class="fa-solid fa-chevron-down text-xs"></i>
                                    </div>
                                 </div>
                                 <div class="flex rounded-lg shadow-sm">
                                    <button onclick="exportAvailableRooms('${type}', 'excel')" class="bg-emerald-600 text-white px-4 py-2 rounded-l-lg hover:bg-emerald-700 transition text-sm font-medium border-r border-emerald-700 flex items-center"><i class="fa-solid fa-file-excel mr-2"></i>Export</button>
                                    <button onclick="exportAvailableRooms('${type}', 'pdf')" class="bg-white text-red-500 border border-gray-200 px-3 py-2 rounded-r-lg hover:bg-red-50 transition text-sm font-medium flex items-center" title="PDF"><i class="fa-solid fa-file-pdf"></i></button>
                                 </div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="p-6 overflow-y-auto pb-24 bg-gray-50 flex-1" id="availableRoomsContainer">
                        ${generateAvailableGrid(allAvailable)}
                    </div>
                </div>
            `;

            document.getElementById('mainContent').innerHTML = html;
            updateActiveNav(-1);
        }

        function filterAvailableRooms(type) {
            const bldg = document.getElementById('av_building_filter').value;
            const searchText = document.getElementById('av_search_filter').value.toLowerCase().trim();

            let filtered = STATE.data.filter(r => (r.status === 'ห้องว่าง' || r.status === 'ว่าง' || !r.status) && ((r.roomType || 'Standard') === type));

            // Filter by Building
            if (bldg !== 'All') {
                filtered = filtered.filter(r => parseRoomInfo(r.roomNo).building === bldg);
            }

            // Filter by Search Text
            if (searchText) {
                filtered = filtered.filter(r => r.roomNo.toLowerCase().includes(searchText));
            }

            document.getElementById('availableRoomsContainer').innerHTML = generateAvailableGrid(filtered);
        }

        function generateAvailableGrid(data) {
            if (data.length === 0) return `
                <div class="flex flex-col items-center justify-center py-20 text-gray-400">
                    <i class="fa-regular fa-folder-open text-6xl mb-4 opacity-30"></i>
                    <p>ไม่พบห้องว่างในเงื่อนไขนี้</p>
                </div>`;

            data.sort((a, b) => a.roomNo.localeCompare(b.roomNo, undefined, { numeric: true }));

            return `
                <div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 animate-fade-in-up">
                    ${data.map(r => `
                        <div class="bg-white p-4 rounded-xl shadow-sm border border-gray-200 hover:shadow-lg hover:border-emerald-300 transition cursor-pointer group relative overflow-hidden" onclick="openModal('${r.rowIndex}')">
                            ${r.isSampleRoom ? `<div class="absolute top-0 right-0 bg-gradient-to-l from-yellow-400 to-yellow-500 text-white text-[9px] font-bold px-3 py-1 rounded-bl-lg shadow-sm z-20">ห้องตัวอย่าง</div>` : ''}
                            <div class="absolute -right-4 -top-4 w-16 h-16 bg-emerald-50 rounded-full group-hover:bg-emerald-100 transition"></div>
                            <div class="relative z-10">
                                <div class="font-bold text-2xl text-gray-800 mb-1 group-hover:text-emerald-700 transition">${r.roomNo}</div>
                                <div class="text-xs text-gray-500 mb-3 flex items-center"><i class="fa-regular fa-building mr-1"></i> ${parseRoomInfo(r.roomNo).building} <span class="mx-1">•</span> FL.${parseRoomInfo(r.roomNo).floor}</div>
                                <div class="inline-flex items-center bg-emerald-100 text-emerald-700 text-[10px] px-2 py-1 rounded-full font-bold">
                                    <div class="w-1.5 h-1.5 bg-emerald-500 rounded-full mr-1.5 animate-pulse"></div> พร้อมอยู่
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            `;
        }

        function exportAvailableRooms(type, format) {
            const bldg = document.getElementById('av_building_filter').value;
            let filtered = STATE.data.filter(r => (r.status === 'ห้องว่าง' || r.status === 'ว่าง' || !r.status) && ((r.roomType || 'Standard') === type));

            if (bldg !== 'All') {
                filtered = filtered.filter(r => parseRoomInfo(r.roomNo).building === bldg);
            }

            if (filtered.length === 0) { showToast('Error', 'ไม่พบข้อมูลที่จะส่งออก', 'error'); return; }

            const scopeName = bldg === 'All' ? 'AllBuildings' : bldg;
            if (format === 'excel') exportExcelFile(filtered, scopeName, ['ห้องว่าง']);
            else exportPDFFile(filtered, scopeName, ['ห้องว่าง']);
        }

        // --- Generic Room List By Status (Reserved/Repair) ---
        function renderRoomListByStatus_OLD(statusKey) {
            STATE.currentView = 'status_view';
            let title = '';
            let themeColor = '';
            let icon = '';
            let filterFn = null;

            if (statusKey === 'reserved') {
                title = 'รายการห้องจอง/หลุดจอง';
                themeColor = 'yellow';
                icon = 'fa-bookmark';
                filterFn = r => r.status === 'ห้องจอง' || r.status === 'จอง';
            } else if (statusKey === 'repair') {
                title = 'รายการห้องปรับปรุง';
                themeColor = 'gray';
                icon = 'fa-screwdriver-wrench';
                filterFn = r => r.status === 'ปรับปรุง' || r.status === 'รอซ่อม';
            }

            const allData = STATE.data.filter(filterFn);
            const buildings = [...new Set(allData.map(r => parseRoomInfo(r.roomNo).building))].sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }));

            let html = `
                <div class="flex flex-col h-full fade-in-up relative">
                    <div class="px-6 pt-6 pb-4 bg-white shadow-sm flex flex-col space-y-4 sticky top-0 z-30">
                        <div class="flex justify-between items-center flex-wrap gap-4">
                            <div class="flex items-center">
                                <button onclick="renderDashboard()" class="mr-3 text-gray-500 hover:text-emerald-600 bg-white p-1 rounded-full shadow w-8 h-8 flex items-center justify-center transition hover:bg-gray-50"><i class="fa-solid fa-arrow-left"></i></button>
                                <div>
                                    <h2 class="font-bold text-xl text-gray-800 flex items-center gap-2">
                                        <span class="bg-${themeColor}-100 p-1 rounded text-${themeColor}-600"><i class="fa-solid ${icon} text-sm"></i></span>
                                        ${title}
                                    </h2>
                                    <p class="text-xs text-gray-500 mt-1">พบทั้งหมด <span class="font-bold text-${themeColor}-600">${allData.length}</span> ห้อง</p>
                                </div>
                            </div>
                            <div class="flex items-center space-x-3">
                                 <input type="hidden" id="current_status_key" value="${statusKey}">
                                 <div class="relative group">
                                    <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                                        <i class="fa-solid fa-building"></i>
                                    </div>
                                    <select id="st_building_filter" onchange="filterRoomListByStatus('${statusKey}')" class="appearance-none bg-white border border-gray-200 text-gray-700 py-2 pl-10 pr-8 rounded-lg leading-tight focus:outline-none focus:ring-2 focus:ring-${themeColor}-500 focus:border-transparent text-sm font-medium shadow-sm cursor-pointer hover:border-${themeColor}-300 transition">
                                        <option value="All">ทุกตึก / ทั้งหมด</option>
                                        ${buildings.map(b => `<option value="${b}">ตึก ${b}</option>`).join('')}
                                    </select>
                                    <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
                                        <i class="fa-solid fa-chevron-down text-xs"></i>
                                    </div>
                                 </div>
                                 <div class="flex rounded-lg shadow-sm">
                                    <button onclick="exportRoomListByStatus('${statusKey}', 'excel')" class="bg-emerald-600 text-white px-4 py-2 rounded-l-lg hover:bg-emerald-700 transition text-sm font-medium border-r border-emerald-700 flex items-center"><i class="fa-solid fa-file-excel mr-2"></i>Export</button>
                                    <button onclick="exportRoomListByStatus('${statusKey}', 'pdf')" class="bg-white text-red-500 border border-gray-200 px-3 py-2 rounded-r-lg hover:bg-red-50 transition text-sm font-medium flex items-center" title="PDF"><i class="fa-solid fa-file-pdf"></i></button>
                                 </div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="p-6 overflow-y-auto pb-24 bg-gray-50 flex-1" id="statusRoomsContainer">
                        ${generateGenericGrid(allData, statusKey)}
                    </div>
                </div>
            `;

            document.getElementById('mainContent').innerHTML = html;
            updateActiveNav(-1);
        }

        function filterRoomListByStatus_OLD(statusKey) {
            const bldg = document.getElementById('st_building_filter').value;
            let filterFn = null;
            if (statusKey === 'reserved') filterFn = r => r.status === 'ห้องจอง' || r.status === 'จอง';
            else if (statusKey === 'repair') filterFn = r => r.status === 'ปรับปรุง' || r.status === 'รอซ่อม';

            let filtered = STATE.data.filter(filterFn);

            if (bldg !== 'All') {
                filtered = filtered.filter(r => parseRoomInfo(r.roomNo).building === bldg);
            }

            document.getElementById('statusRoomsContainer').innerHTML = generateGenericGrid(filtered, statusKey);
        }

        function exportRoomListByStatus_OLD(statusKey, format) {
            const bldg = document.getElementById('st_building_filter').value;
            let filterFn = null;
            let statusFilterType = '';
            if (statusKey === 'reserved') { filterFn = r => r.status === 'ห้องจอง' || r.status === 'จอง'; statusFilterType = 'ห้องจอง'; }
            else if (statusKey === 'repair') { filterFn = r => r.status === 'ปรับปรุง' || r.status === 'รอซ่อม'; statusFilterType = 'ปรับปรุง'; }

            let filtered = STATE.data.filter(filterFn);

            if (bldg !== 'All') {
                filtered = filtered.filter(r => parseRoomInfo(r.roomNo).building === bldg);
            }

            if (filtered.length === 0) { showToast('Error', 'ไม่พบข้อมูลที่จะส่งออก', 'error'); return; }

            const scopeName = bldg === 'All' ? 'AllBuildings' : bldg;
            if (format === 'excel') exportExcelFile(filtered, scopeName, [statusFilterType]);
            else exportPDFFile(filtered, scopeName, [statusFilterType]);
        }

        function generateGenericGrid_OLD(data, statusKey) {
            if (data.length === 0) return `
                <div class="flex flex-col items-center justify-center py-20 text-gray-400">
                    <i class="fa-regular fa-folder-open text-6xl mb-4 opacity-30"></i>
                    <p>ไม่พบข้อมูลในเงื่อนไขนี้</p>
                </div>`;

            data.sort((a, b) => a.roomNo.localeCompare(b.roomNo, undefined, { numeric: true }));

            let badgeColor = 'gray';
            let badgeText = 'N/A';
            let borderColor = 'border-gray-300';

            if (statusKey === 'reserved') {
                badgeColor = 'yellow';
                badgeText = 'จองแล้ว';
                borderColor = 'hover:border-yellow-400';
            } else if (statusKey === 'repair') {
                badgeColor = 'gray';
                badgeText = 'รอซ่อม';
                borderColor = 'hover:border-gray-400';
            }

            return `
                <div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 animate-fade-in-up">
                    ${data.map(r => {
                const expired = (statusKey === 'reserved' || statusKey === 'ห้องจอง' || statusKey === 'จอง') && isBookingExpired(r);
                const cardBadgeColor = expired ? 'orange' : badgeColor;
                const cardBorderColor = expired ? 'hover:border-orange-400' : borderColor;
                const expiredLabel = expired ? 'หลุดจอง' : '';
                return `
                        <div class="bg-white p-4 rounded-xl shadow-sm border border-gray-200 hover:shadow-lg ${cardBorderColor} transition cursor-pointer group relative overflow-hidden" onclick="openModal('${r.rowIndex}')">
                            ${r.isSampleRoom ? `<div class="absolute top-0 right-0 bg-gradient-to-l from-yellow-400 to-yellow-500 text-white text-[9px] font-bold px-3 py-1 rounded-bl-lg shadow-sm z-20">ห้องตัวอย่าง</div>` : ''}
                            ${expired ? `<div class="absolute top-0 left-0 bg-orange-500 text-white text-[9px] font-bold px-2 py-0.5 rounded-br-lg shadow-sm z-20"><i class="fa-solid fa-clock mr-1"></i>หลุดจอง</div>` : ''}
                            <div class="absolute -right-4 -top-4 w-16 h-16 bg-${cardBadgeColor}-50 rounded-full group-hover:bg-${cardBadgeColor}-100 transition"></div>
                            <div class="relative z-10">
                                <div class="font-bold text-2xl text-gray-800 mb-1 group-hover:text-${cardBadgeColor}-600 transition">${r.roomNo}</div>
                                <div class="text-xs text-gray-500 mb-1 flex items-center"><i class="fa-regular fa-building mr-1"></i> ${parseRoomInfo(r.roomNo).building} <span class="mx-1">•</span> FL.${parseRoomInfo(r.roomNo).floor}</div>
                                <div class="text-xs text-gray-400 mb-2 flex items-center"><i class="fa-regular fa-calendar mr-1"></i> ${(r.status === 'ห้องจอง' && r.bookingDate) ? formatDateThai(r.bookingDate) : (r.moveInDate ? formatDateThai(r.moveInDate) : '-')}</div>
                                <div class="inline-flex items-center bg-${cardBadgeColor}-100 text-${cardBadgeColor}-700 text-[10px] px-2 py-1 rounded-full font-bold">
                                    <div class="w-1.5 h-1.5 bg-${cardBadgeColor}-500 rounded-full mr-1.5"></div> ${expired ? 'หลุดจอง' : r.status}
                                </div>
                                <div class="mt-2 text-[10px] text-gray-400 truncate"><i class="fa-solid fa-tag mr-1"></i> ${r.roomType || '-'}</div>
                            </div>
                        </div>
                    `}).join('')}
                </div>
            `;
        }

        // --- NEW IMPLEMENTATIONS (Reserved/Repair View Customizations) ---
        function renderRoomListByStatus(statusKey, opts = {}) {
            STATE.currentView = 'status_view';
            STATE.currentStatusKey = statusKey;
            const config = getStatusConfig(statusKey);
            
            let title = `รายการ${statusKey}`;
            let themeColor = config.color;
            let icon = getIconForStatus(statusKey);
            let filterFn = r => r.status === statusKey;
            let isHex = config.colorType === 'hex';

            if (summaryCard) {
                title = summaryCard.title || 'รายการสรุปยอดรวม';
                themeColor = summaryCard.color || 'teal';
                icon = summaryCard.icon || 'fa-layer-group';
                isHex = summaryCard.colorType === 'hex';
                filterFn = r => {
                    const statuses = summaryCard.statuses || [];
                    if (statuses.includes(r.status)) return true;
                    if (statuses.includes('ห้องว่าง') && (r.status === 'ว่าง' || !r.status)) return true;
                    if (statuses.includes('ห้องจอง') && r.status === 'จอง') return true;
                    if (statuses.includes('ห้องออกคืนประกัน') && r.status === 'คืนประกัน') return true;
                    if (statuses.includes('ปรับปรุง') && (r.status === 'รอซ่อม' || r.status === 'ชำรุด')) return true;
                    if (statuses.includes('ห้องตัดหนี') && r.status === 'ตัดหนี') return true;
                    return false;
                };
            } else if (statusKey === 'vacant' || statusKey === 'ห้องว่าง' || statusKey === 'ว่าง') {
                title = 'รายการห้องว่าง';
                filterFn = r => r.status === 'ห้องว่าง' || r.status === 'ว่าง' || !r.status;
            } else if (statusKey === 'reserved' || statusKey === 'ห้องจอง' || statusKey === 'จอง') {
                title = 'รายการห้องจอง/หลุดจอง';
                filterFn = r => r.status === 'ห้องจอง' || r.status === 'จอง';
            } else if (statusKey === 'repair' || statusKey === 'ปรับปรุง' || statusKey === 'รอซ่อม' || statusKey === 'ชำรุด') {
                title = 'รายการห้องชำรุด';
                filterFn = r => r.status === 'ปรับปรุง' || r.status === 'รอซ่อม' || r.status === 'ชำรุด';
            } else if (statusKey === 'refund' || statusKey === 'ห้องออกคืนประกัน' || statusKey === 'คืนประกัน') {
                title = 'ห้องออกคืนประกัน';
                filterFn = r => r.status === 'ห้องออกคืนประกัน' || r.status === 'คืนประกัน';
            } else if (statusKey === 'writeoff' || statusKey === 'ห้องตัดหนี' || statusKey === 'ตัดหนี') {
                title = 'ห้องตัดหนี';
                filterFn = r => r.status === 'ห้องตัดหนี' || r.status === 'ตัดหนี';
            } else if (statusKey === 'occupied' || statusKey === 'ไม่ว่าง') {
                title = 'รายการห้องมีลูกค้า';
                filterFn = r => r.status === 'ไม่ว่าง';
            } else if (statusKey === 'all') {
                title = 'รายการห้องทั้งหมด';
                themeColor = 'blue';
                icon = 'fa-border-all';
                filterFn = r => true;
            }

            let allData = STATE.data.filter(filterFn);
            // Group Filter Configuration
            const keyMap = {
                'ห้องว่าง': 'vacant', 'ว่าง': 'vacant',
                'ห้องจอง': 'reserved', 'จอง': 'reserved',
                'ปรับปรุง': 'repair', 'รอซ่อม': 'repair', 'ชำรุด': 'repair',
                'ห้องออกคืนประกัน': 'refund', 'คืนประกัน': 'refund',
                'ห้องตัดหนี': 'writeoff', 'ตัดหนี': 'writeoff',
                'ไม่ว่าง': 'occupied', 'all': 'all'
            };
            const mappedKey = keyMap[statusKey] || statusKey;
            let groupConfig = STATE.cardGroups && (STATE.cardGroups[mappedKey] || STATE.cardGroups[statusKey]);
            if ((!groupConfig || !groupConfig.enabled) && summaryCard) {
                groupConfig = (STATE.cardGroups && (STATE.cardGroups['vacant'] || STATE.cardGroups['ห้องว่าง'])) ||
                             Object.values(STATE.cardGroups || {}).find(cg => cg && cg.enabled && Array.isArray(cg.groups) && cg.groups.length > 0);
            }
            let hasGroups = groupConfig && groupConfig.enabled && Array.isArray(groupConfig.groups) && groupConfig.groups.length > 0;
            const selectedGroup = opts.groupName || 'All';

            let groupFilterHtml = '';
            if (hasGroups) {
                if (selectedGroup !== 'All') {
                    const group = groupConfig.groups.find(g => g.name === selectedGroup);
                    if (group && Array.isArray(group.buildings)) {
                        const bldgs = group.buildings.map(b => String(b).trim().toLowerCase());
                        allData = allData.filter(r => {
                            try { return bldgs.includes(String(parseRoomInfo(r.roomNo).building).trim().toLowerCase()); } catch (e) { return false; }
                        });
                        title += ` — ${selectedGroup}`;
                    }
                }

                groupFilterHtml = `
                    <div class="relative group">
                        <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                            <i class="fa-solid fa-layer-group"></i>
                        </div>
                        <select id="st_group_filter" onchange="filterRoomListByStatus('${statusKey}')" class="appearance-none bg-white border border-gray-200 text-gray-700 py-2 pl-10 pr-8 rounded-lg leading-tight focus:outline-none focus:ring-2 focus:ring-${themeColor}-500 focus:border-transparent text-sm font-medium shadow-sm cursor-pointer hover:border-${themeColor}-300 transition">
                            <option value="All">ทุกกลุ่ม</option>
                            ${groupConfig.groups.map(g => `<option value="${g.name.replace(/"/g, '&quot;')}" ${g.name === selectedGroup ? 'selected' : ''}>${g.name}</option>`).join('')}
                        </select>
                        <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
                            <i class="fa-solid fa-chevron-down text-xs"></i>
                        </div>
                    </div>
                `;
            } else if (opts && Array.isArray(opts.buildings) && opts.buildings.length > 0) {
                // Fallback for any old logic calling this with buildings array directly
                allData = allData.filter(r => opts.buildings.includes(parseRoomInfo(r.roomNo).building));
                title += ` — ${opts.buildings.join(', ')}`;
            }

            const buildings = [...new Set(allData.map(r => parseRoomInfo(r.roomNo).building))].sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }));

            // Summary Calculation & Clickable Room Type Filters
            const summary = {};
            allData.forEach(r => {
                const type = r.roomType || 'Standard';
                summary[type] = (summary[type] || 0) + 1;
            });
            const summaryTypes = Object.keys(summary).sort();

            // Generate the click-to-filter pill buttons
            let summaryHtml = `<button onclick="selectListTypeFilter('All')" id="btn_type_filter_All" class="bg-emerald-500 text-white border border-emerald-600 px-3 py-1 rounded-full text-xs font-bold mr-2 mb-2 transition hover:shadow-md outline-none">ทั้งหมด (${allData.length})</button>`;

            summaryHtml += summaryTypes.map(type => {
                const count = summary[type];
                const safeType = type.replace(/'/g, "\\'");
                return `<button onclick="selectListTypeFilter('${safeType}')" id="btn_type_filter_${type}" class="bg-${themeColor}-50 text-${themeColor}-700 border border-${themeColor}-200 hover:bg-${themeColor}-100 px-3 py-1 rounded-full text-xs font-bold mr-2 mb-2 transition outline-none">${type}: ${count}</button>`;
            }).join('');

            // Generate month options for reserved/moveout
            let monthFilterHtml = '';
            const isReserved = statusKey === 'reserved' || statusKey === 'ห้องจอง' || statusKey === 'จอง';
            const isRefund = statusKey === 'refund' || statusKey === 'ห้องออกคืนประกัน' || statusKey === 'คืนประกัน';
            const isWriteoff = statusKey === 'writeoff' || statusKey === 'ห้องตัดหนี' || statusKey === 'ตัดหนี';
            
            if (isReserved || isRefund || isWriteoff) {
                const monthSet = new Set();
                allData.forEach(r => {
                    const dateToUse = (isReserved && r.bookingDate) ? r.bookingDate : r.moveInDate;
                    if (dateToUse) {
                        const d = new Date(dateToUse);
                        if (!isNaN(d.getTime())) {
                            const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
                            monthSet.add(key);
                        }
                    }
                });
                const sortedMonths = [...monthSet].sort();
                const thaiMonths = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
                monthFilterHtml = `
                    <div class="relative group">
                        <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                            <i class="fa-regular fa-calendar"></i>
                        </div>
                        <select id="st_month_filter" onchange="filterRoomListByStatus('${statusKey}')" class="appearance-none bg-white border border-gray-200 text-gray-700 py-2 pl-10 pr-8 rounded-lg leading-tight focus:outline-none focus:ring-2 focus:ring-${themeColor}-500 focus:border-transparent text-sm font-medium shadow-sm cursor-pointer hover:border-${themeColor}-300 transition">
                            <option value="All">ทุกเดือน</option>
                            ${sortedMonths.map(m => {
                    const [y, mo] = m.split('-');
                    const thaiYear = parseInt(y) + 543;
                    const label = thaiMonths[parseInt(mo) - 1] + ' ' + thaiYear;
                    return `<option value="${m}">${label}</option>`;
                }).join('')}
                        </select>
                        <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
                            <i class="fa-solid fa-chevron-down text-xs"></i>
                        </div>
                    </div>
                `;
            }

            const stl = getCardStyles(themeColor, isHex);

            let html = `
                <div class="flex flex-col h-full fade-in-up relative">
                    <div class="px-6 pt-6 pb-4 bg-white shadow-sm flex flex-col space-y-4 sticky top-0 z-30">
                        <div class="flex justify-between items-start flex-wrap gap-4">
                            <div class="flex items-start">
                                <button onclick="renderDashboard()" class="mr-3 text-gray-500 hover:text-emerald-600 bg-white p-1 rounded-full shadow w-8 h-8 flex items-center justify-center transition hover:bg-gray-50"><i class="fa-solid fa-arrow-left"></i></button>
                                <div>
                                    <h2 class="font-bold text-xl text-gray-800 flex items-center gap-2">
                                        <span class="p-1 rounded ${stl.iconBoxClass}" ${stl.iconBoxStyle}><i class="fa-solid ${icon} text-sm"></i></span>
                                        ${title}
                                    </h2>
                                    <div class="mt-2 flex items-center gap-2 flex-wrap">
                                        <p class="text-xs text-gray-500">พบทั้งหมด <span class="font-bold ${stl.textClass}" ${stl.textStyle}>${allData.length}</span> ห้อง</p>
                                        <button onclick="toggleTypePills()" class="text-xs font-medium flex items-center gap-1 px-2 py-0.5 rounded-full border transition ${stl.textClass} hover:bg-gray-100" ${stl.textStyle} style="border-color: currentColor;">
                                            <span id="typePillsToggleText">ประเภทห้อง</span>
                                            <i id="typePillsToggleIcon" class="fa-solid fa-chevron-down text-[10px]"></i>
                                        </button>
                                    </div>
                                    <div id="typePillsContainer" class="mt-2 flex flex-wrap overflow-hidden transition-all duration-300" style="max-height:0; opacity:0;">
                                        ${summaryHtml}
                                    </div>
                                </div>
                            </div>
                            <div class="flex items-center space-x-3">
                                 <input type="hidden" id="current_status_key" value="${statusKey}">
                                 <input type="hidden" id="current_list_type_filter" value="All">
                                 
                                 <!-- Search Input -->
                                 <div class="relative">
                                     <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                                         <i class="fa-solid fa-search"></i>
                                     </div>
                                     <input type="text" id="st_search_filter" onkeyup="filterRoomListByStatus('${statusKey}')" placeholder="ค้นหาเลขห้อง..." 
                                        class="bg-white border border-gray-200 text-gray-700 py-2 pl-10 pr-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-${themeColor}-500 focus:border-transparent text-sm shadow-sm transition w-40 md:w-56">
                                 </div>

                                 <div class="relative group">
                                    <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                                        <i class="fa-solid fa-building"></i>
                                    </div>
                                    <select id="st_building_filter" onchange="filterRoomListByStatus('${statusKey}')" class="appearance-none bg-white border border-gray-200 text-gray-700 py-2 pl-10 pr-8 rounded-lg leading-tight focus:outline-none focus:ring-2 focus:ring-${themeColor}-500 focus:border-transparent text-sm font-medium shadow-sm cursor-pointer hover:border-${themeColor}-300 transition">
                                        <option value="All">ทุกตึก / ทั้งหมด</option>
                                        ${buildings.map(b => `<option value="${b}">ตึก ${b}</option>`).join('')}
                                    </select>
                                    <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
                                        <i class="fa-solid fa-chevron-down text-xs"></i>
                                    </div>
                                 </div>
                                 ${groupFilterHtml}
                                 ${monthFilterHtml}
                                 <div class="flex rounded-lg shadow-sm">
                                    <button onclick="exportRoomListByStatus('${statusKey}', 'excel')" class="bg-emerald-600 text-white px-4 py-2 rounded-l-lg hover:bg-emerald-700 transition text-sm font-medium border-r border-emerald-700 flex items-center"><i class="fa-solid fa-file-excel mr-2"></i>Export</button>
                                    <button onclick="exportRoomListByStatus('${statusKey}', 'pdf')" class="bg-white text-red-500 border border-gray-200 px-3 py-2 rounded-r-lg hover:bg-red-50 transition text-sm font-medium flex items-center" title="PDF"><i class="fa-solid fa-file-pdf"></i></button>
                                 </div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="p-6 overflow-y-auto pb-24 bg-gray-50 flex-1" id="statusRoomsContainer">
                        ${generateGenericGrid(allData, statusKey)}
                    </div>
                </div>
                        `;

            document.getElementById('mainContent').innerHTML = html;
            updateActiveNav(-1);
        }

        function filterRoomListByStatus(statusKey) {
            const bldg = document.getElementById('st_building_filter').value;
            const searchText = document.getElementById('st_search_filter').value.toLowerCase().trim();
            const typeFilter = document.getElementById('current_list_type_filter') ? document.getElementById('current_list_type_filter').value : 'All';

            let filterFn = r => r.status === statusKey;
            if (statusKey === 'vacant' || statusKey === 'ห้องว่าง' || statusKey === 'ว่าง') filterFn = r => r.status === 'ห้องว่าง' || r.status === 'ว่าง' || !r.status;
            else if (statusKey === 'reserved' || statusKey === 'ห้องจอง' || statusKey === 'จอง') filterFn = r => r.status === 'ห้องจอง' || r.status === 'จอง';
            else if (statusKey === 'repair' || statusKey === 'ปรับปรุง' || statusKey === 'รอซ่อม' || statusKey === 'ชำรุด') filterFn = r => r.status === 'ปรับปรุง' || r.status === 'รอซ่อม' || r.status === 'ชำรุด';
            else if (statusKey === 'refund' || statusKey === 'ห้องออกคืนประกัน' || statusKey === 'คืนประกัน') filterFn = r => r.status === 'ห้องออกคืนประกัน' || r.status === 'คืนประกัน';
            else if (statusKey === 'writeoff' || statusKey === 'ห้องตัดหนี' || statusKey === 'ตัดหนี') filterFn = r => r.status === 'ห้องตัดหนี' || r.status === 'ตัดหนี';
            else if (statusKey === 'occupied' || statusKey === 'ไม่ว่าง') filterFn = r => r.status === 'ไม่ว่าง';
            else if (statusKey === 'all') filterFn = r => true;

            let filtered = STATE.data.filter(filterFn);

            // Filter by Building
            if (bldg !== 'All') {
                filtered = filtered.filter(r => parseRoomInfo(r.roomNo).building === bldg);
            }

            // Filter by Group
            const groupFilter = document.getElementById('st_group_filter');
            if (groupFilter && groupFilter.value !== 'All') {
                const keyMap = {
                    'ห้องว่าง': 'vacant', 'ว่าง': 'vacant',
                    'ห้องจอง': 'reserved', 'จอง': 'reserved',
                    'ปรับปรุง': 'repair', 'รอซ่อม': 'repair', 'ชำรุด': 'repair',
                    'ห้องออกคืนประกัน': 'refund', 'คืนประกัน': 'refund',
                    'ห้องตัดหนี': 'writeoff', 'ตัดหนี': 'writeoff',
                    'ไม่ว่าง': 'occupied', 'all': 'all'
                };
                const mappedKey = keyMap[statusKey] || statusKey;
                const groupConfig = STATE.cardGroups && (STATE.cardGroups[mappedKey] || STATE.cardGroups[statusKey]);
                if (groupConfig && groupConfig.groups) {
                    const group = groupConfig.groups.find(g => g.name === groupFilter.value);
                    if (group && Array.isArray(group.buildings)) {
                        const bldgs = group.buildings.map(b => String(b).trim().toLowerCase());
                        filtered = filtered.filter(r => {
                            try { return bldgs.includes(String(parseRoomInfo(r.roomNo).building).trim().toLowerCase()); } catch (e) { return false; }
                        });
                    }
                }
            }

            // Filter by Room Type (new pill filters)
            if (typeFilter !== 'All') {
                const typeFilters = typeFilter.split('|||');
                filtered = filtered.filter(r => typeFilters.includes(r.roomType || 'Standard'));
            }

            // Filter by Search Text
            if (searchText) {
                filtered = filtered.filter(r => r.roomNo.toLowerCase().includes(searchText));
            }

            // Filter by Month (for reserved/moveout)
            const monthFilter = document.getElementById('st_month_filter');
            if (monthFilter && monthFilter.value !== 'All') {
                const isReserved = statusKey === 'reserved' || statusKey === 'ห้องจอง' || statusKey === 'จอง';
                const [filterYear, filterMonth] = monthFilter.value.split('-').map(Number);
                filtered = filtered.filter(r => {
                    const dateToUse = (isReserved && r.bookingDate) ? r.bookingDate : r.moveInDate;
                    if (!dateToUse) return false;
                    const d = new Date(dateToUse);
                    if (isNaN(d.getTime())) return false;
                    return d.getFullYear() === filterYear && (d.getMonth() + 1) === filterMonth;
                });
            }

            document.getElementById('statusRoomsContainer').innerHTML = generateGenericGrid(filtered, statusKey);
        }
        // Helper for toggling type pills visibility
        function toggleTypePills() {
            const container = document.getElementById('typePillsContainer');
            const icon = document.getElementById('typePillsToggleIcon');
            if (!container) return;
            const isHidden = container.style.maxHeight === '0px' || container.style.maxHeight === '0';
            if (isHidden) {
                container.style.maxHeight = container.scrollHeight + 'px';
                container.style.opacity = '1';
                if (icon) { icon.classList.remove('fa-chevron-down'); icon.classList.add('fa-chevron-up'); }
            } else {
                container.style.maxHeight = '0';
                container.style.opacity = '0';
                if (icon) { icon.classList.remove('fa-chevron-up'); icon.classList.add('fa-chevron-down'); }
            }
        }

        // Helper for selecting room type in the list view
        function selectListTypeFilter(type) {
            const filterInput = document.getElementById('current_list_type_filter');
            let currentSelection = filterInput.value.split('|||');

            if (type === 'All') {
                currentSelection = ['All'];
            } else {
                // If "All" is currently in the selection, remove it
                if (currentSelection.includes('All')) {
                    currentSelection = [];
                }

                // Toggle the selected type
                if (currentSelection.includes(type)) {
                    currentSelection = currentSelection.filter(t => t !== type);
                } else {
                    currentSelection.push(type);
                }

                // If nothing is selected after toggling, revert to "All"
                if (currentSelection.length === 0) {
                    currentSelection = ['All'];
                }
            }

            filterInput.value = currentSelection.join('|||');
            const statusKey = document.getElementById('current_status_key').value;

            // Adjust styling of pill buttons to show active state
            const buttons = document.querySelectorAll('button[id^="btn_type_filter_"]');

            // Default inactive styling (depends on status view)
            let inactiveBg = 'bg-gray-50';
            let inactiveText = 'text-gray-700';
            let inactiveBorder = 'border-gray-200';
            let activeBg = 'bg-emerald-500';
            let activeText = 'text-white';
            let activeBorder = 'border-emerald-600';

            if (statusKey === 'reserved') {
                inactiveBg = 'bg-yellow-50'; inactiveText = 'text-yellow-700'; inactiveBorder = 'border-yellow-200';
            } else if (statusKey === 'repair') {
                // Keep default gray
            } else if (statusKey === 'refund') {
                inactiveBg = 'bg-cyan-50'; inactiveText = 'text-cyan-700'; inactiveBorder = 'border-cyan-200';
                activeBg = 'bg-cyan-500'; activeBorder = 'border-cyan-600';
            } else if (statusKey === 'writeoff') {
                inactiveBg = 'bg-purple-50'; inactiveText = 'text-purple-700'; inactiveBorder = 'border-purple-200';
                activeBg = 'bg-purple-500'; activeBorder = 'border-purple-600';
            } else if (statusKey === 'occupied') {
                inactiveBg = 'bg-red-50'; inactiveText = 'text-red-700'; inactiveBorder = 'border-red-200';
                activeBg = 'bg-red-500'; activeBorder = 'border-red-600';
            }

            buttons.forEach(btn => {
                const btnType = btn.id.replace('btn_type_filter_', '');

                // Highlight active
                if (currentSelection.includes(btnType)) {
                    btn.className = `${activeBg} ${activeText} border ${activeBorder} px-3 py-1 rounded-full text-xs font-bold mr-2 mb-2 transition hover:shadow-md outline-none cursor-pointer`;
                } else {
                    btn.className = `${inactiveBg} ${inactiveText} border ${inactiveBorder} hover:brightness-95 px-3 py-1 rounded-full text-xs font-bold mr-2 mb-2 transition outline-none cursor-pointer opacity-75`;
                }
            });

            filterRoomListByStatus(statusKey);
        }

        function exportRoomListByStatus(statusKey, format) {
            const bldg = document.getElementById('st_building_filter').value;
            const typeFilter = document.getElementById('current_list_type_filter') ? document.getElementById('current_list_type_filter').value : 'All';

            let filterFn = r => r.status === statusKey;
            let statusFilterType = statusKey;
            if (statusKey === 'vacant' || statusKey === 'ห้องว่าง' || statusKey === 'ว่าง') { filterFn = r => r.status === 'ห้องว่าง' || r.status === 'ว่าง' || !r.status; statusFilterType = 'ห้องว่าง'; }
            else if (statusKey === 'reserved' || statusKey === 'ห้องจอง' || statusKey === 'จอง') { filterFn = r => r.status === 'ห้องจอง' || r.status === 'จอง'; statusFilterType = 'ห้องจอง'; }
            else if (statusKey === 'repair' || statusKey === 'ปรับปรุง' || statusKey === 'รอซ่อม' || statusKey === 'ชำรุด') { filterFn = r => r.status === 'ปรับปรุง' || r.status === 'รอซ่อม' || r.status === 'ชำรุด'; statusFilterType = 'ปรับปรุง'; }
            else if (statusKey === 'refund' || statusKey === 'ห้องออกคืนประกัน' || statusKey === 'คืนประกัน') { filterFn = r => r.status === 'ห้องออกคืนประกัน' || r.status === 'คืนประกัน'; statusFilterType = 'ห้องออกคืนประกัน'; }
            else if (statusKey === 'writeoff' || statusKey === 'ห้องตัดหนี' || statusKey === 'ตัดหนี') { filterFn = r => r.status === 'ห้องตัดหนี' || r.status === 'ตัดหนี'; statusFilterType = 'ห้องตัดหนี'; }
            else if (statusKey === 'occupied' || statusKey === 'ไม่ว่าง') { filterFn = r => r.status === 'ไม่ว่าง'; statusFilterType = 'ไม่ว่าง'; }

            let filtered = STATE.data.filter(filterFn);

            if (bldg !== 'All') {
                filtered = filtered.filter(r => parseRoomInfo(r.roomNo).building === bldg);
            }

            // Filter by Month (for reserved/moveout/etc)
            const monthFilter = document.getElementById('st_month_filter');
            if (monthFilter && monthFilter.value !== 'All') {
                const isReserved = statusKey === 'reserved' || statusKey === 'ห้องจอง' || statusKey === 'จอง';
                const [filterYear, filterMonth] = monthFilter.value.split('-').map(Number);
                filtered = filtered.filter(r => {
                    const dateToUse = (isReserved && r.bookingDate) ? r.bookingDate : r.moveInDate;
                    if (!dateToUse) return false;
                    const d = new Date(dateToUse);
                    if (isNaN(d.getTime())) return false;
                    return d.getFullYear() === filterYear && (d.getMonth() + 1) === filterMonth;
                });
            }

            // Filter by Group
            const groupFilter = document.getElementById('st_group_filter');
            if (groupFilter && groupFilter.value !== 'All') {
                const keyMap = {
                    'ห้องว่าง': 'vacant', 'ว่าง': 'vacant',
                    'ห้องจอง': 'reserved', 'จอง': 'reserved',
                    'ปรับปรุง': 'repair', 'รอซ่อม': 'repair', 'ชำรุด': 'repair',
                    'ห้องออกคืนประกัน': 'refund', 'คืนประกัน': 'refund',
                    'ห้องตัดหนี': 'writeoff', 'ตัดหนี': 'writeoff',
                    'ไม่ว่าง': 'occupied', 'all': 'all'
                };
                const mappedKey = keyMap[statusKey] || statusKey;
                const groupConfig = STATE.cardGroups && (STATE.cardGroups[mappedKey] || STATE.cardGroups[statusKey]);
                if (groupConfig && groupConfig.groups) {
                    const group = groupConfig.groups.find(g => g.name === groupFilter.value);
                    if (group && Array.isArray(group.buildings)) {
                        const bldgs = group.buildings.map(b => String(b).trim().toLowerCase());
                        filtered = filtered.filter(r => {
                            try { return bldgs.includes(String(parseRoomInfo(r.roomNo).building).trim().toLowerCase()); } catch (e) { return false; }
                        });
                    }
                }
            }

            if (typeFilter !== 'All') {
                const typeFilters = typeFilter.split('|||');
                filtered = filtered.filter(r => typeFilters.includes(r.roomType || 'Standard'));
            }

            if (filtered.length === 0) { showToast('Error', 'ไม่พบข้อมูลที่จะส่งออก', 'error'); return; }

            // Sort before export
            if (statusKey === 'reserved') {
                filtered.sort((a, b) => {
                    const dateA = a.bookingDate || a.moveInDate || '';
                    const dateB = b.bookingDate || b.moveInDate || '';
                    if (!dateA && !dateB) return String(a.roomNo).localeCompare(String(b.roomNo), undefined, { numeric: true });
                    if (!dateA) return 1;
                    if (!dateB) return -1;
                    return String(dateA).localeCompare(String(dateB));
                });
            } else {
                filtered.sort((a, b) => String(a.roomNo).localeCompare(String(b.roomNo), undefined, { numeric: true }));
            }

            const scopeName = bldg === 'All' ? 'AllBuildings' : bldg;
            if (format === 'excel') exportExcelFile(filtered, scopeName, [statusFilterType]);
            else exportPDFFile(filtered, scopeName, [statusFilterType]);
        }

        function generateGenericGrid(data, statusKey) {
            if (data.length === 0) return `
                <div class="flex flex-col items-center justify-center py-20 text-gray-400">
                    <i class="fa-regular fa-folder-open text-6xl mb-4 opacity-30"></i>
                    <p>ไม่พบข้อมูลในเงื่อนไขนี้</p>
                </div>`;

            // Sort: Reserved -> MoveInDate ascending, Others -> RoomNo
            if (statusKey === 'reserved') {
                data.sort((a, b) => {
                    const dateA = a.bookingDate || a.moveInDate || '';
                    const dateB = b.bookingDate || b.moveInDate || '';
                    // Push rooms without date to the end
                    if (!dateA && !dateB) return a.roomNo.localeCompare(b.roomNo, undefined, { numeric: true });
                    if (!dateA) return 1;
                    if (!dateB) return -1;
                    return dateA.localeCompare(dateB);
                });
            } else {
                data.sort((a, b) => a.roomNo.localeCompare(b.roomNo, undefined, { numeric: true }));
            }

            let badgeColor = 'gray';
            let badgeText = 'N/A';
            let borderColor = 'border-gray-300';

            if (statusKey === 'vacant') {
                badgeColor = 'emerald';
                badgeText = 'ว่าง';
                borderColor = 'hover:border-emerald-400';
            } else if (statusKey === 'reserved') {
                badgeColor = 'yellow';
                badgeText = 'จองแล้ว';
                borderColor = 'hover:border-yellow-400';
            } else if (statusKey === 'repair') {
                badgeColor = 'gray';
                badgeText = 'ชำรุด';
                borderColor = 'hover:border-gray-400';
            } else if (statusKey === 'refund') {
                badgeColor = 'cyan';
                badgeText = 'คืนประกัน';
                borderColor = 'hover:border-cyan-400';
            } else if (statusKey === 'writeoff') {
                badgeColor = 'purple';
                badgeText = 'ตัดหนี';
                borderColor = 'hover:border-purple-400';
            } else if (statusKey === 'occupied') {
                badgeColor = 'red';
                badgeText = 'มีลูกค้า';
                borderColor = 'hover:border-red-400';
            }

            // For vacant rooms, group by building
            if (statusKey === 'vacant') {
                const buildingGroups = {};
                data.forEach(r => {
                    const bldg = parseRoomInfo(r.roomNo).building || 'อื่นๆ';
                    if (!buildingGroups[bldg]) buildingGroups[bldg] = [];
                    buildingGroups[bldg].push(r);
                });
                const sortedBuildings = Object.keys(buildingGroups).sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }));

                return `<div class="space-y-6 animate-fade-in-up">${sortedBuildings.map(bldg => {
                    const rooms = buildingGroups[bldg];
                    rooms.sort((a, b) => a.roomNo.localeCompare(b.roomNo, undefined, { numeric: true }));
                    return `
                        <div class="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
                            <h3 class="text-base font-bold text-gray-700 mb-3 border-l-4 border-emerald-500 pl-3 flex items-center">
                                <i class="fa-regular fa-building mr-2 text-emerald-500"></i>ตึก ${bldg}
                                <span class="text-xs text-gray-400 font-normal ml-2">(${rooms.length} ห้อง)</span>
                            </h3>
                            <div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                                ${rooms.map(r => `
                                    <div class="bg-white p-3 rounded-xl shadow-sm border border-gray-200 hover:shadow-lg hover:border-emerald-400 transition cursor-pointer group relative overflow-hidden" onclick="openModal('${r.rowIndex}')">
                                        ${r.isSampleRoom ? '<div class="absolute top-0 right-0 bg-gradient-to-l from-yellow-400 to-yellow-500 text-white text-[9px] font-bold px-2 py-0.5 rounded-bl-lg shadow-sm z-20">ตัวอย่าง</div>' : ''}
                                        <div class="absolute -right-4 -top-4 w-14 h-14 bg-emerald-50 rounded-full group-hover:bg-emerald-100 transition"></div>
                                        <div class="relative z-10">
                                            <div class="font-bold text-xl text-gray-800 mb-1 group-hover:text-emerald-600 transition">${r.roomNo}</div>
                                            <div class="text-xs text-gray-500 mb-2 flex items-center"><i class="fa-regular fa-building mr-1"></i> FL.${parseRoomInfo(r.roomNo).floor}</div>
                                            <div class="inline-flex items-center bg-emerald-100 text-emerald-700 text-[10px] px-2 py-0.5 rounded-full font-bold">
                                                <div class="w-1.5 h-1.5 bg-emerald-500 rounded-full mr-1.5"></div> ว่าง
                                            </div>
                                            <div class="mt-1 text-[10px] text-gray-400 truncate"><i class="fa-solid fa-tag mr-1"></i> ${r.roomType || '-'}</div>
                                        </div>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    `;
                }).join('')}</div>`;
            }

            return `
                <div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 animate-fade-in-up">
                            ${data.map(r => {
                const expired = (statusKey === 'reserved' || statusKey === 'ห้องจอง' || statusKey === 'จอง') && isBookingExpired(r);
                const cardBadgeColor = expired ? 'orange' : badgeColor;
                const cardBorderColor = expired ? 'hover:border-orange-400' : borderColor;

                // Custom Line Logic
                let infoLine = `<div class="text-xs text-gray-500 mb-3 flex items-center"><i class="fa-regular fa-building mr-1"></i> ${parseRoomInfo(r.roomNo).building} <span class="mx-1">•</span> FL.${parseRoomInfo(r.roomNo).floor}</div>`;
                if (statusKey === 'reserved' || statusKey === 'ห้องจอง' || statusKey === 'จอง') {
                    const dateColor = expired ? 'text-orange-600 bg-orange-50' : 'text-yellow-600 bg-yellow-50';
                    const dateLabel = expired ? 'หลุดจอง' : 'เข้าอยู่';
                    const dateToDisplay = (r.bookingDate) ? formatDateThai(r.bookingDate) : formatDateThai(r.moveInDate);
                    infoLine = `<div class="text-xs mb-3 flex items-center ${dateColor} px-2 py-0.5 rounded"><i class="fa-regular fa-calendar mr-1"></i> ${dateLabel}: ${dateToDisplay}</div>`;
                }

                return `
                        <div class="bg-white p-4 rounded-xl shadow-sm border border-gray-200 hover:shadow-lg ${cardBorderColor} transition cursor-pointer group relative overflow-hidden" onclick="openModal('${r.rowIndex}')">
                            ${expired ? `<div class="absolute top-0 left-0 bg-orange-500 text-white text-[9px] font-bold px-2 py-0.5 rounded-br-lg shadow-sm z-20"><i class="fa-solid fa-clock mr-1"></i>หลุดจอง</div>` : ''}
                            <div class="absolute -right-4 -top-4 w-16 h-16 bg-${cardBadgeColor}-50 rounded-full group-hover:bg-${cardBadgeColor}-100 transition"></div>
                            <div class="relative z-10">
                                <div class="font-bold text-2xl text-gray-800 mb-1 group-hover:text-${cardBadgeColor}-600 transition">${r.roomNo}</div>
                                ${infoLine}
                                <div class="inline-flex items-center bg-${cardBadgeColor}-100 text-${cardBadgeColor}-700 text-[10px] px-2 py-1 rounded-full font-bold">
                                    <div class="w-1.5 h-1.5 bg-${cardBadgeColor}-500 rounded-full mr-1.5"></div> ${expired ? 'หลุดจอง' : (statusKey === 'repair' ? 'ชำรุด' : r.status)}
                                </div>
                                <div class="mt-2 text-[10px] text-gray-400 truncate"><i class="fa-solid fa-tag mr-1"></i> ${r.roomType || '-'}</div>
                            </div>
                        </div>
                        `;
            }).join('')
                }
                </div>
                        `;
        }
