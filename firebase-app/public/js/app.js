// Safe Storage Wrapper to prevent crashes in Incognito / strict privacy settings
window.SafeStorage = {
    _memory: {},
    isSupported: function() {
        try {
            const test = '__test__';
            window.localStorage.setItem(test, test);
            window.localStorage.removeItem(test);
            return true;
        } catch(e) {
            return false;
        }
    }(),
    getItem: function(key) {
        if (this.isSupported) {
            try { return window.localStorage.getItem(key); } catch(e) {}
        }
        return this._memory[key] || null;
    },
    setItem: function(key, value) {
        if (this.isSupported) {
            try { window.localStorage.setItem(key, value); return; } catch(e) {}
        }
        this._memory[key] = String(value);
    },
    removeItem: function(key) {
        if (this.isSupported) {
            try { window.localStorage.removeItem(key); return; } catch(e) {}
        }
        delete this._memory[key];
    }
};

        // --- Global State ---
        const STATE = {
            user: null,
            currentProject: null,
            data: [],
            allSettings: [], // Store ALL {project, name, price, detail, color}
            projectRoomTypes: [], // Store current project's types
            allRoomStatuses: [], // Store ALL room statuses
            projectRoomStatuses: [], // Store current project's room statuses
            lastFetch: 0,
            currentView: 'dashboard',
            currentBuildingFilter: null,
            currentFloor: null,
            roomListViewMode: 'floor_plan',
            layouts: {}, // Floor layout templates per building
            buildingStripes: {} // Building header color config
        };
        // Card grouping configs loaded from backend (cardKey -> { enabled, groups: [{name, buildings: []}] })
        STATE.cardGroups = {};

        const GOLF_VIEW_ZONES = {
            'A': ['A1', 'A2', 'A3', 'A4', 'A5', 'A6', 'A7'],
            'B': ['B1', 'B2', 'B3', 'B4', 'B5', 'B6', 'B7'],
            'C&M': ['C1', 'M1', 'C4', 'C5', 'C6', 'C7', 'M2'],
            'P': ['P1', 'P2', 'P3']
        };

        // --- Real-time Updates Listener ---
        window.addEventListener('roomsDataUpdated', (e) => {
            const { project, data } = e.detail;

            // Process the data like loadProject() does
            const processedData = data.map(item => ({
                ...item,
                roomType: item.roomType ? item.roomType.toString().trim() : 'Standard',
                status: item.status ? item.status.toString().trim() : 'ห้องว่าง'
            }));

            // Update local cache
            const cacheKey = `dms_data_${project}`;
            window.SafeStorage.setItem(cacheKey, JSON.stringify({ ts: Date.now(), data: processedData }));

            // If it's the currently active project, update STATE and view
            if (STATE.currentProject === project) {
                STATE.data = processedData;
                if (STATE.currentView === 'dashboard') renderDashboard();
                else if (STATE.currentView === 'visual_map') renderVisualMap();
                else if (STATE.currentView === 'room_list' && STATE.currentBuildingFilter) {
                    renderRoomList(STATE.currentBuildingFilter, STATE.currentFloor);
                }
            }
        });

        document.addEventListener('DOMContentLoaded', () => {
            checkSession();
            const tInput = document.getElementById('inp_tenantName');
            const sInput = document.getElementById('inp_status');
            if (tInput) {
                tInput.addEventListener('input', (e) => {
                    if (e.target.value.trim().length > 0) sInput.value = 'ไม่ว่าง';
                    else if (sInput.value === 'ไม่ว่าง') sInput.value = 'ห้องว่าง';
                });
            }
        });

        // --- Core API (Firebase Version) ---
        // แทนที่ google.script.run ด้วย Firestore operations โดยตรง
        async function callApi(action, payload = {}, options = {}) {
            if (!options.silent) showLoading(true);
            try {
                const result = await firebaseApiHandler({ action, payload });
                if (!options.silent) showLoading(false);
                return result;
            } catch (error) {
                if (!options.silent) showLoading(false);
                showToast('Error', error.message, 'error');
                throw error;
            }
        }

        // --- Auth & Init (Firebase Version) ---
        async function handleLogin(e) {
            e.preventDefault();
            showLoading(true);
            const username = document.getElementById('username').value;
            const password = document.getElementById('password').value;
            const res = await handleLoginFirebase(username, password);
            showLoading(false);
            if (res.success) {
                STATE.user = res.user;
                window.SafeStorage.setItem('dms_user', JSON.stringify(res.user));
                window.SafeStorage.setItem('dms_login_time', Date.now().toString());
                initApp();
            } else {
                showToast('Login Failed', res.message, 'error');
            }
        }

        async function handleRegister(e) {
            e.preventDefault();
            showLoading(true);
            const username = document.getElementById('reg_username').value;
            const password = document.getElementById('reg_password').value;
            const email = document.getElementById('reg_email').value;
            const res = await handleRegisterFirebase(username, password, email);
            showLoading(false);
            if (res.success) {
                showToast('สำเร็จ', res.message, 'success');
                switchAuthMode('login');
                document.getElementById('registerForm').reset();
            } else {
                showToast('ผิดพลาด', res.message, 'error');
            }
        }

        function saveSession(user) { window.SafeStorage.setItem('dms_user', JSON.stringify(user)); }

        function checkSession() {
            // 3-day session expiry check
            const THREE_DAYS_MS = 3 * 24 * 60 * 60 * 1000;
            const loginTime = window.SafeStorage.getItem('dms_login_time');
            if (loginTime && (Date.now() - parseInt(loginTime)) > THREE_DAYS_MS) {
                // Session expired — force logout
                window.SafeStorage.removeItem('dms_user');
                window.SafeStorage.removeItem('dms_login_time');
                auth.signOut();
                const viewLogin = document.getElementById('view-login');
                viewLogin.style.display = 'flex';
                showToast('Session Expired', 'เซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่', 'error');
                return;
            }

            // ใช้ Firebase Auth state listener
            auth.onAuthStateChanged(async (firebaseUser) => {
                if (firebaseUser) {
                    // User is signed in — ดึงข้อมูลจาก Firestore
                    try {
                        const userData = await getCurrentUserData();
                        if (userData) {
                            STATE.user = userData;
                            window.SafeStorage.setItem('dms_user', JSON.stringify(userData));
                            initApp();
                            
               // Admin Menus
            const navGolfD = document.getElementById('nav_golf_booking_desktop');
            const navGolfM = document.getElementById('nav_golf_booking_mobile');
            const navLogsD = document.getElementById('nav_admin_logs');
            const navLogsM = document.getElementById('nav_admin_logs_mobile');
            
            if (STATE.user && STATE.user.role === 'Admin') {
                if (navGolfD) navGolfD.classList.remove('hidden');
                if (navGolfM) navGolfM.classList.remove('hidden');
                if (navLogsD) navLogsD.classList.remove('hidden');
                if (navLogsM) navLogsM.classList.remove('hidden');
            } else {
                if (navGolfD) navGolfD.classList.add('hidden');
                if (navGolfM) navGolfM.classList.add('hidden');
                if (navLogsD) navLogsD.classList.add('hidden');
                if (navLogsM) navLogsM.classList.add('hidden');
            }
                        } else {
                            const viewLogin = document.getElementById('view-login');
                            viewLogin.style.display = 'flex';
                        }
                    } catch (e) {
                        console.error('checkSession error:', e);
                        const viewLogin = document.getElementById('view-login');
                        viewLogin.style.display = 'flex';
                    }
                } else {
                    // Not signed in — try localStorage fallback
                    const stored = window.SafeStorage.getItem('dms_user');
                    if (stored) {
                        try {
                            STATE.user = JSON.parse(stored);
                            initApp();
                        } catch (e) {
                            window.SafeStorage.removeItem('dms_user');
                            const viewLogin = document.getElementById('view-login');
                            viewLogin.style.display = 'flex';
                        }
                    } else {
                        const viewLogin = document.getElementById('view-login');
                        viewLogin.style.display = 'flex';
                    }
                }
            });
        }

        function logout() {
            showConfirmModal(
                'ยืนยันการออกจากระบบ',
                'คุณแน่ใจหรือไม่ว่าต้องการออกจากระบบ?',
                async () => {
                    try {
                        if (typeof handleLogoutFirebase === 'function') {
                            await handleLogoutFirebase();
                        } else {
                            await auth.signOut();
                        }
                    } catch (e) {
                        console.warn('Firebase signOut error:', e);
                    }
                    window.SafeStorage.removeItem('dms_user');
                    window.SafeStorage.removeItem('dms_login_time');
                    STATE.user = null;
                    STATE.currentProject = null;
                    STATE.data = [];
                    const viewMain = document.getElementById('view-main');
                    viewMain.style.display = 'none';
                    
                    const viewLogin = document.getElementById('view-login');
                    viewLogin.style.display = 'flex';
                    
                    document.getElementById('loginForm').reset();
                },
                'fa-solid fa-power-off text-orange-500',
                'bg-orange-50'
            );
        }

        function switchAuthMode(mode) {
            document.getElementById('loginForm').classList.add('hidden');
            document.getElementById('registerForm').classList.add('hidden');
            document.getElementById('forgotForm').classList.add('hidden');
            
            if (mode === 'register') {
                document.getElementById('registerForm').classList.remove('hidden');
            } else if (mode === 'forgot') {
                document.getElementById('forgotForm').classList.remove('hidden');
            } else {
                document.getElementById('loginForm').classList.remove('hidden');
            }
        }

        async function handleForgotPassword(e) {
            e.preventDefault();
            const email = document.getElementById('forgot_email').value;
            if (!email) return;

            showLoading(true);
            try {
                await auth.sendPasswordResetEmail(email);
                showLoading(false);
                showToast('สำเร็จ', 'ลิงก์รีเซ็ตรหัสผ่านถูกส่งไปยังอีเมลของคุณแล้ว', 'success');
                switchAuthMode('login');
                document.getElementById('forgotForm').reset();
            } catch (error) {
                showLoading(false);
                let msg = error.message;
                if (error.code === 'auth/user-not-found') {
                    msg = 'ไม่พบผู้ใช้งานที่ใช้อีเมลนี้ในระบบ';
                }
                showToast('ข้อผิดพลาด', msg, 'error');
            }
        }

        function initApp() {
            const viewLogin = document.getElementById('view-login');
            viewLogin.style.display = 'none';
            
            const viewMain = document.getElementById('view-main');
            viewMain.style.display = 'flex';
            
            document.getElementById('userDisplay').innerText = `${STATE.user.name}`;

            // Check Golf View Access
            const hasGolfAccess = STATE.user.role === 'Admin' || (STATE.user.projects && STATE.user.projects.includes('กอล์ฟวิว'));
            const golfDesktop = document.getElementById('nav_golf_booking_desktop');
            const golfMobile = document.getElementById('nav_golf_booking_mobile');

            if (hasGolfAccess) {
                if (golfDesktop) golfDesktop.classList.remove('hidden');
                if (golfMobile) golfMobile.classList.remove('hidden');
                if (golfMobile) golfMobile.style.display = 'flex';
            } else {
                if (golfDesktop) golfDesktop.classList.add('hidden');
                if (golfMobile) golfMobile.classList.add('hidden');
            }

            fetchSettings();

            // Auto-select: restore last project or auto-select if only 1 project
            const lastProject = window.SafeStorage.getItem('dms_lastProject');
            if (lastProject && STATE.user.projects && STATE.user.projects.includes(lastProject)) {
                selectProject(lastProject);
            } else if (STATE.user.projects && STATE.user.projects.length === 1) {
                selectProject(STATE.user.projects[0]);
            } else {
                showProjectSelector();
            }
        }

        function fetchSettings() {
            callApi('getSettings', {}, { silent: true }).then(res => {
                if (res.success) {
                    STATE.allSettings = res.roomTypes;
                    // Fix: If project is already selected, re-apply filter and render
                    if (STATE.currentProject) {
                        STATE.projectRoomTypes = STATE.allSettings.filter(s => s.project === STATE.currentProject);
                    }
                }
            });

            callApi('getRoomStatuses', {}, { silent: true }).then(res => {
                if (res.success) {
                    STATE.allRoomStatuses = res.statuses || [];
                    if (STATE.currentProject) {
                        STATE.projectRoomStatuses = STATE.allRoomStatuses.filter(s => s.project === STATE.currentProject);
                        ensureDefaultRoomStatuses(STATE.currentProject);
                        // Make sure we re-render dashboard if needed (since statuses might be loaded async)
                        if (STATE.currentView === 'dashboard') renderDashboard();
                    }
                }
            });
        }

        function ensureDefaultRoomStatuses(project) {
            const defaults = [
                { name: 'ห้องว่าง', colorType: 'predefined', color: 'emerald' },
                { name: 'ไม่ว่าง', colorType: 'predefined', color: 'red' },
                { name: 'ห้องจอง', colorType: 'predefined', color: 'yellow' },
                { name: 'ห้องออกคืนประกัน', colorType: 'predefined', color: 'cyan' },
                { name: 'ห้องตัดหนี', colorType: 'predefined', color: 'purple' },
                { name: 'ปรับปรุง', colorType: 'predefined', color: 'gray' }
            ];

            let changed = false;
            
            // Cleanup previously injected bad defaults to prevent duplicates
            const badNames = ['ว่าง', 'จอง', 'คืนประกัน', 'ตัดหนี'];
            const initialLength = STATE.allRoomStatuses.length;
            STATE.allRoomStatuses = STATE.allRoomStatuses.filter(s => !(s.project === project && badNames.includes(s.name)));
            if (STATE.allRoomStatuses.length !== initialLength) {
                changed = true;
            }

            defaults.forEach(d => {
                // If this default status doesn't exist for the project, inject it
                if (!STATE.allRoomStatuses.find(s => s.project === project && s.name === d.name)) {
                    STATE.allRoomStatuses.push({ project, ...d });
                    changed = true;
                }
            });

            if (changed) {
                STATE.projectRoomStatuses = STATE.allRoomStatuses.filter(s => s.project === project);
            }
        }

        function fetchLayouts(project) {
            console.log('[fetchLayouts] Calling getLayouts for project:', project || STATE.currentProject);
            return callApi('getLayouts', { project: project || STATE.currentProject }, { silent: true }).then(res => {
                console.log('[fetchLayouts] API response:', res ? JSON.stringify(res).substring(0, 500) : 'NULL');
                if (!res) {
                    console.error('[fetchLayouts] Response is null — backend may have crashed or returned undefined');
                    return;
                }
                if (res.success) {
                    STATE.layouts = {};
                    (res.layouts || []).forEach(l => {
                        console.log('[fetchLayouts] Processing building:', l.building, 'layout keys:', l.layout ? Object.keys(l.layout) : 'null');
                        // Backward compatibility: old format had topRow/bottomRow at building level
                        // New format has floor keys: { "2": { topRow, bottomRow, ... }, "3": ... }
                        if (l.layout && l.layout.topRow) {
                            console.log('[fetchLayouts] SKIPPING old format for building:', l.building);
                            return;
                        }
                        STATE.layouts[l.building] = l.layout;
                        console.log('[fetchLayouts] Stored layout for', l.building);
                    });
                    console.log('[fetchLayouts] Final STATE.layouts keys:', Object.keys(STATE.layouts));
                } else {
                    console.log('[fetchLayouts] API returned success=false:', res.message);
                }
            }).catch(err => {
                console.error('[fetchLayouts] Error:', err);
            });
        }

        // --- Navigation & Data ---
        function showProjectSelector() {
            STATE.currentView = 'selector';
            const container = document.getElementById('mainContent');
            let html = `
                <div class="max-w-4xl mx-auto pt-10 px-4 fade-in-up">
                    <h2 class="text-3xl font-bold text-center mb-10 text-gray-800">เลือกโครงการ</h2>
                    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            `;
            STATE.user.projects.forEach(p => {
                html += `
                    <div onclick="selectProject('${p}')" class="bg-white rounded-xl shadow-lg hover:shadow-2xl transition cursor-pointer p-6 border-t-4 border-apple-blue transform hover:-translate-y-1">
                        <div class="flex items-center justify-between mb-4">
                            <i class="fa-solid fa-building text-3xl text-blue-600"></i>
                            <span class="bg-blue-100 text-emerald-800 text-xs px-2 py-1 rounded-full font-bold">AVAILABLE</span>
                        </div>
                        <h3 class="text-xl font-bold text-gray-800">${p}</h3>
                        <p class="text-gray-500 text-sm mt-2">จัดการข้อมูลห้องพัก</p>
                    </div>`;
            });
            html += `</div></div>`;
            container.innerHTML = html;
            document.getElementById('navProjectName').innerText = "เลือกโครงการ";
            document.querySelector('aside').classList.add('hidden');
        }

        function selectProject(p) {
            STATE.currentProject = p;
            // Filter Settings for this Project
            STATE.projectRoomTypes = STATE.allSettings.filter(s => s.project === p);
            STATE.projectRoomStatuses = STATE.allRoomStatuses.filter(s => s.project === p);
            ensureDefaultRoomStatuses(p);

            document.getElementById('navProjectName').innerText = p;
            document.querySelector('aside').classList.remove('hidden');
            renderDashboard();
            // Save last selected project for auto-restore
            window.SafeStorage.setItem('dms_lastProject', p);
            // Load layouts first, then fetch project data (so layout templates are ready when rendering)
            fetchLayouts(p).catch(err => { console.error('[selectProject] fetchLayouts failed:', err); }).finally(() => {
                fetchBuildingStripes(p);
                fetchCardGroups(p);
                fetchProjectData(p);
            });
        }

        function fetchProjectData(project, forceRefresh = false, silent = false) {
            const cacheKey = `dms_data_${project}`;
            const cached = window.SafeStorage.getItem(cacheKey);

            const refreshView = () => {
                if (STATE.currentView === 'dashboard') renderDashboard();
                else if (STATE.currentView === 'visual_map') renderVisualMap();
                else if (STATE.currentView === 'room_list' && STATE.currentBuildingFilter) {
                    renderRoomList(STATE.currentBuildingFilter, STATE.currentFloor);
                }
                else if (STATE.currentView === 'available_view') { /* Do nothing */ }
                else renderDashboard();
            };

            // 1. If cache exists, use it immediately for fast rendering (even if we fetch again later)
            if (!forceRefresh && cached) {
                try {
                    const parsed = JSON.parse(cached);
                    STATE.data = parsed.data;
                    refreshView();
                    // We DO NOT return here, we proceed to callApi to ensure onSnapshot is hooked up
                } catch (e) { /* ignore */ }
            }

            // 2. Always call API to establish real-time listener
            callApi('getProjectData', { project }, { silent: silent }).then(res => {
                if (res.success) {
                    STATE.data = res.data.map(item => ({
                        ...item,
                        roomType: item.roomType ? item.roomType.toString().trim() : 'Standard',
                        status: item.status ? item.status.toString().trim() : 'ห้องว่าง'
                    }));

                    window.SafeStorage.setItem(cacheKey, JSON.stringify({ ts: Date.now(), data: STATE.data }));

                    // Also reload layouts on force refresh so they stay in sync
                    if (forceRefresh) {
                        fetchLayouts(project).then(() => {
                            refreshView();
                            if (!silent) showToast('Success', 'อัปเดตข้อมูลแล้ว', 'success');
                        });
                    } else {
                        refreshView();
                    }
                }
            });
        }

        // --- Notification System ---
        function toggleNotificationPanel() {
            const panel = document.getElementById('notifPanel');
            panel.classList.toggle('hidden');
            if (!panel.classList.contains('hidden')) {
                renderNotificationList();
                // Mark all as read
                const log = JSON.parse(window.SafeStorage.getItem('dms_notification_log') || '[]');
                log.forEach(n => n.read = true);
                window.SafeStorage.setItem('dms_notification_log', JSON.stringify(log));
                updateNotifBadge();
            }
        }

        // Close notification panel when clicking outside
        document.addEventListener('click', (e) => {
            const wrapper = document.getElementById('notifBellWrapper');
            const panel = document.getElementById('notifPanel');
            if (wrapper && panel && !wrapper.contains(e.target)) {
                panel.classList.add('hidden');
            }
        });

        function checkExpiredBookingNotifications() {
            const expiredRooms = STATE.data.filter(r => isBookingExpired(r));
            if (expiredRooms.length === 0) return;

            // Get previously notified room keys
            const storageKey = `dms_notified_expired_${STATE.currentProject}`;
            const notifiedSet = new Set(JSON.parse(window.SafeStorage.getItem(storageKey) || '[]'));

            // Find NEW expired rooms not previously notified
            const newExpired = expiredRooms.filter(r => !notifiedSet.has(r.roomNo));

            if (newExpired.length > 0) {
                // Add to notified set
                newExpired.forEach(r => notifiedSet.add(r.roomNo));
                window.SafeStorage.setItem(storageKey, JSON.stringify([...notifiedSet]));

                // Add to notification log
                const logKey = 'dms_notification_log';
                const log = JSON.parse(window.SafeStorage.getItem(logKey) || '[]');
                const now = new Date().toISOString();

                newExpired.forEach(r => {
                    const dateForBooking = r.bookingDate || r.moveInDate;
                    const bookDate = dateForBooking ? formatDateThai(dateForBooking) : '-';
                    const diffDays = dateForBooking ? Math.floor((new Date() - new Date(dateForBooking)) / (1000 * 60 * 60 * 24)) : 0;
                    log.unshift({
                        id: `${r.roomNo}_${Date.now()}`,
                        roomNo: r.roomNo,
                        message: `ห้อง ${r.roomNo} หลุดจอง (จองมา ${diffDays} วัน, วันที่จอง: ${bookDate})`,
                        timestamp: now,
                        read: false,
                        project: STATE.currentProject
                    });
                });

                // Keep max 100 log entries
                if (log.length > 100) log.length = 100;
                window.SafeStorage.setItem(logKey, JSON.stringify(log));

                // Show toast for new expired rooms
                const roomList = newExpired.map(r => r.roomNo).join(', ');
                setTimeout(() => {
                    showToast('🔔 หลุดจองใหม่!', `ห้อง ${roomList} หลุดจอง (เกิน 30 วัน)`, 'error');
                }, 500);
            }

            updateNotifBadge();
        }

        function updateNotifBadge() {
            const log = JSON.parse(window.SafeStorage.getItem('dms_notification_log') || '[]');
            const unreadCount = log.filter(n => !n.read).length;
            const badge = document.getElementById('notifBadge');
            if (unreadCount > 0) {
                badge.textContent = unreadCount > 9 ? '9+' : unreadCount;
                badge.classList.remove('hidden');
            } else {
                badge.classList.add('hidden');
            }
        }

        function renderNotificationList() {
            const log = JSON.parse(window.SafeStorage.getItem('dms_notification_log') || '[]');
            const container = document.getElementById('notifList');

            if (log.length === 0) {
                container.innerHTML = `
                    <div class="p-6 text-center text-gray-400 text-sm">
                        <i class="fa-regular fa-bell-slash text-3xl mb-2 opacity-30"></i>
                        <p>ไม่มีการแจ้งเตือน</p>
                    </div>`;
                return;
            }

            container.innerHTML = log.map(n => {
                const date = new Date(n.timestamp);
                const timeStr = `${date.toLocaleDateString('th-TH', { day: '2-digit', month: 'short', year: '2-digit' })} ${date.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}`;
                return `
                    <div class="px-4 py-3 ${n.read ? 'bg-white' : 'bg-orange-50'} hover:bg-gray-50 transition cursor-pointer" onclick="const idx='${STATE.data.find(r=>r.roomNo===n.roomNo)?.rowIndex}'; if(idx && idx!=='undefined') openModal(idx); else showToast('Error', 'ไม่พบข้อมูลห้องนี้ (อาจถูกลบไปแล้ว)', 'error');">
                        <div class="flex items-start gap-3">
                            <div class="bg-orange-100 text-orange-600 p-1.5 rounded-lg flex-shrink-0 mt-0.5">
                                <i class="fa-solid fa-clock text-sm"></i>
                            </div>
                            <div class="flex-1 min-w-0">
                                <p class="text-sm font-bold text-gray-800">${n.roomNo} <span class="text-orange-500 font-normal text-xs">หลุดจอง</span></p>
                                <p class="text-[11px] text-gray-500 mt-0.5 truncate">${n.message}</p>
                                <p class="text-[10px] text-gray-400 mt-1"><i class="fa-regular fa-clock mr-1"></i>${timeStr}</p>
                            </div>
                            ${!n.read ? '<div class="w-2 h-2 bg-orange-500 rounded-full flex-shrink-0 mt-2"></div>' : ''}
                        </div>
                    </div>
                `;
            }).join('');
        }

        function clearNotificationLog() {
            window.SafeStorage.removeItem('dms_notification_log');
            window.SafeStorage.removeItem(`dms_notified_expired_${STATE.currentProject}`);
            renderNotificationList();
            updateNotifBadge();
            showToast('Success', 'ล้างการแจ้งเตือนทั้งหมดแล้ว', 'success');
        }


        function updateActiveNav(i) {
            document.querySelectorAll('.nav-item').forEach((l, idx) => l.classList[idx === i ? 'add' : 'remove']('active-nav'));
            document.querySelectorAll('.nav-item-mobile').forEach((l, idx) => l.classList[idx === i ? 'add' : 'remove']('active-mobile'));
        }
        function openReportModal() {
            // Reset Date Filters
            const dateMode = document.getElementById('rpt_date_mode');
            if (dateMode) {
                dateMode.value = 'all';
                toggleReportDateInputs();
            }
            const startDate = document.getElementById('rpt_start_date');
            if (startDate) startDate.value = '';
            const endDate = document.getElementById('rpt_end_date');
            if (endDate) endDate.value = '';

            const container = document.getElementById('rpt_type_container');
            if (container) {
                container.innerHTML = '';
                // Generate checkboxes based on Project Settings
                STATE.projectRoomTypes.forEach(t => {
                    const colorClass = `text-${t.color}-500`;
                    const borderClass = `hover:bg-${t.color}-50`;

                    const html = `
                        <label class="flex items-center space-x-2 border p-2 rounded-lg ${borderClass} cursor-pointer transition text-sm">
                            <input type="checkbox" name="rpt_type" value="${t.name}" checked class="rounded ${colorClass}">
                                <span class="font-medium text-gray-700">${t.name}</span>
                            </label>
                    `;
                    container.insertAdjacentHTML('beforeend', html);
                });
            }

            // Populate Building Filter
            const buildingSelect = document.getElementById('rpt_building');
            buildingSelect.innerHTML = '<option value="All">ทุกตึก</option>';
            const buildings = [...new Set(STATE.data.map(r => parseRoomInfo(r.roomNo).building))].sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }));
            buildings.forEach(b => {
                const opt = document.createElement('option');
                opt.value = b;
                opt.innerText = `ตึก ${b}`;
                buildingSelect.appendChild(opt);
            });

            // Pre-select current building filter if active
            if (STATE.currentBuildingFilter && buildings.includes(STATE.currentBuildingFilter)) {
                buildingSelect.value = STATE.currentBuildingFilter;
            }

            // Populate Floor based on selected building
            onReportBuildingChange();

            document.getElementById('reportModal').classList.remove('hidden');
        }

        function onReportBuildingChange() {
            const buildingSelect = document.getElementById('rpt_building');
            const floorSelect = document.getElementById('rpt_floor');
            const selectedBuilding = buildingSelect.value;

            floorSelect.innerHTML = '<option value="All">ทุกชั้น</option>';

            let sourceData = STATE.data;
            if (selectedBuilding !== 'All') {
                sourceData = sourceData.filter(r => parseRoomInfo(r.roomNo).building === selectedBuilding);
            }

            const floors = new Set();
            sourceData.forEach(r => floors.add(parseRoomInfo(r.roomNo).floor));
            const sortedFloors = Array.from(floors).sort((a, b) => a - b);

            sortedFloors.forEach(f => {
                const opt = document.createElement('option');
                opt.value = f; opt.innerText = `ชั้น ${f}`;
                floorSelect.appendChild(opt);
            });
        }
        function closeReportModal() { document.getElementById('reportModal').classList.add('hidden'); }
        function toggleAllCheckboxes(name) { const checkboxes = document.querySelectorAll(`input[name = "${name}"]`); const allChecked = Array.from(checkboxes).every(c => c.checked); checkboxes.forEach(c => c.checked = !allChecked); }

        function toggleReportDateInputs() {
            const mode = document.getElementById('rpt_date_mode').value;
            const rangeFields = document.getElementById('rpt_date_range_fields');
            const monthField = document.getElementById('rpt_date_month_field');

            if (mode === 'range') {
                rangeFields.classList.remove('hidden');
                monthField.classList.add('hidden');
            } else if (mode === 'month') {
                rangeFields.classList.add('hidden');
                monthField.classList.remove('hidden');
                populateReportMonths();
            } else {
                rangeFields.classList.add('hidden');
                monthField.classList.add('hidden');
            }
        }

        function populateReportMonths() {
            const select = document.getElementById('rpt_month_select');
            if (!select) return;

            const monthSet = new Set();
            STATE.data.forEach(r => {
                // Include both moveInDate and bookingDate for month options
                [r.moveInDate, r.bookingDate].forEach(dateVal => {
                    if (dateVal) {
                        const d = new Date(dateVal);
                        if (!isNaN(d.getTime())) {
                            const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
                            monthSet.add(key);
                        }
                    }
                });
            });

            const sortedMonths = [...monthSet].sort().reverse(); // Newest first
            const thaiMonths = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];

            if (sortedMonths.length === 0) {
                select.innerHTML = '<option value="">ไม่มีข้อมูลวันที่ในระบบ</option>';
                return;
            }

            select.innerHTML = sortedMonths.map(m => {
                const [y, mo] = m.split('-');
                const thaiYear = parseInt(y) + 543;
                const label = thaiMonths[parseInt(mo) - 1] + ' ' + thaiYear;
                return `<option value="${m}">${label}</option>`;
            }).join('');
        }

        // --- User Management Frontend ---
        function renderSettingsUsers() {
            STATE.currentView = 'settings_users';
            showLoading(true);

            callApi('getUsers', { user: STATE.user }).then(res => {
                showLoading(false);
                if (!res.success) { showToast('Error', res.message, 'error'); return; }

                const users = res.users;

                let html = `
                <div class="max-w-6xl mx-auto p-6 fade-in-up">
                    <button onclick="renderSettings()" class="mb-4 text-gray-500 hover:text-blue-600 flex items-center text-sm font-bold"><i class="fa-solid fa-arrow-left mr-2"></i> กลับไปหน้าตั้งค่ารวม</button>
                    
                    <div class="flex justify-between items-center mb-6">
                        <h2 class="text-2xl font-bold text-gray-800 flex items-center"><i class="fa-solid fa-users-gear mr-2 text-blue-600"></i> จัดการผู้ใช้ (User Management)</h2>
                        <button onclick="openUserModal()" class="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition shadow-md flex items-center text-sm"><i class="fa-solid fa-plus mr-2"></i> เพิ่มผู้ใช้ใหม่</button>
                    </div>
                    
                    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        ${users.map(u => `
                            <div class="bg-white rounded-2xl shadow-[0_2px_10px_rgba(0,0,0,0.04)] border border-gray-100 p-6 flex flex-col hover:shadow-lg transition-all duration-300 relative group overflow-hidden">
                                <!-- Top bar: Role & Status -->
                                <div class="flex justify-between items-start mb-4">
                                    <span class="${u.role === 'Admin' ? 'bg-purple-50 text-purple-600 border-purple-200' : 'bg-blue-50 text-blue-600 border-blue-200'} border text-xs px-2.5 py-1 rounded-lg font-semibold tracking-wide flex items-center">
                                        <i class="fa-solid ${u.role === 'Admin' ? 'fa-user-shield' : 'fa-user'} mr-1.5"></i> ${u.role}
                                    </span>
                                    <span class="${u.status === 'Active' ? 'bg-green-50 text-green-600 border-green-200' : 'bg-red-50 text-red-600 border-red-200'} border text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full font-bold">
                                        ${u.status}
                                    </span>
                                </div>
                                
                                <!-- User Info -->
                                <div class="flex items-center gap-4 mb-5">
                                    <div class="w-12 h-12 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center text-gray-500 font-bold text-xl flex-shrink-0 border border-gray-200">
                                        ${u.username.charAt(0).toUpperCase()}
                                    </div>
                                    <div class="min-w-0">
                                        <h3 class="text-lg font-bold text-gray-900 truncate">${u.username}</h3>
                                        <p class="text-sm text-gray-500 truncate"><i class="fa-regular fa-envelope mr-1.5 opacity-70"></i>${u.email}</p>
                                    </div>
                                </div>

                                <!-- Access info -->
                                <div class="mt-auto bg-gray-50 rounded-xl p-3 mb-4">
                                    <p class="text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wider">การเข้าถึง</p>
                                    <p class="text-sm text-gray-700 font-medium line-clamp-2" title="${u.role === 'Admin' ? 'All' : u.access}">
                                        ${u.role === 'Admin' ? '<span class="text-gray-400 italic"><i class="fa-solid fa-infinity text-xs mr-1"></i> เข้าถึงได้ทั้งหมด</span>' : (u.access || '-')}
                                    </p>
                                </div>

                                <!-- Actions -->
                                <div class="flex items-center justify-end gap-2 pt-3 border-t border-gray-100">
                                    <button onclick='openUserModal(${JSON.stringify(u)})' class="flex items-center justify-center px-4 py-2 bg-gray-50 text-gray-700 rounded-lg text-sm font-semibold hover:bg-blue-50 hover:text-blue-600 transition-colors">
                                        <i class="fa-solid fa-pen-to-square mr-2"></i> แก้ไข
                                    </button>
                                    <button onclick='deleteUser("${u.id}", "${u.username}")' class="flex items-center justify-center px-3 py-2 bg-gray-50 text-gray-500 rounded-lg text-sm hover:bg-red-50 hover:text-red-600 transition-colors" title="ลบผู้ใช้">
                                        <i class="fa-solid fa-trash-can"></i>
                                    </button>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
                        `;

                document.getElementById('mainContent').innerHTML = html;
            });
        }

        function openUserModal(user = null) {
            // Re-use roomModal structure or generic modal? Ideally generic. 
            // Let's inject a specific modal for users to avoid conflicts.
            let title = user ? "แก้ไขผู้ใช้" : "เพิ่มผู้ใช้ใหม่";
            let btnText = user ? "บันทึกการแก้ไข" : "สร้างบัญชี";

            // Generate Project Checkboxes Logic
            // We can hardcode specific list or rely on Admin's project list.
            const allProjects = ["กอล์ฟวิว", "กอล์ฟซิตี้", "กอล์ฟแมนชั่น", "เมเปิลซิตี้", "เมเปิลแมนชั่น"];

            let accessHtml = allProjects.map(p => {
                let checked = user && user.access && user.access.includes(p) ? 'checked' : '';
                return `<label class="flex items-center space-x-2 text-sm"><input type="checkbox" name="user_access" value="${p}" ${checked} class="rounded text-blue-600 focus:ring-blue-500"><span>${p}</span></label>`;
            }).join('');

            let html = `
                <div id="userModal" class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center z-50 animate-fade-in">
                            <div class="relative bg-white rounded-xl shadow-2xl p-8 max-w-md w-full mx-4">
                                <div class="flex justify-between items-center mb-6">
                                    <h3 class="text-xl font-bold text-gray-800">${title}</h3>
                                    <button onclick="closeUserModal()" class="text-gray-400 hover:text-gray-600 transition"><i class="fa-solid fa-xmark text-xl"></i></button>
                                </div>
                                <div class="space-y-4">
                                    <input type="hidden" id="u_id" value="${user ? user.id : ''}">
                                        <div>
                                            <label class="block text-sm font-medium text-gray-700 mb-1">ชื่อผู้ใช้ (Login)</label>
                                            <input type="text" id="u_username" value="${user ? user.username : ''}" class="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" ${user ? 'readonly bg-gray-100' : ''}>
                                        </div>
                                        <div>
                                            <label class="block text-sm font-medium text-gray-700 mb-1">รหัสผ่าน ${user ? '<span class="text-xs text-gray-400 font-normal">(เว้นว่างหากไม่ต้องการเปลี่ยน)</span>' : ''}</label>
                                            <input type="password" id="u_password" class="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" placeholder="******">
                                        </div>
                                        <div>
                                            <label class="block text-sm font-medium text-gray-700 mb-1">อีเมล (ถ้ามี)</label>
                                            <input type="email" id="u_email" value="${user ? user.email : ''}" class="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none">
                                        </div>

                                        <div class="grid grid-cols-2 gap-4">
                                            <div>
                                                <label class="block text-sm font-medium text-gray-700 mb-1">สิทธิ์ (Role)</label>
                                                <select id="u_role" class="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" onchange="toggleAccessSection()">
                                                    <option value="Project User" ${user && user.role === 'Project User' ? 'selected' : ''}>Project User</option>
                                                    <option value="Admin" ${user && user.role === 'Admin' ? 'selected' : ''}>Admin</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label class="block text-sm font-medium text-gray-700 mb-1">สถานะ</label>
                                                <select id="u_status" class="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none">
                                                    <option value="Active" ${user && user.status === 'Active' ? 'selected' : ''}>ใช้งานปกติ</option>
                                                    <option value="Inactive" ${user && user.status === 'Inactive' ? 'selected' : ''}>ระงับใช้งาน</option>
                                                </select>
                                            </div>
                                        </div>

                                        <div id="u_access_section" class="${user && user.role === 'Admin' ? 'hidden' : ''}">
                                            <label class="block text-sm font-medium text-gray-700 mb-2">สิทธิ์เข้าถึงโครงการ</label>
                                            <div class="grid grid-cols-2 gap-2 bg-gray-50 p-3 rounded-lg border border-gray-100">
                                                ${accessHtml}
                                            </div>
                                        </div>

                                        <button onclick="saveUser()" class="w-full bg-blue-600 text-white py-2.5 rounded-lg hover:bg-blue-700 transition font-bold shadow-lg mt-2">${btnText}</button>
                                </div>
                            </div>
                </div>
                        `;

            // Remove existing modal if any
            const existing = document.getElementById('userModal');
            if (existing) existing.remove();

            document.body.insertAdjacentHTML('beforeend', html);
        }

        function closeUserModal() {
            const el = document.getElementById('userModal');
            if (el) el.remove();
        }

        function toggleAccessSection() {
            const role = document.getElementById('u_role').value;
            const sec = document.getElementById('u_access_section');
            if (role === 'Admin') sec.classList.add('hidden'); else sec.classList.remove('hidden');
        }

        function saveUser() {
            const id = document.getElementById('u_id').value;
            const username = document.getElementById('u_username').value.trim();
            const password = document.getElementById('u_password').value;
            const email = document.getElementById('u_email').value.trim();
            const role = document.getElementById('u_role').value;
            const status = document.getElementById('u_status').value;

            if (!username) { showToast('Warning', 'กรุณาระบุชื่อผู้ใช้', 'error'); return; }
            if (!id && !password) { showToast('Warning', 'กรุณากำหนดรหัสผ่าน', 'error'); return; }

            const access = Array.from(document.querySelectorAll('input[name="user_access"]:checked')).map(c => c.value).join(', ');

            const userData = { id, username, password, email, role, status, access };
            const action = id ? 'edit' : 'add';

            showLoading(true);
            callApi('manageUser', { user: STATE.user, action, userData }).then(res => {
                showLoading(false);
                if (res.success) {
                    showToast('Success', res.message, 'success');
                    closeUserModal();
                    renderSettingsUsers();
                } else {
                    showToast('Error', res.message, 'error');
                }
            });
        }

        function deleteUser(id, username) {
            if (!confirm(`ยืนยันการลบผู้ใช้ "${username}" ?`)) return;

            showLoading(true);
            callApi('manageUser', { user: STATE.user, action: 'delete', userData: { id } }).then(res => {
                showLoading(false);
                if (res.success) {
                    showToast('Success', res.message, 'success');
                    renderSettingsUsers();
                } else {
                    showToast('Error', res.message, 'error');
                }
            });
        }
        // ==========================================
        // AUDIT LOGS & FULL BACKUP
        // ==========================================
        function getStatusColor(status) {
            if (!status) return '#9ca3af'; // gray-400
            
            // Check dynamic statuses first
            if (STATE.projectRoomStatuses) {
                const custom = STATE.projectRoomStatuses.find(s => s.name === status);
                if (custom) {
                    if (custom.colorType === 'hex') {
                        return custom.color;
                    } else {
                        // Predefined color mapping to hex
                        const tailwindHex = {
                            'red': '#ef4444',
                            'emerald': '#10b981',
                            'yellow': '#eab308',
                            'cyan': '#06b6d4',
                            'purple': '#a855f7',
                            'gray': '#6b7280',
                            'blue': '#3b82f6'
                        };
                        return tailwindHex[custom.color] || '#6b7280';
                    }
                }
            }

            // Fallback to legacy hardcoded logic
            if (status.includes('ไม่ว่าง') || status.includes('มีลูกค้า')) return '#ef4444'; // red-500
            if (status.includes('ห้องว่าง') || status.includes('ว่าง')) return '#10b981'; // emerald-500
            if (status.includes('จอง')) return '#eab308'; // yellow-500
            if (status.includes('คืนประกัน')) return '#06b6d4'; // cyan-500
            if (status.includes('ตัดหนี')) return '#a855f7'; // purple-500
            if (status.includes('ซ่อม') || status.includes('ปรับปรุง')) return '#6b7280'; // gray-500
            if (status.includes('Add') || status.includes('Edit') || status.includes('Delete')) return '#3b82f6'; // blue-500
            return '#6b7280'; // default gray
        }

        function getStatusConfig(status) {
            let config = { colorType: 'predefined', color: 'gray', name: status || 'ว่าง' };
            if (!status) {
                config.color = 'emerald';
                return config;
            }
            
            // Check dynamic statuses first
            if (STATE.projectRoomStatuses) {
                const custom = STATE.projectRoomStatuses.find(s => s.name === status);
                if (custom) {
                    return custom;
                }
            }

            // Fallback
            if (status.includes('ว่าง')) config.color = 'emerald';
            else if (status.includes('ไม่ว่าง')) config.color = 'red';
            else if (status.includes('จอง')) config.color = 'yellow';
            else if (status.includes('ซ่อม') || status.includes('ปรับปรุง')) config.color = 'gray';
            else if (status.includes('คืนประกัน')) config.color = 'cyan';
            else if (status.includes('ตัดหนี')) config.color = 'purple';
            
            return config;
        }

        function getIconForStatus(status) {
            if (!status) return 'fa-door-open';
            if (status === 'all') return 'fa-border-all';
            if (status.includes('ไม่ว่าง') || status.includes('ลูกค้า')) return 'fa-user-check';
            if (status.includes('ว่าง')) return 'fa-door-open';
            if (status.includes('จอง')) return 'fa-calendar-check';
            if (status.includes('คืนประกัน')) return 'fa-money-bill-transfer';
            if (status.includes('ตัดหนี')) return 'fa-user-slash';
            if (status.includes('ซ่อม') || status.includes('ปรับปรุง') || status.includes('ชำรุด')) return 'fa-screwdriver-wrench';
            return 'fa-tag';
        }

        // Initialize logs state
        if (!STATE.logsDate) {
            STATE.logsDate = new Date();
            STATE.logsFilter = { project: null, search: '' };
            STATE.logsSortDesc = true;
        }

        async function renderLogs() {
            STATE.currentView = 'logs';
            updateActiveNav(4);
            
            if (STATE.logsFilter.project === null) {
                STATE.logsFilter.project = STATE.currentProject || '';
            }
            
            const dateStr = STATE.logsDate.toISOString().split('T')[0];
            
            let html = `
                <div class="max-w-6xl mx-auto p-6 fade-in-up">
                    <h2 class="text-2xl font-bold text-gray-800 mb-6 flex items-center"><i class="fa-solid fa-clock-rotate-left mr-2 text-indigo-600"></i> ประวัติการทำงาน (Audit Logs)</h2>
                    
                    <!-- Controls -->
                    <div class="bg-white p-4 rounded-xl shadow-sm border border-gray-200 mb-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div class="flex items-center gap-2">
                            <button onclick="changeLogsDate(-1)" class="w-10 h-10 flex items-center justify-center rounded-lg border border-gray-300 hover:bg-gray-100 transition"><i class="fa-solid fa-chevron-left text-gray-600"></i></button>
                            <input type="date" id="logsDatePicker" value="${dateStr}" onchange="selectLogsDate(this.value)" class="border border-gray-300 rounded-lg px-3 py-2 text-gray-700 outline-none focus:ring-2 focus:ring-indigo-500">
                            <button onclick="changeLogsDate(1)" class="w-10 h-10 flex items-center justify-center rounded-lg border border-gray-300 hover:bg-gray-100 transition"><i class="fa-solid fa-chevron-right text-gray-600"></i></button>
                        </div>
                        <div class="flex flex-1 md:justify-end gap-3 items-center">
                            <select id="logsProjectFilter" onchange="applyLogsFilter()" class="border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-700 outline-none focus:ring-2 focus:ring-indigo-500 max-w-[150px]">
                                <option value="">ทุกโครงการ</option>
                                ${PROJECTS.map(p => `<option value="${p}" ${STATE.logsFilter.project === p ? 'selected' : ''}>${p}</option>`).join('')}
                            </select>
                            <div class="relative max-w-[200px]">
                                <i class="fa-solid fa-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm"></i>
                                <input type="text" id="logsSearchFilter" placeholder="ค้นหา พนักงาน, ห้อง..." value="${STATE.logsFilter.search}" oninput="applyLogsFilter()" class="border border-gray-300 rounded-lg pl-9 pr-3 py-2 text-sm text-gray-700 outline-none focus:ring-2 focus:ring-indigo-500 w-full">
                            </div>
                            <button onclick="toggleLogsSort()" class="border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 transition flex items-center gap-2">
                                <i class="fa-solid ${STATE.logsSortDesc ? 'fa-arrow-down-short-wide' : 'fa-arrow-up-wide-short'}"></i> 
                                ${STATE.logsSortDesc ? 'ใหม่ล่าสุดก่อน' : 'เก่าสุดก่อน'}
                            </button>
                        </div>
                    </div>

                    <div class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                        <div class="p-8 text-center" id="logsLoading">
                            <i class="fa-solid fa-spinner fa-spin text-3xl text-apple-blue mb-3"></i>
                            <p class="text-gray-500">กำลังโหลดประวัติการทำงาน...</p>
                        </div>
                        <div class="overflow-x-auto">
                            <table class="w-full text-sm text-left text-gray-500 hidden" id="logsTable">
                                <thead class="text-xs text-gray-700 uppercase bg-gray-50 border-b">
                                    <tr>
                                        <th class="px-6 py-4">เวลา</th>
                                        <th class="px-6 py-4">ผู้ใช้งาน</th>
                                        <th class="px-6 py-4">โครงการ</th>
                                        <th class="px-6 py-4">เลขห้อง</th>
                                        <th class="px-6 py-4">สถานะที่เปลี่ยนไป</th>
                                    </tr>
                                </thead>
                                <tbody id="logsTbody" class="divide-y divide-gray-100">
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            `;
            document.getElementById('mainContent').innerHTML = html;
            fetchAndRenderLogs();
        }

        window.changeLogsDate = function(offset) {
            STATE.logsDate.setDate(STATE.logsDate.getDate() + offset);
            renderLogs();
        };

        window.selectLogsDate = function(val) {
            if (val) {
                STATE.logsDate = new Date(val);
                renderLogs();
            }
        };

        window.applyLogsFilter = function() {
            STATE.logsFilter.project = document.getElementById('logsProjectFilter').value;
            STATE.logsFilter.search = document.getElementById('logsSearchFilter').value.toLowerCase();
            renderLogsTbody();
        };

        window.toggleLogsSort = function() {
            STATE.logsSortDesc = !STATE.logsSortDesc;
            renderLogs(); // Re-fetch to sort properly from DB if needed, or just re-sort locally
        };

        let currentLogsData = []; // Store fetched logs for local filtering

        async function fetchAndRenderLogs() {
            try {
                const startOfDay = new Date(STATE.logsDate);
                startOfDay.setHours(0, 0, 0, 0);
                const endOfDay = new Date(STATE.logsDate);
                endOfDay.setHours(23, 59, 59, 999);

                // Fetch by date range and sort direction
                const query = db.collection('logs')
                    .where('timestamp', '>=', firebase.firestore.Timestamp.fromDate(startOfDay))
                    .where('timestamp', '<=', firebase.firestore.Timestamp.fromDate(endOfDay))
                    .orderBy('timestamp', STATE.logsSortDesc ? 'desc' : 'asc')
                    .limit(500); // safety limit

                const snapshot = await query.get();
                
                document.getElementById('logsLoading').classList.add('hidden');
                document.getElementById('logsTable').classList.remove('hidden');
                
                currentLogsData = [];
                snapshot.forEach(doc => {
                    const data = doc.data();
                    data.id = doc.id;
                    if (data.timestamp) data.jsDate = data.timestamp.toDate();
                    currentLogsData.push(data);
                });

                renderLogsTbody();
                
            } catch (error) {
                console.error(error);
                document.getElementById('logsLoading').innerHTML = `<div class="text-red-500"><i class="fa-solid fa-circle-exclamation text-2xl mb-2"></i><br>เกิดข้อผิดพลาด: ${error.message}</div>`;
                document.getElementById('logsLoading').classList.remove('hidden');
                document.getElementById('logsTable').classList.add('hidden');
            }
        }

        function renderLogsTbody() {
            const tbody = document.getElementById('logsTbody');
            
            // Apply client-side filters
            const filtered = currentLogsData.filter(d => {
                if (STATE.logsFilter.project && d.project !== STATE.logsFilter.project) return false;
                if (STATE.logsFilter.search) {
                    const q = STATE.logsFilter.search;
                    const matchUser = (d.user || '').toLowerCase().includes(q);
                    const matchRoom = (d.room || '').toLowerCase().includes(q);
                    const matchAction = (d.action || '').toLowerCase().includes(q);
                    const matchStatus = (d.status || '').toLowerCase().includes(q);
                    if (!matchUser && !matchRoom && !matchAction && !matchStatus) return false;
                }
                return true;
            });

            if (filtered.length === 0) {
                tbody.innerHTML = `<tr><td colspan="5" class="px-6 py-8 text-center text-gray-400"><i class="fa-solid fa-folder-open text-2xl mb-2"></i><br>ไม่พบประวัติการทำงานตามเงื่อนไขที่เลือก</td></tr>`;
                return;
            }
            
            let rowsHtml = '';
            filtered.forEach(data => {
                let dateStr = 'Unknown';
                if (data.jsDate) {
                    dateStr = data.jsDate.toLocaleTimeString('th-TH'); // Only show time since we know the date
                }
                
                const statusColor = getStatusColor(data.status || '');
                
                rowsHtml += `
                    <tr class="hover:bg-gray-50 transition">
                        <td class="px-6 py-4 whitespace-nowrap text-gray-500">${dateStr}</td>
                        <td class="px-6 py-4 font-medium text-gray-900">${data.user || '-'}</td>
                        <td class="px-6 py-4 text-gray-600">${data.project || '-'}</td>
                        <td class="px-6 py-4 font-bold text-gray-700">${data.room || '-'}</td>
                        <td class="px-6 py-4">
                            <span class="px-2 py-1 text-xs rounded-lg font-bold" style="background-color: ${statusColor}20; color: ${statusColor}; border: 1px solid ${statusColor}40;">
                                ${data.action ? `[${data.action}] ` : ''}${data.status || data.info || '-'}
                            </span>
                        </td>
                    </tr>
                `;
            });
            tbody.innerHTML = rowsHtml;
        }

        async function backupFullDatabase() {
            if (!confirm('ต้องการดาวน์โหลดสำรองข้อมูลห้องของทุกโครงการใช่หรือไม่? (อาจใช้เวลาสักครู่)')) return;
            
            showLoading(true);
            try {
                // Fetch ALL rooms from Firestore
                const snapshot = await db.collection('rooms').get();
                
                // Group by project
                const projectsData = {};
                snapshot.docs.forEach(doc => {
                    const d = doc.data();
                    const p = d.project || 'Unknown';
                    if (!projectsData[p]) projectsData[p] = [];
                    projectsData[p].push(d);
                });
                
                const wb = XLSX.utils.book_new();
                
                // Create a sheet for each project
                Object.keys(projectsData).forEach(project => {
                    // Sort rooms numerically/alphabetically
                    const sorted = projectsData[project].sort((a, b) => (a.roomNo||'').localeCompare(b.roomNo||'', undefined, { numeric: true }));
                    
                    // Format for Excel mapping the 13 columns original Google Sheet format
                    const exportRows = sorted.map(d => {
                        return {
                            'เลขห้อง': d.roomNo || '',
                            'ชื่อ': '',
                            'โทร': '',
                            'บัตร': '',
                            'ที่อยู่': '',
                            'Mate': '',
                            'Mateโทร': '',
                            'สถานะ': d.status || 'ห้องว่าง',
                            'วันที่เข้าอยู่': d.moveInDate || '',
                            'ประเภท': d.roomType || 'Standard',
                            'หมายเหตุ': d.remark || '',
                            'ห้องตัวอย่าง': d.isSampleRoom ? 'Y' : '',
                            'วันที่ทำจอง': d.bookingDate || ''
                        };
                    });
                    
                    const ws = XLSX.utils.json_to_sheet(exportRows);
                    XLSX.utils.book_append_sheet(wb, ws, project);
                });
                
                // Add Logs sheet
                try {
                    const logsSnap = await db.collection('logs').orderBy('timestamp', 'desc').limit(500).get();
                    if (!logsSnap.empty) {
                        const logsRows = logsSnap.docs.map(doc => {
                            const d = doc.data();
                            return {
                                'Timestamp': d.timestamp ? d.timestamp.toDate().toISOString() : '',
                                'User': d.user || '',
                                'Project': d.project || '',
                                'Room': d.room || '',
                                'Action': d.action || '',
                                'Status': d.status || ''
                            };
                        });
                        const wsLogs = XLSX.utils.json_to_sheet(logsRows);
                        XLSX.utils.book_append_sheet(wb, wsLogs, "Logs");
                    }
                } catch(e) { console.warn("Could not backup logs", e); }
                
                const dateStr = new Date().toISOString().split('T')[0];
                XLSX.writeFile(wb, `Pinehurst_Backup_${dateStr}.xlsx`);
                
                showLoading(false);
                showToast('Success', 'ดาวน์โหลดข้อมูลสำรองเรียบร้อยแล้ว', 'success');
                
            } catch (error) {
                showLoading(false);
                console.error(error);
                showToast('Error', 'เกิดข้อผิดพลาด: ' + error.message, 'error');
            }
        }
    


