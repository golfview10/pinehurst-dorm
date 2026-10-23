/**
 * Internal Messaging View (ระบบข้อความภายใน)
 * Pinehurst Dormitory Management System
 * 
 * รองรับการสนทนา 1-on-1, บรอดแคสต์ประกาศ (Admin),
 * ตรวจสอบสถานะออนไลน์แบบ Real-time, แจ้งเตือนข้อความมุมขวาล่างพร้อมเสียง Chime
 */

const MESSAGING_STATE = {
    conversations: [],
    activeConversationId: null,
    activePartnerName: null,
    activePartnerRole: null,
    searchQuery: '',
    isMobileChatOpen: false,
    activeUsersCache: [],
    activeMessages: [],
    modalSelectedUser: null
};

/**
 * Helper ดึงชื่อคู่สนทนาโดยกรองชื่อตัวเองออก (Case-insensitive)
 */
function getConversationPartner(conv, myName) {
    if (!conv) return 'Unknown';
    const myLower = String(myName || '').toLowerCase().trim();
    const parts = conv.participants || [];
    // ค้นหา participant ที่ไม่ใช่ชื่อตัวเอง (case-insensitive)
    const partner = parts.find(p => String(p).toLowerCase().trim() !== myLower);
    return partner || 'Unknown';
}

/**
 * Render หน้าหลักของระบบส่งข้อความ
 */
