// pages/AdminPages/AdminBuses.js
import React, { useState, useEffect } from 'react';
import { createBus, updateBus, deleteBus, subscribeToTransportData } from '../AdminPages/transportFunctions';
import { toast } from 'react-toastify';
import '../../pages/AdminPagesStyle/AdminBuses.css';

const AdminBuses = () => {
    const [buses, setBuses] = useState([]);
    const [busData, setBusData] = useState({ busNumber: '', capacity: '', model: '' });
    const [editingBus, setEditingBus] = useState(null);

    useEffect(() => {
        const unsubscribe = subscribeToTransportData('buses', (busList) => {
            setBuses(busList);
        });
        return () => unsubscribe();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingBus) {
                await updateBus(editingBus.id, busData);
                toast.success('Bus updated successfully!');
                setEditingBus(null);
            } else {
                await createBus(busData);
                toast.success('Bus created successfully!');
            }
            setBusData({ busNumber: '', capacity: '', model: '' });
        } catch (error) {
            toast.error(error.message);
        }
    };

    const handleEdit = (bus) => {
        setEditingBus(bus);
        setBusData({ busNumber: bus.busNumber, capacity: bus.capacity, model: bus.model });
    };

    const handleDelete = async (busId) => {
        if (window.confirm('Are you sure you want to delete this bus?')) {
            try {
                await deleteBus(busId);
                toast.success('Bus deleted successfully!');
            } catch (error) {
                toast.error(error.message);
            }
        }
    };

    return (
        <div className="admin-buses">
            <h2>Bus Management</h2>
            <form onSubmit={handleSubmit}>
                <input
                    type="text"
                    placeholder="Bus Number"
                    value={busData.busNumber}
                    onChange={(e) => setBusData({ ...busData, busNumber: e.target.value })}
                    required
                />
                <input
                    type="number"
                    placeholder="Capacity"
                    value={busData.capacity}
                    onChange={(e) => setBusData({ ...busData, capacity: e.target.value })}
                    required
                />
                <input
                    type="text"
                    placeholder="Model"
                    value={busData.model}
                    onChange={(e) => setBusData({ ...busData, model: e.target.value })}
                    required
                />
                <button type="submit">{editingBus ? 'Update Bus' : 'Add Bus'}</button>
                {editingBus && (
                    <button
                        type="button"
                        onClick={() => {
                            setEditingBus(null);
                            setBusData({ busNumber: '', capacity: '', model: '' });
                        }}
                    >
                        Cancel
                    </button>
                )}
            </form>

            <div className="bus-list">
                {buses.map(bus => (
                    <div key={bus.id} className="bus-item">
                        <p>Bus Number: {bus.busNumber}</p>
                        <p>Capacity: {bus.capacity}</p>
                        <p>Model: {bus.model}</p>
                        <button className="edit" onClick={() => handleEdit(bus)}>Edit</button>
                        <button className="delete" onClick={() => handleDelete(bus.id)}>Delete</button>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default AdminBuses;