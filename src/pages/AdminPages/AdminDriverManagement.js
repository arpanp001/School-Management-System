// pages/AdminPages/AdminDriverManagement.js
import React, { useState, useEffect } from 'react';
import { createDriver, assignBusToDriver, updateDriver, deleteDriver, subscribeToTransportData } from '../AdminPages/transportFunctions';
import { toast } from 'react-toastify';
import '../../pages/AdminPagesStyle/AdminDriverManagement.css';

const AdminDriverManagement = () => {
    const [drivers, setDrivers] = useState([]);
    const [buses, setBuses] = useState([]);
    const [routes, setRoutes] = useState([]);
    const [driverData, setDriverData] = useState({ name: '', licenseNumber: '', contact: '' });
    const [assignment, setAssignment] = useState({ driverId: '', busId: '', routeId: '' });
    const [editingDriver, setEditingDriver] = useState(null);

    useEffect(() => {
        const unsubscribers = [];
        unsubscribers.push(subscribeToTransportData('drivers', setDrivers));
        unsubscribers.push(subscribeToTransportData('buses', setBuses));
        unsubscribers.push(subscribeToTransportData('routes', setRoutes));
        return () => unsubscribers.forEach(unsubscribe => unsubscribe());
    }, []);

    const handleDriverSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingDriver) {
                await updateDriver(editingDriver.id, driverData);
                toast.success('Driver updated successfully!');
                setEditingDriver(null);
            } else {
                await createDriver(driverData);
                toast.success('Driver added successfully!');
            }
            setDriverData({ name: '', licenseNumber: '', contact: '' });
        } catch (error) {
            toast.error(error.message);
        }
    };

    const handleAssignment = async (e) => {
        e.preventDefault();
        try {
            await assignBusToDriver(assignment.driverId, assignment.busId, assignment.routeId);
            toast.success('Assignment successful!');
            setAssignment({ driverId: '', busId: '', routeId: '' });
        } catch (error) {
            toast.error(error.message);
        }
    };

    const handleEdit = (driver) => {
        setEditingDriver(driver);
        setDriverData({ name: driver.name, licenseNumber: driver.licenseNumber, contact: driver.contact });
    };

    const handleDelete = async (driverId) => {
        if (window.confirm('Are you sure you want to delete this driver?')) {
            try {
                await deleteDriver(driverId);
                toast.success('Driver deleted successfully!');
            } catch (error) {
                toast.error(error.message);
            }
        }
    };

    const getBusNumber = (busId) => {
        const bus = buses.find(b => b.id === busId);
        return bus ? bus.busNumber : 'Not assigned';
    };

    const getRouteName = (routeId) => {
        const route = routes.find(r => r.id === routeId);
        return route ? route.routeName : 'Not assigned';
    };

    return (
        <div className="admin-driver-management">
            <h2>Driver Management</h2>
            <form onSubmit={handleDriverSubmit}>
                <input
                    type="text"
                    placeholder="Driver Name"
                    value={driverData.name}
                    onChange={(e) => setDriverData({ ...driverData, name: e.target.value })}
                    required
                />
                <input
                    type="text"
                    placeholder="License Number"
                    value={driverData.licenseNumber}
                    onChange={(e) => setDriverData({ ...driverData, licenseNumber: e.target.value })}
                    required
                />
                <input
                    type="text"
                    placeholder="Contact"
                    value={driverData.contact}
                    onChange={(e) => setDriverData({ ...driverData, contact: e.target.value })}
                    required
                />
                <button type="submit">{editingDriver ? 'Update Driver' : 'Add Driver'}</button>
                {editingDriver && (
                    <button
                        type="button"
                        onClick={() => {
                            setEditingDriver(null);
                            setDriverData({ name: '', licenseNumber: '', contact: '' });
                        }}
                    >
                        Cancel
                    </button>
                )}
            </form>

            <form onSubmit={handleAssignment}>
                <select
                    value={assignment.driverId}
                    onChange={(e) => setAssignment({ ...assignment, driverId: e.target.value })}
                    required
                >
                    <option value="">Select Driver</option>
                    {drivers.map(driver => (
                        <option key={driver.id} value={driver.id}>{driver.name}</option>
                    ))}
                </select>
                <select
                    value={assignment.busId}
                    onChange={(e) => setAssignment({ ...assignment, busId: e.target.value })}
                    required
                >
                    <option value="">Select Bus</option>
                    {buses.map(bus => (
                        <option key={bus.id} value={bus.id}>{bus.busNumber}</option>
                    ))}
                </select>
                <select
                    value={assignment.routeId}
                    onChange={(e) => setAssignment({ ...assignment, routeId: e.target.value })}
                    required
                >
                    <option value="">Select Route</option>
                    {routes.map(route => (
                        <option key={route.id} value={route.id}>{route.routeName}</option>
                    ))}
                </select>
                <button type="submit">Assign</button>
            </form>

            <div className="driver-list">
                {drivers.map(driver => (
                    <div key={driver.id} className="driver-item">
                        <p>Name: {driver.name}</p>
                        <p>License: {driver.licenseNumber}</p>
                        <p>Bus: {getBusNumber(driver.assignedBus)}</p>
                        <p>Route: {getRouteName(driver.assignedRoute)}</p>
                        <button className="edit" onClick={() => handleEdit(driver)}>Edit</button>
                        <button className="delete" onClick={() => handleDelete(driver.id)}>Delete</button>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default AdminDriverManagement;