async function renderMessaging(preselectUser = null) {
    STATE.currentView = 'messaging';
    if (typeof updateActiveNav === 'function') {
        updateActiveNav('messaging');
    }

    const main = document.getElementById('mainContent');
    if (!main) return;

    // โหลดรายชื่อผู้ใช้ที่ Active และสถานะออนไลน์ในเบื้องหลัง
    await loadActiveUsersForMessaging();

    main.innerHTML = `
        <div class="h-[calc(100vh-68px)] flex flex-col bg-gray-50 overflow-hidden fade-in-up">
            <!-- Top Messaging Bar -->
            <div class="bg-white border-b border-gray-200/80 px-4 py-3 flex items-center justify-between shadow-xs shrink-0 z-10">
                <div class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center shadow-sm">
                        <i class="fa-solid fa-comments text-lg"></i>
                    </div>
                    <div>
                        <h1 class="text-lg font-bold text-gray-900 leading-tight">ระบบข้อความภายใน</h1>
                        <p class="text-xs text-gray-500">พูดคุย แจ้งงาน และประสานงานระหว่างเจ้าหน้าที่และผู้ดูแลระบบ</p>
                    </div>
                </div>

                <div class="flex items-center gap-2">
                    <button onclick="openNewMessageModal(false)" 
                        class="inline-flex items-center gap-2 px-3.5 py-2 bg-apple-blue hover:bg-blue-600 active:scale-95 text-white text-xs sm:text-sm font-semibold rounded-xl shadow-xs transition">
                        <i class="fa-solid fa-pen-to-square"></i>
                        <span>เขียนข้อความ</span>
                    </button>
                    ${STATE.user && STATE.user.role === 'Admin' ? `
                    <button onclick="openNewMessageModal(true)" 
                        class="inline-flex items-center gap-2 px-3.5 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 active:scale-95 text-white text-xs sm:text-sm font-semibold rounded-xl shadow-xs transition"
                        title="ส่งข้อความหาหลายคนพร้อมกัน">
                        <i class="fa-solid fa-bullhorn"></i>
                        <span class="hidden sm:inline">บรอดแคสต์</span>
                    </button>
                    ` : ''}
                </div>
            </div>

            <!-- Chat Split Container -->
            <div class="flex-1 flex overflow-hidden relative">
                <!-- Left: Conversation List Panel -->
                <div id="msgConversationPanel" class="w-full md:w-80 lg:w-96 bg-white border-r border-gray-200 flex flex-col shrink-0 h-full transition-all duration-300 z-10 ${MESSAGING_STATE.isMobileChatOpen ? 'hidden md:flex' : 'flex'}">
                    <!-- Search Box -->
                    <div class="p-3 border-b border-gray-100 bg-gray-50/50">
                        <div class="relative">
                            <i class="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs"></i>
                            <input type="text" id="msgSearchInput" oninput="handleMessagingSearch(this.value)"
                                placeholder="ค้นหาการสนทนา..." 
                                class="w-full pl-8 pr-8 py-2 bg-white border border-gray-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-apple-blue/20 focus:border-apple-blue transition">
                            <button id="msgClearSearchBtn" onclick="clearMessagingSearch()" class="hidden absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs">
                                <i class="fa-solid fa-xmark"></i>
                            </button>
                        </div>
                    </div>

                    <!-- Conversations List -->
                    <div id="msgConversationList" class="flex-1 overflow-y-auto divide-y divide-gray-100/80">
                        <div class="p-8 text-center text-gray-400 text-sm">
                            <i class="fa-solid fa-circle-notch fa-spin text-2xl mb-2 text-apple-blue"></i>
                            <p>กำลังโหลดการสนทนา...</p>
                        </div>
                    </div>
                </div>

                <!-- Right: Active Chat Panel -->
                <div id="msgChatPanel" class="flex-1 bg-[#F8FAFC] flex flex-col h-full overflow-hidden ${!MESSAGING_STATE.isMobileChatOpen ? 'hidden md:flex' : 'flex'}">
                    <div id="msgChatContent" class="h-full flex flex-col">
                        <!-- Default Empty State -->
                        <div class="flex-1 flex flex-col items-center justify-center p-8 text-center text-gray-400">
                            <div class="w-20 h-20 rounded-3xl bg-blue-50 text-apple-blue flex items-center justify-center text-3xl mb-4 shadow-xs">
                                <i class="fa-regular fa-comment-dots"></i>
                            </div>
                            <h3 class="text-base font-bold text-gray-700 mb-1">ยังไม่ได้เลือกการสนทนา</h3>
                            <p class="text-xs sm:text-sm text-gray-500 max-w-sm mb-6">เลือกการสนทนาจากรายการทางซ้าย หรือกดปุ่ม "เขียนข้อความ" เพื่อเริ่มส่งข้อความหาผู้ใช้อื่น</p>
                            <button onclick="openNewMessageModal(false)" class="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 text-apple-blue hover:bg-blue-50 font-semibold text-xs sm:text-sm rounded-xl transition shadow-xs">
                                <i class="fa-solid fa-plus"></i> เริ่มการสนทนาใหม่
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;

    // Hook up real-time listener for current user's conversations
    initRealtimeConversations(preselectUser);
}

/**
 * โหลดรายชื่อผู้ใช้ทั้งหมดที่ Active สำหรับแสดงใน Modal และตรวจสอบสถานะออนไลน์
 */
async function loadActiveUsersForMessaging() {
    try {
        const res = await callApi('getActiveUsers', { user: STATE.user }, { silent: true });
        if (res && res.success) {
            MESSAGING_STATE.activeUsersCache = res.users || [];
        }
    } catch (e) {
        console.warn('[loadActiveUsersForMessaging]', e);
    }
}

/**
 * เริ่มต้น Listener สำหรับการสนทนา Realtime
 */
function initRealtimeConversations(preselectUser = null) {
    const myName = STATE.user ? (STATE.user.name || STATE.user.username) : '';
    if (!myName) return;

    listenToUserConversations(myName, (data) => {
        MESSAGING_STATE.conversations = data.conversations || [];
        renderConversationList();

        // หากมีการระบุผู้ใช้ที่ต้องการเปิดแชทล่วงหน้า
        if (preselectUser && !MESSAGING_STATE.activeConversationId) {
            selectUserChat(preselectUser);
        } else if (MESSAGING_STATE.activeConversationId) {
            highlightActiveConversation();
        }
    });
}

/**
 * เลือกแชทกับผู้ใช้ที่ระบุ
 */
function selectUserChat(username, role = 'User') {
    const myName = STATE.user ? (STATE.user.name || STATE.user.username) : '';
    const convId = getConversationId(myName, username);
    openConversation(convId, username, role);
}

/**
 * เปิดหน้าระบบข้อความและเริ่มแชทกับผู้ใช้ที่ระบุทันที
 */
function openChatWithUser(username, role = 'User') {
    renderMessaging(username);
}

/**
 * Render รายการห้องแชททางด้านซ้าย
 */
function renderConversationList() {
    const listEl = document.getElementById('msgConversationList');
    if (!listEl) return;

    const myName = STATE.user ? (STATE.user.name || STATE.user.username) : '';
    const myNameLower = String(myName).toLowerCase().trim();
    let filtered = MESSAGING_STATE.conversations;

    // กรองด้วยคำค้นหา
    if (MESSAGING_STATE.searchQuery) {
        const q = MESSAGING_STATE.searchQuery.toLowerCase();
        filtered = filtered.filter(c => {
            const partner = getConversationPartner(c, myName);
            const lastMsg = c.lastMessage || '';
            return partner.toLowerCase().includes(q) || lastMsg.toLowerCase().includes(q);
        });
    }

    if (filtered.length === 0) {
        if (MESSAGING_STATE.searchQuery) {
            listEl.innerHTML = `
                <div class="p-8 text-center text-gray-400 text-xs">
                    <i class="fa-solid fa-magnifying-glass text-2xl mb-2 opacity-40"></i>
                    <p>ไม่พบผลการค้นหา "${escapeHtml(MESSAGING_STATE.searchQuery)}"</p>
                </div>
            `;
        } else {
            listEl.innerHTML = `
                <div class="p-8 text-center text-gray-400 text-xs">
                    <i class="fa-regular fa-comments text-3xl mb-3 opacity-30 text-gray-400"></i>
                    <p class="font-medium text-gray-600 mb-1">ยังไม่มีประวัติการส่งข้อความ</p>
                    <p class="text-gray-400 mb-4">กดปุ่ม "เขียนข้อความ" เพื่อเริ่มต้นส่งหาเพื่อนร่วมงานหรือผู้ดูแล</p>
                    <button onclick="openNewMessageModal(false)" class="px-3.5 py-2 bg-blue-50 text-apple-blue rounded-xl font-semibold text-xs hover:bg-blue-100 transition shadow-2xs">
                        <i class="fa-solid fa-pen mr-1.5"></i> ส่งข้อความแรก
                    </button>
                </div>
            `;
        }
        return;
    }

    listEl.innerHTML = filtered.map(c => {
        const partnerName = getConversationPartner(c, myName);
        const partnerDetails = (c.participantDetails && (c.participantDetails[partnerName] || c.participantDetails[partnerName.toLowerCase()])) || {};
        const isPartnerAdmin = partnerDetails.role === 'Admin';
        const isActive = c.id === MESSAGING_STATE.activeConversationId;

        // ดึงจำนวนข้อความที่ยังไม่ได้อ่าน
        const unread = (c.unreadCount && (c.unreadCount[myName] || c.unreadCount[myNameLower])) || c.unread || 0;
        const timeStr = formatMessageTimestamp(c.lastMessageAt);
        const isLastSenderMe = String(c.lastSender || '').toLowerCase().trim() === myNameLower;
        const lastMsgPrefix = isLastSenderMe ? '<span class="text-gray-400 font-normal">คุณ: </span>' : '';

        // ตรวจสอบสถานะออนไลน์จาก Cache
        const partnerUser = (MESSAGING_STATE.activeUsersCache || []).find(u => u.username.toLowerCase() === partnerName.toLowerCase());
        const isOnline = partnerUser ? partnerUser.isOnline : false;

        return `
            <div onclick="openConversation('${c.id}', '${escapeHtml(partnerName)}', '${partnerDetails.role || 'User'}')"
                class="conv-item p-3.5 hover:bg-blue-50/50 cursor-pointer transition flex items-start gap-3 relative ${isActive ? 'bg-blue-50/80 border-r-4 border-apple-blue' : ''}"
                id="conv_${c.id}">
                <!-- Avatar -->
                <div class="relative shrink-0">
                    <div class="w-11 h-11 rounded-2xl ${isPartnerAdmin ? 'bg-gradient-to-br from-amber-500 to-orange-500' : 'bg-gradient-to-br from-blue-500 to-indigo-500'} text-white font-bold flex items-center justify-center text-sm shadow-xs">
                        ${partnerName.substring(0, 2).toUpperCase()}
                    </div>
                    <!-- Online status dot -->
                    <span class="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white ${isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-gray-300'}" title="${isOnline ? 'ออนไลน์' : 'ออฟไลน์'}"></span>
                    ${unread > 0 ? `
                    <span class="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold rounded-full h-5 min-w-[20px] px-1 flex items-center justify-center ring-2 ring-white animate-pulse shadow-sm">
                        ${unread > 99 ? '99+' : unread}
                    </span>
                    ` : ''}
                </div>

                <!-- Info -->
                <div class="flex-1 min-w-0">
                    <div class="flex items-center justify-between gap-1 mb-1">
                        <div class="flex items-center gap-1.5 truncate">
                            <span class="font-bold text-sm text-gray-900 truncate">${escapeHtml(partnerName)}</span>
                            ${isPartnerAdmin ? `
                            <span class="px-1.5 py-0.2 bg-amber-100 text-amber-700 text-[9px] font-bold rounded uppercase shrink-0">Admin</span>
                            ` : `
                            <span class="px-1.5 py-0.2 bg-blue-100 text-blue-700 text-[9px] font-bold rounded uppercase shrink-0">User</span>
                            `}
                        </div>
                        <span class="text-[10px] text-gray-400 shrink-0 font-medium">${timeStr}</span>
                    </div>

                    <p class="text-xs ${unread > 0 ? 'text-gray-900 font-bold' : 'text-gray-500'} truncate leading-tight">
                        ${lastMsgPrefix}${escapeHtml(c.lastMessage || 'ไม่มีข้อความ')}
                    </p>
                </div>
            </div>
        `;
    }).join('');
}

/**
 * ไฮไลต์ห้องแชทที่กำลังเลือกอยู่
 */
function highlightActiveConversation() {
    document.querySelectorAll('.conv-item').forEach(el => {
        el.classList.remove('bg-blue-50/80', 'border-r-4', 'border-apple-blue');
    });
    if (MESSAGING_STATE.activeConversationId) {
        const activeEl = document.getElementById(`conv_${MESSAGING_STATE.activeConversationId}`);
        if (activeEl) {
            activeEl.classList.add('bg-blue-50/80', 'border-r-4', 'border-apple-blue');
        }
    }
}

/**
 * เปิดการสนทนา (Active Chat)
 */
async function openConversation(convId, partnerName, partnerRole = 'User') {
    MESSAGING_STATE.activeConversationId = convId;
    MESSAGING_STATE.activePartnerName = partnerName;
    MESSAGING_STATE.activePartnerRole = partnerRole;
    MESSAGING_STATE.isMobileChatOpen = true;

    // Toggle panels for responsive mobile view
    const convPanel = document.getElementById('msgConversationPanel');
    const chatPanel = document.getElementById('msgChatPanel');
    if (convPanel && chatPanel) {
        convPanel.classList.add('hidden', 'md:flex');
        chatPanel.classList.remove('hidden');
        chatPanel.classList.add('flex');
    }

    highlightActiveConversation();

    // มาร์กว่าเปิดอ่านแล้วใน Firestore ทันที
    const myName = STATE.user ? (STATE.user.name || STATE.user.username) : '';
    if (myName) {
        callApi('markConversationAsRead', {
            conversationId: convId,
            username: myName
        }, { silent: true });
    }

    // Render Chat Window
    renderChatWindow(partnerName, partnerRole);

    // Listen to messages
    listenToActiveChat(convId, (messages) => {
        MESSAGING_STATE.activeMessages = messages;
        renderChatMessages(messages);
    });
}

/**
 * ปิดมุมมองแชทบนมือถือเพื่อกลับไปหน้ารายชื่อ
 */
function closeMobileChat() {
    MESSAGING_STATE.isMobileChatOpen = false;
    const convPanel = document.getElementById('msgConversationPanel');
    const chatPanel = document.getElementById('msgChatPanel');
    if (convPanel && chatPanel) {
        convPanel.classList.remove('hidden');
        convPanel.classList.add('flex');
        chatPanel.classList.add('hidden');
        chatPanel.classList.remove('flex');
    }
}

/**
 * Render โครงหน้าต่างแชท (Header + Message Area + Quick Suggestions + Input)
 */
function renderChatWindow(partnerName, partnerRole) {
    const chatContent = document.getElementById('msgChatContent');
    if (!chatContent) return;

    const isPartnerAdmin = partnerRole === 'Admin';
    const isAdmin = STATE.user && STATE.user.role === 'Admin';

    // ตรวจสอบสถานะออนไลน์ของคู่สนทนา
    const partnerUser = (MESSAGING_STATE.activeUsersCache || []).find(u => u.username.toLowerCase() === partnerName.toLowerCase());
    const isOnline = partnerUser ? partnerUser.isOnline : false;
    const statusText = isOnline ? 'กำลังออนไลน์' : (partnerUser?.lastSeenText || 'ออฟไลน์');

    chatContent.innerHTML = `
        <!-- Chat Header -->
        <div class="px-4 py-3 bg-white border-b border-gray-200 flex items-center justify-between shrink-0 shadow-xs z-10">
            <div class="flex items-center gap-3">
                <button onclick="closeMobileChat()" class="md:hidden w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 flex items-center justify-center transition mr-1">
                    <i class="fa-solid fa-arrow-left"></i>
                </button>

                <div class="relative shrink-0">
                    <div class="w-10 h-10 rounded-2xl ${isPartnerAdmin ? 'bg-gradient-to-br from-amber-500 to-orange-500' : 'bg-gradient-to-br from-blue-500 to-indigo-500'} text-white font-bold flex items-center justify-center text-sm shadow-xs">
                        ${partnerName.substring(0, 2).toUpperCase()}
                    </div>
                    <span class="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white ${isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-gray-300'}" title="${isOnline ? 'ออนไลน์' : 'ออฟไลน์'}"></span>
                </div>

                <div>
                    <div class="flex items-center gap-2">
                        <h2 class="font-bold text-gray-900 text-sm sm:text-base leading-tight">${escapeHtml(partnerName)}</h2>
                        ${isPartnerAdmin ? `
                        <span class="px-1.5 py-0.5 bg-amber-100 text-amber-700 text-[10px] font-bold rounded uppercase">Admin</span>
                        ` : `
                        <span class="px-1.5 py-0.5 bg-blue-100 text-blue-700 text-[10px] font-bold rounded uppercase">User</span>
                        `}
                    </div>
                    <div class="flex items-center gap-1.5 text-[11px]">
                        <span class="w-2 h-2 rounded-full ${isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-gray-400'}"></span>
                        <span class="${isOnline ? 'text-emerald-600 font-semibold' : 'text-gray-400'}">${statusText}</span>
                    </div>
                </div>
            </div>

            <div class="flex items-center gap-2">
                ${isAdmin ? `
                <button onclick="confirmDeleteCurrentConversation()" 
                    class="text-gray-400 hover:text-red-500 p-2 rounded-lg hover:bg-red-50 transition" 
                    title="ลบประวัติการสนทนานี้">
                    <i class="fa-solid fa-trash text-sm"></i>
                </button>
                ` : ''}
            </div>
        </div>

        <!-- Chat Messages Container -->
        <div id="msgMessagesContainer" class="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
            <div class="text-center py-10 text-gray-400 text-xs">
                <i class="fa-solid fa-circle-notch fa-spin text-xl mb-2 text-apple-blue"></i>
                <p>กำลังโหลดข้อความ...</p>
            </div>
        </div>

        <!-- Quick Templates / Suggestions -->
        <div class="px-4 py-2 bg-white border-t border-gray-100 flex items-center gap-2 overflow-x-auto scrollbar-hide shrink-0">
            <span class="text-[11px] text-gray-400 font-medium shrink-0"><i class="fa-regular fa-lightbulb mr-1 text-amber-500"></i>ข้อความด่วน:</span>
            <button onclick="useQuickMessage('รับทราบเรียบร้อยครับ')" class="px-2.5 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full text-xs shrink-0 transition">
                ✓ รับทราบครับ
            </button>
            <button onclick="useQuickMessage('กำลังตรวจสอบข้อมูลให้ครับ')" class="px-2.5 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full text-xs shrink-0 transition">
                🔍 กำลังตรวจสอบให้
            </button>
            <button onclick="useQuickMessage('ดำเนินการเรียบร้อยแล้วครับ')" class="px-2.5 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full text-xs shrink-0 transition">
                ✅ เรียบร้อยแล้ว
            </button>
            <button onclick="useQuickMessage('รบกวนตรวจสอบห้องพักด้วยครับ')" class="px-2.5 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full text-xs shrink-0 transition">
                ตรวจสอบห้องพัก
            </button>
            <button onclick="useQuickMessage('ขอบคุณครับ')" class="px-2.5 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full text-xs shrink-0 transition">
                ขอบคุณครับ
            </button>
        </div>

        <!-- Chat Input Bar -->
        <div class="p-3 sm:p-4 bg-white border-t border-gray-200 shrink-0">
            <form onsubmit="handleSendMessageSubmit(event)" class="flex items-end gap-2">
                <div class="flex-1 relative bg-gray-50 border border-gray-200 focus-within:border-apple-blue focus-within:ring-2 focus-within:ring-apple-blue/20 rounded-2xl transition">
                    <textarea id="msgInputText" 
                        rows="1"
                        placeholder="พิมพ์ข้อความของคุณที่นี่... (กด Enter เพื่อส่ง, Shift+Enter ขึ้นบรรทัดใหม่)"
                        onkeydown="handleMessageInputKey(event)"
                        oninput="autoResizeTextarea(this)"
                        class="w-full px-4 py-3 bg-transparent text-sm text-gray-800 placeholder-gray-400 focus:outline-none resize-none max-h-32 leading-relaxed"></textarea>
                </div>

                <button type="submit" id="msgSendBtn"
                    class="h-11 px-5 bg-apple-blue hover:bg-blue-600 active:scale-95 text-white font-semibold rounded-2xl shadow-sm transition flex items-center justify-center gap-2 shrink-0">
                    <i class="fa-solid fa-paper-plane text-sm"></i>
                    <span class="hidden sm:inline text-sm">ส่ง</span>
                </button>
            </form>
        </div>
    `;

    // Focus input
    setTimeout(() => {
        const inp = document.getElementById('msgInputText');
        if (inp) inp.focus();
    }, 150);
}

/**
 * Render ข้อความใน Chat Window
 */
function renderChatMessages(messages) {
    const container = document.getElementById('msgMessagesContainer');
    if (!container) return;

    if (!messages || messages.length === 0) {
        container.innerHTML = `
            <div class="h-full flex flex-col items-center justify-center text-center p-8 text-gray-400">
                <div class="w-16 h-16 rounded-2xl bg-blue-50 text-apple-blue flex items-center justify-center text-2xl mb-3 shadow-xs">
                    <i class="fa-regular fa-comments"></i>
                </div>
                <h4 class="font-bold text-gray-700 text-sm mb-1">เริ่มต้นการสนทนา</h4>
                <p class="text-xs text-gray-500 max-w-xs">พิมพ์ข้อความด้านล่างเพื่อส่งหา <strong>${escapeHtml(MESSAGING_STATE.activePartnerName)}</strong></p>
            </div>
        `;
        return;
    }

    const myName = STATE.user ? (STATE.user.name || STATE.user.username) : '';
    const myNameLower = String(myName).toLowerCase().trim();
    let html = '';
    let lastDateStr = '';

    messages.forEach(m => {
        const isMe = String(m.senderName || '').toLowerCase().trim() === myNameLower;
        const msgDateStr = formatMessageDateGroup(m.timestamp);

        // Date separator banner
        if (msgDateStr !== lastDateStr) {
            html += `
                <div class="flex items-center justify-center my-4">
                    <span class="px-3.5 py-1 bg-gray-200/70 text-gray-600 text-[11px] font-semibold rounded-full shadow-2xs">
                        ${msgDateStr}
                    </span>
                </div>
            `;
            lastDateStr = msgDateStr;
        }

        const timeStr = formatMessageTimeOnly(m.timestamp);
        const formattedContent = escapeHtml(m.content).replace(/\n/g, '<br>');

        if (isMe) {
            // ข้อความที่ฉันส่งออก (ด้านขวา)
            html += `
                <div class="flex justify-end gap-2 items-end group">
                    <div class="flex flex-col items-end max-w-[82%] sm:max-w-[70%]">
                        <div class="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-2.5 rounded-2xl rounded-br-xs shadow-xs text-xs sm:text-sm leading-relaxed break-words">
                            ${formattedContent}
                        </div>
                        <div class="flex items-center gap-1.5 mt-1 text-[10px] text-gray-400 px-1">
                            <span>${timeStr}</span>
                            ${m.read ? `
                            <span class="text-apple-blue font-bold flex items-center gap-0.5" title="อ่านแล้ว">
                                <i class="fa-solid fa-check-double text-[10px]"></i> อ่านแล้ว
                            </span>
                            ` : `
                            <span class="text-gray-400 flex items-center gap-0.5" title="ส่งแล้ว">
                                <i class="fa-solid fa-check text-[10px]"></i> ส่งแล้ว
                            </span>
                            `}
                        </div>
                    </div>
                </div>
            `;
        } else {
            // ข้อความที่ได้รับเข้ามา (ด้านซ้าย)
            const isSenderAdmin = m.senderRole === 'Admin';
            html += `
                <div class="flex justify-start gap-2.5 items-end group">
                    <div class="w-8 h-8 rounded-xl ${isSenderAdmin ? 'bg-gradient-to-br from-amber-500 to-orange-500' : 'bg-gradient-to-br from-blue-500 to-indigo-500'} text-white font-bold flex items-center justify-center text-xs shrink-0 shadow-2xs mb-4">
                        ${(m.senderName || 'U').substring(0, 2).toUpperCase()}
                    </div>

                    <div class="flex flex-col items-start max-w-[82%] sm:max-w-[70%]">
                        <div class="text-[11px] font-semibold text-gray-500 mb-1 px-1 flex items-center gap-1.5">
                            <span>${escapeHtml(m.senderName)}</span>
                            ${isSenderAdmin ? '<span class="text-[9px] bg-amber-100 text-amber-700 px-1 rounded font-bold">Admin</span>' : ''}
                        </div>
                        <div class="bg-white border border-gray-200/80 text-gray-800 px-4 py-2.5 rounded-2xl rounded-bl-xs shadow-xs text-xs sm:text-sm leading-relaxed break-words">
                            ${formattedContent}
                        </div>
                        <div class="mt-1 text-[10px] text-gray-400 px-1">
                            <span>${timeStr}</span>
                        </div>
                    </div>
                </div>
            `;
        }
    });

    container.innerHTML = html;

    // เลื่อนลงล่างสุดอย่างนุ่มนวล
    setTimeout(() => {
        container.scrollTop = container.scrollHeight;
    }, 50);
}

/**
 * ส่งข้อความจากฟอร์ม
 */
async function handleSendMessageSubmit(e) {
    if (e) e.preventDefault();

    const input = document.getElementById('msgInputText');
    if (!input) return;

    const content = input.value.trim();
    if (!content) return;

    const convId = MESSAGING_STATE.activeConversationId;
    const recipient = MESSAGING_STATE.activePartnerName;

    if (!recipient) {
        showToast('แจ้งเตือน', 'กรุณาเลือกผู้รับข้อความ', 'error');
        return;
    }

    // ล้างข้อความใน input ทันที (Optimistic feeling)
    input.value = '';
    input.style.height = 'auto';

    try {
        const res = await callApi('sendMessage', {
            conversationId: convId,
            recipientName: recipient,
            recipientRole: MESSAGING_STATE.activePartnerRole || 'User',
            content: content,
            sender: STATE.user
        }, { silent: true });

        if (!res.success) {
            showToast('ข้อผิดพลาด', res.message, 'error');
        }
    } catch (err) {
        showToast('ผิดพลาด', 'ไม่สามารถส่งข้อความได้: ' + err.message, 'error');
    }
}

/**
 * Handle Enter / Shift+Enter ในช่องพิมพ์ข้อความ
 */
function handleMessageInputKey(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSendMessageSubmit();
    }
}

/**
 * ขยายความสูง textarea อัตโนมัติตามความยาวเนื้อหา
 */
function autoResizeTextarea(el) {
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 128) + 'px';
}

/**
 * ใช้ข้อความสำเร็จรูป
 */
function useQuickMessage(text) {
    const input = document.getElementById('msgInputText');
    if (input) {
        input.value = text;
        input.focus();
        autoResizeTextarea(input);
    }
}

/**
 * Search filter การสนทนา
 */
function handleMessagingSearch(val) {
    MESSAGING_STATE.searchQuery = val.trim();
    const clearBtn = document.getElementById('msgClearSearchBtn');
    if (clearBtn) {
        clearBtn.classList.toggle('hidden', !val.trim());
    }
    renderConversationList();
}

function clearMessagingSearch() {
    const input = document.getElementById('msgSearchInput');
    if (input) input.value = '';
    handleMessagingSearch('');
}

// =====================================================
// NEW MESSAGE & BROADCAST MODAL (REDESIGNED & ROBUST)
// =====================================================

/**
 * เปิด Modal เขียนข้อความใหม่ หรือ บรอดแคสต์
 */
function openNewMessageModal(isBroadcast = false) {
    MESSAGING_STATE.modalSelectedUser = null;
    const users = MESSAGING_STATE.activeUsersCache || [];
    const isAdmin = STATE.user && STATE.user.role === 'Admin';

    const modalHtml = `
        <div id="newMsgModal" class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-fade-in">
            <div class="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[85vh] animate-scale-up">
                <!-- Modal Header -->
                <div class="px-6 py-4 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
                    <div class="flex items-center gap-3">
                        <div class="w-10 h-10 rounded-xl ${isBroadcast ? 'bg-purple-100 text-purple-600' : 'bg-blue-100 text-apple-blue'} flex items-center justify-center text-lg">
                            <i class="fa-solid ${isBroadcast ? 'fa-bullhorn' : 'fa-pen-to-square'}"></i>
                        </div>
                        <div>
                            <h3 class="font-bold text-gray-900 text-base">
                                ${isBroadcast ? 'ส่งข้อความหาหลายคน (Broadcast)' : 'เขียนข้อความใหม่'}
                            </h3>
                            <p class="text-xs text-gray-500">
                                ${isBroadcast ? 'ส่งข้อความประกาศเดียวกันหาผู้ใช้หลายคนพร้อมกัน' : 'เลือกผู้รับที่ต้องการส่งข้อความถึง'}
                            </p>
                        </div>
                    </div>
                    <button onclick="closeNewMessageModal()" class="text-gray-400 hover:text-gray-600 p-2 rounded-lg hover:bg-gray-100 transition">
                        <i class="fa-solid fa-xmark text-lg"></i>
                    </button>
                </div>

                <!-- Modal Body -->
                <div class="p-6 flex-1 overflow-y-auto space-y-4">
                    <!-- Search User -->
                    <div>
                        <label class="block text-xs font-semibold text-gray-700 mb-1.5">ค้นหาผู้รับ</label>
                        <div class="relative">
                            <i class="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs"></i>
                            <input type="text" id="modalUserSearch" oninput="filterModalUsers(this.value)"
                                placeholder="พิมพ์ชื่อผู้ใช้หรืออีเมล..."
                                class="w-full pl-8 pr-3 py-2 border border-gray-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-apple-blue/20 focus:border-apple-blue">
                        </div>
                    </div>

                    <!-- User Selector / List -->
                    <div>
                        <div class="flex items-center justify-between mb-2">
                            <span class="text-xs font-semibold text-gray-700">รายชื่อผู้ใช้ (${users.length} คน)</span>
                            ${isBroadcast ? `
                            <button type="button" onclick="toggleSelectAllModalUsers()" class="text-xs text-apple-blue hover:underline font-medium">
                                เลือกทั้งหมด / ยกเลิก
                            </button>
                            ` : `
                            <span class="text-[11px] text-gray-400">กดเลือกเพื่อส่งข้อความ</span>
                            `}
                        </div>

                        <div id="modalUsersList" class="border border-gray-100 rounded-xl divide-y divide-gray-100 max-h-48 overflow-y-auto bg-gray-50/50">
                            ${renderModalUsersListHtml(users, isBroadcast)}
                        </div>
                    </div>

                    <!-- Selected Target Banner (1-on-1 Mode) -->
                    ${!isBroadcast ? `
                    <div id="modalSelectedTargetBanner" class="hidden bg-blue-50/90 border border-blue-200 text-blue-900 rounded-xl p-3 flex items-center justify-between text-xs animate-fade-in">
                        <div class="flex items-center gap-2.5 min-w-0">
                            <span id="modalSelectedUserDot" class="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0"></span>
                            <div class="truncate">
                                <span>กำลังส่งข้อความหา: </span>
                                <strong id="modalSelectedUserName" class="font-bold text-sm text-blue-900"></strong>
                                <span id="modalSelectedUserRole" class="ml-1 text-[10px] bg-blue-200 text-blue-800 px-1.5 py-0.2 rounded font-semibold"></span>
                            </div>
                        </div>
                        <button type="button" onclick="clearModalSelectedUser()" class="text-blue-500 hover:text-blue-700 font-semibold text-xs shrink-0 ml-2">
                            เปลี่ยน
                        </button>
                    </div>
                    ` : ''}

                    <!-- Message Text Area -->
                    <div id="modalDirectMessageArea" class="space-y-1.5">
                        <label class="block text-xs font-semibold text-gray-700">ข้อความที่ต้องการส่ง</label>
                        <textarea id="modalMsgContent" rows="3" 
                            placeholder="${isBroadcast ? 'พิมพ์ข้อความประกาศสำหรับทุกคนที่นี่...' : 'พิมพ์ข้อความของคุณที่นี่...'}"
                            class="w-full p-3 border border-gray-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-apple-blue/20 focus:border-apple-blue resize-none"></textarea>

                        <!-- Quick suggestions inside modal -->
                        <div class="flex flex-wrap gap-1.5 pt-1">
                            <span class="text-[10px] text-gray-400 self-center">ข้อความด่วน:</span>
                            <button type="button" onclick="setModalQuickText('สวัสดีครับ/ค่ะ')" class="text-[11px] px-2 py-0.5 bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-600 transition">สวัสดีครับ</button>
                            <button type="button" onclick="setModalQuickText('รบกวนตรวจสอบห้องพักด้วยครับ')" class="text-[11px] px-2 py-0.5 bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-600 transition">ตรวจสอบห้องพัก</button>
                            <button type="button" onclick="setModalQuickText('แจ้งข้อมูลเรียบร้อยแล้วครับ')" class="text-[11px] px-2 py-0.5 bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-600 transition">แจ้งข้อมูลเรียบร้อย</button>
                            <button type="button" onclick="setModalQuickText('มีของชำรุดรอซ่อมครับ')" class="text-[11px] px-2 py-0.5 bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-600 transition">มีของชำรุด</button>
                        </div>
                    </div>
                </div>

                <!-- Modal Footer -->
                <div class="px-6 py-3.5 bg-gray-50 border-t border-gray-100 flex items-center justify-end gap-2">
                    <button onclick="closeNewMessageModal()" class="px-4 py-2 border border-gray-200 text-gray-600 hover:bg-gray-100 text-xs sm:text-sm font-semibold rounded-xl transition">
                        ยกเลิก
                    </button>
                    ${isBroadcast ? `
                    <button onclick="submitBroadcastMessage()" class="px-5 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 active:scale-95 text-white text-xs sm:text-sm font-bold rounded-xl shadow-xs transition flex items-center gap-2">
                        <i class="fa-solid fa-paper-plane"></i> ส่งประกาศทั้งหมด
                    </button>
                    ` : `
                    <button type="button" onclick="openDirectChatFromModal()" class="px-3.5 py-2 border border-blue-200 text-apple-blue hover:bg-blue-50 active:scale-95 text-xs sm:text-sm font-semibold rounded-xl transition">
                        เปิดห้องแชท
                    </button>
                    <button onclick="submitModalDirectMessage()" class="px-5 py-2 bg-apple-blue hover:bg-blue-600 active:scale-95 text-white text-xs sm:text-sm font-bold rounded-xl shadow-xs transition flex items-center gap-2">
                        <i class="fa-solid fa-paper-plane"></i> ส่งข้อความทันที
                    </button>
                    `}
                </div>
            </div>
        </div>
    `;

    closeNewMessageModal();
    document.body.insertAdjacentHTML('beforeend', modalHtml);
}

function closeNewMessageModal() {
    const m = document.getElementById('newMsgModal');
    if (m) m.remove();
}

/**
 * Render รายชื่อผู้ใช้ใน Modal
 */
function renderModalUsersListHtml(users, isBroadcast) {
    if (!users || users.length === 0) {
        return `<div class="p-4 text-center text-gray-400 text-xs">ไม่พบผู้ใช้งานอื่นในระบบ</div>`;
    }

    return users.map(u => {
        const isAdmin = u.role === 'Admin';
        const isOnline = u.isOnline;
        const lastSeen = u.lastSeenText || 'ออฟไลน์';

        if (isBroadcast) {
            return `
                <label class="modal-user-item flex items-center gap-3 p-3 hover:bg-white cursor-pointer transition select-none">
                    <input type="checkbox" name="broadcast_users" value="${escapeHtml(u.username)}" class="rounded text-purple-600 focus:ring-purple-500 w-4 h-4">
                    <div class="relative shrink-0">
                        <div class="w-8 h-8 rounded-lg ${isAdmin ? 'bg-amber-100 text-amber-600' : 'bg-blue-100 text-blue-600'} flex items-center justify-center font-bold text-xs">
                            ${u.username.substring(0, 2).toUpperCase()}
                        </div>
                        <span class="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-white ${isOnline ? 'bg-emerald-500' : 'bg-gray-300'}"></span>
                    </div>
                    <div class="flex-1 min-w-0">
                        <div class="flex items-center gap-2">
                            <span class="text-xs font-bold text-gray-800 truncate">${escapeHtml(u.username)}</span>
                            <span class="text-[9px] ${isAdmin ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'} px-1 rounded font-bold">${u.role}</span>
                            ${isOnline ? '<span class="text-[9px] text-emerald-600 bg-emerald-50 px-1 rounded font-semibold border border-emerald-200">🟢 ออนไลน์</span>' : ''}
                        </div>
                        <p class="text-[10px] text-gray-400 truncate">${escapeHtml(u.email || u.access || '')}</p>
                    </div>
                </label>
            `;
        } else {
            return `
                <div onclick="selectModalRecipient('${escapeHtml(u.username)}', '${u.role}', ${isOnline ? 'true' : 'false'}, '${escapeHtml(lastSeen)}')" 
                    class="modal-user-item user-card-${escapeHtml(u.username)} flex items-center justify-between p-3 hover:bg-blue-50 cursor-pointer transition">
                    <div class="flex items-center gap-3 min-w-0">
                        <div class="relative shrink-0">
                            <div class="w-8 h-8 rounded-lg ${isAdmin ? 'bg-amber-100 text-amber-600' : 'bg-blue-100 text-blue-600'} flex items-center justify-center font-bold text-xs">
                                ${u.username.substring(0, 2).toUpperCase()}
                            </div>
                            <span class="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-white ${isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-gray-300'}"></span>
                        </div>
                        <div class="min-w-0">
                            <div class="flex items-center gap-2">
                                <span class="text-xs font-bold text-gray-800 truncate">${escapeHtml(u.username)}</span>
                                <span class="text-[9px] ${isAdmin ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'} px-1 rounded font-bold">${u.role}</span>
                                ${isOnline ? '<span class="text-[9px] text-emerald-600 bg-emerald-50 px-1 py-0.2 rounded font-semibold border border-emerald-200">🟢 ออนไลน์</span>' : `<span class="text-[9px] text-gray-400">${lastSeen}</span>`}
                            </div>
                            <p class="text-[10px] text-gray-400 truncate">${escapeHtml(u.email || u.access || '')}</p>
                        </div>
                    </div>
                    <div class="flex items-center gap-1.5 shrink-0">
                        <span class="select-badge text-xs text-apple-blue font-semibold px-2 py-1 rounded-lg hover:bg-blue-100 transition">
                            เลือก <i class="fa-solid fa-check text-[10px] ml-0.5"></i>
                        </span>
                    </div>
                </div>
            `;
        }
    }).join('');
}

/**
 * เลือกผู้รับใน 1-on-1 Modal
 */
function selectModalRecipient(username, role, isOnline, lastSeenText) {
    MESSAGING_STATE.modalSelectedUser = {
        name: username,
        role: role,
        isOnline: isOnline,
        lastSeenText: lastSeenText
    };

    // อัปเดตไฮไลต์ในรายการ
    document.querySelectorAll('.modal-user-item').forEach(el => {
        el.classList.remove('bg-blue-100/70', 'ring-2', 'ring-apple-blue');
    });

    const activeEl = document.querySelector(`.user-card-${username}`);
    if (activeEl) {
        activeEl.classList.add('bg-blue-100/70', 'ring-2', 'ring-apple-blue');
    }

    // อัปเดต Banner แสดงเป้าหมาย
    const banner = document.getElementById('modalSelectedTargetBanner');
    const nameEl = document.getElementById('modalSelectedUserName');
    const roleEl = document.getElementById('modalSelectedUserRole');
    const dotEl = document.getElementById('modalSelectedUserDot');

    if (banner && nameEl) {
        nameEl.innerText = username;
        if (roleEl) roleEl.innerText = role;
        if (dotEl) {
            dotEl.className = `w-2.5 h-2.5 rounded-full shrink-0 ${isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-gray-400'}`;
        }
        banner.classList.remove('hidden');
    }

    // เลื่อนไปที่ช่องกรอกข้อความและโฟกัส
    const msgInput = document.getElementById('modalMsgContent');
    if (msgInput) {
        msgInput.placeholder = `พิมพ์ข้อความถึงคุณ ${username}...`;
        msgInput.focus();
    }
}

