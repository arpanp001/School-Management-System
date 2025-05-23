import React, { useState, useEffect } from 'react';
import { db } from '../../firebase/config';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { toast } from 'react-toastify';
import { FaSpinner } from 'react-icons/fa';
import '../StudentDashboardCardsCss/StudentEarningsCard.css';

const StudentEarningsCard = ({ attendanceData }) => {
    const [timetable, setTimetable] = useState([]);
    const [subjects, setSubjects] = useState([]);
    const [teachers, setTeachers] = useState([]);
    const [attendanceRecords, setAttendanceRecords] = useState([]);
    const [loading, setLoading] = useState(true);
    const auth = getAuth();
    const studentId = auth.currentUser?.uid;

    // Get current day and date
    const today = new Date();
    const currentDay = today.toLocaleString('en-US', { weekday: 'long' }).split(',')[0]; // e.g., "Monday"
    const todayDate = today.toISOString().split('T')[0]; // e.g., "2025-04-21"

    useEffect(() => {
        if (!studentId) {
            toast.error('Please log in to view your timetable');
            setLoading(false);
            return;
        }

        const fetchDailyTimetableAndAttendance = async () => {
            try {
                setLoading(true);

                // Fetch student's assigned class
                const studentMappingsQuery = query(
                    collection(db, 'studentAssignments'),
                    where('studentId', '==', studentId)
                );
                const mappingsSnap = await getDocs(studentMappingsQuery);
                const classIds = mappingsSnap.docs.map(doc => doc.data().classId);

                if (classIds.length === 0) {
                    toast.info('No class assigned yet');
                    setLoading(false);
                    return;
                }

                // Fetch timetable for current day
                const timetablesQuery = query(
                    collection(db, 'timetables'),
                    where('classId', 'in', classIds),
                    where('day', '==', currentDay)
                );
                const timetablesSnap = await getDocs(timetablesQuery);
                const timetableData = timetablesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setTimetable(timetableData);

                // Fetch subjects
                const subjectsSnap = await getDocs(collection(db, 'subjects'));
                setSubjects(subjectsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));

                // Fetch teachers
                const teachersSnap = await getDocs(collection(db, 'teacherLog'));
                setTeachers(teachersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));

                // Fetch attendance records for today
                const attendanceQuery = query(
                    collection(db, 'studentAttendance'),
                    where('studentId', '==', studentId),
                    where('date', '==', todayDate)
                );
                const attendanceSnap = await getDocs(attendanceQuery);
                const attendanceData = attendanceSnap.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data(),
                    date: new Date(doc.data().date),
                }));
                setAttendanceRecords(attendanceData);
            } catch (error) {
                toast.error('Error fetching timetable or attendance: ' + error.message);
            } finally {
                setLoading(false);
            }
        };

        fetchDailyTimetableAndAttendance();
    }, [studentId, currentDay, todayDate]);

    const getSubjectName = (subjectId) => {
        const sub = subjects.find(s => s.id === subjectId);
        return sub ? sub.subjectName : 'N/A';
    };

    const getTeacherName = (teacherId) => {
        const teacher = teachers.find(t => t.id === teacherId);
        return teacher ? teacher.email : 'N/A';
    };

    // Get attendance status for a specific timetable entry
    const getAttendanceStatus = (entry) => {
        const record = attendanceRecords.find(
            (rec) =>
                rec.subjectId === entry.subjectId &&
                rec.date.toISOString().split('T')[0] === todayDate &&
                (!rec.timeSlot || rec.timeSlot === entry.timeSlot) // Match timeSlot if available
        );
        return record ? record.status : 'N/A';
    };

    return (
        <div className="student-earnings-card" role="region" aria-label="Daily timetable and attendance">
            <div className="earnings-card-content">
                <div className="earnings-card-info">
                    <h2 className="earnings-card-title">{currentDay}'s Timetable</h2>
                    {loading ? (
                        <div className="loading-spinner" aria-live="polite" aria-busy="true">
                            <FaSpinner className="spinner" aria-label="Loading timetable data" />
                        </div>
                    ) : timetable.length === 0 ? (
                        <p className="earnings-card-empty">No classes scheduled for {currentDay}</p>
                    ) : (
                        <ul className="timetable-list">
                            {timetable
                                .sort((a, b) => a.timeSlot.localeCompare(b.timeSlot))
                                .map((entry) => {
                                    const status = getAttendanceStatus(entry);
                                    return (
                                        <li key={entry.id} className="timetable-item">
                                            <span className="timetable-time">{entry.timeSlot}</span>
                                            <div className="timetable-details">
                                                <span className="timetable-subject">{getSubjectName(entry.subjectId)}</span>
                                                <span className="timetable-teacher">{getTeacherName(entry.teacherId)}</span>
                                                <span
                                                    className={`timetable-attendance ${status === 'present'
                                                            ? 'present'
                                                            : status === 'absent'
                                                                ? 'absent'
                                                                : status === 'halfday'
                                                                    ? 'halfday'
                                                                    : status === 'late'
                                                                        ? 'late'
                                                                        : 'unknown'
                                                        }`}
                                                >
                                                    Attendance: {status.charAt(0).toUpperCase() + status.slice(1) || 'N/A'}
                                                </span>
                                            </div>
                                        </li>
                                    );
                                })}
                        </ul>
                    )}
                </div>
            </div>
        </div>
    );
};

export default StudentEarningsCard;