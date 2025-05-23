import React, { useState, useEffect, useCallback } from 'react';
import { db, auth } from '../../firebase/config';
import { collection, getDocs } from 'firebase/firestore';
import { toast } from 'react-toastify';
import '../TeacherPagesStyle/TeacherExamSchedule.css';

// Component for displaying loading message
const LoadingMessage = () => (
    <div className="exam-schedule-loading">
        Loading...
    </div>
);

// Component for displaying no schedule message
const NoScheduleMessage = () => (
    <div className="exam-schedule-no-duties">
        No examination duties assigned to you yet.
    </div>
);

// Component for the exam schedule table
const ExamScheduleTable = ({ examSchedules, classes, subjects, studentCounts, examHalls }) => (
    <div className="exam-schedule-table-wrapper">
        <table className="exam-schedule-table">
            <thead>
                <tr>
                    <th>Date</th>
                    <th>Class</th>
                    <th>Subject</th>
                    <th>Time</th>
                    <th>Exam Hall</th>
                    <th>Exam Type</th>
                    <th>Duration</th>
                    <th>Student Count</th>
                </tr>
            </thead>
            <tbody>
                {examSchedules.map(exam => {
                    const classData = classes.find(c => c.id === exam.classId);
                    const subjectData = subjects.find(s => s.id === exam.subjectId);
                    const hallData = examHalls.find(h => h.id === exam.examHall);
                    const studentCount = studentCounts[exam.classId] !== undefined
                        ? studentCounts[exam.classId]
                        : 'Loading...';

                    return (
                        <tr key={exam.id}>
                            <td>{exam.date}</td>
                            <td>{classData ? `${classData.className} - ${classData.section}` : 'N/A'}</td>
                            <td>{subjectData ? subjectData.subjectName : 'N/A'}</td>
                            <td>{`${exam.startTime} - ${exam.endTime}`}</td>
                            <td>{hallData ? hallData.name : 'N/A'}</td>
                            <td>{exam.examType}</td>
                            <td>{exam.duration} min</td>
                            <td>{studentCount}</td>
                        </tr>
                    );
                })}
            </tbody>
        </table>
    </div>
);

const TeacherExamSchedule = () => {
    // State management
    const [examSchedules, setExamSchedules] = useState([]);
    const [classes, setClasses] = useState([]);
    const [subjects, setSubjects] = useState([]);
    const [studentCounts, setStudentCounts] = useState({});
    const [loading, setLoading] = useState(true); // Added loading state
    const examHalls = [
        { id: 'hall1', name: 'Hall 1', capacity: 50 },
        { id: 'hall2', name: 'Hall 2', capacity: 40 },
        { id: 'hall3', name: 'Hall 3', capacity: 30 },
    ];

    // Helper functions
    const getStudentCount = useCallback(async (classId) => {
        try {
            const studentMappings = await getDocs(collection(db, 'classStudentMapping'));
            const mappings = studentMappings.docs.map(doc => doc.data());
            return mappings.filter(mapping => mapping.classId === classId).length;
        } catch (error) {
            return 'N/A';
        }
    }, []);

    const fetchData = useCallback(async () => {
        setLoading(true); // Set loading to true at the start
        try {
            const teacherId = auth.currentUser.uid;

            // Fetch classes
            const classesSnap = await getDocs(collection(db, 'classes'));
            const classesData = classesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setClasses(classesData);

            // Fetch subjects
            const subjectsSnap = await getDocs(collection(db, 'subjects'));
            setSubjects(subjectsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));

            // Fetch exam schedules
            const schedulesSnap = await getDocs(collection(db, 'examSchedules'));
            const allSchedules = schedulesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            const teacherSchedules = allSchedules.filter(schedule =>
                schedule.invigilators.includes(teacherId)
            );
            setExamSchedules(teacherSchedules);

            // Fetch student counts for all relevant classes
            const counts = {};
            await Promise.all(teacherSchedules.map(async (exam) => {
                const count = await getStudentCount(exam.classId);
                counts[exam.classId] = count;
            }));
            setStudentCounts(counts);
        } catch (error) {
            toast.error('Error fetching exam schedules: ' + error.message);
        } finally {
            setLoading(false); // Set loading to false when done (success or error)
        }
    }, [getStudentCount]);

    // Data fetching
    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // Render
    return (
        <div className="exam-schedule-container">
            <h2 className="exam-schedule-title">My Examination Duties</h2>
            {loading ? (
                <LoadingMessage />
            ) : (
                <>
                    <ExamScheduleTable
                        examSchedules={examSchedules}
                        classes={classes}
                        subjects={subjects}
                        studentCounts={studentCounts}
                        examHalls={examHalls}
                    />
                    {examSchedules.length === 0 && <NoScheduleMessage />}
                </>
            )}
        </div>
    );
};

export default TeacherExamSchedule;