/**
 * ยกเลิกการเลือกผู้ใช้ใน Modal
 */
function clearModalSelectedUser() {
    MESSAGING_STATE.modalSelectedUser = null;
    document.querySelectorAll('.modal-user-item').forEach(el => {
        el.classList.remove('bg-blue-100/70', 'ring-2', 'ring-apple-blue');
    });
    const banner = document.getElementById('modalSelectedTargetBanner');
    if (banner) banner.classList.add('hidden');
    const msgInput = document.getElementById('modalMsgContent');
    if (msgInput) msgInput.placeholder = 'พิมพ์ข้อความของคุณที่นี่...';
}

/**
 * ใส่ข้อความด่วนลงใน Modal Textarea
 */
function setModalQuickText(text) {
    const input = document.getElementById('modalMsgContent');
    if (input) {
        input.value = text;
        input.focus();
    }
}

/**
 * ส่งข้อความทันทีจากปุ่มใน Modal
 */
async function submitModalDirectMessage() {
    const selected = MESSAGING_STATE.modalSelectedUser;
    if (!selected) {
        showToast('แจ้งเตือน', 'กรุณากดเลือกผู้รับจากรายการด้านบนก่อนส่งข้อความ', 'error');
        return;
    }

    const input = document.getElementById('modalMsgContent');
    const content = input ? input.value.trim() : '';
    if (!content) {
        showToast('แจ้งเตือน', 'กรุณาระบุข้อความที่ต้องการส่ง', 'error');
        if (input) input.focus();
        return;
    }

    showLoading(true);
    try {
        const myName = STATE.user ? (STATE.user.name || STATE.user.username) : '';
        const convId = getConversationId(myName, selected.name);

        const res = await callApi('sendMessage', {
            conversationId: convId,
            recipientName: selected.name,
            recipientRole: selected.role,
            content: content,
            sender: STATE.user
        });
        showLoading(false);

        if (res.success) {
            showToast('สำเร็จ', `ส่งข้อความถึงคุณ "${selected.name}" เรียบร้อยแล้ว`, 'success');
            closeNewMessageModal();
            // เปิดห้องแชทกับคนนี้ทันที
            selectUserChat(selected.name, selected.role);
        } else {
            showToast('ผิดพลาด', res.message, 'error');
        }
    } catch (e) {
        showLoading(false);
        showToast('ผิดพลาด', e.message, 'error');
    }
}

