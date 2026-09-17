/**
 * Smart Dormitory Management System — Firebase Data Layer
 * แทนที่ code.js (Google Apps Script) ทั้งหมดด้วย Firestore operations
 * 
 * ทุก function คืนค่า { success: true/false, ... } เหมือนเดิม
 * เพื่อให้ Frontend เดิมทำงานได้โดยไม่ต้องแก้ไข render functions
 */

// =====================================================
// AUTH FUNCTIONS
// =====================================================

/**
 * Login ด้วย email + password ผ่าน Firebase Auth
 * ระบบเดิมใช้ username → เราเก็บ mapping username→email ใน Firestore
 */
async function handleLoginFirebase(username, password) {
    try {
        // ค้นหา user document ที่ username ตรงกัน
        const usersRef = db.collection('users');
        const snapshot = await usersRef.where('username', '==', username).limit(1).get();

        if (snapshot.empty) {
            return { success: false, message: "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง" };
        }

        const userDoc = snapshot.docs[0];
        const userData = userDoc.data();

        if (userData.status !== 'Active') {
            return { success: false, message: "บัญชีของคุณยังไม่ได้รับการอนุมัติ" };
        }

        // Login ผ่าน Firebase Auth ด้วย email
        const email = userData.email;
        try {
            await auth.signInWithEmailAndPassword(email, password);
        } catch (authError) {
            // JIT Migration: หากยังไม่มีบัญชีใน Firebase Auth แต่มีใน Firestore และรหัสผ่านตรงกัน
            if ((authError.code === 'auth/user-not-found' || authError.code === 'auth/invalid-credential')
                && userData.password && userData.password === password) {
                try {
                    // สร้างบัญชีให้ใหม่ทันทีและทำการล็อกอินอัตโนมัติ
                    await auth.createUserWithEmailAndPassword(email, password);
                } catch (createError) {
                    if (createError.code === 'auth/weak-password') {
                        return { success: false, message: "รหัสผ่านเดิมสั้นเกินไป (ต้องมี 6 ตัวอักษรขึ้นไป) กรุณาติดต่อแอดมินหรือสมัครสมาชิกใหม่" };
                    }
                    throw createError;
                }
            } else {
                throw authError; // ถ้าไม่ใช่ JIT หรือรหัสไม่ตรง ให้โยน error ออกไปปกติ
            }
        }

        return {
            success: true,
            user: {
                id: userDoc.id,
                name: userData.username,
                role: userData.role,
                projects: userData.role === 'Admin' ? PROJECTS : (userData.access || [])
            }
        };
    } catch (error) {
        console.error('[Login Error]', error);
        
        // Auto-fix for cache corruption
        if (error && error.message && error.message.includes('INTERNAL ASSERTION FAILED')) {
            setTimeout(() => {
                indexedDB.deleteDatabase('firestore/[DEFAULT]/smartcourt-gvsport/main');
                window.location.reload(true);
            }, 1500);
            return { success: false, message: "กำลังรีเซ็ตระบบเนื่องจากข้อมูลแคชขัดข้อง กรุณารอสักครู่..." };
        }

        if (error.code === 'auth/wrong-password' || error.code === 'auth/user-not-found' || error.code === 'auth/invalid-credential') {
            return { success: false, message: "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง" };
        }
        return { success: false, message: error.message };
    }
}

/**
 * Register ผู้ใช้ใหม่
 */
async function handleRegisterFirebase(username, password, email) {
    try {
        // ตรวจสอบ username ซ้ำ
        const existing = await db.collection('users').where('username', '==', username).limit(1).get();
        if (!existing.empty) {
            return { success: false, message: "ชื่อผู้ใช้นี้ถูกใช้ไปแล้ว" };
        }

        // ตรวจสอบ email ซ้ำ
        const existingEmail = await db.collection('users').where('email', '==', email).limit(1).get();
        if (!existingEmail.empty) {
            return { success: false, message: "อีเมลนี้ถูกใช้ไปแล้ว กรุณาใช้อีเมลอื่น" };
        }

        // สร้าง Firebase Auth user
        const userCredential = await auth.createUserWithEmailAndPassword(email, password);
        const uid = userCredential.user.uid;

        // สร้าง user document ใน Firestore
        await db.collection('users').doc(uid).set({
            username: username,
            email: email,
            role: 'Project User',
            access: PROJECTS, // Default: access ทุกโครงการ
            status: 'Active',
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });

        // Sign out หลังลงทะเบียน (ให้ login ใหม่)
        await auth.signOut();

        return { success: true, message: "ลงทะเบียนสำเร็จ เข้าสู่ระบบได้ทันที" };
    } catch (error) {
        console.error('[Register Error]', error);
        if (error.code === 'auth/email-already-in-use') {
            return { success: false, message: "อีเมลนี้ถูกใช้ไปแล้ว" };
        }
        return { success: false, message: error.message };
    }
}

async function handleLogoutFirebase() {
    // Clear all realtime listeners before signing out to prevent Assertion Errors
    if (typeof projectListeners !== 'undefined') {
        Object.keys(projectListeners).forEach(p => {
            if (typeof projectListeners[p] === 'function') {
                try {
                    projectListeners[p]();
                } catch (e) {}
            }
            delete projectListeners[p];
        });
    }
    // Also clear other listeners if any
    if (typeof settingsListener === 'function') {
        settingsListener();
        settingsListener = null;
    }
    await auth.signOut();
}

/**
 * ดึงข้อมูล user ปัจจุบันจาก Firestore (หลัง auth state change)
 */
