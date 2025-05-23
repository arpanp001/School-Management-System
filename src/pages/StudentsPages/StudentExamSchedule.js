import React, { useState, useEffect } from 'react';
import { db, auth } from '../../firebase/config';
import { collection, getDocs } from 'firebase/firestore';
import { toast } from 'react-toastify';
import '../StudentPagesStyle/StudentExamSchedule.css';

const StudentExamSchedule = () => {
    const [examSchedules, setExamSchedules] = useState([]);
    const [classes, setClasses] = useState([]);
    const [subjects, setSubjects] = useState([]);
    const [studentClassId, setStudentClassId] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [examHalls] = useState([
        { id: 'hall1', name: 'Hall 1', capacity: 50 },
        { id: 'hall2', name: 'Hall 2', capacity: 40 },
        { id: 'hall3', name: 'Hall 3', capacity: 30 },
    ]); // Same as admin component

    useEffect(() => {
        fetchStudentData();
    }, []);

    const fetchStudentData = async () => {
        try {
            setIsLoading(true);
            // Get current student's ID
            const currentUser = auth.currentUser;
            if (!currentUser) {
                toast.error('You must be logged in to view exam schedules');
                setIsLoading(false);
                return;
            }

            const studentId = currentUser.uid;

            // Fetch student's class assignment
            const studentMappingsSnap = await getDocs(collection(db, 'studentAssignments'));
            const studentMappings = studentMappingsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            const studentAssignment = studentMappings.find(mapping => mapping.studentId === studentId);

            if (!studentAssignment) {
                toast.error('No class assignment found for this student');
                setIsLoading(false);
                return;
            }

            setStudentClassId(studentAssignment.classId);

            // Fetch classes
            const classesSnap = await getDocs(collection(db, 'classes'));
            setClasses(classesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));

            // Fetch subjects
            const subjectsSnap = await getDocs(collection(db, 'subjects'));
            setSubjects(subjectsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));

            // Fetch exam schedules for student's class
            const schedulesSnap = await getDocs(collection(db, 'examSchedules'));
            const allSchedules = schedulesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

            // Filter schedules for student's class
            const studentSchedules = allSchedules.filter(schedule =>
                schedule.classId === studentAssignment.classId
            );

            // Sort exams by date (and time if needed)
            studentSchedules.sort((a, b) => {
                const dateA = new Date(a.date + ' ' + a.startTime);
                const dateB = new Date(b.date + ' ' + b.startTime);
                return dateA - dateB;
            });

            setExamSchedules(studentSchedules);
            setIsLoading(false);
        } catch (error) {
            toast.error('Error fetching exam schedules: ' + error.message);
            setIsLoading(false);
        }
    };

    // Function to check if exam is upcoming (within next 7 days)
    const isUpcomingExam = (examDate) => {
        const today = new Date();
        const examDay = new Date(examDate);
        const diffTime = examDay - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays >= 0 && diffDays <= 7;
    };

    // Function to format date to a more readable format
    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        return new Date(dateString).toLocaleDateString('en-US', options);
    };

    return (
        <div className="ses-container">
            <div className="ses-header">
                <h2 className="ses-title">My Exam Schedule</h2>
                <div className="ses-header-decoration"></div>
            </div>

            {isLoading ? (
                <div className="ses-loading">
                    <div className="ses-spinner"></div>
                    <p>Loading exam schedule...</p>
                </div>
            ) : !studentClassId ? (
                <div className="ses-no-class">
                    <div className="ses-alert-icon">⚠️</div>
                    <p className="ses-alert-message">You haven't been assigned to a class yet. Please contact your administrator.</p>
                </div>
            ) : examSchedules.length === 0 ? (
                <div className="ses-no-exams">
                    <div className="ses-info-icon">ℹ️</div>
                    <p className="ses-info-message">No exams scheduled for your class yet.</p>
                </div>
            ) : (
                <div className="ses-exam-container">
                    <div className="ses-exam-list">
                        {examSchedules.map(exam => {
                            const subjectData = subjects.find(s => s.id === exam.subjectId);
                            const hallData = examHalls.find(h => h.id === exam.examHall);
                            const upcoming = isUpcomingExam(exam.date);

                            return (
                                <div key={exam.id} className={`ses-exam-card ${upcoming ? 'ses-exam-upcoming' : ''}`}>
                                    {upcoming && <div className="ses-upcoming-badge">Upcoming</div>}

                                    <div className="ses-exam-header">
                                        <h3 className="ses-exam-subject">
                                            {subjectData ? subjectData.subjectName : 'N/A'}
                                        </h3>
                                        <span className="ses-exam-type">{exam.examType}</span>
                                    </div>

                                    <div className="ses-exam-body">
                                        <div className="ses-exam-info">
                                            <div className="ses-info-group">
                                                <span className="ses-info-label">Date:</span>
                                                <span className="ses-info-value">{formatDate(exam.date)}</span>
                                            </div>

                                            <div className="ses-info-group">
                                                <span className="ses-info-label">Time:</span>
                                                <span className="ses-info-value">{`${exam.startTime} - ${exam.endTime}`}</span>
                                            </div>

                                            <div className="ses-info-group">
                                                <span className="ses-info-label">Duration:</span>
                                                <span className="ses-info-value">{exam.duration} minutes</span>
                                            </div>

                                            <div className="ses-info-group">
                                                <span className="ses-info-label">Location:</span>
                                                <span className="ses-info-value">{hallData ? hallData.name : 'N/A'}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="ses-exam-footer">
                                        <div className="ses-countdown">
                                            {exam.instructions ? (
                                                <div className="ses-instructions">
                                                    <span className="ses-instructions-label">Instructions:</span>
                                                    <p className="ses-instructions-text">{exam.instructions}</p>
                                                </div>
                                            ) : (
                                                <p className="ses-no-instructions"></p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
};

export default StudentExamSchedule;