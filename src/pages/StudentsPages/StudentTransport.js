import React, { useState, useEffect } from 'react';
import { auth } from '../../firebase/config';
import { subscribeToStudentData, subscribeToTransportData } from '../AdminPages/transportFunctions';
import { onAuthStateChanged } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import '../../pages/StudentPagesStyle/StudentTransport.css';

const StudentTransport = () => {
    const [transportDetails, setTransportDetails] = useState(null);
    const [buses, setBuses] = useState([]);
    const [routes, setRoutes] = useState([]);
    const [drivers, setDrivers] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const unsubscribers = [];

        const authUnsubscribe = onAuthStateChanged(auth, (user) => {
            if (user) {
                const studentUnsubscribe = subscribeToStudentData(user.uid, (studentData) => {
                    if (studentData && studentData.transport) {
                        const bus = buses.find(b => b.id === studentData.transport.busId);
                        const route = routes.find(r => r.id === studentData.transport.routeId);
                        const driver = drivers.find(d => d.id === studentData.transport.driverId);
                        setTransportDetails({
                            bus: bus || {},
                            route: route || {},
                            driver: driver || {}
                        });
                    } else {
                        setTransportDetails(null);
                    }
                    setLoading(false);
                });
                unsubscribers.push(studentUnsubscribe);

                const busesUnsubscribe = subscribeToTransportData('buses', setBuses);
                const routesUnsubscribe = subscribeToTransportData('routes', setRoutes);
                const driversUnsubscribe = subscribeToTransportData('drivers', setDrivers);
                unsubscribers.push(busesUnsubscribe, routesUnsubscribe, driversUnsubscribe);
            } else {
                setTransportDetails(null);
                setLoading(false);
                navigate('/'); // Redirect to login page instead of showing toast
            }
        });

        unsubscribers.push(authUnsubscribe);

        return () => unsubscribers.forEach(unsubscribe => unsubscribe());
    }, [buses, routes, drivers, navigate]);

    if (loading) {
        return (
            <div className="stp__loading-container">
                <div className="stp__loading-spinner"></div>
                <p className="stp__loading-text">Loading transport details...</p>
            </div>
        );
    }

    if (!transportDetails) {
        return (
            <div className="stp__no-data-container">
                <div className="stp__no-data-icon">
                    <i className="stp__icon-bus"></i>
                </div>
                <h3 className="stp__no-data-title">No Transport Assigned</h3>
                <p className="stp__no-data-message">
                    You don't have any transport details assigned yet. Please contact your administrator.
                </p>
            </div>
        );
    }

    return (
        <div className="stp__container">
            <div className="stp__header">
                <h2 className="stp__title">My Transport Details</h2>
                <div className="stp__title-underline"></div>
            </div>

            <div className="stp__cards-container">
                <div className="stp__card stp__card--bus">
                    <div className="stp__card-header">
                        <div className="stp__card-icon">
                            <i className="stp__icon-bus"></i>
                        </div>
                        <h3 className="stp__card-title">Bus Information</h3>
                    </div>
                    <div className="stp__card-content">
                        <div className="stp__info-item">
                            <span className="stp__info-label">Bus Number:</span>
                            <span className="stp__info-value">{transportDetails.bus.busNumber || 'N/A'}</span>
                        </div>
                        <div className="stp__info-item">
                            <span className="stp__info-label">Capacity:</span>
                            <span className="stp__info-value">{transportDetails.bus.capacity || 'N/A'}</span>
                        </div>
                        <div className="stp__info-item">
                            <span className="stp__info-label">Model:</span>
                            <span className="stp__info-value">{transportDetails.bus.model || 'N/A'}</span>
                        </div>
                    </div>
                </div>

                <div className="stp__card stp__card--route">
                    <div className="stp__card-header">
                        <div className="stp__card-icon">
                            <i className="stp__icon-route"></i>
                        </div>
                        <h3 className="stp__card-title">Route Information</h3>
                    </div>
                    <div className="stp__card-content">
                        <div className="stp__info-item">
                            <span className="stp__info-label">Route:</span>
                            <span className="stp__info-value">{transportDetails.route.routeName || 'N/A'}</span>
                        </div>
                        <div className="stp__info-item">
                            <span className="stp__info-label">From:</span>
                            <span className="stp__info-value">{transportDetails.route.startPoint || 'N/A'}</span>
                        </div>
                        <div className="stp__info-item">
                            <span className="stp__info-label">To:</span>
                            <span className="stp__info-value">{transportDetails.route.endPoint || 'N/A'}</span>
                        </div>
                        <div className="stp__info-item stp__info-item--stops">
                            <span className="stp__info-label">Stops:</span>
                            <span className="stp__info-value stp__info-value--stops">
                                {transportDetails.route.stops?.join(', ') || 'N/A'}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="stp__card stp__card--driver">
                    <div className="stp__card-header">
                        <div className="stp__card-icon">
                            <i className="stp__icon-driver"></i>
                        </div>
                        <h3 className="stp__card-title">Driver Information</h3>
                    </div>
                    <div className="stp__card-content">
                        <div className="stp__info-item">
                            <span className="stp__info-label">Name:</span>
                            <span className="stp__info-value">{transportDetails.driver.name || 'N/A'}</span>
                        </div>
                        <div className="stp__info-item">
                            <span className="stp__info-label">Contact:</span>
                            <span className="stp__info-value">{transportDetails.driver.contact || 'N/A'}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StudentTransport;