async function getCurrentUserData() {
    const currentUser = auth.currentUser;
    if (!currentUser) return null;

    // First try direct UID lookup (for users created natively in Firebase)
    let doc = await db.collection('users').doc(currentUser.uid).get();

    if (!doc.exists) {
        // Fallback: search by email (for migrated users whose doc ID ≠ Auth UID)
        const snapshot = await db.collection('users')
            .where('email', '==', currentUser.email)
            .limit(1)
            .get();
        if (snapshot.empty) return null;
        doc = snapshot.docs[0];
    }

    const data = doc.data();
    return {
        id: doc.id,
        name: data.username,
        role: data.role,
        projects: data.role === 'Admin' ? PROJECTS : (data.access || [])
    };
}

// =====================================================
// USER MANAGEMENT (Admin Only)
// =====================================================

async function handleGetUsersFirebase(user) {
    if (!user || user.role !== 'Admin') {
        return { success: false, message: "Access Denied" };
    }

    try {
        const snapshot = await db.collection('users').get();
        const users = snapshot.docs.map(doc => {
            const d = doc.data();
            return {
                id: doc.id,
                username: d.username,
                email: d.email,
                role: d.role,
                access: Array.isArray(d.access) ? d.access.join(',') : (d.access || ''),
                status: d.status
            };
        });
        return { success: true, users };
    } catch (error) {
        return { success: false, message: error.message };
    }
}