/**
 * เปิดห้องแชทกับผู้ใช้ที่เลือกไว้ใน Modal โดยไม่ต้องพิมพ์ข้อความก่อน
 */
function openDirectChatFromModal() {
    const selected = MESSAGING_STATE.modalSelectedUser;
    if (!selected) {
        showToast('แจ้งเตือน', 'กรุณากดเลือกผู้ใช้ที่ต้องการเปิดห้องแชท', 'error');
        return;
    }

    const typedMsg = document.getElementById('modalMsgContent') ? document.getElementById('modalMsgContent').value.trim() : '';
    closeNewMessageModal();

    selectUserChat(selected.name, selected.role);

    if (typedMsg) {
        setTimeout(() => {
            const inp = document.getElementById('msgInputText');
            if (inp) {
                inp.value = typedMsg;
                autoResizeTextarea(inp);
            }
        }, 200);
    }
}

/**
 * Filter users in modal
 */
function filterModalUsers(keyword) {
    const q = keyword.toLowerCase().trim();
    const items = document.querySelectorAll('.modal-user-item');
    items.forEach(el => {
        const text = el.innerText.toLowerCase();
        el.style.display = text.includes(q) ? 'flex' : 'none';
    });
}

/**
 * Toggle select all in broadcast modal
 */
function toggleSelectAllModalUsers() {
    const checkboxes = document.querySelectorAll('input[name="broadcast_users"]');
    const allChecked = Array.from(checkboxes).every(c => c.checked);
    checkboxes.forEach(c => c.checked = !allChecked);
}

/**
 * ส่ง Broadcast ข้อความหาผู้ใช้หลายคน
 */
async function submitBroadcastMessage() {
    const checked = Array.from(document.querySelectorAll('input[name="broadcast_users"]:checked')).map(c => c.value);
    const content = document.getElementById('modalMsgContent') ? document.getElementById('modalMsgContent').value.trim() : '';

    if (checked.length === 0) {
        showToast('แจ้งเตือน', 'กรุณาเลือกผู้รับอย่างน้อย 1 คน', 'error');
        return;
    }
    if (!content) {
        showToast('แจ้งเตือน', 'กรุณาระบุข้อความประกาศที่ต้องการส่ง', 'error');
        return;
    }

    showLoading(true);
    try {
        const res = await callApi('broadcastMessage', {
            recipients: checked,
            content: content,
            sender: STATE.user
        });
        showLoading(false);

        if (res.success) {
            showToast('สำเร็จ', `ส่งประกาศหาผู้ใช้ ${res.count} คนเรียบร้อยแล้ว`, 'success');
            closeNewMessageModal();
        } else {
            showToast('ผิดพลาด', res.message, 'error');
        }
    } catch (e) {
        showLoading(false);
        showToast('ผิดพลาด', e.message, 'error');
    }
}

/**
 * ยืนยันลบการสนทนา (เฉพาะ Admin)
 */
