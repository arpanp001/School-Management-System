import React, { useState, useEffect } from 'react';
import { db, auth } from '../../firebase/config';
import { collection, addDoc, onSnapshot, query, where } from 'firebase/firestore';
import { toast } from 'react-toastify';
import emailjs from '@emailjs/browser';
import '../../pages/TeacherPagesStyle/TeacherLeave.css';

// Initialize EmailJS with your user ID
emailjs.init('sss-GrBLqM_2bdune');

// Component for displaying loading or no-requests message
const LoadingMessage = ({ message }) => (
    <div className="leave-message">
        {message}
    </div>
);

// Component for the leave request form
const LeaveRequestForm = ({
    leaveType,
    setLeaveType,
    reason,
    setReason,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    handleSubmit,
    loading,
    dateError,
}) => (
    <form className="leave-form" onSubmit={handleSubmit}>
        <div className="leave-form-group">
            <label className="leave-form-label">Leave Type</label>
            <select
                className="leave-form-select"
                value={leaveType}
                onChange={(e) => setLeaveType(e.target.value)}
                required
            >
                <option value="">Select Leave Type</option>
                <option value="Sick">Sick Leave</option>
                <option value="Casual">Casual Leave</option>
                <option value="Emergency">Emergency Leave</option>
            </select>
        </div>
        <div className="leave-form-group">
            <label className="leave-form-label">Reason</label>
            <textarea
                className="leave-form-textarea"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                required
                placeholder="Enter reason for leave"
            />
        </div>
        <div className="leave-form-group">
            <label className="leave-form-label">Start Date</label>
            <input
                type="date"
                className="leave-form-input"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
            />
        </div>
        <div className="leave-form-group">
            <label className="leave-form-label">End Date</label>
            <input
                type="date"
                className="leave-form-input"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                required
            />
            {dateError && <span className="leave-form-error">{dateError}</span>}
        </div>
        <button
            type="submit"
            className="leave-form-button"
            disabled={loading || dateError}
        >
            {loading ? 'Submitting...' : 'Submit Leave Request'}
        </button>
    </form>
);

// Component for the leave requests table
const LeaveRequestsTable = ({ currentRequests, renderStatusBadge }) => (
    <div className="leave-table-wrapper">
        <table className="leave-table">
            <thead>
                <tr>
                    <th>Leave Type</th>
                    <th>Reason</th>
                    <th>Start Date</th>
                    <th>End Date</th>
                    <th>Status</th>
                </tr>
            </thead>
            <tbody>
                {currentRequests.length === 0 ? (
                    <tr>
                        <td colSpan="5" className="leave-table-empty">
                            No leave requests found
                        </td>
                    </tr>
                ) : (
                    currentRequests.map((request) => (
                        <tr key={request.id}>
                            <td>{request.leaveType}</td>
                            <td>{request.reason}</td>
                            <td>{new Date(request.startDate).toLocaleDateString()}</td>
                            <td>{new Date(request.endDate).toLocaleDateString()}</td>
                            <td>{renderStatusBadge(request.status)}</td>
                        </tr>
                    ))
                )}
            </tbody>
        </table>
    </div>
);

// Component for pagination controls
const PaginationControls = ({ currentPage, totalPages, paginate, loading }) => (
    <nav className="leave-pagination">
        <button
            className="leave-pagination-button"
            onClick={() => paginate(currentPage - 1)}
            disabled={currentPage === 1 || loading}
        >
            Previous
        </button>
        {Array.from({ length: totalPages }, (_, i) => (
            <button
                key={i}
                className={`leave-pagination-button ${currentPage === i + 1 ? 'active' : ''}`}
                onClick={() => paginate(i + 1)}
                disabled={loading}
            >
                {i + 1}
            </button>
        ))}
        <button
            className="leave-pagination-button"
            onClick={() => paginate(currentPage + 1)}
            disabled={currentPage === totalPages || loading}
        >
            Next
        </button>
    </nav>
);

