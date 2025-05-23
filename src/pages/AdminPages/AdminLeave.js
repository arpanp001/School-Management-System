import React, { useState, useEffect } from 'react';
import { db } from '../../firebase/config';
import { collection, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { toast } from 'react-toastify';
import emailjs from '@emailjs/browser';
import '../../pages/AdminPagesStyle/AdminLeave.css';

// Component for filter and search controls
const LeaveFilter = ({ statusFilter, setStatusFilter, searchEmail, setSearchEmail }) => (
    <div className="filter-container">
        <div className="form-group">
            <label className="form-label">Search by Email</label>
            <input
                type="text"
                className="form-input"
                placeholder="Enter teacher email"
                value={searchEmail}
                onChange={(e) => setSearchEmail(e.target.value)}
            />
        </div>
        <div className="form-group">
            <label className="form-label">Filter by Status</label>
            <select
                className="form-input"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
            >
                <option value="All">All</option>
                <option value="Pending">Pending</option>
                <option value="Approved">Approved</option>
                <option value="Rejected">Rejected</option>
            </select>
        </div>
    </div>
);

// Component for the leave requests table
const LeaveTable = ({
    leaveRequests,
    adminRemarks,
    setAdminRemarks,
    handleAction,
    currentPage,
    itemsPerPage,
    totalPages,
    paginate
}) => (
    <div className="table-container">
        <table className="leave-table">
            <thead>
                <tr>
                    <th>Teacher Email</th>
                    <th>Leave Type</th>
                    <th>Reason</th>
                    <th>Start Date</th>
                    <th>End Date</th>
                    <th>Status</th>
                    <th>Admin Remarks</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
                {leaveRequests.map((request) => (
                    <tr key={request.id}>
                        <td>{request.teacherEmail || 'N/A'}</td>
                        <td>{request.leaveType || 'N/A'}</td>
                        <td>{request.reason || 'N/A'}</td>
                        <td>{request.startDate ? new Date(request.startDate).toLocaleDateString() : 'N/A'}</td>
                        <td>{request.endDate ? new Date(request.endDate).toLocaleDateString() : 'N/A'}</td>
                        <td>
                            <span
                                className={`status-badge ${request.status === 'Approved'
                                        ? 'status-approved'
                                        : request.status === 'Rejected'
                                            ? 'status-rejected'
                                            : 'status-pending'
                                    }`}
                            >
                                {request.status || 'Pending'}
                            </span>
                        </td>
                        <td>
                            {request.status === 'Pending' ? (
                                <textarea
                                    className="form-input"
                                    value={adminRemarks[request.id] || ''}
                                    onChange={(e) =>
                                        setAdminRemarks((prev) => ({ ...prev, [request.id]: e.target.value }))
                                    }
                                    placeholder="Add remarks"
                                    rows="2"
                                />
                            ) : (
                                request.adminRemarks || 'N/A'
                            )}
                        </td>
                        <td>
                            {request.status === 'Pending' && (
                                <div className="action-buttons">
                                    <button
                                        className="btn btn-approve"
                                        onClick={() => handleAction(request.id, 'Approved')}
                                    >
                                        Approve
                                    </button>
                                    <button
                                        className="btn btn-reject"
                                        onClick={() => handleAction(request.id, 'Rejected')}
                                    >
                                        Reject
                                    </button>
                                </div>
                            )}
                        </td>
                    </tr>
                ))}
                {leaveRequests.length === 0 && (
                    <tr>
                        <td colSpan="8" className="no-data">
                            No leave requests found
                        </td>
                    </tr>
                )}
            </tbody>
        </table>
        {leaveRequests.length > itemsPerPage && (
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
                            key={i + 1}
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

const AdminLeave = () => {
    // State management
    const [leaveRequests, setLeaveRequests] = useState([]);
    const [adminRemarks, setAdminRemarks] = useState({});
    const [statusFilter, setStatusFilter] = useState('All');
    const [searchEmail, setSearchEmail] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(10);

    // Data fetching with real-time updates
    useEffect(() => {
        const unsubscribe = onSnapshot(
            collection(db, 'leave-requests'),
            (snapshot) => {
                const requests = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
                setLeaveRequests(requests);
            },
            (error) => {
                console.error('Error fetching leave requests:', error);
                toast.error('Failed to load leave requests');
            }
        );

        return () => unsubscribe();
    }, []);

    // Email notification for leave decision
    const sendDecisionEmail = async (request, status, adminRemarks) => {
        const templateParams = {
            to_email: request.teacherEmail,
            to_name: request.teacherEmail.split('@')[0],
            leave_type: request.leaveType || 'N/A',
            start_date: request.startDate ? new Date(request.startDate).toLocaleDateString() : 'N/A',
            end_date: request.endDate ? new Date(request.endDate).toLocaleDateString() : 'N/A',
            status: status,
            admin_remarks: adminRemarks || 'No remarks provided',
            from_name: 'School Admin',
        };

        try {
            await emailjs.send(
                'service_l0fenxj', // Replace with your EmailJS service ID
                'template_tdsymj8', // Replace with your EmailJS template ID
                templateParams,
                'sss-GrBLqM_2bdune' // Replace with your EmailJS public key
            );
            toast.success(`Decision email sent to ${request.teacherEmail}`);
        } catch (error) {
            console.error('Error sending decision email:', error);
            toast.error('Failed to send decision email: ' + (error.text || error.message));
        }
    };

    // Handle approve/reject actions
    const handleAction = async (requestId, status) => {
        try {
            const leaveDoc = doc(db, 'leave-requests', requestId);
            const request = leaveRequests.find((req) => req.id === requestId);
            const remarks = adminRemarks[requestId] || '';

            await updateDoc(leaveDoc, {
                status,
                adminRemarks: remarks,
                updatedAt: new Date().toISOString(),
            });

            await sendDecisionEmail(request, status, remarks);

            toast.success(`Leave request ${status.toLowerCase()} successfully!`);
            setAdminRemarks((prev) => ({ ...prev, [requestId]: '' }));
        } catch (error) {
            console.error(`Error updating leave request:`, error);
            toast.error(`Failed to ${status.toLowerCase()} leave request`);
        }
    };

    // Filter and search logic
    const filteredRequests = leaveRequests.filter((request) => {
        const matchesStatus = statusFilter === 'All' || request.status === statusFilter;
        const email =
            request.teacherEmail && typeof request.teacherEmail === 'string'
                ? request.teacherEmail.toLowerCase()
                : '';
        const matchesEmail = email.includes(searchEmail.toLowerCase());
        return matchesStatus && matchesEmail;
    });

    // Pagination calculations
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = filteredRequests.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(filteredRequests.length / itemsPerPage);

    const paginate = (pageNumber) => setCurrentPage(pageNumber);

    return (
        <div className="container">
            <h2 className="page-title">Manage Leave Requests</h2>
            <LeaveFilter
                statusFilter={statusFilter}
                setStatusFilter={setStatusFilter}
                searchEmail={searchEmail}
                setSearchEmail={setSearchEmail}
            />
            <div className="table-wrapper">
                <LeaveTable
                    leaveRequests={currentItems}
                    adminRemarks={adminRemarks}
                    setAdminRemarks={setAdminRemarks}
                    handleAction={handleAction}
                    currentPage={currentPage}
                    itemsPerPage={itemsPerPage}
                    totalPages={totalPages}
                    paginate={paginate}
                />
            </div>
        </div>
    );
};

export default AdminLeave;