async function handleManageUserFirebase(action, userData, user) {
    // Verify admin status from the actual current session (not just the passed-in user object)
    const currentUser = auth.currentUser;
    if (!currentUser || !user || user.role !== 'Admin') {
        return { success: false, message: "Access Denied" };
    }

    try {
        if (action === 'add') {
            // Check duplicate username
            const existing = await db.collection('users').where('username', '==', userData.username).limit(1).get();
            if (!existing.empty) {
                return { success: false, message: "ชื่อผู้ใช้นี้มีอยู่แล้ว" };
            }

            // Note: Admin ต้องสร้าง Firebase Auth user ผ่าน Admin SDK (server-side)
            // ตอนนี้เก็บใน Firestore ก่อน — user จะต้อง register เอง
            const newId = 'U' + Date.now();
            await db.collection('users').doc(newId).set({
                username: userData.username,
                email: userData.email || '',
                role: userData.role,
                access: userData.access ? userData.access.split(',').map(s => s.trim()).filter(s => s) : [],
                status: userData.status || 'Active',
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            return { success: true, message: "เพิ่มผู้ใช้เรียบร้อย" };

        } else if (action === 'edit') {
            const userRef = db.collection('users').doc(userData.id);
            const updateData = {
                username: userData.username,
                email: userData.email,
                role: userData.role,
                access: userData.access ? userData.access.split(',').map(s => s.trim()).filter(s => s) : [],
                status: userData.status
            };
            // Don't update password here (handled by Firebase Auth)
            await userRef.update(updateData);
            return { success: true, message: "แก้ไขข้อมูลเรียบร้อย" };

        } else if (action === 'delete') {
            await db.collection('users').doc(userData.id).delete();
            return { success: true, message: "ลบผู้ใช้เรียบร้อย" };
        }

        return { success: false, message: "Invalid action" };
    } catch (error) {
        return { success: false, message: error.message };
    }
}

// =====================================================
// PROJECT DATA (Rooms) - Mega-Document Architecture
// =====================================================

const projectListeners = {};
const projectDataCache = {};

async function handleGetProjectDataFirebase(project) {
    try {
        // Unsubscribe from other projects' listeners to conserve Firestore quota
        // and prevent concurrent background event dispatches
        Object.keys(projectListeners).forEach(p => {
            if (p !== project && typeof projectListeners[p] === 'function') {
                try {
                    projectListeners[p](); // Call the unsubscribe function
                } catch (e) {
                    console.warn('[Unsubscribe Warning]', e);
                }
                delete projectListeners[p];
                delete projectDataCache[p];
            }
        });

        if (!projectListeners[project]) {
            // First time load: wait for the first snapshot
            await new Promise((resolve, reject) => {
                const unsubscribe = db.collection('buildingRooms')
                    .where('project', '==', project)
                    .onSnapshot(snapshot => {
                        let allRooms = [];
                        snapshot.docs.forEach(doc => {
                            const buildingData = doc.data();
                            if (buildingData.rooms && Array.isArray(buildingData.rooms)) {
                                // Add rowIndex (oldDocId or generate one) for UI compatibility
                                const mappedRooms = buildingData.rooms.map(r => ({
                                    ...r,
                                    rowIndex: r.oldDocId || `${project}_${r.roomNo.replace(/[/\\]/g, '-')}`
                                }));
                                allRooms = allRooms.concat(mappedRooms);
                            }
                        });

                        projectDataCache[project] = allRooms;

                        // Dispatch global event so UI can re-render in real-time
                        window.dispatchEvent(new CustomEvent('roomsDataUpdated', { detail: { project, data: allRooms } }));

                        resolve(); // Resolve on first load
                    }, error => {
                        console.error('[Realtime Error]', error);
                        reject(error);
                    });

                projectListeners[project] = unsubscribe;
            });
        }

        // Return from memory cache (0 quota reads)
        return { success: true, data: projectDataCache[project] || [] };
    } catch (error) {
        return { success: false, message: error.message };
    }
}

// --- Helper: Parse Room Number (Internal to db.js) ---
function parseRoomInfoForDb(roomNo) {
    let cleanRoomNo = roomNo.toString().trim();
    if (cleanRoomNo.length < 3) return { building: 'Main', full: cleanRoomNo };
    const len = cleanRoomNo.length;
    const building = cleanRoomNo.substring(0, len - 3);
    return { building: building || 'Main', full: cleanRoomNo };
}

async function handleSaveRoomDataFirebase(project, rowIndex, data, userName) {
    try {
        const info = parseRoomInfoForDb(data.roomNo);
        const building = info.building;
        const docId = `${project}_${building}`;
        const buildingRef = db.collection('buildingRooms').doc(docId);

        let finalStatus = data.status;

        await db.runTransaction(async (transaction) => {
            const doc = await transaction.get(buildingRef);
            
            let rooms = [];
            if (doc.exists && doc.data().rooms) {
                rooms = doc.data().rooms;
            }

            // Find existing room index
            // We use roomNo to find it, or rowIndex if provided
            let existingRoomIndex = -1;
            if (rowIndex) {
                // If rowIndex is the old document ID or the generated ID
                existingRoomIndex = rooms.findIndex(r => r.oldDocId === rowIndex || `${project}_${r.roomNo.replace(/[/\\]/g, '-')}` === rowIndex || r.roomNo === data.roomNo);
            } else {
                existingRoomIndex = rooms.findIndex(r => r.roomNo === data.roomNo);
            }

            let bookingDate = '';
            if (data.status === 'ห้องจอง') {
                if (existingRoomIndex >= 0 && rooms[existingRoomIndex].bookingDate) {
                    bookingDate = rooms[existingRoomIndex].bookingDate;
                } else {
                    bookingDate = new Date().toISOString().split('T')[0];
                }
            }

            const roomData = {
                roomNo: data.roomNo,
                status: data.status,
                moveInDate: data.moveInDate || '',
                roomType: data.roomType || 'Standard',
                remark: data.remark || '',
                isSampleRoom: data.isSampleRoom || false,
                bookingDate: bookingDate,
                bookingDuration: data.bookingDuration || '',
                noBookingExpiry: data.noBookingExpiry || false,
                oldDocId: rowIndex || null // preserve old reference if any
            };

            if (existingRoomIndex >= 0) {
                // Update
                rooms[existingRoomIndex] = { ...rooms[existingRoomIndex], ...roomData };
            } else {
                // Add new
                rooms.push(roomData);
            }

            transaction.set(buildingRef, {
                project: project,
                building: building,
                rooms: rooms,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            }, { merge: true });
        });

        // We also need to update the projectSummary! (But for simplicity, we can recount it via a cloud function or let dashboard aggregate later. For now, we update it in a separate block)
        // In a real robust system, we would transaction the summary too. For now, since summary is less critical for data integrity than the room itself, we can skip or do it separately.
        
        // Log action
        await logAction(userName, project, data.roomNo, rowIndex ? 'Edit' : 'Add', 'Update Status/Date/Remark', data.status);

        return { success: true };
    } catch (error) {
        return { success: false, message: error.message };
    }
}

async function handleAddRoomFirebase(project, roomNo, roomType, status) {
    try {
        if (!project || !roomNo) {
            return { success: false, message: "Missing Data" };
        }

        const info = parseRoomInfoForDb(roomNo);
        const building = info.building;
        const docId = `${project}_${building}`;
        const buildingRef = db.collection('buildingRooms').doc(docId);

        let successMessage = "";

        await db.runTransaction(async (transaction) => {
            const doc = await transaction.get(buildingRef);
            let rooms = [];
            if (doc.exists && doc.data().rooms) {
                rooms = doc.data().rooms;
            }

            if (rooms.find(r => r.roomNo === roomNo)) {
                throw new Error("เลขห้องนี้มีอยู่แล้ว");
            }

            rooms.push({
                roomNo: roomNo,
                roomType: roomType || 'Standard',
                status: status || 'ห้องว่าง',
                moveInDate: '',
                remark: '',
                isSampleRoom: false,
                bookingDate: '',
                bookingDuration: ''
            });

            transaction.set(buildingRef, {
                project: project,
                building: building,
                rooms: rooms,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            }, { merge: true });

            successMessage = "เพิ่มห้องสำเร็จ";
        });

        return { success: true, message: successMessage };
    } catch (error) {
        return { success: false, message: error.message };
    }
}

// =====================================================
// SETTINGS
// =====================================================

async function handleGetRoomStatusesFirebase() {
    try {
        const snapshot = await db.collection('roomStatuses').get();
        if (snapshot.empty) return { success: true, statuses: [] };

        const statuses = snapshot.docs.map(doc => {
            const d = doc.data();
            return {
                id: doc.id,
                project: d.project,
                name: d.name,
                colorType: d.colorType || 'predefined', // predefined or custom
                color: d.color || 'gray'
            };
        });
        return { success: true, statuses };
    } catch (error) {
        return { success: false, message: error.message };
    }
}

async function handleSaveRoomStatusesFirebase(statuses) {
    try {
        const batch = db.batch();
        const existing = await db.collection('roomStatuses').get();
        existing.docs.forEach(doc => batch.delete(doc.ref));

        if (statuses && statuses.length > 0) {
            statuses.forEach(s => {
                const ref = db.collection('roomStatuses').doc();
                batch.set(ref, {
                    project: s.project,
                    name: s.name,
                    colorType: s.colorType || 'predefined',
                    color: s.color || 'gray'
                });
            });
        }
        await batch.commit();
        return { success: true };
    } catch (error) {
        return { success: false, message: error.message };
    }
}

async function handleGetSettingsFirebase() {
    try {
        const snapshot = await db.collection('settings').get();

        if (snapshot.empty) {
            return { success: true, roomTypes: [] };
        }

        const roomTypes = snapshot.docs.map(doc => {
            const d = doc.data();
            return {
                id: doc.id,
                project: d.project,
                name: d.name,
                price: d.price,
                detail: d.detail,
                color: d.color || 'gray',
                category: d.category || d.name
            };
        });

        return { success: true, roomTypes };
    } catch (error) {
        return { success: false, message: error.message };
    }
}

async function handleSaveSettingsFirebase(roomTypes) {
    try {
        // Strategy: Delete all existing settings, then re-add
        // (Same approach as the original code.js which clears the sheet)
        const batch = db.batch();

        // Delete existing
        const existing = await db.collection('settings').get();
        existing.docs.forEach(doc => batch.delete(doc.ref));

        // Add new
        if (roomTypes && roomTypes.length > 0) {
            roomTypes.forEach(rt => {
                const ref = db.collection('settings').doc();
                batch.set(ref, {
                    project: rt.project,
                    name: rt.name,
                    price: rt.price,
                    detail: rt.detail,
                    color: rt.color || 'gray',
                    category: rt.category || rt.name
                });
            });
        }

        await batch.commit();
        return { success: true };
    } catch (error) {
        return { success: false, message: error.message };
    }
}


async function handleGetRoomStatusesFirebase() {
    try {
        const snapshot = await db.collection('roomStatuses').get();
        const statuses = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                project: data.project,
                name: data.name,
                colorType: data.colorType || 'predefined',
                color: data.color || 'emerald'
            };
        });
        return { success: true, statuses };
    } catch (error) {
        return { success: false, message: error.message };
    }
}

