import React, { useState, useEffect } from 'react';
import { db, auth } from '../../firebase/config';
import { collection, query, onSnapshot } from 'firebase/firestore';
import { toast } from 'react-toastify';
import './../TeacherDashboardCardCss/TimetableCard.css';

const TimetableCard = () => {
    const [totalWorkHours, setTotalWorkHours] = useState(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const user = auth.currentUser;
        if (!user) {
            toast.error('Please log in to view work hours');
            setLoading(false);
            return;
        }

        const today = new Date().setHours(0, 0, 0, 0);
        const q = query(collection(db, 'teacherAttendance'));
        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            try {
                const dayLogs = querySnapshot.docs
                    .filter(
                        doc =>
                            doc.data().teacherId === user.uid &&
                            new Date(doc.data().timestamp).setHours(0, 0, 0, 0) === today
                    )
                    .map(doc => doc.data());

                let totalHours = 0;
                const validLogs = dayLogs.filter(log => log.punchType === 'out' && log.workHours);
                validLogs.forEach(log => {
                    totalHours += parseFloat(log.workHours || 0);
                });

                setTotalWorkHours(totalHours.toFixed(2));
                setLoading(false);
            } catch (error) {
                console.error('Error calculating work hours:', error);
                toast.error('Failed to load work hours');
                setLoading(false);
            }
        }, (error) => {
            console.error('Error fetching attendance logs:', error);
            toast.error('Failed to load work hours');
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    return (
        <div className="timetable-card">
            <h3>Today's Total Work Hours</h3>
            <div className="work-hours-container">
                {loading ? (
                    <span className="work-hours loading">Calculating...</span>
                ) : totalWorkHours > 0 ? (
                    <span className="work-hours">{totalWorkHours} hrs</span>
                ) : (
                    <span className="work-hours no-data">No hours recorded</span>
                )}
            </div>
        </div>
    );
};

export default TimetableCard;