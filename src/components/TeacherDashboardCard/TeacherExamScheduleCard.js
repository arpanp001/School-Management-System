import React, { useState, useEffect, useCallback } from 'react';
import { db, auth } from '../../firebase/config';
import { collection, getDocs, query, where, onSnapshot } from 'firebase/firestore';
import { toast } from 'react-toastify';
import '../TeacherDashboardCardCss/TeacherExamScheduleCard.css';

const TeacherExamScheduleCard = () => {
    const [examSchedules, setExamSchedules] = useState([]);
    const [classes, setClasses] = useState([]);
    const [subjects, setSubjects] = useState([]);
    const [examHalls] = useState([
        { id: 'hall1', name: 'Hall 1', capacity: 50 },
        { id: 'hall2', name: 'Hall 2', capacity: 40 },
        { id: 'hall3', name: 'Hall 3', capacity: 30 },
    ]);
    const teacherId = auth.currentUser?.uid;

    const getExamData = useCallback(async () => {
        try {
            // Fetch classes
            const classesSnap = await getDocs(collection(db, 'classes'));
            setClasses(classesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));

            // Fetch subjects
            const subjectsSnap = await getDocs(collection(db, 'subjects'));
            setSubjects(subjectsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        } catch (error) {
            toast.error('Error fetching supporting data: ' + error.message);
        }
    }, []);

    useEffect(() => {
        getExamData();

        if (!teacherId) return;

        const q = query(collection(db, 'examSchedules'), where('invigilators', 'array-contains', teacherId));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const schedules = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
                .sort((a, b) => new Date(b.date) - new Date(a.date)) // Sort by date descending
                .slice(0, 3); // Get the top 3 most recent
            setExamSchedules(schedules);
        }, (error) => {
            console.error('Error fetching exam schedules:', error);
            toast.error('Failed to load exam schedules');
        });

        return () => unsubscribe();
    }, [teacherId, getExamData]);

    return (
        <div className="exam-schedule-container">
            <h3>Teacher Exam Schedule</h3>
            {examSchedules.length > 0 ? (
                <ul className="exam-list">
                    {examSchedules.map((exam) => {
                        const classData = classes.find(c => c.id === exam.classId);
                        const subjectData = subjects.find(s => s.id === exam.subjectId);
                        const hallData = examHalls.find(h => h.id === exam.examHall);
                        const examDate = new Date(exam.date).toLocaleDateString();
                        return (
                            <li key={exam.id} className="exam-item">
                                <strong>Date:</strong> {examDate}<br />
                                <strong>Class:</strong> {classData ? `${classData.className} - ${classData.section}` : 'N/A'}<br />
                                <strong>Subject:</strong> {subjectData ? subjectData.subjectName : 'N/A'}<br />
                                <strong>Time:</strong> {`${exam.startTime} - ${exam.endTime}`} <br />
                                <strong>Exam Hall:</strong> {hallData ? hallData.name : 'N/A'}<br />
                                <strong>Type:</strong> {exam.examType}
                            </li>
                        );
                    })}
                </ul>
            ) : (
                <p>No recent examination duties assigned.</p>
            )}
        </div>
    );
};

export default TeacherExamScheduleCard;