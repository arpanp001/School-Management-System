import React, { useState, useEffect } from 'react';
import { db } from '../../firebase/config';
import { collection, getDocs, addDoc, query, where, serverTimestamp } from 'firebase/firestore';
import { toast } from 'react-toastify';
import { getAuth } from 'firebase/auth';
import '../TeacherPagesStyle/TeacherMarkAttendance.css';

// Loading spinner component
const LoadingSpinner = () => (
    <div className="mark-attendance-loading-spinner">
        <div className="mark-attendance-spinner"></div>
        <span>Loading...</span>
    </div>
);

// Component for class, subject, and date selection
const ClassSubjectSelector = ({
    classes,
    subjects,
    selectedClass,
    setSelectedClass,
    selectedSubject,
    setSelectedSubject,
    selectedDate,
    setSelectedDate,
    handleSubmit,
    isFormValid,
}) => (
    <form onSubmit={handleSubmit} className="mark-attendance-form-container">
        <div className="mark-attendance-form-grid">
            <div className="mark-attendance-form-group">
                <label htmlFor="class">Class</label>
                <select
                    id="class"
                    className="mark-attendance-form-input"
                    value={selectedClass}
                    onChange={(e) => setSelectedClass(e.target.value)}
                    required
                >
                    <option value="">Select Class</option>
                    {classes.map((cls) => (
                        <option key={cls.id} value={cls.id}>
                            {cls.className} - {cls.section}
                        </option>
                    ))}
                </select>
            </div>
            <div className="mark-attendance-form-group">
                <label htmlFor="subject">Subject</label>
                <select
                    id="subject"
                    className="mark-attendance-form-input"
                    value={selectedSubject}
                    onChange={(e) => setSelectedSubject(e.target.value)}
                    required
                >
                    <option value="">Select Subject</option>
                    {subjects.map((subject) => (
                        <option key={subject.id} value={subject.id}>
                            {subject.subjectName}
                        </option>
                    ))}
                </select>
            </div>
            <div className="mark-attendance-form-group">
                <label htmlFor="date">Date</label>
                <input
                    type="date"
                    id="date"
                    className="mark-attendance-form-input"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    required
                />
            </div>
        </div>
        <button type="submit" className="mark-attendance-btn mark-attendance-btn-primary" disabled={!isFormValid()}>
            Mark Attendance
        </button>
    </form>
);