function confirmDeleteCurrentConversation() {
    const convId = MESSAGING_STATE.activeConversationId;
    const partner = MESSAGING_STATE.activePartnerName;
    if (!convId) return;

    showConfirmModal(
        'ลบประวัติการสนทนา',
        `คุณแน่ใจหรือไม่ว่าต้องการลบประวัติการสนทนากับ "${escapeHtml(partner)}" ทั้งหมด? การกระทำนี้ไม่สามารถย้อนกลับได้`,
        async () => {
            showLoading(true);
            const res = await callApi('deleteConversation', {
                conversationId: convId,
                user: STATE.user
            });
            showLoading(false);

            if (res.success) {
                showToast('สำเร็จ', res.message, 'success');
                MESSAGING_STATE.activeConversationId = null;
                MESSAGING_STATE.activePartnerName = null;
                MESSAGING_STATE.activePartnerRole = null;
                stopActiveChatListener();
                renderMessaging();
            } else {
                showToast('ผิดพลาด', res.message, 'error');
            }
        }
    );
}

/**
 * Format timestamp display for list
 */
function formatMessageTimestamp(timestamp) {
    if (!timestamp) return '';
    let date;
    if (timestamp.toDate) {
        date = timestamp.toDate();
    } else if (timestamp.seconds) {
        date = new Date(timestamp.seconds * 1000);
    } else {
        date = new Date(timestamp);
    }

    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();

    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');

    if (isToday) {
        return `${hours}:${minutes}`;
    }

    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    if (date.toDateString() === yesterday.toDateString()) {
        return `เมื่อวาน`;
    }

    const d = date.getDate();
    const m = date.getMonth() + 1;
    return `${d}/${m}`;
}