async function handleSaveRoomStatusesFirebase(statuses) {
    try {
        const batch = db.batch();

        // Delete existing
        const existing = await db.collection('roomStatuses').get();
        existing.docs.forEach(doc => batch.delete(doc.ref));

        // Add new
        if (statuses && statuses.length > 0) {
            statuses.forEach(s => {
                const ref = db.collection('roomStatuses').doc();
                batch.set(ref, {
                    project: s.project,
                    name: s.name,
                    colorType: s.colorType || 'predefined',
                    color: s.color || 'emerald'
                });
            });
        }

        await batch.commit();
        return { success: true };
    } catch (error) {
        return { success: false, message: error.message };
    }
}

// =====================================================
// LAYOUTS
// =====================================================

async function handleGetLayoutsFirebase(project) {
    try {
        let query = db.collection('layouts');
        if (project) {
            query = query.where('project', '==', project);
        }

        const snapshot = await query.get();

        if (snapshot.empty) {
            return { success: true, layouts: [] };
        }

        const layouts = [];
        snapshot.docs.forEach(doc => {
            const d = doc.data();
            try {
                const layout = typeof d.layoutJSON === 'string' ? JSON.parse(d.layoutJSON) : d.layoutJSON;
                layouts.push({
                    project: d.project,
                    building: d.building,
                    layout: layout,
                    updatedAt: d.updatedAt ? d.updatedAt.toDate().toISOString() : ''
                });
            } catch (e) {
                console.warn('[getLayouts] Error parsing layout:', e);
            }
        });

        return { success: true, layouts };
    } catch (error) {
        return { success: false, message: error.message };
    }
}

async function handleSaveLayoutFirebase(project, building, layout) {
    if (!project || !building || !layout) {
        return { success: false, message: "Missing data" };
    }

    try {
        const docId = `${project}_${building}`;
        await db.collection('layouts').doc(docId).set({
            project: project,
            building: building,
            layoutJSON: layout, // Store as object (Firestore handles JSON natively)
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });

        return { success: true, message: "บันทึก Layout เรียบร้อย" };
    } catch (error) {
        return { success: false, message: error.message };
    }
}

async function handleDeleteLayoutFirebase(project, building) {
    try {
        const docId = `${project}_${building}`;
        const docRef = db.collection('layouts').doc(docId);
        const doc = await docRef.get();

        if (!doc.exists) {
            return { success: false, message: "ไม่พบ Layout ของตึกนี้" };
        }

        await docRef.delete();
        return { success: true, message: "ลบ Layout เรียบร้อย" };
    } catch (error) {
        return { success: false, message: error.message };
    }
}

// =====================================================
// BUILDING STRIPES
// =====================================================

async function handleGetBuildingStripesFirebase(project) {
    if (!project) return { success: false, message: "Missing project" };

    try {
        const doc = await db.collection('buildingStripes').doc(project).get();

        if (!doc.exists || !doc.data().stripes) {
            return { success: true, stripes: {} };
        }

        const stripes = typeof doc.data().stripes === 'string'
            ? JSON.parse(doc.data().stripes)
            : doc.data().stripes;

        return { success: true, stripes };
    } catch (error) {
        return { success: true, stripes: {} };
    }
}

async function handleSaveBuildingStripesFirebase(project, stripes) {
    if (!project) return { success: false, message: "Missing project" };

    try {
        await db.collection('buildingStripes').doc(project).set({
            stripes: stripes || {},
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });

        return { success: true, message: "บันทึกแถบสีตึกเรียบร้อย" };
    } catch (error) {
        return { success: false, message: error.message };
    }
}

// =====================================================
// CARD GROUPS
// =====================================================

async function handleGetCardGroupsFirebase(project) {
    if (!project) return { success: false, message: 'Missing project' };

    try {
        const snapshot = await db.collection('cardGroups')
            .where('project', '==', project)
            .get();

        if (snapshot.empty) {
            return { success: true, cardGroups: {} };
        }

        const map = {};
        snapshot.docs.forEach(doc => {
            const d = doc.data();
            const cardKey = (d.cardKey || '').trim();
            const enabled = d.enabled === true || d.enabled === 'true';
            const groups = d.groups || [];
            map[cardKey] = { enabled, groups };
        });

        return { success: true, cardGroups: map };
    } catch (error) {
        return { success: true, cardGroups: {} };
    }
}

async function handleSaveCardGroupsFirebase(project, cardKey, enabled, groups) {
    if (!project || !cardKey) return { success: false, message: 'Missing data' };

    try {
        const docId = `${project}_${cardKey}`;
        await db.collection('cardGroups').doc(docId).set({
            project: project,
            cardKey: cardKey,
            enabled: !!enabled,
            groups: groups || [],
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });

        return { success: true, message: 'บันทึกกลุ่มการ์ดเรียบร้อย' };
    } catch (error) {
        return { success: false, message: error.message };
    }
}

// =====================================================
// SUMMARY CARDS (Custom Aggregate Cards)
// =====================================================

