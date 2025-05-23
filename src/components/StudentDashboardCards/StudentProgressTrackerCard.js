import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import '../StudentDashboardCardsCss/StudentProgressTrackerCard.css';
import { auth, db } from '../../firebase/config';
import { collection, getDocs, query, where, onSnapshot } from 'firebase/firestore';
import { FaCalendarAlt, FaClock, FaMapMarkerAlt } from 'react-icons/fa';
import { Tooltip } from 'react-tooltip';

const StudentProgressTrackerCard = () => {
    const [examSchedules, setExamSchedules] = useState([]);
    const [subjects, setSubjects] = useState([]);
    const [studentClassId, setStudentClassId] = useState(null);
    const [loading, setLoading] = useState(true);

    const examHalls = [
        { id: 'hall1', name: 'Hall 1', capacity: 50 },
        { id: 'hall2', name: 'Hall 2', capacity: 40 },
        { id: 'hall3', name: 'Hall 3', capacity: 30 },
    ];

    useEffect(() => {
        const fetchData = () => {
            const user = auth.currentUser;
            if (!user) {
                setLoading(false);
                return;
            }

            // Fetch subjects (one-time fetch since subjects are unlikely to change often)
            getDocs(collection(db, 'subjects'))
                .then(subjectsSnap => {
                    const subjectsData = subjectsSnap.docs.map(doc => ({
                        id: doc.id,
                        ...doc.data(),
                    }));
                    setSubjects(subjectsData);
                })
                .catch(error => {
                    console.error('Error fetching subjects:', error);
                });

            // Real-time listener for student assignments
            const unsubscribeStudentMappings = onSnapshot(
                collection(db, 'studentAssignments'),
                (studentMappingsSnap) => {
                    const studentMappings = studentMappingsSnap.docs.map(doc => ({
                        id: doc.id,
                        ...doc.data(),
                    }));
                    const studentAssignment = studentMappings.find(mapping => mapping.studentId === user.uid);

                    if (!studentAssignment) {
                        setStudentClassId(null);
                        setExamSchedules([]);
                        setLoading(false);
                        return;
                    }

                    setStudentClassId(studentAssignment.classId);

                    // Real-time listener for exam schedules
                    const schedulesQuery = query(
                        collection(db, 'examSchedules'),
                        where('classId', '==', studentAssignment.classId)
                    );
                    const unsubscribeSchedules = onSnapshot(schedulesQuery, (schedulesSnap) => {
                        const allSchedules = schedulesSnap.docs.map(doc => ({
                            id: doc.id,
                            ...doc.data(),
                            date: new Date(doc.data().date),
                        }));

                        const today = new Date();
                        today.setHours(0, 0, 0, 0);
                        const sortedSchedules = allSchedules
                            .sort((a, b) => a.date - b.date)
                            .filter(exam => exam.date >= today)
                            .slice(0, 3);

                        setExamSchedules(sortedSchedules);
                        setLoading(false);
                    }, (error) => {
                        console.error('Error fetching exam schedules:', error);
                        setExamSchedules([]);
                        setLoading(false);
                    });

                    return () => unsubscribeSchedules();
                },
                (error) => {
                    console.error('Error fetching student mappings:', error);
                    setExamSchedules([]);
                    setLoading(false);
                }
            );

            return () => unsubscribeStudentMappings();
        };

        fetchData();
    }, []);

    if (loading) {
        return (
            <div className="student-progress-tracker-card" aria-live="polite" aria-busy="true">
                <h2>Upcoming Exam Schedule</h2>
                <div className="loading-spinner" role="status">
                    <span className="visually-hidden">Loading...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="student-progress-tracker-card">
            <h2>Upcoming Exam Schedule</h2>
            {studentClassId ? (
                examSchedules.length > 0 ? (
                    <>
                        <ul>
                            {examSchedules.map(exam => {
                                const subjectData = subjects.find(s => s.id === exam.subjectId);
                                const hallData = examHalls.find(h => h.id === exam.examHall);
                                return (
                                    <li
                                        key={exam.id}
                                        className="exam-item fade-in"
                                        data-tooltip-id={`exam-tooltip-${exam.id}`}
                                        data-tooltip-content={`Exam Type: ${exam.examType}\nDuration: ${exam.duration} min`}
                                    >
                                        <div className="exam-info">
                                            <span className="exam-subject">{subjectData ? subjectData.subjectName : 'N/A'}</span>
                                            <div className="exam-date">
                                                <FaCalendarAlt className="icon" />
                                                <span>{exam.date.toLocaleDateString()}</span>
                                            </div>
                                        </div>
                                        <div className="exam-details">
                                            <div className="exam-time">
                                                <FaClock className="icon" />
                                                <span>{`${exam.startTime} - ${exam.endTime}`}</span>
                                            </div>
                                            <div className="exam-hall">
                                                <FaMapMarkerAlt className="icon" />
                                                <span>{hallData ? hallData.name : 'N/A'}</span>
                                            </div>
                                        </div>
                                    </li>
                                );
                            })}
                        </ul>
                        <Link to="/student/exam-schedule" className="view-more">View Full Schedule</Link>
                    </>
                ) : (
                    <p className="no-data">No upcoming exams scheduled.</p>
                )
            ) : (
                <p className="no-data">Not assigned to a class yet.</p>
            )}
            <Tooltip id="exam-tooltip" place="top" effect="solid" className="custom-tooltip" />
        </div>
    );
};

export default StudentProgressTrackerCard;