/**
 * Format date group separator for chat bubbles
 */
function formatMessageDateGroup(timestamp) {
    if (!timestamp) return 'วันนี้';
    let date;
    if (timestamp.toDate) {
        date = timestamp.toDate();
    } else if (timestamp.seconds) {
        date = new Date(timestamp.seconds * 1000);
    } else {
        date = new Date(timestamp);
    }

    const now = new Date();
    if (date.toDateString() === now.toDateString()) return 'วันนี้';

    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    if (date.toDateString() === yesterday.toDateString()) return 'เมื่อวาน';

    const thaiMonths = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
    return `${date.getDate()} ${thaiMonths[date.getMonth()]} ${date.getFullYear() + 543}`;
}

/**
 * Format time only for chat bubble
 */
function formatMessageTimeOnly(timestamp) {
    if (!timestamp) return '';
    let date;
    if (timestamp.toDate) {
        date = timestamp.toDate();
    } else if (timestamp.seconds) {
        date = new Date(timestamp.seconds * 1000);
    } else {
        date = new Date(timestamp);
    }
    const h = String(date.getHours()).padStart(2, '0');
    const m = String(date.getMinutes()).padStart(2, '0');
    return `${h}:${m}`;
}

console.log('[View] Messaging module loaded successfully (v=44)');
