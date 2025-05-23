// pages/AdminPages/AdminRoutes.js
import React, { useState, useEffect } from 'react';
import { createRoute, updateRoute, deleteRoute, subscribeToTransportData } from '../AdminPages/transportFunctions';
import { toast } from 'react-toastify';
import '../../pages/AdminPagesStyle/AdminRoutes.css';

const AdminRoutes = () => {
    const [routes, setRoutes] = useState([]);
    const [routeData, setRouteData] = useState({ routeName: '', startPoint: '', endPoint: '', stops: '' });
    const [editingRoute, setEditingRoute] = useState(null);

    useEffect(() => {
        const unsubscribe = subscribeToTransportData('routes', (routeList) => {
            setRoutes(routeList);
        });
        return () => unsubscribe();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const routeToSave = { ...routeData, stops: routeData.stops.split(',').map(stop => stop.trim()) };
            if (editingRoute) {
                await updateRoute(editingRoute.id, routeToSave);
                toast.success('Route updated successfully!');
                setEditingRoute(null);
            } else {
                await createRoute(routeToSave);
                toast.success('Route created successfully!');
            }
            setRouteData({ routeName: '', startPoint: '', endPoint: '', stops: '' });
        } catch (error) {
            toast.error(error.message);
        }
    };

    const handleEdit = (route) => {
        setEditingRoute(route);
        setRouteData({
            routeName: route.routeName,
            startPoint: route.startPoint,
            endPoint: route.endPoint,
            stops: route.stops.join(', ')
        });
    };

    const handleDelete = async (routeId) => {
        if (window.confirm('Are you sure you want to delete this route?')) {
            try {
                await deleteRoute(routeId);
                toast.success('Route deleted successfully!');
            } catch (error) {
                toast.error(error.message);
            }
        }
    };

    return (
        <div className="admin-routes">
            <h2>Route Management</h2>
            <form onSubmit={handleSubmit}>
                <input
                    type="text"
                    placeholder="Route Name"
                    value={routeData.routeName}
                    onChange={(e) => setRouteData({ ...routeData, routeName: e.target.value })}
                    required
                />
                <input
                    type="text"
                    placeholder="Start Point"
                    value={routeData.startPoint}
                    onChange={(e) => setRouteData({ ...routeData, startPoint: e.target.value })}
                    required
                />
                <input
                    type="text"
                    placeholder="End Point"
                    value={routeData.endPoint}
                    onChange={(e) => setRouteData({ ...routeData, endPoint: e.target.value })}
                    required
                />
                <textarea
                    placeholder="Stops (comma-separated)"
                    value={routeData.stops}
                    onChange={(e) => setRouteData({ ...routeData, stops: e.target.value })}
                    required
                />
                <button type="submit">{editingRoute ? 'Update Route' : 'Add Route'}</button>
                {editingRoute && (
                    <button
                        type="button"
                        onClick={() => {
                            setEditingRoute(null);
                            setRouteData({ routeName: '', startPoint: '', endPoint: '', stops: '' });
                        }}
                    >
                        Cancel
                    </button>
                )}
            </form>

            <div className="route-list">
                {routes.map(route => (
                    <div key={route.id} className="route-item">
                        <p>Route: {route.routeName}</p>
                        <p>{route.startPoint} to {route.endPoint}</p>
                        <p>Stops: {route.stops.join(', ')}</p>
                        <button className="edit" onClick={() => handleEdit(route)}>Edit</button>
                        <button className="delete" onClick={() => handleDelete(route.id)}>Delete</button>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default AdminRoutes;