// Component for student attendance table
const StudentAttendanceTable = ({ students, attendance, handleAttendanceChange }) => (
    <div className="mark-attendance-table-wrapper">
        <div className="mark-attendance-table-header">
            <h4>Mark Student Attendance</h4>
        </div>
        <div className="mark-attendance-table-container">
            <table className="mark-attendance-table">
                <thead>
                    <tr>
                        <th>Student Email</th>
                        <th>Status</th>
                    </tr>
                </thead>
                <tbody>
                    {students.length === 0 ? (
                        <tr>
                            <td colSpan="2" className="mark-attendance-no-data">
                                No students found
                            </td>
                        </tr>
                    ) : (
                        students.map((student) => (
                            <tr key={student.id}>
                                <td>{student.email}</td>
                                <td className="mark-attendance-action-buttons">
                                    <button
                                        type="button"
                                        className={`mark-attendance-status-button mark-attendance-present-button ${attendance[student.id] ? 'active' : ''}`}
                                        onClick={() => handleAttendanceChange(student.id, true)}
                                    >
                                        Present
                                    </button>
                                    <button
                                        type="button"
                                        className={`mark-attendance-status-button mark-attendance-absent-button ${attendance[student.id] === false ? 'active' : ''}`}
                                        onClick={() => handleAttendanceChange(student.id, false)}
                                    >
                                        Absent
                                    </button>
                                </td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
    </div>
);

// Component for attendance summary
const AttendanceSummary = ({ summary, showSummary }) => (
    <div className={`mark-attendance-summary-container ${showSummary ? 'visible' : 'hidden'}`}>
        <span className="mark-attendance-summary-item">✅ Present: {summary.present}</span>
        <span className="mark-attendance-summary-item">❌ Absent: {summary.absent}</span>
        <span className="mark-attendance-summary-item">📄 Total Students: {summary.total}</span>
    </div>
);

const TeacherMarkAttendance = () => {
    // State management
    const [classes, setClasses] = useState([]);
    const [subjects, setSubjects] = useState([]);
    const [students, setStudents] = useState([]);
    const [selectedClass, setSelectedClass] = useState('');
    const [selectedSubject, setSelectedSubject] = useState('');
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [attendance, setAttendance] = useState({});
    const [summary, setSummary] = useState({ present: 0, absent: 0, total: 0 });
    const [showSummary, setShowSummary] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const auth = getAuth();
    const teacherId = auth.currentUser?.uid;

    // Data fetching
    useEffect(() => {
        fetchTeacherClasses();
    }, []);

    const fetchTeacherClasses = async () => {
        setIsLoading(true);
        try {
            const classTeacherQuery = query(
                collection(db, 'classTeacherMapping'),
                where('teacherId', '==', teacherId)
            );
            const classTeacherSnap = await getDocs(classTeacherQuery);
            const classIds = classTeacherSnap.docs.map((doc) => doc.data().classId);

            const classesSnap = await getDocs(collection(db, 'classes'));
            const teacherClasses = classesSnap.docs
                .filter((doc) => classIds.includes(doc.id))
                .map((doc) => ({ id: doc.id, ...doc.data() }));
            setClasses(teacherClasses);

            const subjectsSnap = await getDocs(collection(db, 'subjects'));
            setSubjects(subjectsSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
        } catch (error) {
            toast.error('Error fetching classes: ' + error.message);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchStudents = async () => {
        if (!selectedClass) return;
        setIsLoading(true);
        try {
            const studentAssignmentsQuery = query(
                collection(db, 'studentAssignments'),
                where('classId', '==', selectedClass)
            );
            const studentAssignmentsSnap = await getDocs(studentAssignmentsQuery);
            const studentIds = studentAssignmentsSnap.docs.map((doc) => doc.data().studentId);

            const studentsSnap = await getDocs(collection(db, 'studentLog'));
            const classStudents = studentsSnap.docs
                .filter((doc) => studentIds.includes(doc.id))
                .map((doc) => ({ id: doc.id, ...doc.data() }));
            setStudents(classStudents);

            const initialAttendance = {};
            classStudents.forEach((student) => {
                initialAttendance[student.id] = false; // Default to absent
            });
            setAttendance(initialAttendance);
        } catch (error) {
            toast.error('Error fetching students: ' + error.message);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchStudents();
    }, [selectedClass]);

    // Attendance handling
    const handleAttendanceChange = (studentId, status) => {
        setAttendance((prev) => ({
            ...prev,
            [studentId]: status,
        }));
    };

    const isFormValid = () => {
        return selectedClass !== '' && selectedSubject !== '' && selectedDate !== '';
    };

    const calculateSummary = () => {
        const total = Object.keys(attendance).length;
        const present = Object.values(attendance).filter((status) => status === true).length;
        const absent = total - present;
        return { present, absent, total };
    };

    // Send notifications to absent students
    const sendAbsentNotifications = async (absentStudentIds, subjectName, date) => {
        try {
            const notificationPromises = absentStudentIds.map(studentId => {
                const notification = {
                    message: `You were marked absent for ${subjectName} on ${new Date(date).toLocaleDateString()}`,
                    type: 'attendance',
                    read: false,
                    createdAt: serverTimestamp(),
                    link: '/student/attendance'
                };
                return addDoc(collection(db, 'studentLog', studentId, 'notifications'), notification);
            });
            await Promise.all(notificationPromises);
            toast.success(`Notifications sent to ${absentStudentIds.length} absent students`);
        } catch (error) {
            console.error('Error sending absent notifications:', error);
            toast.error('Error sending notifications to absent students');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!isFormValid()) {
            toast.error('Please select class, subject, and date');
            return;
        }

        setIsLoading(true);
        try {
            const attendanceQuery = query(
                collection(db, 'studentAttendance'),
                where('classId', '==', selectedClass),
                where('subjectId', '==', selectedSubject),
                where('date', '==', selectedDate)
            );
            const attendanceSnap = await getDocs(attendanceQuery);

            if (!attendanceSnap.empty) {
                toast.error('Attendance has already been marked for this class, subject, and date.');
                return;
            }

            const sessionQuery = query(
                collection(db, 'classSessions'),
                where('classId', '==', selectedClass),
                where('subjectId', '==', selectedSubject),
                where('date', '==', selectedDate)
            );
            const sessionSnap = await getDocs(sessionQuery);

            if (sessionSnap.empty) {
                const docRef = await addDoc(collection(db, 'classSessions'), {
                    classId: selectedClass,
                    subjectId: selectedSubject,
                    date: selectedDate,
                    createdAt: new Date().toISOString(),
                });
                console.log(`Added session to classSessions with ID: ${docRef.id}`);
            } else {
                console.log('Session already exists. Skipping addition to classSessions.');
            }

            const attendanceData = Object.keys(attendance).map((studentId) => ({
                studentId,
                classId: selectedClass,
                subjectId: selectedSubject,
                date: selectedDate,
                status: attendance[studentId] ? 'present' : 'absent',
                teacherId,
                createdAt: new Date().toISOString(),
            }));

            await Promise.all(
                attendanceData.map((data) => addDoc(collection(db, 'studentAttendance'), data))
            );

            // Send notifications to absent students
            const absentStudentIds = Object.keys(attendance).filter(studentId => !attendance[studentId]);
            if (absentStudentIds.length > 0) {
                const subjectDoc = subjects.find(sub => sub.id === selectedSubject);
                const subjectName = subjectDoc?.subjectName || 'Unknown Subject';
                await sendAbsentNotifications(absentStudentIds, subjectName, selectedDate);
            }

            const newSummary = calculateSummary();
            setSummary(newSummary);
            setShowSummary(true);

            setTimeout(() => {
                setShowSummary(false);
            }, 10000);

            toast.success('Attendance marked successfully');

            setAttendance({});
            setSelectedClass('');
            setSelectedSubject('');
            setStudents([]);
        } catch (error) {
            toast.error('Error marking attendance: ' + error.message);
            console.error('Error in handleSubmit:', error);
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading) {
        return <LoadingSpinner />;
    }

    return (
        <div className="mark-attendance-container">
            <h2 className="mark-attendance-page-title">Mark Attendance</h2>
            <ClassSubjectSelector
                classes={classes}
                subjects={subjects}
                selectedClass={selectedClass}
                setSelectedClass={setSelectedClass}
                selectedSubject={selectedSubject}
                setSelectedSubject={setSelectedSubject}
                selectedDate={selectedDate}
                setSelectedDate={setSelectedDate}
                handleSubmit={handleSubmit}
                isFormValid={isFormValid}
            />
            {students.length > 0 && (
                <StudentAttendanceTable
                    students={students}
                    attendance={attendance}
                    handleAttendanceChange={handleAttendanceChange}
                />
            )}
            <AttendanceSummary summary={summary} showSummary={showSummary} />
        </div>
    );
};

export default TeacherMarkAttendance;