const TeacherLeave = () => {
    // State management
    const [leaveType, setLeaveType] = useState('');
    const [reason, setReason] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [leaveRequests, setLeaveRequests] = useState([]);
    const [loading, setLoading] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [requestsPerPage] = useState(5);
    const [dateError, setDateError] = useState('');
    const teacherId = auth.currentUser?.uid;
    const teacherEmail = auth.currentUser?.email;

    // Helper functions
    const validateDateRange = () => {
        if (!startDate || !endDate) return ''; // No validation if either date is empty
        const start = new Date(startDate);
        const end = new Date(endDate);
        if (end < start) {
            return 'End date must be after start date';
        }
        return '';
    };

    const sendSubmissionEmail = async () => {
        const adminEmail = 'pawararpan1322@gmail.com';

        if (!teacherEmail) {
            console.error('Teacher email is not available');
            toast.error('Unable to send email: Teacher email not found');
            return;
        }

        console.log('Sending leave request submission email to:', adminEmail);

        const templateParams = {
            admin_email: adminEmail,
            teacher_email: teacherEmail,
            leave_type: leaveType,
            start_date: startDate ? new Date(startDate).toLocaleDateString() : 'N/A',
            end_date: endDate ? new Date(endDate).toLocaleDateString() : 'N/A',
            reason: reason,
            from_name: 'School System',
        };

        console.log('EmailJS template params:', templateParams);

        try {
            const response = await emailjs.send(
                'service_l0fenxj',
                'template_4hqp896',
                templateParams
            );
            console.log('Submission email sent successfully:', response);
            toast.success(`Leave request notification sent to admin (${adminEmail})`);
        } catch (error) {
            console.error('Error sending submission email:', error);
            console.error('Error details:', error.text || error.message);
            toast.error(`Failed to send leave request notification: ${error.text || error.message}`);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const error = validateDateRange();
        setDateError(error);

        if (!teacherId || !teacherEmail || error) {
            if (error) {
                toast.error(error);
            } else {
                toast.error('User authentication failed. Please log in again.');
            }
            return;
        }

        setLoading(true);

        try {
            const docRef = await addDoc(collection(db, 'leave-requests'), {
                teacherId,
                teacherEmail,
                leaveType,
                reason,
                startDate,
                endDate,
                status: 'Pending',
                createdAt: new Date().toISOString(),
            });

            console.log('Leave request submitted with ID:', docRef.id);

            await sendSubmissionEmail();

            toast.success('Leave request submitted successfully!');
            setLeaveType('');
            setReason('');
            setStartDate('');
            setEndDate('');
            setDateError(''); // Clear error on successful submission
        } catch (error) {
            console.error('Error submitting leave request:', error);
            toast.error('Failed to submit leave request: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const renderStatusBadge = (status) => (
        <span
            className={`leave-status-badge ${status === 'Approved'
                    ? 'leave-status-success'
                    : status === 'Rejected'
                        ? 'leave-status-danger'
                        : 'leave-status-warning'
                }`}
        >
            {status}
        </span>
    );

    // Pagination logic
    const indexOfLastRequest = currentPage * requestsPerPage;
    const indexOfFirstRequest = indexOfLastRequest - requestsPerPage;
    const currentRequests = leaveRequests.slice(indexOfFirstRequest, indexOfLastRequest);
    const totalPages = Math.ceil(leaveRequests.length / requestsPerPage);

    const paginate = (pageNumber) => setCurrentPage(pageNumber);

    // Real-time data subscription
    useEffect(() => {
        if (!teacherId) return;

        const q = query(collection(db, 'leave-requests'), where('teacherId', '==', teacherId));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const requests = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setLeaveRequests(requests);
            setCurrentPage(1);
        }, (error) => {
            console.error('Error fetching leave requests:', error);
            toast.error('Failed to load leave requests');
        });

        return () => unsubscribe();
    }, [teacherId]);

    // Render states
    if (!teacherId) {
        return (
            <div className="leave-container">
                <h2 className="leave-title">Leave Requests</h2>
                <LoadingMessage message="Please log in to view leave requests" />
            </div>
        );
    }

    return (
        <div className="leave-container">
            <h2 className="leave-title">Leave Requests</h2>
            <LeaveRequestForm
                leaveType={leaveType}
                setLeaveType={setLeaveType}
                reason={reason}
                setReason={setReason}
                startDate={startDate}
                setStartDate={setStartDate}
                endDate={endDate}
                setEndDate={setEndDate}
                handleSubmit={handleSubmit}
                loading={loading}
                dateError={dateError}
            />
            <h3 className="leave-subtitle">Your Leave Requests</h3>
            <LeaveRequestsTable
                currentRequests={currentRequests}
                renderStatusBadge={renderStatusBadge}
            />
            {totalPages > 1 && (
                <PaginationControls
                    currentPage={currentPage}
                    totalPages={totalPages}
                    paginate={paginate}
                    loading={loading}
                />
            )}
        </div>
    );
};

export default TeacherLeave;