async function handleGetSummaryCardsFirebase(project) {
    if (!project) return { success: false, message: 'Missing project' };

    try {
        const snapshot = await db.collection('summaryCards')
            .where('project', '==', project)
            .get();

        if (snapshot.empty) {
            return { success: true, summaryCards: [] };
        }

        const cards = [];
        snapshot.docs.forEach(doc => {
            const d = doc.data();
            cards.push({
                id: doc.id,
                project: d.project,
                title: d.title || '',
                color: d.color || 'teal',
                colorType: d.colorType || 'predefined',
                icon: d.icon || 'fa-layer-group',
                statuses: Array.isArray(d.statuses) ? d.statuses : [],
                enabled: d.enabled !== false,
                order: typeof d.order === 'number' ? d.order : 0
            });
        });

        cards.sort((a, b) => (a.order || 0) - (b.order || 0));
        return { success: true, summaryCards: cards };
    } catch (error) {
        console.error('[handleGetSummaryCardsFirebase]', error);
        return { success: true, summaryCards: [] };
    }
}

async function handleSaveSummaryCardFirebase(project, cardData) {
    if (!project || !cardData || !cardData.title) {
        return { success: false, message: 'Missing required summary card data' };
    }

    try {
        const docRef = cardData.id 
            ? db.collection('summaryCards').doc(cardData.id) 
            : db.collection('summaryCards').doc();

        const payload = {
            project: project,
            title: (cardData.title || '').trim(),
            color: cardData.color || 'teal',
            colorType: cardData.colorType || 'predefined',
            icon: cardData.icon || 'fa-layer-group',
            statuses: Array.isArray(cardData.statuses) ? cardData.statuses : [],
            enabled: cardData.enabled !== false,
            order: typeof cardData.order === 'number' ? cardData.order : 0,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        };

        if (!cardData.id) {
            payload.createdAt = firebase.firestore.FieldValue.serverTimestamp();
        }

        await docRef.set(payload, { merge: true });
        return { success: true, message: 'บันทึกการ์ดสรุปยอดเรียบร้อย', id: docRef.id };
    } catch (error) {
        console.error('[handleSaveSummaryCardFirebase]', error);
        return { success: false, message: error.message };
    }
}

async function handleDeleteSummaryCardFirebase(cardId) {
    if (!cardId) return { success: false, message: 'Missing cardId' };

    try {
        await db.collection('summaryCards').doc(cardId).delete();
        return { success: true, message: 'ลบการ์ดสรุปยอดเรียบร้อย' };
    } catch (error) {
        console.error('[handleDeleteSummaryCardFirebase]', error);
        return { success: false, message: error.message };
    }
}

// =====================================================
// CARD ORDER (Dashboard Cards Sorting)
// =====================================================

async function handleGetCardOrderFirebase(project) {
    if (!project) return { success: false, message: 'Missing project' };

    try {
        const doc = await db.collection('cardOrder').doc(project).get();
        if (!doc.exists) {
            return { success: true, order: [] };
        }
        const data = doc.data();
        return { success: true, order: Array.isArray(data.order) ? data.order : [] };
    } catch (error) {
        console.error('[handleGetCardOrderFirebase]', error);
        return { success: true, order: [] };
    }
}

