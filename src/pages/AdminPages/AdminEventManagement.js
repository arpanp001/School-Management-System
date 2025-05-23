import React, { useState, useEffect } from 'react';
import { db } from '../../firebase/config'; // Adjust path
import { collection, addDoc, onSnapshot, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { toast } from 'react-toastify';
import '../../pages/AdminPagesStyle/AdminEventManagement.css';

// Component for the event form
const EventForm = ({ form, setForm, handleSubmit, editingEvent }) => (
    <form onSubmit={handleSubmit} className="event-form">
        <div className="form-row">
            <div className="form-group">
                <label className="form-label">Event Name</label>
                <input
                    type="text"
                    className="form-input"
                    placeholder="Event Name"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    required
                />
            </div>
            <div className="form-group">
                <label className="form-label">Type</label>
                <select
                    className="form-input"
                    value={form.type}
                    onChange={(e) => setForm({ ...form, type: e.target.value })}
                    required
                >
                    <option value="">Select Type</option>
                    <option value="Holiday">Holiday</option>
                    <option value="Festival">Festival</option>
                    <option value="School Function">School Function</option>
                </select>
            </div>
            <div className="form-group">
                <label className="form-label">Date</label>
                <input
                    type="date"
                    className="form-input"
                    value={form.date}
                    onChange={(e) => setForm({ ...form, date: e.target.value })}
                    required
                />
            </div>
            <div className="form-group form-buttons">
                <button type="submit" className="btn btn-primary">
                    {editingEvent ? 'Update Event' : 'Add Event'}
                </button>
            </div>
        </div>
        <div className="form-group">
            <label className="form-label">Description</label>
            <textarea
                className="form-input"
                placeholder="Description"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                required
            />
        </div>
    </form>
);

// Component for the filter control
const EventFilter = ({ filter, setFilter }) => (
    <div className="filter-container">
        <div className="form-group">
            <label className="form-label">Filter by Type:</label>
            <select
                className="form-input"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
            >
                <option value="All">All</option>
                <option value="Holiday">Holidays</option>
                <option value="Festival">Festivals</option>
                <option value="School Function">School Functions</option>
            </select>
        </div>
    </div>
);

// Component for the event table
const EventTable = ({
    currentEvents,
    handleEdit,
    handleDelete,
    currentPage,
    totalPages,
    paginate,
}) => (
    <div className="table-wrapper">
        <div className="table-container">
            <table className="event-table">
                <thead>
                    <tr>
                        <th>Name</th>
                        <th>Type</th>
                        <th>Date</th>
                        <th>Description</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {currentEvents.map((event) => (
                        <tr key={event.id}>
                            <td>{event.name}</td>
                            <td>{event.type}</td>
                            <td>{new Date(event.date).toLocaleDateString()}</td>
                            <td>{event.description}</td>
                            <td>
                                <button
                                    className="btn btn-edit"
                                    onClick={() => handleEdit(event)}
                                >
                                    Edit
                                </button>
                                <button
                                    className="btn btn-delete"
                                    onClick={() => handleDelete(event.id)}
                                >
                                    Delete
                                </button>
                            </td>
                        </tr>
                    ))}
                    {currentEvents.length === 0 && (
                        <tr>
                            <td colSpan="5" className="no-data">
                                No events found
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
        {totalPages > 1 && (
            <nav className="pagination-container">
                <ul className="pagination">
                    <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                        <button
                            className="page-link"
                            onClick={() => paginate(currentPage - 1)}
                        >
                            Previous
                        </button>
                    </li>
                    {Array.from({ length: totalPages }, (_, i) => (
                        <li
                            key={i}
                            className={`page-item ${currentPage === i + 1 ? 'active' : ''}`}
                        >
                            <button
                                className="page-link"
                                onClick={() => paginate(i + 1)}
                            >
                                {i + 1}
                            </button>
                        </li>
                    ))}
                    <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                        <button
                            className="page-link"
                            onClick={() => paginate(currentPage + 1)}
                        >
                            Next
                        </button>
                    </li>
                </ul>
            </nav>
        )}
    </div>
);

const AdminEventManagement = () => {
    // State management
    const [events, setEvents] = useState([]);
    const [filteredEvents, setFilteredEvents] = useState([]);
    const [form, setForm] = useState({ name: '', type: '', date: '', description: '' });
    const [editingEvent, setEditingEvent] = useState(null);
    const [filter, setFilter] = useState('All');
    const [currentPage, setCurrentPage] = useState(1);
    const [eventsPerPage] = useState(5); // You can adjust this number

    // Real-time data fetching
    useEffect(() => {
        const unsubscribe = onSnapshot(collection(db, 'events'), (snapshot) => {
            const eventsData = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
            setEvents(eventsData);
            setFilteredEvents(eventsData);
        }, (error) => {
            console.error('Error fetching events:', error);
            toast.error('Failed to load events');
        });
        return () => unsubscribe();
    }, []);

    // Filter effect
    useEffect(() => {
        if (filter === 'All') {
            setFilteredEvents(events);
        } else {
            setFilteredEvents(events.filter((event) => event.type === filter));
        }
        setCurrentPage(1); // Reset to first page when filter changes
    }, [filter, events]);

    // Pagination calculations
    const indexOfLastEvent = currentPage * eventsPerPage;
    const indexOfFirstEvent = indexOfLastEvent - eventsPerPage;
    const currentEvents = filteredEvents.slice(indexOfFirstEvent, indexOfLastEvent);
    const totalPages = Math.ceil(filteredEvents.length / eventsPerPage);

    const paginate = (pageNumber) => setCurrentPage(pageNumber);

    // Form submission handler
    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingEvent) {
                const eventRef = doc(db, 'events', editingEvent.id);
                await updateDoc(eventRef, {
                    ...form,
                    date: new Date(form.date).toISOString(),
                    updatedAt: new Date().toISOString(),
                });
                toast.success('Event updated successfully!');
                setEditingEvent(null);
            } else {
                await addDoc(collection(db, 'events'), {
                    ...form,
                    date: new Date(form.date).toISOString(),
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                });
                toast.success('Event added successfully!');
            }
            setForm({ name: '', type: '', date: '', description: '' });
        } catch (error) {
            console.error('Error saving event:', error);
            toast.error('Failed to save event');
        }
    };

    // Edit handler
    const handleEdit = (event) => {
        setEditingEvent(event);
        setForm({
            name: event.name,
            type: event.type,
            date: new Date(event.date).toISOString().split('T')[0],
            description: event.description,
        });
    };

    // Delete handler
    const handleDelete = async (eventId) => {
        if (window.confirm('Are you sure you want to delete this event?')) {
            try {
                await deleteDoc(doc(db, 'events', eventId));
                toast.success('Event deleted successfully!');
            } catch (error) {
                console.error('Error deleting event:', error);
                toast.error('Failed to delete event');
            }
        }
    };

    return (
        <div className="container">
            <h2 className="page-title">Yearly Event Management</h2>
            <EventForm
                form={form}
                setForm={setForm}
                handleSubmit={handleSubmit}
                editingEvent={editingEvent}
            />
            <EventFilter filter={filter} setFilter={setFilter} />
            <div className="table-wrapper">
                <EventTable
                    currentEvents={currentEvents}
                    handleEdit={handleEdit}
                    handleDelete={handleDelete}
                    currentPage={currentPage}
                    totalPages={totalPages}
                    paginate={paginate}
                />
            </div>
        </div>
    );
};

export default AdminEventManagement;