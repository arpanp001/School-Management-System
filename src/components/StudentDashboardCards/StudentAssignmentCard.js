import React, { useState, useEffect } from 'react';
import { auth, db } from '../../firebase/config';
import { doc, getDoc, collection, getDocs } from 'firebase/firestore';
import '../StudentDashboardCardsCss/StudentAssignmentCard.css';

const StudentAssignmentCard = () => {
    const [transportDetails, setTransportDetails] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchTransportData = async () => {
        const user = auth.currentUser;
        if (!user) {
            console.log('No user logged in');
            setError('Please log in to view transport details');
            setLoading(false);
            return;
        }

        try {
            let studentLogSnap;
            const studentLogRef = doc(db, 'studentLog', user.uid);
            studentLogSnap = await getDoc(studentLogRef);
            console.log('studentLog exists:', studentLogSnap.exists());

            let studentData;
            if (studentLogSnap.exists()) {
                studentData = studentLogSnap.data();
            } else {
                console.log('studentLog not found, falling back to students-profile');
                const studentProfileRef = doc(db, 'students-profile', user.uid);
                const studentProfileSnap = await getDoc(studentProfileRef);
                console.log('students-profile exists:', studentProfileSnap.exists());

                if (!studentProfileSnap.exists()) {
                    console.log('No student document found for UID:', user.uid);
                    setError('Student data not found');
                    setLoading(false);
                    return;
                }
                studentData = studentProfileSnap.data();
            }

            console.log('Student data:', studentData);

            if (!studentData.transport) {
                console.log('No transport field in student data');
                setTransportDetails(null);
                setLoading(false);
                return;
            }

            const { busId, routeId, driverId } = studentData.transport;
            console.log('Transport IDs:', { busId, routeId, driverId });

            const busesSnapshot = await getDocs(collection(db, 'buses'));
            const buses = busesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            console.log('Buses:', buses);

            const routesSnapshot = await getDocs(collection(db, 'routes'));
            const routes = routesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            console.log('Routes:', routes);

            const driversSnapshot = await getDocs(collection(db, 'drivers'));
            const drivers = driversSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            console.log('Drivers:', drivers);

            const bus = buses.find(b => b.id === busId) || {};
            const route = routes.find(r => r.id === routeId) || {};
            const driver = drivers.find(d => d.id === driverId) || {};

            console.log('Matched transport details:', { bus, route, driver });

            if (!bus.busNumber && !route.routeName && !driver.name) {
                console.log('No matching transport details found');
                setTransportDetails(null);
            } else {
                setTransportDetails({ bus, route, driver });
            }
        } catch (error) {
            console.error('Error fetching transport data:', error);
            setError('Failed to load transport details: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTransportData();
    }, []);

    const handleRetry = () => {
        setLoading(true);
        setError(null);
        fetchTransportData();
    };

    if (loading) {
        return (
            <div className="stc-card" aria-live="polite" aria-busy="true">
                <h2>My Transport</h2>
                <p>Loading transport details...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="stc-card">
                <h2>My Transport</h2>
                <p className="stc-error">{error}</p>
                <button className="stc-retry" onClick={handleRetry} aria-label="Retry loading transport details">
                    Retry
                </button>
            </div>
        );
    }

    if (!transportDetails) {
        return (
            <div className="stc-card">
                <h2>My Transport</h2>
                <p className="stc-empty">No transport assigned yet.</p>
            </div>
        );
    }

    return (
        <div className="stc-card" role="region" aria-label="Student transport details">
            <h2>My Transport</h2>
            <div className="stc-details">
                <div className="stc-section bus" aria-label="Bus information section">
                    <h3>Bus</h3>
                    <p>Number: {transportDetails.bus.busNumber || 'N/A'}</p>
                    <p>Capacity: {transportDetails.bus.capacity || 'N/A'}</p>
                    <p>Model: {transportDetails.bus.model || 'N/A'}</p>
                </div>
                <div className="stc-section route" aria-label="Route information section">
                    <h3>Route</h3>
                    <p>Name: {transportDetails.route.routeName || 'N/A'}</p>
                    <p>From: {transportDetails.route.startPoint || 'N/A'}</p>
                    <p>To: {transportDetails.route.endPoint || 'N/A'}</p>
                </div>
                <div className="stc-section driver" aria-label="Driver information section">
                    <h3>Driver</h3>
                    <p>Name: {transportDetails.driver.name || 'N/A'}</p>
                    <p>Contact: {transportDetails.driver.contact || 'N/A'}</p>
                </div>
            </div>
        </div>
    );
};

export default StudentAssignmentCard;