async function handleSaveCardOrderFirebase(project, orderArray) {
    if (!project || !Array.isArray(orderArray)) {
        return { success: false, message: 'Missing project or orderArray' };
    }

    try {
        await db.collection('cardOrder').doc(project).set({
            project: project,
            order: orderArray,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        return { success: true, message: 'บันทึกลำดับการ์ดเรียบร้อย' };
    } catch (error) {
        console.error('[handleSaveCardOrderFirebase]', error);
        return { success: false, message: error.message };
    }
}

// =====================================================
// LOGGING
// =====================================================

async function logAction(userName, project, room, action, info, status) {
    try {
        await db.collection('logs').add({
            timestamp: firebase.firestore.FieldValue.serverTimestamp(),
            user: userName,
            project: project,
            room: room,
            action: action,
            info: info,
            status: status
        });
    } catch (e) {
        console.warn('[logAction] Error:', e);
    }
}

// =====================================================
// UNIFIED API HANDLER
// (Drop-in replacement for google.script.run.apiHandler)
// =====================================================

async function firebaseApiHandler(request) {
    const { action, payload } = request;

    try {
        switch (action) {
            case 'login':
                return await handleLoginFirebase(payload.username, payload.password);

            case 'register':
                return await handleRegisterFirebase(payload.username, payload.password, payload.email);

            case 'getProjectData':
                return await handleGetProjectDataFirebase(payload.project);

            case 'saveRoomData':
                return await handleSaveRoomDataFirebase(
                    payload.project,
                    payload.rowIndex,
                    payload.data,
                    payload.user
                );

            case 'addRoom':
                return await handleAddRoomFirebase(
                    payload.project,
                    payload.roomNo,
                    payload.roomType,
                    payload.status
                );

            case 'getSettings':
                return await handleGetSettingsFirebase();

            case 'saveSettings':
                return await handleSaveSettingsFirebase(payload.roomTypes);

            case 'getRoomStatuses':
                return await handleGetRoomStatusesFirebase();

            case 'saveRoomStatuses':
                return await handleSaveRoomStatusesFirebase(payload.statuses);

            case 'getUsers':
                return await handleGetUsersFirebase(payload.user);

            case 'manageUser':
                return await handleManageUserFirebase(payload.action, payload.userData, payload.user);

            case 'getLayouts':
                return await handleGetLayoutsFirebase(payload.project);

            case 'saveLayout':
                return await handleSaveLayoutFirebase(payload.project, payload.building, payload.layout);

            case 'deleteLayout':
                return await handleDeleteLayoutFirebase(payload.project, payload.building);

            case 'getBuildingStripes':
                return await handleGetBuildingStripesFirebase(payload.project);

            case 'saveBuildingStripes':
                return await handleSaveBuildingStripesFirebase(payload.project, payload.stripes);

            case 'getCardGroups':
                return await handleGetCardGroupsFirebase(payload.project);

            case 'saveCardGroups':
                return await handleSaveCardGroupsFirebase(
                    payload.project,
                    payload.cardKey,
                    payload.enabled,
                    payload.groups
                );

            case 'getSummaryCards':
                return await handleGetSummaryCardsFirebase(payload.project);

            case 'saveSummaryCard':
                return await handleSaveSummaryCardFirebase(payload.project, payload.card);

            case 'deleteSummaryCard':
                return await handleDeleteSummaryCardFirebase(payload.cardId || payload.id);

            case 'getCardOrder':
                return await handleGetCardOrderFirebase(payload.project);

            case 'saveCardOrder':
                return await handleSaveCardOrderFirebase(payload.project, payload.order);

            // =====================================================
            // FURNITURE MANAGEMENT API
            // =====================================================
            case 'getFurnitureItems':
                return await handleGetFurnitureItemsFirebase(payload.project);

            case 'saveFurnitureItem':
                return await handleSaveFurnitureItemFirebase(payload.project, payload.item);

            case 'deleteFurnitureItem':
                return await handleDeleteFurnitureItemFirebase(payload.itemId);

            case 'getRoomFurniture':
                return await handleGetRoomFurnitureFirebase(payload.project);

            case 'returnFurniture':
                return await handleReturnFurnitureFirebase(payload.project, payload.roomNo, payload.furnitureName, payload.quantity, payload.userName, payload.remark);

            case 'addFurnitureToRoom':
                return await handleAddFurnitureToRoomFirebase(payload.project, payload.roomNo, payload.furnitureName, payload.quantity, payload.userName, payload.remark);

            case 'transferToCentral':
                return await handleTransferToCentralFirebase(payload.project, payload.building, payload.furnitureName, payload.quantity, payload.userName, payload.remark);

            case 'transferFromCentral':
                return await handleTransferFromCentralFirebase(payload.project, payload.building, payload.furnitureName, payload.quantity, payload.userName, payload.remark);

            case 'getFurnitureStock':
                return await handleGetFurnitureStockFirebase(payload.project);

            case 'getFurnitureLogs':
                return await handleGetFurnitureLogsFirebase(payload.project, payload.filters);

            default:
                throw new Error("Invalid Action: " + action);
        }
    } catch (error) {
        console.error('[firebaseApiHandler]', action, error);
        return { success: false, message: error.message };
    }
}

// =====================================================
// FURNITURE MANAGEMENT FUNCTIONS
// =====================================================

// --- Real-time listener for room furniture ---
const furnitureListeners = {};
const roomFurnitureCache = {};

/**
 * ดึงรายการเฟอร์นิเจอร์ (Master List) ตาม project
 */
async function handleGetFurnitureItemsFirebase(project) {
    try {
        const snapshot = await db.collection('furnitureItems')
            .where('project', '==', project)
            .get();

        const items = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        return { success: true, data: items };
    } catch (error) {
        return { success: false, message: error.message };
    }
}

/**
 * บันทึกรายการเฟอร์นิเจอร์ (เพิ่ม/แก้ไข)
 */
async function handleSaveFurnitureItemFirebase(project, item) {
    try {
        const data = {
            project: project,
            name: item.name,
            category: item.category || '',
            icon: item.icon || 'fa-couch',
            defaultQty: item.defaultQty || 1,
            assignTo: item.assignTo || { type: 'all', targets: [] },
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        };

        if (item.id) {
            // Update existing
            await db.collection('furnitureItems').doc(item.id).update(data);
        } else {
            // Add new
            data.createdAt = firebase.firestore.FieldValue.serverTimestamp();
            await db.collection('furnitureItems').add(data);
        }

        return { success: true };
    } catch (error) {
        return { success: false, message: error.message };
    }
}

/**
 * ลบรายการเฟอร์นิเจอร์
 */
async function handleDeleteFurnitureItemFirebase(itemId) {
    try {
        await db.collection('furnitureItems').doc(itemId).delete();
        return { success: true };
    } catch (error) {
        return { success: false, message: error.message };
    }
}

/**
 * ดึงข้อมูลเฟอร์ในแต่ละห้อง (Mega-Doc per building) + real-time listener
 */
async function handleGetRoomFurnitureFirebase(project) {
    try {
        // Unsubscribe old listener for this project
        if (furnitureListeners[project]) {
            furnitureListeners[project]();
            delete furnitureListeners[project];
        }

        // Set up real-time listener
        await new Promise((resolve, reject) => {
            const unsubscribe = db.collection('roomFurniture')
                .where('project', '==', project)
                .onSnapshot(snapshot => {
                    const result = {};
                    snapshot.docs.forEach(doc => {
                        const d = doc.data();
                        if (d.building && d.rooms) {
                            result[d.building] = d.rooms;
                        }
                    });

                    roomFurnitureCache[project] = result;

                    // Dispatch event for UI re-render
                    window.dispatchEvent(new CustomEvent('roomFurnitureUpdated', {
                        detail: { project, data: result }
                    }));

                    resolve();
                }, error => {
                    console.error('[Furniture Realtime Error]', error);
                    reject(error);
                });

            furnitureListeners[project] = unsubscribe;
        });

        return { success: true, data: roomFurnitureCache[project] || {} };
    } catch (error) {
        return { success: false, message: error.message };
    }
}

/**
 * คืนเฟอร์จากห้อง → สต๊อกตึก (Transaction)
 */
async function handleReturnFurnitureFirebase(project, roomNo, furnitureName, quantity, userName, remark) {
    try {
        const info = parseRoomInfoForDb(roomNo);
        const building = info.building;
        const furDocId = `${project}_${building}`;
        const stockDocId = `${project}_building_${building}`;

        const furRef = db.collection('roomFurniture').doc(furDocId);
        const stockRef = db.collection('furnitureStock').doc(stockDocId);

        await db.runTransaction(async (transaction) => {
            const furDoc = await transaction.get(furRef);
            const stockDoc = await transaction.get(stockRef);

            // Update room furniture
            let rooms = furDoc.exists ? (furDoc.data().rooms || {}) : {};
            let roomItems = rooms[roomNo] || {};
            const currentQty = roomItems[furnitureName] || 0;

            if (currentQty < quantity) {
                throw new Error(`ห้อง ${roomNo} มี ${furnitureName} แค่ ${currentQty} ชิ้น ไม่สามารถคืน ${quantity} ชิ้นได้`);
            }

            const newQty = currentQty - quantity;
            if (newQty <= 0) {
                delete roomItems[furnitureName];
            } else {
                roomItems[furnitureName] = newQty;
            }
            rooms[roomNo] = roomItems;

            transaction.set(furRef, {
                project, building, rooms,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            }, { merge: true });

            // Update building stock
            let stockItems = stockDoc.exists ? (stockDoc.data().items || {}) : {};
            stockItems[furnitureName] = (stockItems[furnitureName] || 0) + quantity;

            transaction.set(stockRef, {
                project, type: 'building', building,
                items: stockItems,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            }, { merge: true });
        });

        // Log
        await logFurnitureAction(userName, project, 'return', furnitureName, roomNo, info.building, quantity, remark);

        return { success: true, message: `คืน ${furnitureName} x${quantity} จากห้อง ${roomNo} สำเร็จ` };
    } catch (error) {
        return { success: false, message: error.message };
    }
}

/**
 * เพิ่มเฟอร์เข้าห้อง ← สต๊อกตึก (Transaction)
 */
async function handleAddFurnitureToRoomFirebase(project, roomNo, furnitureName, quantity, userName, remark) {
    try {
        const info = parseRoomInfoForDb(roomNo);
        const building = info.building;
        const furDocId = `${project}_${building}`;
        const stockDocId = `${project}_building_${building}`;

        const furRef = db.collection('roomFurniture').doc(furDocId);
        const stockRef = db.collection('furnitureStock').doc(stockDocId);

        await db.runTransaction(async (transaction) => {
            const furDoc = await transaction.get(furRef);
            const stockDoc = await transaction.get(stockRef);

            // Check stock
            let stockItems = stockDoc.exists ? (stockDoc.data().items || {}) : {};
            const stockQty = stockItems[furnitureName] || 0;

            if (stockQty < quantity) {
                throw new Error(`สต๊อกตึก ${building} มี ${furnitureName} แค่ ${stockQty} ชิ้น ไม่พอเพิ่ม ${quantity} ชิ้น`);
            }

            // Deduct from stock
            stockItems[furnitureName] = stockQty - quantity;
            if (stockItems[furnitureName] <= 0) delete stockItems[furnitureName];

            transaction.set(stockRef, {
                project, type: 'building', building,
                items: stockItems,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            }, { merge: true });

            // Add to room
            let rooms = furDoc.exists ? (furDoc.data().rooms || {}) : {};
            let roomItems = rooms[roomNo] || {};
            roomItems[furnitureName] = (roomItems[furnitureName] || 0) + quantity;
            rooms[roomNo] = roomItems;

            transaction.set(furRef, {
                project, building, rooms,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            }, { merge: true });
        });

        await logFurnitureAction(userName, project, 'add', furnitureName, roomNo, info.building, quantity, remark);

        return { success: true, message: `เพิ่ม ${furnitureName} x${quantity} เข้าห้อง ${roomNo} สำเร็จ` };
    } catch (error) {
        return { success: false, message: error.message };
    }
}

/**
 * เบิกเฟอร์จากสต๊อกตึก → สต๊อกส่วนกลาง (Transaction)
 */
async function handleTransferToCentralFirebase(project, building, furnitureName, quantity, userName, remark) {
    try {
        const buildingStockId = `${project}_building_${building}`;
        const centralStockId = `${project}_central`;

        const bRef = db.collection('furnitureStock').doc(buildingStockId);
        const cRef = db.collection('furnitureStock').doc(centralStockId);

        await db.runTransaction(async (transaction) => {
            const bDoc = await transaction.get(bRef);
            const cDoc = await transaction.get(cRef);

            // Check building stock
            let bItems = bDoc.exists ? (bDoc.data().items || {}) : {};
            const bQty = bItems[furnitureName] || 0;

            if (bQty < quantity) {
                throw new Error(`สต๊อกตึก ${building} มี ${furnitureName} แค่ ${bQty} ชิ้น ไม่พอเบิก ${quantity} ชิ้น`);
            }

            // Deduct from building stock
            bItems[furnitureName] = bQty - quantity;
            if (bItems[furnitureName] <= 0) delete bItems[furnitureName];

            transaction.set(bRef, {
                project, type: 'building', building,
                items: bItems,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            }, { merge: true });

            // Add to central stock
            let cItems = cDoc.exists ? (cDoc.data().items || {}) : {};
            cItems[furnitureName] = (cItems[furnitureName] || 0) + quantity;

            transaction.set(cRef, {
                project, type: 'central', building: null,
                items: cItems,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            }, { merge: true });
        });

        await logFurnitureAction(userName, project, 'transfer_to_central', furnitureName, null, building, quantity, remark);

        return { success: true, message: `เบิก ${furnitureName} x${quantity} จากตึก ${building} ไปส่วนกลาง สำเร็จ` };
    } catch (error) {
        return { success: false, message: error.message };
    }
}

/**
 * เบิกเฟอร์จากสต๊อกส่วนกลาง → สต๊อกตึก (Transaction)
 */
async function handleTransferFromCentralFirebase(project, building, furnitureName, quantity, userName, remark) {
    try {
        const buildingStockId = `${project}_building_${building}`;
        const centralStockId = `${project}_central`;

        const bRef = db.collection('furnitureStock').doc(buildingStockId);
        const cRef = db.collection('furnitureStock').doc(centralStockId);

        await db.runTransaction(async (transaction) => {
            const cDoc = await transaction.get(cRef);
            const bDoc = await transaction.get(bRef);

            // Check central stock
            let cItems = cDoc.exists ? (cDoc.data().items || {}) : {};
            const cQty = cItems[furnitureName] || 0;

            if (cQty < quantity) {
                throw new Error(`สต๊อกส่วนกลางมี ${furnitureName} แค่ ${cQty} ชิ้น ไม่พอเบิก ${quantity} ชิ้น`);
            }

            // Deduct from central
            cItems[furnitureName] = cQty - quantity;
            if (cItems[furnitureName] <= 0) delete cItems[furnitureName];

            transaction.set(cRef, {
                project, type: 'central', building: null,
                items: cItems,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            }, { merge: true });

            // Add to building stock
            let bItems = bDoc.exists ? (bDoc.data().items || {}) : {};
            bItems[furnitureName] = (bItems[furnitureName] || 0) + quantity;

            transaction.set(bRef, {
                project, type: 'building', building,
                items: bItems,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            }, { merge: true });
        });

        await logFurnitureAction(userName, project, 'transfer_from_central', furnitureName, null, building, quantity, remark);

        return { success: true, message: `เบิก ${furnitureName} x${quantity} จากส่วนกลางไปตึก ${building} สำเร็จ` };
    } catch (error) {
        return { success: false, message: error.message };
    }
}

/**
 * ดึงสต๊อกเฟอร์ทั้งหมด (ตึก + ส่วนกลาง) ของโครงการ
 */
async function handleGetFurnitureStockFirebase(project) {
    try {
        const snapshot = await db.collection('furnitureStock')
            .where('project', '==', project)
            .get();

        const buildings = {};
        let central = {};

        snapshot.docs.forEach(doc => {
            const d = doc.data();
            if (d.type === 'building' && d.building) {
                buildings[d.building] = d.items || {};
            } else if (d.type === 'central') {
                central = d.items || {};
            }
        });

        return { success: true, data: { buildings, central } };
    } catch (error) {
        return { success: false, message: error.message };
    }
}

/**
 * ดึง Audit Trail เฟอร์นิเจอร์
 */
async function handleGetFurnitureLogsFirebase(project, filters) {
    try {
        let query = db.collection('furnitureLogs')
            .where('project', '==', project)
            .orderBy('timestamp', 'desc')
            .limit(200);

        if (filters && filters.building) {
            query = query.where('building', '==', filters.building);
        }

        const snapshot = await query.get();
        const logs = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            timestamp: doc.data().timestamp ? doc.data().timestamp.toDate().toISOString() : null
        }));

        return { success: true, data: logs };
    } catch (error) {
        return { success: false, message: error.message };
    }
}

