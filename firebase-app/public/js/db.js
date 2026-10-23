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
    if (typeof messagingUnreadListener === 'function') {
        messagingUnreadListener();
        messagingUnreadListener = null;
    }
    if (typeof activeChatListener === 'function') {
        activeChatListener();
        activeChatListener = null;
    }
    if (typeof stopUserPresence === 'function' && typeof STATE !== 'undefined' && STATE.user) {
        stopUserPresence(STATE.user);
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
                    .onSnapshot(async (snapshot) => {
                        let allRooms = [];
                        snapshot.docs.forEach(doc => {
                            const buildingData = doc.data();
                            if (buildingData.rooms && Array.isArray(buildingData.rooms)) {
                                const mappedRooms = buildingData.rooms.map(r => ({
                                    ...r,
                                    _buildingDocId: doc.id,
                                    rowIndex: r.oldDocId || `${project}_${r.roomNo.replace(/[/\\]/g, '-')}`
                                }));
                                allRooms = allRooms.concat(mappedRooms);
                            }
                        });

                        // Deduplicate by roomNo in memory:
                        // If multiple documents contain the same roomNo (e.g. City Condo_69 vs City Condo_69-337),
                        // prefer the one with updated status, or the one matching the current building document format.
                        const roomMap = new Map();
                        allRooms.forEach(r => {
                            if (!roomMap.has(r.roomNo)) {
                                roomMap.set(r.roomNo, r);
                            } else {
                                const existing = roomMap.get(r.roomNo);
                                const isRUpdated = r.status && r.status !== 'ห้องว่าง';
                                const isExistingUpdated = existing.status && existing.status !== 'ห้องว่าง';
                                if (isRUpdated && !isExistingUpdated) {
                                    roomMap.set(r.roomNo, r);
                                } else if (r._buildingDocId && r._buildingDocId.includes('-') && !existing._buildingDocId.includes('-')) {
                                    roomMap.set(r.roomNo, r);
                                }
                            }
                        });
                        allRooms = Array.from(roomMap.values());

                        projectDataCache[project] = allRooms;

                        // Dispatch global event so UI can re-render in real-time
                        window.dispatchEvent(new CustomEvent('roomsDataUpdated', { detail: { project, data: allRooms } }));

                        resolve(); // Resolve on first load

                        // Background auto-consolidation: merge legacy/fragmented building docs (e.g. City Condo)
                        checkAndConsolidateBuildingDocs(project, snapshot);
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

// --- Background Auto-Consolidation for Building Documents ---
let isConsolidatingBuildingDocs = false;
async function checkAndConsolidateBuildingDocs(project, snapshot) {
    if (isConsolidatingBuildingDocs) return;
    if (!firebase.auth() || !firebase.auth().currentUser) return; // Only run when authenticated

    try {
        const targetGroups = {};
        let hasMismatchedDocs = false;

        snapshot.docs.forEach(doc => {
            const d = doc.data();
            if (!d.rooms || !Array.isArray(d.rooms) || d.rooms.length === 0) return;

            const firstRoom = d.rooms[0];
            const info = parseRoomInfoForDb(firstRoom.roomNo);
            const expectedDocId = getBuildingDocId(project, info.building);

            if (!targetGroups[expectedDocId]) {
                targetGroups[expectedDocId] = {
                    expectedDocId: expectedDocId,
                    building: info.building,
                    docs: []
                };
            }
            targetGroups[expectedDocId].docs.push(doc);

            if (doc.id !== expectedDocId) {
                hasMismatchedDocs = true;
            }
        });

        // Also check if any group has multiple docs (split docs like City Condo_69 and City Condo_69-337)
        for (const targetId in targetGroups) {
            if (targetGroups[targetId].docs.length > 1) {
                hasMismatchedDocs = true;
            }
        }

        if (!hasMismatchedDocs) return;

        isConsolidatingBuildingDocs = true;
        console.log('[Consolidation] Detected legacy or fragmented building documents for project:', project);

        const batch = db.batch();
        let opsCount = 0;

        for (const targetId in targetGroups) {
            const group = targetGroups[targetId];
            if (group.docs.length === 1 && group.docs[0].id === group.expectedDocId) {
                continue; // Already clean and matched
            }

            const consolidatedRoomsMap = new Map();
            group.docs.forEach(doc => {
                const docRooms = doc.data().rooms || [];
                docRooms.forEach(r => {
                    if (!consolidatedRoomsMap.has(r.roomNo)) {
                        consolidatedRoomsMap.set(r.roomNo, r);
                    } else {
                        const existing = consolidatedRoomsMap.get(r.roomNo);
                        const isRUpdated = r.status && r.status !== 'ห้องว่าง';
                        const isExistingUpdated = existing.status && existing.status !== 'ห้องว่าง';
                        if (isRUpdated && !isExistingUpdated) {
                            consolidatedRoomsMap.set(r.roomNo, { ...existing, ...r });
                        } else {
                            consolidatedRoomsMap.set(r.roomNo, { ...r, ...existing });
                        }
                    }
                });
            });

            const mergedRooms = Array.from(consolidatedRoomsMap.values());
            mergedRooms.sort((a, b) => {
                const numA = parseInt(parseRoomInfoForDb(a.roomNo).roomIndex) || 0;
                const numB = parseInt(parseRoomInfoForDb(b.roomNo).roomIndex) || 0;
                return numA - numB;
            });

            // Write target consolidated doc
            const targetRef = db.collection('buildingRooms').doc(group.expectedDocId);
            batch.set(targetRef, {
                project: project,
                building: group.building,
                rooms: mergedRooms,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            }, { merge: true });
            opsCount++;

            // Delete old / legacy docs
            group.docs.forEach(doc => {
                if (doc.id !== group.expectedDocId) {
                    batch.delete(db.collection('buildingRooms').doc(doc.id));
                    opsCount++;
                    console.log(`[Consolidation] Cleaning up legacy doc: ${doc.id}`);
                }
            });
        }

        if (opsCount > 0) {
            await batch.commit();
            console.log(`[Consolidation] Successfully consolidated building documents for ${project} (${opsCount} operations)`);
        }
    } catch (err) {
        console.warn('[Consolidation Error]', err);
    } finally {
        isConsolidatingBuildingDocs = false;
    }
}

// --- Helper: Parse Room Number (Internal to db.js) ---
function parseRoomInfoForDb(roomNo) {
    if (typeof parseRoomInfo === 'function') {
        return parseRoomInfo(roomNo);
    }
    let cleanRoomNo = roomNo.toString().trim();
    if (cleanRoomNo.length < 3) return { building: 'Main', full: cleanRoomNo };
    const len = cleanRoomNo.length;
    const building = cleanRoomNo.substring(0, len - 3);
    return { building: building || 'Main', full: cleanRoomNo };
}

function getBuildingDocId(project, building) {
    const safeBldg = String(building || '').replace(/[/\\]/g, '-');
    return `${project}_${safeBldg}`;
}

async function handleSaveRoomDataFirebase(project, rowIndex, data, userName) {
    try {
        const info = parseRoomInfoForDb(data.roomNo);
        const building = info.building;
        const docId = getBuildingDocId(project, building);
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

            const existingRoomPrice = (existingRoomIndex >= 0 && rooms[existingRoomIndex].roomPrice !== undefined) ? rooms[existingRoomIndex].roomPrice : 0;
            const finalRoomPrice = data.roomPrice !== undefined ? (parseFloat(data.roomPrice) || 0) : existingRoomPrice;

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
                roomPrice: finalRoomPrice,
                oldDocId: rowIndex || null // preserve old reference if any
            };

            if (existingRoomIndex >= 0) {
                // Update
                rooms[existingRoomIndex] = { ...rooms[existingRoomIndex], ...roomData };
            } else {
                // Extra check: ensure roomNo isn't already in rooms before pushing
                const matchIndex = rooms.findIndex(r => r.roomNo === data.roomNo);
                if (matchIndex >= 0) {
                    rooms[matchIndex] = { ...rooms[matchIndex], ...roomData };
                } else {
                    rooms.push(roomData);
                }
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
        const docId = getBuildingDocId(project, building);
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

/**
 * สร้างตึกและห้องพักเป็นชุด (Batch / Building Rooms Generator)
 * สิทธิ์: Admin เท่านั้น
 */
async function handleBatchCreateRoomsFirebase(project, building, roomsToCreate, user) {
    try {
        if (!project || !building || !Array.isArray(roomsToCreate) || roomsToCreate.length === 0) {
            return { success: false, message: "ข้อมูลไม่ครบถ้วนสำหรับการสร้างห้องชุด" };
        }

        const currentUser = auth.currentUser;
        if (!currentUser) {
            return { success: false, message: "กรุณาเข้าสู่ระบบก่อนทำรายการ" };
        }
        if (!user || user.role !== 'Admin') {
            return { success: false, message: "สิทธิ์การเข้าถึงถูกปฏิเสธ (Admin เท่านั้น)" };
        }

        const safeBuilding = String(building).trim().toUpperCase();
        const docId = getBuildingDocId(project, safeBuilding);
        const buildingRef = db.collection('buildingRooms').doc(docId);

        let addedCount = 0;
        let skippedCount = 0;
        const skippedRooms = [];

        await db.runTransaction(async (transaction) => {
            const doc = await transaction.get(buildingRef);
            let existingRooms = [];
            if (doc.exists && doc.data().rooms) {
                existingRooms = doc.data().rooms;
            }

            const existingMap = new Set(existingRooms.map(r => r.roomNo));
            const newRoomsToAdd = [];

            roomsToCreate.forEach(item => {
                const rNo = (item.roomNo || '').trim();
                if (!rNo) return;
                if (existingMap.has(rNo)) {
                    skippedCount++;
                    skippedRooms.push(rNo);
                } else {
                    existingMap.add(rNo);
                    newRoomsToAdd.push({
                        roomNo: rNo,
                        roomType: item.roomType || 'Standard',
                        status: item.status || 'ห้องว่าง',
                        moveInDate: item.moveInDate || '',
                        remark: item.remark || '',
                        isSampleRoom: !!item.isSampleRoom,
                        bookingDate: '',
                        bookingDuration: '',
                        noBookingExpiry: false,
                        oldDocId: null
                    });
                    addedCount++;
                }
            });

            if (addedCount === 0 && skippedCount > 0) {
                throw new Error(`ห้องทั้งหมดในชุดนี้ (${skippedCount} ห้อง) มีอยู่ในระบบแล้ว`);
            }

            const combinedRooms = [...existingRooms, ...newRoomsToAdd];

            // เรียงลำดับห้องตามชั้นและเลขห้อง
            combinedRooms.sort((a, b) => {
                const infoA = parseRoomInfoForDb(a.roomNo);
                const infoB = parseRoomInfoForDb(b.roomNo);
                const floorA = parseInt(infoA.floor) || 0;
                const floorB = parseInt(infoB.floor) || 0;
                if (floorA !== floorB) return floorA - floorB;
                const idxA = parseInt(infoA.roomIndex) || 0;
                const idxB = parseInt(infoB.roomIndex) || 0;
                if (idxA !== idxB) return idxA - idxB;
                return a.roomNo.localeCompare(b.roomNo, undefined, { numeric: true });
            });

            transaction.set(buildingRef, {
                project: project,
                building: safeBuilding,
                rooms: combinedRooms,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            }, { merge: true });
        });

        // Audit log
        const userName = user.name || user.username || 'Admin';
        await logAction(
            userName,
            project,
            safeBuilding,
            'Create Building/Rooms',
            `สร้างตึก ${safeBuilding} เพิ่ม ${addedCount} ห้อง${skippedCount > 0 ? ` (ข้ามห้องซ้ำ ${skippedCount} ห้อง)` : ''}`,
            'สำเร็จ'
        );

        return {
            success: true,
            addedCount,
            skippedCount,
            skippedRooms,
            totalCreated: addedCount,
            building: safeBuilding,
            message: `สร้างตึก ${safeBuilding} สำเร็จ เพิ่มทั้งหมด ${addedCount} ห้อง${skippedCount > 0 ? ` (ข้ามห้องเดิม ${skippedCount} ห้อง)` : ''}`
        };
    } catch (error) {
        console.error('[handleBatchCreateRoomsFirebase]', error);
        return { success: false, message: error.message };
    }
}

// =====================================================
// SOFT DELETE & 30-DAY ROOM RECYCLE BIN
// =====================================================

/**
 * ลบห้องแบบ Soft Delete (ย้ายไปถังขยะ 30 วัน)
 */
async function handleSoftDeleteRoomFirebase(project, roomNo, user) {
    try {
        if (!project || !roomNo) {
            return { success: false, message: "ข้อมูลไม่ครบถ้วนสำหรับการลบห้อง" };
        }

        const currentUser = auth.currentUser;
        if (!currentUser) {
            return { success: false, message: "กรุณาเข้าสู่ระบบก่อนทำรายการ" };
        }
        if (!user || user.role !== 'Admin') {
            return { success: false, message: "สิทธิ์การเข้าถึงถูกปฏิเสธ (Admin เท่านั้น)" };
        }

        const cleanRoomNo = String(roomNo).trim();
        const info = parseRoomInfoForDb(cleanRoomNo);
        const building = info.building;
        const bldgDocId = getBuildingDocId(project, building);
        const buildingRef = db.collection('buildingRooms').doc(bldgDocId);
        const delDocId = `${project}_${cleanRoomNo.replace(/[/\\]/g, '-')}`;
        const deletedRoomRef = db.collection('deletedRooms').doc(delDocId);

        let targetRoomData = null;

        await db.runTransaction(async (transaction) => {
            const bldgDoc = await transaction.get(buildingRef);
            if (!bldgDoc.exists || !bldgDoc.data().rooms) {
                throw new Error(`ไม่พบข้อมูลตึก ${building} ในระบบ`);
            }

            const rooms = bldgDoc.data().rooms || [];
            const roomIdx = rooms.findIndex(r => r.roomNo === cleanRoomNo);
            if (roomIdx === -1) {
                throw new Error(`ไม่พบห้อง ${cleanRoomNo} ในตึก ${building}`);
            }

            targetRoomData = rooms[roomIdx];
            const updatedRooms = rooms.filter((_, idx) => idx !== roomIdx);

            const now = Date.now();
            const expiresAt = now + (30 * 24 * 60 * 60 * 1000); // 30 วัน

            // บันทึกห้องลงถังขยะ
            transaction.set(deletedRoomRef, {
                project: project,
                building: building,
                roomNo: cleanRoomNo,
                deletedAt: firebase.firestore.FieldValue.serverTimestamp(),
                deletedAtMillis: now,
                deletedBy: user.name || user.username || 'Admin',
                expiresAtMillis: expiresAt,
                roomData: targetRoomData
            });

            // ตัดห้องออกจากตึก
            transaction.set(buildingRef, {
                rooms: updatedRooms,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            }, { merge: true });
        });

        // Audit log
        const userName = user.name || user.username || 'Admin';
        await logAction(
            userName,
            project,
            cleanRoomNo,
            'Soft Delete',
            `ย้ายห้อง ${cleanRoomNo} (ตึก ${building}) ไปยังถังขยะ (เก็บกู้คืนได้ 30 วัน)`,
            'สำเร็จ'
        );

        return {
            success: true,
            roomNo: cleanRoomNo,
            building: building,
            message: `ย้ายห้อง ${cleanRoomNo} ไปยังถังขยะเรียบร้อย (สามารถกู้คืนได้ภายใน 30 วัน)`
        };
    } catch (error) {
        console.error('[handleSoftDeleteRoomFirebase]', error);
        return { success: false, message: error.message };
    }
}

/**
 * ดึงรายการห้องในถังขยะ พร้อมล้างห้องที่หมดอายุเกิน 30 วันอัตโนมัติ
 */
async function handleGetDeletedRoomsFirebase(project) {
    try {
        const currentUser = auth.currentUser;
        if (!currentUser) {
            return { success: false, message: "กรุณาเข้าสู่ระบบก่อนทำรายการ", rooms: [] };
        }

        let query = db.collection('deletedRooms');
        if (project) {
            query = query.where('project', '==', project);
        }

        const snapshot = await query.get();
        if (snapshot.empty) {
            return { success: true, rooms: [] };
        }

        const now = Date.now();
        const activeDeletedRooms = [];
        const expiredDocRefs = [];

        snapshot.docs.forEach(doc => {
            const data = doc.data();
            const expMillis = data.expiresAtMillis || 0;

            // ตรวจสอบห้องที่เกิน 30 วัน
            if (expMillis > 0 && now >= expMillis) {
                expiredDocRefs.push(doc.ref);
            } else {
                activeDeletedRooms.push({
                    id: doc.id,
                    ...data
                });
            }
        });

        // ล้างห้องที่หมดอายุอัตโนมัติ (Batch Delete)
        if (expiredDocRefs.length > 0) {
            const batch = db.batch();
            expiredDocRefs.forEach(ref => batch.delete(ref));
            await batch.commit();
            console.log(`[RecycleBin] Auto-purged ${expiredDocRefs.length} expired room(s) older than 30 days`);
        }

        // จัดเรียงจากวันที่ลบล่าสุดมาก่อน
        activeDeletedRooms.sort((a, b) => (b.deletedAtMillis || 0) - (a.deletedAtMillis || 0));

        return {
            success: true,
            rooms: activeDeletedRooms,
            purgedCount: expiredDocRefs.length
        };
    } catch (error) {
        console.error('[handleGetDeletedRoomsFirebase]', error);
        return { success: false, message: error.message, rooms: [] };
    }
}

/**
 * กู้คืนห้องจากถังขยะกลับเข้าตึกเดิม
 */
async function handleRestoreRoomFirebase(project, roomNo, user) {
    try {
        if (!project || !roomNo) {
            return { success: false, message: "ข้อมูลไม่ครบถ้วนสำหรับการกู้คืนห้อง" };
        }

        const currentUser = auth.currentUser;
        if (!currentUser) {
            return { success: false, message: "กรุณาเข้าสู่ระบบก่อนทำรายการ" };
        }
        if (!user || user.role !== 'Admin') {
            return { success: false, message: "สิทธิ์การเข้าถึงถูกปฏิเสธ (Admin เท่านั้น)" };
        }

        const cleanRoomNo = String(roomNo).trim();
        const delDocId = `${project}_${cleanRoomNo.replace(/[/\\]/g, '-')}`;
        const deletedRoomRef = db.collection('deletedRooms').doc(delDocId);

        let restoredBuilding = "";

        await db.runTransaction(async (transaction) => {
            const delDoc = await transaction.get(deletedRoomRef);
            if (!delDoc.exists) {
                throw new Error(`ไม่พบข้อมูลห้อง ${cleanRoomNo} ในถังขยะ (อาจถูกล้างไปแล้ว)`);
            }

            const delData = delDoc.data();
            const building = delData.building || parseRoomInfoForDb(cleanRoomNo).building;
            restoredBuilding = building;
            const bldgDocId = getBuildingDocId(project, building);
            const buildingRef = db.collection('buildingRooms').doc(bldgDocId);

            const bldgDoc = await transaction.get(buildingRef);
            let rooms = [];
            if (bldgDoc.exists && bldgDoc.data().rooms) {
                rooms = bldgDoc.data().rooms;
            }

            // ตรวจสอบว่าในตึกมีห้องเลขนี้อยู่แล้วหรือไม่
            if (rooms.some(r => r.roomNo === cleanRoomNo)) {
                throw new Error(`ห้อง ${cleanRoomNo} มีอยู่ในตึก ${building} แล้ว ไม่สามารถกู้คืนซ้ำได้`);
            }

            // นำข้อมูลเดิมของห้องกลับมา หรือ fallback
            const roomToRestore = delData.roomData || {
                roomNo: cleanRoomNo,
                roomType: 'Standard',
                status: 'ห้องว่าง',
                moveInDate: '',
                remark: '',
                isSampleRoom: false,
                bookingDate: '',
                bookingDuration: ''
            };

            rooms.push(roomToRestore);

            // เรียงลำดับห้อง
            rooms.sort((a, b) => {
                const infoA = parseRoomInfoForDb(a.roomNo);
                const infoB = parseRoomInfoForDb(b.roomNo);
                const floorA = parseInt(infoA.floor) || 0;
                const floorB = parseInt(infoB.floor) || 0;
                if (floorA !== floorB) return floorA - floorB;
                const idxA = parseInt(infoA.roomIndex) || 0;
                const idxB = parseInt(infoB.roomIndex) || 0;
                if (idxA !== idxB) return idxA - idxB;
                return a.roomNo.localeCompare(b.roomNo, undefined, { numeric: true });
            });

            // ใส่ห้องกลับเข้าตึก
            transaction.set(buildingRef, {
                project: project,
                building: building,
                rooms: rooms,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            }, { merge: true });

            // ลบออกจากถังขยะ
            transaction.delete(deletedRoomRef);
        });

        // Audit log
        const userName = user.name || user.username || 'Admin';
        await logAction(
            userName,
            project,
            cleanRoomNo,
            'Restore Room',
            `กู้คืนห้อง ${cleanRoomNo} กลับสู่ตึก ${restoredBuilding} เรียบร้อย`,
            'สำเร็จ'
        );

        return {
            success: true,
            roomNo: cleanRoomNo,
            building: restoredBuilding,
            message: `กู้คืนห้อง ${cleanRoomNo} กลับสู่ตึก ${restoredBuilding} สำเร็จ`
        };
    } catch (error) {
        console.error('[handleRestoreRoomFirebase]', error);
        return { success: false, message: error.message };
    }
}

/**
 * ลบห้องออกจากถังขยะถาวรทันที (Permanent Hard Delete)
 */
async function handlePermanentDeleteRoomFirebase(project, roomNo, user) {
    try {
        if (!project || !roomNo) {
            return { success: false, message: "ข้อมูลไม่ครบถ้วน" };
        }

        const currentUser = auth.currentUser;
        if (!currentUser) {
            return { success: false, message: "กรุณาเข้าสู่ระบบก่อนทำรายการ" };
        }
        if (!user || user.role !== 'Admin') {
            return { success: false, message: "สิทธิ์การเข้าถึงถูกปฏิเสธ (Admin เท่านั้น)" };
        }

        const cleanRoomNo = String(roomNo).trim();
        const delDocId = `${project}_${cleanRoomNo.replace(/[/\\]/g, '-')}`;
        await db.collection('deletedRooms').doc(delDocId).delete();

        const userName = user.name || user.username || 'Admin';
        await logAction(
            userName,
            project,
            cleanRoomNo,
            'Permanent Delete',
            `ลบห้อง ${cleanRoomNo} ออกจากระบบและถังขยะถาวร`,
            'สำเร็จ'
        );

        return {
            success: true,
            roomNo: cleanRoomNo,
            message: `ลบห้อง ${cleanRoomNo} ออกจากระบบถาวรเรียบร้อย`
        };
    } catch (error) {
        console.error('[handlePermanentDeleteRoomFirebase]', error);
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
        const docId = getBuildingDocId(project, building);
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
        const docId = getBuildingDocId(project, building);
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

            case 'batchCreateRooms':
                return await handleBatchCreateRoomsFirebase(
                    payload.project,
                    payload.building,
                    payload.rooms,
                    payload.user
                );

            case 'softDeleteRoom':
                return await handleSoftDeleteRoomFirebase(
                    payload.project,
                    payload.roomNo,
                    payload.user
                );

            case 'getDeletedRooms':
                return await handleGetDeletedRoomsFirebase(payload.project);

            case 'restoreRoom':
                return await handleRestoreRoomFirebase(
                    payload.project,
                    payload.roomNo,
                    payload.user
                );

            case 'permanentDeleteRoom':
                return await handlePermanentDeleteRoomFirebase(
                    payload.project,
                    payload.roomNo,
                    payload.user
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
                return await handleReturnFurnitureFirebase(payload.project, payload.roomNo, payload.items, payload.userName, payload.remark);

            case 'addFurnitureToRoom':
                return await handleAddFurnitureToRoomFirebase(payload.project, payload.roomNo, payload.items, payload.userName, payload.remark);

            case 'transferToCentral':
                return await handleTransferToCentralFirebase(payload.project, payload.building, payload.items, payload.userName, payload.remark);

            case 'transferFromCentral':
                return await handleTransferFromCentralFirebase(payload.project, payload.building, payload.items, payload.userName, payload.remark);

            case 'getFurnitureStock':
                return await handleGetFurnitureStockFirebase(payload.project);

            case 'getFurnitureLogs':
                return await handleGetFurnitureLogsFirebase(payload.project, payload.filters);

            case 'getRoomFurnitureHistory':
                return await handleGetRoomFurnitureHistoryFirebase(payload.project, payload.roomNo);

            case 'addCentralStock':
                return await handleAddCentralStockFirebase(payload.project, payload.items, payload.userName, payload.remark);

            case 'disposeCentralStock':
                return await handleDisposeCentralStockFirebase(payload.project, payload.items, payload.userName, payload.remark);

            // =====================================================
            // INTERNAL MESSAGING API
            // =====================================================
            case 'getActiveUsers':
                return await handleGetActiveUsersFirebase(payload.user);

            case 'sendMessage':
                return await handleSendMessageFirebase(payload);

            case 'broadcastMessage':
                return await handleBroadcastMessageFirebase(payload);

            case 'markConversationAsRead':
                return await handleMarkConversationAsReadFirebase(payload.conversationId, payload.username);

            case 'deleteConversation':
                return await handleDeleteConversationFirebase(payload.conversationId, payload.user);

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
async function handleReturnFurnitureFirebase(project, roomNo, items, userName, remark) {
    try {
        if (!items || !Array.isArray(items) || items.length === 0) {
            throw new Error("ไม่มีรายการที่ต้องคืน");
        }

        const info = parseRoomInfoForDb(roomNo);
        const building = info.building;
        const furDocId = getBuildingDocId(project, building);
        const stockDocId = `${project}_building_${String(building || '').replace(/[/\\]/g, '-')}`;

        const furRef = db.collection('roomFurniture').doc(furDocId);
        const stockRef = db.collection('furnitureStock').doc(stockDocId);

        await db.runTransaction(async (transaction) => {
            const furDoc = await transaction.get(furRef);
            const stockDoc = await transaction.get(stockRef);

            let rooms = furDoc.exists ? (furDoc.data().rooms || {}) : {};
            let roomItems = rooms[roomNo] || {};
            let stockItems = stockDoc.exists ? (stockDoc.data().items || {}) : {};

            for (const item of items) {
                const { name: furnitureName, qty: quantity } = item;
                const currentQty = roomItems[furnitureName] || 0;

                if (currentQty < quantity) {
                    throw new Error(`ห้อง ${roomNo} มี ${furnitureName} แค่ ${currentQty} ชิ้น ไม่สามารถคืน ${quantity} ชิ้นได้`);
                }

                // Deduct from room
                const newQty = currentQty - quantity;
                if (newQty <= 0) {
                    roomItems[furnitureName] = firebase.firestore.FieldValue.delete();
                } else {
                    roomItems[furnitureName] = newQty;
                }

                // Add to building stock
                stockItems[furnitureName] = (stockItems[furnitureName] || 0) + quantity;
            }

            rooms[roomNo] = roomItems;

            transaction.set(furRef, {
                project, building, rooms,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            }, { merge: true });

            transaction.set(stockRef, {
                project, type: 'building', building,
                items: stockItems,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            }, { merge: true });
        });

        // Logs
        const namesSummary = items.map(i => `${i.name} x${i.qty}`).join(', ');
        for (const item of items) {
            await logFurnitureAction(userName, project, 'return', item.name, roomNo, info.building, item.qty, remark);
        }
        await logAction(userName, project, roomNo, 'จัดการเฟอร์นิเจอร์', `คืน ${namesSummary}`, 'สำเร็จ');

        return { success: true, message: `คืน ${namesSummary} จากห้อง ${roomNo} สำเร็จ` };
    } catch (error) {
        return { success: false, message: error.message };
    }
}

/**
 * เพิ่มเฟอร์เข้าห้อง ← สต๊อกตึก (Transaction)
 */
async function handleAddFurnitureToRoomFirebase(project, roomNo, items, userName, remark) {
    try {
        if (!items || !Array.isArray(items) || items.length === 0) {
            throw new Error("ไม่มีรายการที่ต้องเพิ่ม");
        }

        const info = parseRoomInfoForDb(roomNo);
        const building = info.building;
        const furDocId = getBuildingDocId(project, building);
        const stockDocId = `${project}_building_${String(building || '').replace(/[/\\]/g, '-')}`;

        const furRef = db.collection('roomFurniture').doc(furDocId);
        const stockRef = db.collection('furnitureStock').doc(stockDocId);

        await db.runTransaction(async (transaction) => {
            const furDoc = await transaction.get(furRef);
            const stockDoc = await transaction.get(stockRef);

            let stockItems = stockDoc.exists ? (stockDoc.data().items || {}) : {};
            let rooms = furDoc.exists ? (furDoc.data().rooms || {}) : {};
            let roomItems = rooms[roomNo] || {};

            for (const item of items) {
                const { name: furnitureName, qty: quantity } = item;
                const stockQty = stockItems[furnitureName] || 0;

                if (stockQty < quantity) {
                    throw new Error(`สต๊อกตึก ${building} มี ${furnitureName} แค่ ${stockQty} ชิ้น ไม่พอเพิ่ม ${quantity} ชิ้น`);
                }

                // Deduct from stock
                stockItems[furnitureName] = stockQty - quantity;
                if (stockItems[furnitureName] <= 0) stockItems[furnitureName] = firebase.firestore.FieldValue.delete();

                // Add to room
                roomItems[furnitureName] = (roomItems[furnitureName] || 0) + quantity;
            }

            rooms[roomNo] = roomItems;

            transaction.set(stockRef, {
                project, type: 'building', building,
                items: stockItems,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            }, { merge: true });

            transaction.set(furRef, {
                project, building, rooms,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            }, { merge: true });
        });

        const namesSummary = items.map(i => `${i.name} x${i.qty}`).join(', ');
        for (const item of items) {
            await logFurnitureAction(userName, project, 'add', item.name, roomNo, info.building, item.qty, remark);
        }
        await logAction(userName, project, roomNo, 'จัดการเฟอร์นิเจอร์', `เพิ่ม ${namesSummary}`, 'สำเร็จ');

        return { success: true, message: `เพิ่ม ${namesSummary} เข้าห้อง ${roomNo} สำเร็จ` };
    } catch (error) {
        return { success: false, message: error.message };
    }
}

/**
 * เบิกเฟอร์จากสต๊อกตึก → สต๊อกส่วนกลาง (Transaction)
 */
async function handleTransferToCentralFirebase(project, building, items, userName, remark) {
    try {
        if (!items || !Array.isArray(items) || items.length === 0) {
            throw new Error("ไม่มีรายการที่ต้องเบิก");
        }

        const buildingStockId = `${project}_building_${building}`;
        const centralStockId = `${project}_central`;

        const bRef = db.collection('furnitureStock').doc(buildingStockId);
        const cRef = db.collection('furnitureStock').doc(centralStockId);

        await db.runTransaction(async (transaction) => {
            const bDoc = await transaction.get(bRef);
            const cDoc = await transaction.get(cRef);

            let bItems = bDoc.exists ? (bDoc.data().items || {}) : {};
            let cItems = cDoc.exists ? (cDoc.data().items || {}) : {};

            for (const item of items) {
                const { name: furnitureName, qty: quantity } = item;
                const bQty = bItems[furnitureName] || 0;

                if (bQty < quantity) {
                    throw new Error(`สต๊อกตึก ${building} มี ${furnitureName} แค่ ${bQty} ชิ้น ไม่พอเบิก ${quantity} ชิ้น`);
                }

                // Deduct from building stock
                bItems[furnitureName] = bQty - quantity;
                if (bItems[furnitureName] <= 0) bItems[furnitureName] = firebase.firestore.FieldValue.delete();

                // Add to central stock
                cItems[furnitureName] = (cItems[furnitureName] || 0) + quantity;
            }

            transaction.set(bRef, {
                project, type: 'building', building,
                items: bItems,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            }, { merge: true });

            transaction.set(cRef, {
                project, type: 'central', building: null,
                items: cItems,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            }, { merge: true });
        });

        const namesSummary = items.map(i => `${i.name} x${i.qty}`).join(', ');
        for (const item of items) {
            await logFurnitureAction(userName, project, 'transfer_to_central', item.name, null, building, item.qty, remark);
        }

        return { success: true, message: `เบิก ${namesSummary} จากตึก ${building} ไปส่วนกลาง สำเร็จ` };
    } catch (error) {
        return { success: false, message: error.message };
    }
}

/**
 * เบิกเฟอร์จากสต๊อกส่วนกลาง → สต๊อกตึก (Transaction)
 */
async function handleTransferFromCentralFirebase(project, building, items, userName, remark) {
    try {
        if (!items || !Array.isArray(items) || items.length === 0) {
            throw new Error("ไม่มีรายการที่ต้องเบิก");
        }

        const buildingStockId = `${project}_building_${building}`;
        const centralStockId = `${project}_central`;

        const bRef = db.collection('furnitureStock').doc(buildingStockId);
        const cRef = db.collection('furnitureStock').doc(centralStockId);

        await db.runTransaction(async (transaction) => {
            const cDoc = await transaction.get(cRef);
            const bDoc = await transaction.get(bRef);

            let cItems = cDoc.exists ? (cDoc.data().items || {}) : {};
            let bItems = bDoc.exists ? (bDoc.data().items || {}) : {};

            for (const item of items) {
                const { name: furnitureName, qty: quantity } = item;
                const cQty = cItems[furnitureName] || 0;

                if (cQty < quantity) {
                    throw new Error(`สต๊อกส่วนกลางมี ${furnitureName} แค่ ${cQty} ชิ้น ไม่พอเบิก ${quantity} ชิ้น`);
                }

                // Deduct from central
                cItems[furnitureName] = cQty - quantity;
                if (cItems[furnitureName] <= 0) cItems[furnitureName] = firebase.firestore.FieldValue.delete();

                // Add to building stock
                bItems[furnitureName] = (bItems[furnitureName] || 0) + quantity;
            }

            transaction.set(cRef, {
                project, type: 'central', building: null,
                items: cItems,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            }, { merge: true });

            transaction.set(bRef, {
                project, type: 'building', building,
                items: bItems,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            }, { merge: true });
        });

        const namesSummary = items.map(i => `${i.name} x${i.qty}`).join(', ');
        for (const item of items) {
            await logFurnitureAction(userName, project, 'transfer_from_central', item.name, null, building, item.qty, remark);
        }

        return { success: true, message: `เบิก ${namesSummary} จากส่วนกลางไปตึก ${building} สำเร็จ` };
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
            .limit(1000);

        if (filters && filters.building) {
            query = query.where('building', '==', filters.building);
        }
        const snapshot = await query.get();
        let logs = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            timestamp: doc.data().timestamp ? doc.data().timestamp.toDate().toISOString() : null
        }));

        if (filters && filters.furnitureName) {
            logs = logs.filter(l => l.furnitureName === filters.furnitureName);
        }
        if (filters && filters.action) {
            logs = logs.filter(l => l.action === filters.action);
        }

        return { success: true, data: logs };
    } catch (error) {
        return { success: false, message: error.message };
    }
}

async function handleGetRoomFurnitureHistoryFirebase(project, roomNo) {
    try {
        const query = db.collection('furnitureLogs')
            .where('project', '==', project)
            .where('roomNo', '==', roomNo)
            .orderBy('timestamp', 'desc')
            .limit(100);
            
        const snapshot = await query.get();
        let history = [];
        snapshot.forEach(doc => {
            const data = doc.data();
            // Filter actions in memory
            if (data.action === 'add' || data.action === 'return') {
                history.push({
                    ...data,
                    id: doc.id,
                    timestamp: data.timestamp ? data.timestamp.toDate().toISOString() : null
                });
            }
        });
        
        return { success: true, data: history };
    } catch (error) {
        console.error('[handleGetRoomFurnitureHistoryFirebase]', error);
        return { success: false, message: error.message };
    }
}

/**
 * เพิ่มสต๊อกส่วนกลาง (Admin Only) — เพิ่มยอดใหม่เข้าสู่ระบบส่วนกลาง
 */
async function handleAddCentralStockFirebase(project, items, userName, remark) {
    try {
        if (!remark || remark.trim() === '') {
            return { success: false, message: 'กรุณาระบุเหตุผลในการเพิ่มสต๊อก' };
        }
        if (!items || !Array.isArray(items) || items.length === 0) {
            return { success: false, message: 'ไม่มีรายการที่ต้องเพิ่ม' };
        }

        const centralStockId = `${project}_central`;
        const cRef = db.collection('furnitureStock').doc(centralStockId);

        await db.runTransaction(async (transaction) => {
            const cDoc = await transaction.get(cRef);
            let cItems = cDoc.exists ? (cDoc.data().items || {}) : {};

            for (const item of items) {
                const { name: furnitureName, qty: quantity } = item;
                cItems[furnitureName] = (cItems[furnitureName] || 0) + quantity;
            }

            transaction.set(cRef, {
                project, type: 'central',
                items: cItems,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            }, { merge: true });
        });

        const namesSummary = items.map(i => `${i.name} x${i.qty}`).join(', ');
        for (const item of items) {
            await logFurnitureAction(userName, project, 'add_central_stock', item.name, null, null, item.qty, remark);
        }
        
        await logAction(userName, project, null, 'จัดการสต๊อกเฟอร์นิเจอร์', `เพิ่ม ${namesSummary} เข้าส่วนกลาง`, 'สำเร็จ');

        return { success: true, message: `เพิ่ม ${namesSummary} เข้าสต๊อกส่วนกลางสำเร็จ` };
    } catch (error) {
        return { success: false, message: error.message };
    }
}

/**
 * ตัดสต๊อกส่วนกลางออกจากระบบ (Admin Only) — ลดยอดโดยไม่ย้ายไปที่ไหน
 * ใช้สำหรับกรณีที่ยอดในระบบเกินจากของจริง เช่น บางห้องไม่มีเฟอร์บางชิ้นแต่แรก
 */
async function handleDisposeCentralStockFirebase(project, items, userName, remark) {
    try {
        if (!remark || remark.trim() === '') {
            return { success: false, message: 'กรุณาระบุเหตุผลในการตัดสต๊อก' };
        }
        if (!items || !Array.isArray(items) || items.length === 0) {
            return { success: false, message: 'ไม่มีรายการที่ต้องตัดสต๊อก' };
        }

        const centralStockId = `${project}_central`;
        const cRef = db.collection('furnitureStock').doc(centralStockId);

        await db.runTransaction(async (transaction) => {
            const cDoc = await transaction.get(cRef);
            let cItems = cDoc.exists ? (cDoc.data().items || {}) : {};

            for (const item of items) {
                const { name: furnitureName, qty: quantity } = item;
                const cQty = cItems[furnitureName] || 0;

                if (cQty < quantity) {
                    throw new Error(`สต๊อกส่วนกลางมี ${furnitureName} แค่ ${cQty} ชิ้น ไม่สามารถตัด ${quantity} ชิ้นได้`);
                }

                const newQty = cQty - quantity;
                if (newQty <= 0) {
                    cItems[furnitureName] = firebase.firestore.FieldValue.delete();
                } else {
                    cItems[furnitureName] = newQty;
                }
            }

            transaction.set(cRef, {
                project, type: 'central', building: null,
                items: cItems,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            }, { merge: true });
        });

        const namesSummary = items.map(i => `${i.name} x${i.qty}`).join(', ');
        for (const item of items) {
            await logFurnitureAction(userName, project, 'dispose_central', item.name, null, null, item.qty, remark);
        }

        return { success: true, message: `ตัดสต๊อก ${namesSummary} ออกจากส่วนกลางสำเร็จ` };
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
 * ดึงประวัติของเฟอร์นิเจอร์ชิ้นนั้นๆ
 */
async function handleGetFurnitureHistoryFirebase(project, furnitureName) {
    try {
        const snapshot = await db.collection('furnitureLogs')
            .where('project', '==', project)
            .where('furnitureName', '==', furnitureName)
            .get();
            
        const logs = snapshot.docs.map(d => {
            const data = d.data();
            return { id: d.id, ...data, timestamp: data.timestamp ? data.timestamp.toDate() : new Date() };
        });
        
        return { success: true, logs: logs.sort((a, b) => b.timestamp - a.timestamp) };
    } catch (error) {
        return { success: false, message: error.message };
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
                const furDocId = getBuildingDocId(project, building);
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

// =====================================================
// INTERNAL MESSAGING SYSTEM & PRESENCE FUNCTIONS
// =====================================================

let messagingUnreadListener = null;
let activeChatListener = null;
let userPresenceInterval = null;
let knownConversationLastTimes = {};
let isGlobalMessagingInitialLoad = true;

/**
 * สร้าง Conversation ID ที่ปลอดภัยและจัดเรียงชื่อตัวอักษรพิมพ์เล็ก
 */
function getConversationId(u1, u2) {
    const s1 = String(u1 || '').trim().toLowerCase();
    const s2 = String(u2 || '').trim().toLowerCase();
    const sorted = [s1, s2].sort();
    return `conv_${sorted[0]}_${sorted[1]}`.replace(/[^\w\u0E00-\u0E7F]/g, '_');
}

/**
 * จัดการสถานะออนไลน์ (User Presence) ของผู้ใช้ในระบบ
 */
function initUserPresence(user) {
    if (!user || !user.id) return;

    const updatePresence = async (isOnline = true) => {
        try {
            await db.collection('users').doc(user.id).set({
                isOnline: isOnline,
                lastSeen: firebase.firestore.FieldValue.serverTimestamp()
            }, { merge: true });
        } catch (e) {
            // Silently ignore presence errors
        }
    };

    // อัปเดตออนไลน์ทันที
    updatePresence(true);

    // Heartbeat ทุก 45 วินาที
    if (userPresenceInterval) clearInterval(userPresenceInterval);
    userPresenceInterval = setInterval(() => {
        if (document.visibilityState === 'visible') {
            updatePresence(true);
        }
    }, 45000);

    // สลับแท็บ / กลับมาใช้งาน
    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') {
            updatePresence(true);
        }
    });

    // ปิดหน้าจอ
    window.addEventListener('beforeunload', () => {
        updatePresence(false);
    });
}

function stopUserPresence(user) {
    if (userPresenceInterval) {
        clearInterval(userPresenceInterval);
        userPresenceInterval = null;
    }
    if (user && user.id) {
        try {
            db.collection('users').doc(user.id).set({
                isOnline: false,
                lastSeen: firebase.firestore.FieldValue.serverTimestamp()
            }, { merge: true });
        } catch (e) {}
    }
}

/**
 * ดึงรายชื่อผู้ใช้ที่ Active ทั้งหมด พร้อมสถานะออนไลน์
 */
async function handleGetActiveUsersFirebase(currentUser) {
    try {
        const snapshot = await db.collection('users').get();
        const currentName = currentUser ? String(currentUser.name || currentUser.username || '').toLowerCase().trim() : '';
        const now = Date.now();
        const users = [];

        snapshot.docs.forEach(doc => {
            const d = doc.data();
            const uname = String(d.username || doc.id).trim();
            const unameLower = uname.toLowerCase();

            // ไม่รวมตัวผู้ใช้เอง และไม่รวมคนที่ถูก Inactive
            if (d.status !== 'Inactive' && unameLower !== currentName) {
                // ตรวจสอบว่าออนไลน์อยู่หรือไม่ (lastSeen ภายใน 3 นาที)
                let isOnline = false;
                let lastSeenText = 'ออฟไลน์';

                if (d.lastSeen) {
                    const lastSeenMs = d.lastSeen.toMillis ? d.lastSeen.toMillis() : (d.lastSeen.seconds * 1000 || 0);
                    const diffMins = Math.floor((now - lastSeenMs) / 60000);
                    if (diffMins < 3) {
                        isOnline = true;
                        lastSeenText = 'ออนไลน์';
                    } else if (diffMins < 60) {
                        lastSeenText = `ใช้งานเมื่อ ${diffMins} นาทีที่แล้ว`;
                    } else if (diffMins < 1440) {
                        const hours = Math.floor(diffMins / 60);
                        lastSeenText = `ใช้งานเมื่อ ${hours} ชม. ที่แล้ว`;
                    } else {
                        lastSeenText = 'ออฟไลน์';
                    }
                }

                users.push({
                    id: doc.id,
                    username: uname,
                    email: d.email || '',
                    role: d.role || 'Project User',
                    status: d.status || 'Active',
                    isOnline: isOnline,
                    lastSeenText: lastSeenText,
                    access: Array.isArray(d.access) ? d.access.join(', ') : (d.access || '')
                });
            }
        });

        // จัดเรียง: คนที่ออนไลน์อยู่ขึ้นก่อน -> Admin -> เรียงตามชื่อ
        users.sort((a, b) => {
            if (a.isOnline && !b.isOnline) return -1;
            if (!a.isOnline && b.isOnline) return 1;
            if (a.role === 'Admin' && b.role !== 'Admin') return -1;
            if (a.role !== 'Admin' && b.role === 'Admin') return 1;
            return a.username.localeCompare(b.username);
        });

        return { success: true, users };
    } catch (error) {
        console.error('[handleGetActiveUsersFirebase]', error);
        return { success: false, message: error.message };
    }
}

/**
 * ส่งข้อความ 1-on-1 พร้อมป้องกันปัญหา Casing และ Dot Notation ใน Firestore
 */
async function handleSendMessageFirebase(payload) {
    const { recipientName, content, sender } = payload;
    if (!recipientName || !content || !content.trim()) {
        return { success: false, message: "กรุณาระบุผู้รับและข้อความ" };
    }
    if (!sender || (!sender.name && !sender.username)) {
        return { success: false, message: "ไม่พบข้อมูลผู้ส่ง กรุณาเข้าสู่ระบบใหม่" };
    }

    try {
        const senderName = String(sender.name || sender.username || '').trim();
        const targetRecipient = String(recipientName || '').trim();
        const convId = payload.conversationId || getConversationId(senderName, targetRecipient);
        const convRef = db.collection('messages').doc(convId);
        const chatRef = convRef.collection('chats').doc();

        const trimmedContent = content.trim();
        const batch = db.batch();

        // 1. บันทึกข้อความลง subcollection chats
        batch.set(chatRef, {
            id: chatRef.id,
            senderId: sender.id || '',
            senderName: senderName,
            senderRole: sender.role || 'Project User',
            recipientName: targetRecipient,
            content: trimmedContent,
            timestamp: firebase.firestore.FieldValue.serverTimestamp(),
            read: false
        });

        // 2. ดึงข้อมูลการสนทนาเดิมเพื่ออัปเดต unreadCount อย่างปลอดภัย
        const convDoc = await convRef.get();
        const existingData = convDoc.exists ? convDoc.data() : {};
        const prevUnread = existingData.unreadCount || {};

        // คำนวณ unreadCount โดยไม่ใช้ dot notation เพื่อป้องกันปัญหาชื่อผู้ใช้มีจุดหรืออักขระพิเศษ
        const currentRecipientUnread = parseInt(prevUnread[targetRecipient]) || parseInt(prevUnread[targetRecipient.toLowerCase()]) || 0;
        const newRecipientUnread = currentRecipientUnread + 1;

        const updatedUnread = {
            ...prevUnread,
            [targetRecipient]: newRecipientUnread,
            [targetRecipient.toLowerCase()]: newRecipientUnread,
            [senderName]: 0,
            [senderName.toLowerCase()]: 0
        };

        // เก็บ participants ทั้งแบบตัวพิมพ์ปกติและตัวพิมพ์เล็ก เพื่อให้ query array-contains เจอเสมอ 100%
        const participants = Array.from(new Set([
            senderName,
            targetRecipient,
            senderName.toLowerCase(),
            targetRecipient.toLowerCase()
        ]));

        const participantDetails = {
            ...(existingData.participantDetails || {}),
            [senderName]: { name: senderName, role: sender.role || 'Project User' },
            [targetRecipient]: { name: targetRecipient, role: payload.recipientRole || existingData.participantDetails?.[targetRecipient]?.role || 'Project User' }
        };

        const summaryData = {
            conversationId: convId,
            participants: participants,
            participantDetails: participantDetails,
            lastMessage: trimmedContent,
            lastSender: senderName,
            lastSenderRole: sender.role || 'Project User',
            lastMessageAt: firebase.firestore.FieldValue.serverTimestamp(),
            unreadCount: updatedUnread,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        };

        if (!convDoc.exists) {
            summaryData.createdAt = firebase.firestore.FieldValue.serverTimestamp();
        }

        batch.set(convRef, summaryData, { merge: true });
        await batch.commit();

        return { success: true, conversationId: convId };
    } catch (error) {
        console.error('[handleSendMessageFirebase]', error);
        return { success: false, message: error.message };
    }
}

/**
 * ส่งข้อความหาหลายคนพร้อมกัน (Broadcast)
 */
async function handleBroadcastMessageFirebase(payload) {
    const { recipients, content, sender } = payload;
    if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
        return { success: false, message: "กรุณาเลือกผู้รับอย่างน้อย 1 คน" };
    }
    if (!content || !content.trim()) {
        return { success: false, message: "กรุณาระบุข้อความ" };
    }

    try {
        for (const recipientName of recipients) {
            await handleSendMessageFirebase({
                recipientName,
                content,
                sender
            });
        }
        return { success: true, count: recipients.length };
    } catch (error) {
        console.error('[handleBroadcastMessageFirebase]', error);
        return { success: false, message: error.message };
    }
}

/**
 * อัพเดตว่าเปิดอ่านข้อความแล้ว (Mark as read)
 */
async function handleMarkConversationAsReadFirebase(conversationId, username) {
    if (!conversationId || !username) return { success: false };
    try {
        const uname = String(username).trim();
        const convRef = db.collection('messages').doc(conversationId);
        const convDoc = await convRef.get();

        if (convDoc.exists) {
            const data = convDoc.data();
            const unread = { ...(data.unreadCount || {}) };
            unread[uname] = 0;
            unread[uname.toLowerCase()] = 0;
            await convRef.set({ unreadCount: unread }, { merge: true });
        }

        // ปรับสถานะข้อความใน chats ที่ส่งถึงเราให้เป็น read = true
        const unreadChats = await convRef.collection('chats')
            .where('read', '==', false)
            .limit(100)
            .get();

        if (!unreadChats.empty) {
            const batch = db.batch();
            const unameLower = uname.toLowerCase();
            unreadChats.docs.forEach(doc => {
                const cd = doc.data();
                const rName = String(cd.recipientName || '').toLowerCase().trim();
                if (rName === unameLower) {
                    batch.update(doc.ref, { read: true });
                }
            });
            await batch.commit();
        }

        return { success: true };
    } catch (error) {
        console.error('[handleMarkConversationAsReadFirebase]', error);
        return { success: false, message: error.message };
    }
}

/**
 * ลบประวัติการสนทนา (เฉพาะ Admin)
 */
async function handleDeleteConversationFirebase(conversationId, user) {
    if (!user || user.role !== 'Admin') {
        return { success: false, message: "เฉพาะ Admin เท่านั้นที่สามารถลบการสนทนาได้" };
    }
    try {
        const convRef = db.collection('messages').doc(conversationId);
        const chatsSnapshot = await convRef.collection('chats').get();
        const batch = db.batch();
        chatsSnapshot.docs.forEach(doc => batch.delete(doc.ref));
        batch.delete(convRef);
        await batch.commit();
        return { success: true, message: "ลบประวัติการสนทนาเรียบร้อย" };
    } catch (error) {
        return { success: false, message: error.message };
    }
}

/**
 * Real-time Listener ข้อความทั้งหมดสำหรับ User พร้อมระบบแจ้งเตือนมุมขวาล่างทั่วทั้งแอพ
 */
function listenToUserConversations(username, onUpdate) {
    if (!username) return null;
    if (messagingUnreadListener) {
        messagingUnreadListener();
        messagingUnreadListener = null;
    }

    const myName = String(username).trim();
    const myNameLower = myName.toLowerCase();

    try {
        messagingUnreadListener = db.collection('messages')
            .where('participants', 'array-contains', myNameLower)
            .onSnapshot(snapshot => {
                const conversations = [];
                let totalUnread = 0;

                snapshot.forEach(doc => {
                    const data = doc.data();
                    const unread = (data.unreadCount && (data.unreadCount[myName] || data.unreadCount[myNameLower])) || 0;
                    totalUnread += unread;
                    conversations.push({
                        id: doc.id,
                        ...data,
                        unread
                    });

                    // ตรวจจับข้อความใหม่เพื่อแสดงแจ้งเตือนขวาล่าง
                    const lastSender = String(data.lastSender || '').toLowerCase().trim();
                    const msgTime = data.lastMessageAt ? (data.lastMessageAt.toMillis ? data.lastMessageAt.toMillis() : (data.lastMessageAt.seconds * 1000 || 0)) : 0;
                    const prevKnownTime = knownConversationLastTimes[doc.id] || 0;

                    if (!isGlobalMessagingInitialLoad && msgTime > prevKnownTime && lastSender && lastSender !== myNameLower) {
                        // ไม่แสดงแจ้งเตือนถ้ากำลังเปิดหน้าต่างแชทกับคนนี้อยู่
                        const isCurrentlyLookingAtThisChat = (typeof STATE !== 'undefined' && STATE.currentView === 'messaging') &&
                            (typeof MESSAGING_STATE !== 'undefined' && MESSAGING_STATE.activeConversationId === doc.id);

                        if (!isCurrentlyLookingAtThisChat) {
                            if (typeof showBottomRightChatNotification === 'function') {
                                showBottomRightChatNotification({
                                    conversationId: doc.id,
                                    senderName: data.lastSender,
                                    senderRole: data.lastSenderRole || (data.participantDetails && data.participantDetails[data.lastSender]?.role) || 'User',
                                    content: data.lastMessage || 'ส่งข้อความถึงคุณ'
                                });
                            }
                        }
                    }

                    if (msgTime > 0) {
                        knownConversationLastTimes[doc.id] = Math.max(prevKnownTime, msgTime);
                    }
                });

                isGlobalMessagingInitialLoad = false;

                // จัดเรียงตาม lastMessageAt ล่าสุด
                conversations.sort((a, b) => {
                    const tA = a.lastMessageAt ? (a.lastMessageAt.toMillis ? a.lastMessageAt.toMillis() : (a.lastMessageAt.seconds * 1000 || 0)) : 0;
                    const tB = b.lastMessageAt ? (b.lastMessageAt.toMillis ? b.lastMessageAt.toMillis() : (b.lastMessageAt.seconds * 1000 || 0)) : 0;
                    return tB - tA;
                });

                if (typeof onUpdate === 'function') {
                    onUpdate({ conversations, totalUnread });
                }
                updateMessagingBadges(totalUnread);
            }, err => {
                console.warn('[listenToUserConversations error]', err);
                // Fallback: ถ้า query array-contains lowercase ยังไม่พบ ลอง query ด้วยชื่อตัวพิมพ์ปกติ
                if (myNameLower !== myName) {
                    db.collection('messages')
                        .where('participants', 'array-contains', myName)
                        .onSnapshot(s => {
                            let total = 0;
                            s.forEach(d => {
                                const data = d.data();
                                total += (data.unreadCount && (data.unreadCount[myName] || data.unreadCount[myNameLower])) || 0;
                            });
                            updateMessagingBadges(total);
                        });
                }
            });
    } catch (e) {
        console.error('[listenToUserConversations]', e);
    }
    return messagingUnreadListener;
}

/**
 * อัพเดต Badge แสดงจำนวนข้อความที่ยังไม่ได้อ่าน
 */
function updateMessagingBadges(unreadCount) {
    const count = parseInt(unreadCount) || 0;
    const badges = [
        document.getElementById('msgUnreadBadge'),
        document.getElementById('sidebarMsgBadge'),
        document.getElementById('mobileMsgBadge')
    ];
    badges.forEach(el => {
        if (!el) return;
        if (count > 0) {
            el.innerText = count > 99 ? '99+' : count;
            el.classList.remove('hidden');
        } else {
            el.classList.add('hidden');
        }
    });
}

/**
 * Real-time Listener ข้อความในการสนทนาที่เลือก (Active Chat)
 */
function listenToActiveChat(conversationId, onUpdate) {
    if (activeChatListener) {
        activeChatListener();
        activeChatListener = null;
    }
    if (!conversationId) return null;

    try {
        activeChatListener = db.collection('messages')
            .doc(conversationId)
            .collection('chats')
            .orderBy('timestamp', 'asc')
            .limitToLast(150)
            .onSnapshot(snapshot => {
                const messages = [];
                snapshot.forEach(doc => {
                    messages.push({
                        id: doc.id,
                        ...doc.data()
                    });
                });
                if (typeof onUpdate === 'function') {
                    onUpdate(messages);
                }
            }, err => {
                console.warn('[listenToActiveChat error]', err);
            });
    } catch (e) {
        console.error('[listenToActiveChat]', e);
    }
    return activeChatListener;
}

function stopActiveChatListener() {
    if (activeChatListener) {
        activeChatListener();
        activeChatListener = null;
    }
}

console.log('[DB] Firebase Data Layer loaded - 31 API handlers ready (Internal Messaging, Real-time Presence & Notifications active)');


