import React, { useState, useEffect } from 'react';
import { db, auth } from '../../firebase/config';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import '../TeacherDashboardCardCss/TeacherLeaveCard.css';

const TeacherLeaveCard = () => {
    const [leaveRequests, setLeaveRequests] = useState([]);
    const teacherId = auth.currentUser?.uid;

    useEffect(() => {
        if (!teacherId) return;

        const q = query(collection(db, 'leave-requests'), where('teacherId', '==', teacherId));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const requests = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
                .sort((a, b) => {
                    // Prioritize pending requests and sort by createdAt descending
                    if (a.status === 'Pending' && b.status !== 'Pending') return -1;
                    if (a.status !== 'Pending' && b.status === 'Pending') return 1;
                    return new Date(b.createdAt) - new Date(a.createdAt);
                })
                .slice(0, 3); // Get the top 3 most recent
            setLeaveRequests(requests);
        }, (error) => {
            console.error('Error fetching leave requests:', error);
        });

        return () => unsubscribe();
    }, [teacherId]);

    return (
        <div className="teacher-leave-card-container">
            <h3>Teacher Leave Request</h3>
            {leaveRequests.length > 0 ? (
                <ul className="teacher-leave-card-list">
                    {leaveRequests.map((request) => (
                        <li key={request.id} className="teacher-leave-card-item">
                            <strong>Type:</strong> {request.leaveType || 'N/A'}<br />
                            <strong>Start Date:</strong> {request.startDate ? new Date(request.startDate).toLocaleDateString() : 'N/A'}<br />
                            <strong>End Date:</strong> {request.endDate ? new Date(request.endDate).toLocaleDateString() : 'N/A'}<br />
                            <strong>Status:</strong>
                            <span className={`teacher-leave-card-status ${request.status === 'Approved' ? 'teacher-leave-card-success' : request.status === 'Rejected' ? 'teacher-leave-card-danger' : 'teacher-leave-card-warning'}`}>
                                {request.status || 'Pending'}
                            </span>
                        </li>
                    ))}
                </ul>
            ) : (
                <p>No recent leave requests found.</p>
            )}
        </div>
    );
};

export default TeacherLeaveCard;