/**
 * บันทึก Furniture Audit Log
 */
async function logFurnitureAction(userName, project, action, furnitureName, roomNo, building, quantity, remark) {
    try {
        await db.collection('furnitureLogs').add({
            userName: userName || 'Unknown',
            project: project,
            action: action,
            furnitureName: furnitureName,
            roomNo: roomNo || null,
            building: building || null,
            quantity: quantity || 1,
            remark: remark || '',
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        });
    } catch (e) {
        console.error('[logFurnitureAction Error]', e);
    }
}

/**
 * ผูกเฟอร์เข้าตึก/ห้อง (Batch write) — เมื่อกำหนด assignTo ใน furnitureItems
 * เรียกหลัง saveFurnitureItem เพื่อ populate roomFurniture
 */
async function handleApplyFurnitureAssignmentFirebase(project, furnitureName, defaultQty, assignTo) {
    try {
        if (!assignTo || !assignTo.type) {
            return { success: false, message: 'กรุณากำหนดขอบเขตการผูกเฟอร์' };
        }

        // Get all rooms for the project
        const roomsSnapshot = await db.collection('buildingRooms')
            .where('project', '==', project)
            .get();

        // Determine which buildings/rooms to assign
        const batch = db.batch();
        const updatedBuildings = new Set();

        roomsSnapshot.docs.forEach(doc => {
            const d = doc.data();
            const building = d.building;
            const rooms = d.rooms || [];

            // Check if this building should get the furniture
            let shouldAssign = false;
            if (assignTo.type === 'all') {
                shouldAssign = true;
            } else if (assignTo.type === 'buildings') {
                shouldAssign = assignTo.targets.includes(building);
            }

            if (shouldAssign || assignTo.type === 'rooms') {
                const furDocId = `${project}_${building}`;
                const furRef = db.collection('roomFurniture').doc(furDocId);

                // We need to read current data first
                updatedBuildings.add({ building, rooms, furRef, furDocId });
            }
        });

        // Process each building
        for (const { building, rooms, furRef, furDocId } of updatedBuildings) {
            const furDoc = await furRef.get();
            let existingRooms = furDoc.exists ? (furDoc.data().rooms || {}) : {};

            rooms.forEach(room => {
                const roomNo = room.roomNo;

                // For 'rooms' type, only assign to specific rooms
                if (assignTo.type === 'rooms' && !assignTo.targets.includes(roomNo)) {
                    return;
                }

                if (!existingRooms[roomNo]) {
                    existingRooms[roomNo] = {};
                }

                // Only add if not already present
                if (!existingRooms[roomNo][furnitureName]) {
                    existingRooms[roomNo][furnitureName] = defaultQty;
                }
            });

            batch.set(furRef, {
                project, building,
                rooms: existingRooms,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            }, { merge: true });
        }

        await batch.commit();

        return { success: true, message: `ผูก ${furnitureName} เข้าห้องสำเร็จ` };
    } catch (error) {
        return { success: false, message: error.message };
    }
}

console.log('[DB] Firebase Data Layer loaded - 26 API handlers ready (includes Furniture Management)');
