import React, { useState, useEffect } from 'react';
import { db } from '../../firebase/config';
import { collection, query, orderBy, onSnapshot, getDocs, updateDoc, doc } from 'firebase/firestore';
import { toast } from 'react-toastify';
import '../../pages/AdminPagesStyle/AdminTeacherAttendance.css';

const AdminTeacherAttendance = () => {
    const [attendanceData, setAttendanceData] = useState([]);
    const [viewMode, setViewMode] = useState('daily');
    const [filterTeacher, setFilterTeacher] = useState('');
    const [filterDate, setFilterDate] = useState('');
    const [teachers, setTeachers] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(10);
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [selectedRecord, setSelectedRecord] = useState(null);
    const [editedData, setEditedData] = useState({});

    const fetchTeachers = async () => {
        try {
            const teacherQuery = query(collection(db, 'teacherLog'));
            const teacherSnapshot = await getDocs(teacherQuery);
            const teacherList = teacherSnapshot.docs.map(doc => ({
                id: doc.id,
                email: doc.data().email
            }));
            setTeachers(teacherList);
        } catch (error) {
            toast.error('Error fetching teachers: ' + error.message);
        }
    };

    useEffect(() => {
        fetchTeachers();

        const fetchAttendanceData = () => {
            try {
                const q = query(collection(db, 'teacherAttendance'), orderBy('timestamp', 'desc'));
                const unsubscribe = onSnapshot(q, (snapshot) => {
                    const allAttendance = snapshot.docs.map(doc => ({
                        id: doc.id,
                        ...doc.data()
                    }));

                    const filteredData = allAttendance.filter(attendance => {
                        const attendanceDate = new Date(attendance.timestamp);
                        const now = new Date();

                        // If a specific date filter is applied, show records for that exact date
                        if (filterDate) {
                            const selectedDate = new Date(filterDate);
                            return (
                                attendanceDate.getFullYear() === selectedDate.getFullYear() &&
                                attendanceDate.getMonth() === selectedDate.getMonth() &&
                                attendanceDate.getDate() === selectedDate.getDate()
                            );
                        }

                        // View mode filtering when no specific date is selected
                        if (viewMode === 'daily') {
                            return attendanceDate.toDateString() === now.toDateString();
                        }
                        if (viewMode === 'weekly') {
                            const weekStart = new Date(now.setDate(now.getDate() - now.getDay()));
                            return attendanceDate >= weekStart;
                        }
                        if (viewMode === 'monthly') {
                            return (
                                attendanceDate.getMonth() === now.getMonth() &&
                                attendanceDate.getFullYear() === now.getFullYear()
                            );
                        }
                        return true;
                    }).filter(attendance =>
                        filterTeacher ? attendance.teacherId === filterTeacher : true
                    );

                    setAttendanceData(filteredData);
                    setCurrentPage(1);
                }, (error) => {
                    toast.error('Error fetching attendance data: ' + error.message);
                });

                return unsubscribe;
            } catch (error) {
                toast.error('Error setting up real-time listener: ' + error.message);
            }
        };

        const unsubscribe = fetchAttendanceData();
        return () => unsubscribe && unsubscribe();
    }, [viewMode, filterTeacher, filterDate]);

    const paginate = (pageNumber) => setCurrentPage(pageNumber);

    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = attendanceData.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(attendanceData.length / itemsPerPage);

    const openEditModal = (record) => {
        setSelectedRecord(record);
        setEditedData({
            timestamp: new Date(record.timestamp).toISOString().slice(0, 16),
            punchType: record.punchType,
            punchCategory: record.punchCategory || 'main',
            status: record.status,
            workHours: record.workHours || ''
        });
        setEditModalOpen(true);
    };

    const handleEditChange = (e) => {
        const { name, value } = e.target;
        setEditedData(prev => ({ ...prev, [name]: value }));
    };

    const saveEditedRecord = async () => {
        try {
            const updatedData = {
                ...selectedRecord,
                timestamp: new Date(editedData.timestamp).toISOString(),
                punchType: editedData.punchType,
                punchCategory: editedData.punchCategory,
                status: editedData.status,
                workHours: editedData.workHours ? parseFloat(editedData.workHours) : null
            };

            await updateDoc(doc(db, 'teacherAttendance', selectedRecord.id), updatedData);
            toast.success('Attendance record updated successfully!');
            setEditModalOpen(false);
            setSelectedRecord(null);
        } catch (error) {
            toast.error('Error updating record: ' + error.message);
        }
    };

    return (
        <div className="admin-teacher-attendance-container">
            <h2>Teacher Attendance Management</h2>

            {/* Filters */}
            <div className="filters-section">
                <h4>Filters</h4>
                <div className="filter-row">
                    <div className="filter-group">
                        <label htmlFor="viewMode" className="form-label">View Mode</label>
                        <div className="btn-group">
                            <button className={`btn btn-outline-primary ${viewMode === 'daily' ? 'active' : ''}`} onClick={() => setViewMode('daily')}>Daily</button>
                            <button className={`btn btn-outline-primary ${viewMode === 'weekly' ? 'active' : ''}`} onClick={() => setViewMode('weekly')}>Weekly</button>
                            <button className={`btn btn-outline-primary ${viewMode === 'monthly' ? 'active' : ''}`} onClick={() => setViewMode('monthly')}>Monthly</button>
                        </div>
                    </div>
                    <div className="filter-group">
                        <label htmlFor="teacherFilter" className="form-label">Teacher</label>
                        <select id="teacherFilter" className="form-select" value={filterTeacher} onChange={(e) => setFilterTeacher(e.target.value)}>
                            <option value="">All Teachers</option>
                            {teachers.map(teacher => (
                                <option key={teacher.id} value={teacher.id}>{teacher.email}</option>
                            ))}
                        </select>
                    </div>
                    <div className="filter-group">
                        <label htmlFor="dateFilter" className="form-label">Date</label>
                        <input type="date" id="dateFilter" className="form-control" value={filterDate} onChange={(e) => setFilterDate(e.target.value)} />
                    </div>
                </div>
            </div>

            {/* Attendance Table */}
            <div className="table-section">
                <h4>Attendance Records {filterDate ? `for ${new Date(filterDate).toLocaleDateString()}` : ''}</h4>
                <div className="table-container">
                    <table className="attendance-table">
                        <thead>
                            <tr>
                                <th>Teacher Email</th>
                                <th>Date</th>
                                <th>Category</th>
                                <th>Type</th>
                                <th>Time</th>
                                <th>Status</th>
                                <th>Work Hours</th>
                                <th>Image</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {currentItems.map(attendance => (
                                <tr key={attendance.id}>
                                    <td data-label="Teacher Email">{attendance.email}</td>
                                    <td data-label="Date">{new Date(attendance.timestamp).toLocaleDateString()}</td>
                                    <td data-label="Category">{attendance.punchCategory || 'main'}</td>
                                    <td data-label="Type">{attendance.punchType}</td>
                                    <td data-label="Time">{new Date(attendance.timestamp).toLocaleTimeString()}</td>
                                    <td data-label="Status">{attendance.status}</td>
                                    <td data-label="Work Hours">{attendance.workHours || '-'}</td>
                                    <td data-label="Image">
                                        <img src={attendance.image} alt="Punch Capture" className="attendance-image" />
                                    </td>
                                    <td data-label="Actions">
                                        <button className="btn btn-edit" onClick={() => openEditModal(attendance)}>Edit</button>
                                    </td>
                                </tr>
                            ))}
                            {currentItems.length === 0 && (
                                <tr>
                                    <td colSpan="9" className="no-records">No attendance records found</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {attendanceData.length > itemsPerPage && (
                    <nav className="pagination-nav">
                        <ul className="pagination">
                            <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                                <button className="page-link" onClick={() => paginate(currentPage - 1)}>Previous</button>
                            </li>
                            {Array.from({ length: totalPages }, (_, i) => (
                                <li key={i + 1} className={`page-item ${currentPage === i + 1 ? 'active' : ''}`}>
                                    <button className="page-link" onClick={() => paginate(i + 1)}>{i + 1}</button>
                                </li>
                            ))}
                            <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                                <button className="page-link" onClick={() => paginate(currentPage + 1)}>Next</button>
                            </li>
                        </ul>
                    </nav>
                )}
            </div>

            {/* Edit Modal */}
            {editModalOpen && (
                <div className="modal-overlay">
                    <div className="modal-container">
                        <div className="modal-header">
                            <h5 className="modal-title">Edit Attendance Record</h5>
                            <button type="button" className="modal-close-btn" onClick={() => setEditModalOpen(false)} aria-label="Close">
                                ×
                            </button>
                        </div>
                        <div className="modal-body">
                            <div className="modal-form-group">
                                <label className="form-label" htmlFor="timestamp">Timestamp</label>
                                <input
                                    type="datetime-local"
                                    id="timestamp"
                                    className="form-control"
                                    name="timestamp"
                                    value={editedData.timestamp}
                                    onChange={handleEditChange}
                                />
                            </div>
                            <div className="modal-form-group">
                                <label className="form-label" htmlFor="punchType">Punch Type</label>
                                <select
                                    id="punchType"
                                    className="form-select"
                                    name="punchType"
                                    value={editedData.punchType}
                                    onChange={handleEditChange}
                                >
                                    <option value="in">In</option>
                                    <option value="out">Out</option>
                                </select>
                            </div>
                            <div className="modal-form-group">
                                <label className="form-label" htmlFor="punchCategory">Category</label>
                                <select
                                    id="punchCategory"
                                    className="form-select"
                                    name="punchCategory"
                                    value={editedData.punchCategory}
                                    onChange={handleEditChange}
                                >
                                    <option value="main">Main</option>
                                    <option value="break">Break</option>
                                </select>
                            </div>
                            <div className="modal-form-group">
                                <label className="form-label" htmlFor="status">Status</label>
                                <select
                                    id="status"
                                    className="form-select"
                                    name="status"
                                    value={editedData.status}
                                    onChange={handleEditChange}
                                >
                                    <option value="Present">Present</option>
                                    <option value="Half-Day">Half-Day</option>
                                    <option value="Invalid">Invalid</option>
                                    <option value="Early Exit">Early Exit</option>
                                    <option value="Normal">Normal</option>
                                    <option value="Overtime">Overtime</option>
                                </select>
                            </div>
                            <div className="modal-form-group">
                                <label className="form-label" htmlFor="workHours">Work Hours (optional)</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    id="workHours"
                                    className="form-control"
                                    name="workHours"
                                    value={editedData.workHours}
                                    onChange={handleEditChange}
                                    placeholder="Enter hours (e.g., 2.50)"
                                />
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button type="button" className="btn btn-cancel" onClick={() => setEditModalOpen(false)}>Cancel</button>
                            <button type="button" className="btn btn-save" onClick={saveEditedRecord}>Save</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminTeacherAttendance;