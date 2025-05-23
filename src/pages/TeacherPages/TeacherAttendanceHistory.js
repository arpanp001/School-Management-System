import React, { useState, useEffect } from 'react';
import { db } from '../../firebase/config';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { toast } from 'react-toastify';
import { getAuth } from 'firebase/auth';
import '../TeacherPagesStyle/TeacherAttendanceHistory.css';

// Loading spinner component
const LoadingSpinner = () => (
    <div className="history-loading-spinner">
        <div className="history-spinner"></div>
        <span>Loading...</span>
    </div>
);

// Component for class, subject, and date selection
const ClassSubjectDateSelector = ({
    classes,
    subjects,
    selectedClass,
    setSelectedClass,
    selectedSubject,
    setSelectedSubject,
    selectedDate,
    setSelectedDate,
}) => (
    <div className="history-form-container">
        <div className="history-form-grid">
            <div className="history-form-group">
                <label htmlFor="history-class">Class</label>
                <select
                    id="history-class"
                    className="history-form-input"
                    value={selectedClass}
                    onChange={(e) => setSelectedClass(e.target.value)}
                >
                    <option value="">Select Class</option>
                    {classes.map((cls) => (
                        <option key={cls.id} value={cls.id}>
                            {cls.className} - {cls.section}
                        </option>
                    ))}
                </select>
            </div>
            <div className="history-form-group">
                <label htmlFor="history-subject">Subject</label>
                <select
                    id="history-subject"
                    className="history-form-input"
                    value={selectedSubject}
                    onChange={(e) => setSelectedSubject(e.target.value)}
                >
                    <option value="">Select Subject</option>
                    {subjects.map((subject) => (
                        <option key={subject.id} value={subject.id}>
                            {subject.subjectName}
                        </option>
                    ))}
                </select>
            </div>
            <div className="history-form-group">
                <label htmlFor="history-date">Date</label>
                <input
                    type="date"
                    id="history-date"
                    className="history-form-input"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                />
            </div>
        </div>
    </div>
);

// Component for attendance history table
const AttendanceHistoryTable = ({ attendanceRecords }) => (
    <div className="history-table-wrapper">
        <div className="history-table-header">
            <h4>Attendance History</h4>
        </div>
        <div className="history-table-container">
            <table className="history-attendance-table">
                <thead>
                    <tr>
                        <th>Student Email</th>
                        <th>Status</th>
                        <th>Date</th>
                    </tr>
                </thead>
                <tbody>
                    {attendanceRecords.length === 0 ? (
                        <tr>
                            <td colSpan="3" className="history-no-data">
                                No attendance records found for the selected criteria.
                            </td>
                        </tr>
                    ) : (
                        attendanceRecords.map((record) => (
                            <tr key={record.id}>
                                <td>{record.studentEmail}</td>
                                <td className={`history-status-${record.status}`}>{record.status}</td>
                                <td>{record.date}</td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
    </div>
);

const TeacherAttendanceHistory = () => {
    // State management
    const [classes, setClasses] = useState([]);
    const [subjects, setSubjects] = useState([]);
    const [attendanceRecords, setAttendanceRecords] = useState([]);
    const [selectedClass, setSelectedClass] = useState('');
    const [selectedSubject, setSelectedSubject] = useState('');
    const [selectedDate, setSelectedDate] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    const auth = getAuth();
    const teacherId = auth.currentUser?.uid;

    // Data fetching
    useEffect(() => {
        fetchTeacherClasses();
    }, []);

    const fetchTeacherClasses = async () => {
        setIsLoading(true);
        setError(null);
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
            setError('Error fetching classes: ' + error.message);
            toast.error('Error fetching classes: ' + error.message);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchAttendanceRecords = async () => {
        if (!selectedClass || !selectedSubject || !selectedDate) {
            setAttendanceRecords([]);
            return;
        }
        setIsLoading(true);
        setError(null);
        try {
            const attendanceQuery = query(
                collection(db, 'studentAttendance'),
                where('classId', '==', selectedClass),
                where('subjectId', '==', selectedSubject),
                where('date', '==', selectedDate),
                where('teacherId', '==', teacherId)
            );
            const attendanceSnap = await getDocs(attendanceQuery);
            const records = attendanceSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

            // Fetch student details
            const studentIds = [...new Set(records.map((record) => record.studentId))];
            const studentsSnap = await getDocs(collection(db, 'studentLog'));
            const studentsMap = studentsSnap.docs.reduce((acc, doc) => {
                acc[doc.id] = doc.data().email;
                return acc;
            }, {});

            const enrichedRecords = records.map((record) => ({
                ...record,
                studentEmail: studentsMap[record.studentId] || 'Unknown',
            }));

            setAttendanceRecords(enrichedRecords);
        } catch (error) {
            setError('Error fetching attendance records: ' + error.message);
            toast.error('Error fetching attendance records: ' + error.message);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchAttendanceRecords();
    }, [selectedClass, selectedSubject, selectedDate]);

    if (isLoading) {
        return <LoadingSpinner />;
    }

    if (error) {
        return (
            <div className="history-container">
                <h2 className="history-page-title">Attendance History</h2>
                <div className="history-error-message">{error}</div>
            </div>
        );
    }

    return (
        <div className="history-container">
            <h2 className="history-page-title">Attendance History</h2>
            <ClassSubjectDateSelector
                classes={classes}
                subjects={subjects}
                selectedClass={selectedClass}
                setSelectedClass={setSelectedClass}
                selectedSubject={selectedSubject}
                setSelectedSubject={setSelectedSubject}
                selectedDate={selectedDate}
                setSelectedDate={setSelectedDate}
            />
            <AttendanceHistoryTable attendanceRecords={attendanceRecords} />
        </div>
    );
};

export default TeacherAttendanceHistory;