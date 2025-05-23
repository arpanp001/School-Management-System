// src/firebase/transportFunctions.js
import { db } from "../../firebase/config";
import {
    collection,
    addDoc,
    updateDoc,
    doc,
    getDocs,
    getDoc,
    deleteDoc,
    onSnapshot,
    query
} from "firebase/firestore";

// Bus Management
export const createBus = async (busData) => {
    try {
        const docRef = await addDoc(collection(db, "buses"), {
            ...busData,
            createdAt: new Date().toISOString(),
            status: "active"
        });
        return docRef.id;
    } catch (error) {
        throw new Error("Error creating bus: " + error.message);
    }
};

export const updateBus = async (busId, busData) => {
    try {
        const busRef = doc(db, "buses", busId);
        await updateDoc(busRef, busData);
    } catch (error) {
        throw new Error("Error updating bus: " + error.message);
    }
};

export const deleteBus = async (busId) => {
    try {
        await deleteDoc(doc(db, "buses", busId));
        const driversSnapshot = await getDocs(collection(db, "drivers"));
        driversSnapshot.docs.forEach(async (driverDoc) => {
            if (driverDoc.data().assignedBus === busId) {
                await updateDoc(doc(db, "drivers", driverDoc.id), {
                    assignedBus: null,
                    assignedRoute: null
                });
            }
        });
        const studentsSnapshot = await getDocs(collection(db, "studentLog"));
        studentsSnapshot.docs.forEach(async (studentDoc) => {
            if (studentDoc.data().transport?.busId === busId) {
                await updateDoc(doc(db, "studentLog", studentDoc.id), {
                    transport: null
                });
            }
        });
    } catch (error) {
        throw new Error("Error deleting bus: " + error.message);
    }
};

// Route Management
export const createRoute = async (routeData) => {
    try {
        const docRef = await addDoc(collection(db, "routes"), {
            ...routeData,
            createdAt: new Date().toISOString(),
            status: "active"
        });
        return docRef.id;
    } catch (error) {
        throw new Error("Error creating route: " + error.message);
    }
};

export const updateRoute = async (routeId, routeData) => {
    try {
        const routeRef = doc(db, "routes", routeId);
        await updateDoc(routeRef, routeData);
    } catch (error) {
        throw new Error("Error updating route: " + error.message);
    }
};

export const deleteRoute = async (routeId) => {
    try {
        await deleteDoc(doc(db, "routes", routeId));
        const driversSnapshot = await getDocs(collection(db, "drivers"));
        driversSnapshot.docs.forEach(async (driverDoc) => {
            if (driverDoc.data().assignedRoute === routeId) {
                await updateDoc(doc(db, "drivers", driverDoc.id), {
                    assignedRoute: null
                });
            }
        });
    } catch (error) {
        throw new Error("Error deleting route: " + error.message);
    }
};

// Driver Management
export const createDriver = async (driverData) => {
    try {
        const docRef = await addDoc(collection(db, "drivers"), {
            ...driverData,
            createdAt: new Date().toISOString(),
            status: "active"
        });
        return docRef.id;
    } catch (error) {
        throw new Error("Error creating driver: " + error.message);
    }
};

export const updateDriver = async (driverId, driverData) => {
    try {
        const driverRef = doc(db, "drivers", driverId);
        await updateDoc(driverRef, driverData);
    } catch (error) {
        throw new Error("Error updating driver: " + error.message);
    }
};

export const assignBusToDriver = async (driverId, busId, routeId) => {
    try {
        const driverRef = doc(db, "drivers", driverId);
        await updateDoc(driverRef, {
            assignedBus: busId,
            assignedRoute: routeId,
            lastUpdated: new Date().toISOString()
        });
    } catch (error) {
        throw new Error("Error assigning bus to driver: " + error.message);
    }
};

export const deleteDriver = async (driverId) => {
    try {
        await deleteDoc(doc(db, "drivers", driverId));
        const studentsSnapshot = await getDocs(collection(db, "studentLog"));
        studentsSnapshot.docs.forEach(async (studentDoc) => {
            if (studentDoc.data().transport?.driverId === driverId) {
                await updateDoc(doc(db, "studentLog", studentDoc.id), {
                    "transport.driverId": null
                });
            }
        });
    } catch (error) {
        throw new Error("Error deleting driver: " + error.message);
    }
};

// Student Bus Assignment
export const assignBusToStudent = async (studentId, busId) => {
    try {
        await getDoc(doc(db, "buses", busId));
        const driverSnapshot = await getDocs(collection(db, "drivers"));
        const assignedDriver = driverSnapshot.docs.find(doc =>
            doc.data().assignedBus === busId
        );

        const studentRef = doc(db, "studentLog", studentId);
        await updateDoc(studentRef, {
            transport: {
                busId: busId,
                routeId: assignedDriver?.data().assignedRoute || null,
                driverId: assignedDriver?.id || null,
                assignedAt: new Date().toISOString()
            }
        });
    } catch (error) {
        throw new Error("Error assigning bus to student: " + error.message);
    }
};

export const removeStudentBusAssignment = async (studentId) => {
    try {
        const studentRef = doc(db, "studentLog", studentId);
        await updateDoc(studentRef, {
            transport: null
        });
    } catch (error) {
        throw new Error("Error removing student assignment: " + error.message);
    }
};

// One-time fetch (unchanged)
export const getTransportData = async (collectionName) => {
    try {
        const snapshot = await getDocs(collection(db, collectionName));
        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
    } catch (error) {
        throw new Error(`Error fetching ${collectionName}: ` + error.message);
    }
};

// Real-time subscription
export const subscribeToTransportData = (collectionName, callback) => {
    try {
        const q = query(collection(db, collectionName));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const data = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            callback(data);
        }, (error) => {
            throw new Error(`Error subscribing to ${collectionName}: ` + error.message);
        });
        return unsubscribe;
    } catch (error) {
        throw new Error(`Error setting up subscription for ${collectionName}: ` + error.message);
    }
};

export const subscribeToStudentData = (studentId, callback) => {
    try {
        const unsubscribe = onSnapshot(doc(db, 'studentLog', studentId), (studentDoc) => {
            const data = studentDoc.exists() ? { id: studentDoc.id, ...studentDoc.data() } : null;
            callback(data);
        }, (error) => {
            throw new Error("Error subscribing to student data: " + error.message);
        });
        return unsubscribe;
    } catch (error) {
        throw new Error("Error setting up student subscription: " + error.message);
    }
};