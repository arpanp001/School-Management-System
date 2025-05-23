import React, { useState, useEffect } from 'react';
import { db } from '../../firebase/config';
import { collection, getDocs, updateDoc, doc, query, where } from 'firebase/firestore';
import { toast } from 'react-toastify';
import { getAuth } from 'firebase/auth';
import '../TeacherPagesStyle/TeacherEditAttendance.css';

// Loading spinner component
const LoadingSpinner = () => (
    <div className="edit-loading-spinner">
        <div className="edit-spinner"></div>
        <span>Loading...</span>
    </div>
);

// Component for class and subject selection
const ClassSubjectSelector = ({
    classes,
    subjects,
    selectedClass,
    setSelectedClass,
    selectedSubject,
    setSelectedSubject,
}) => (
    <div className="edit-form-container">
        <div className="edit-form-grid">
            <div className="edit-form-group">
                <label htmlFor="edit-class">Class</label>
                <select
                    id="edit-class"
                    className="edit-form-input"
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
            <div className="edit-form-group">
                <label htmlFor="edit-subject">Subject</label>
                <select
                    id="edit-subject"
                    className="edit-form-input"
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
        </div>
    </div>
);

// Component for search bar
const SearchBar = ({ searchQuery, setSearchQuery }) => (
    <div className="edit-search-container">
        <input
            type="text"
            className="edit-search-input"
            placeholder="Search by student email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
        />
    </div>
);

// Component for editable attendance table
const EditableAttendanceTable = ({ filteredRecords, handleStatusChange }) => (
    <div className="edit-table-wrapper">
        <div className="edit-table-header">
            <h4>Edit Attendance</h4>
        </div>
        <div className="edit-table-container">
            <table className="edit-attendance-table">
                <thead>
                    <tr>
                        <th>Student Email</th>
                        <th>Status</th>
                        <th>Action</th>
                    </tr>
                </thead>
                <tbody>
                    {filteredRecords.length === 0 ? (
                        <tr>
                            <td colSpan="3" className="edit-no-data">
                                No matching students found.
                            </td>
                        </tr>
                    ) : (
                        filteredRecords.map((record) => (
                            <tr key={record.id}>
                                <td>{record.studentEmail}</td>
                                <td className={`edit-status-${record.status}`}>{record.status}</td>
                                <td>
                                    <button
                                        className="edit-toggle-btn"
                                        onClick={() => handleStatusChange(record.id, record.status)}
                                    >
                                        Toggle Status
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

const TeacherEditAttendance = () => {
    // State management
    const [classes, setClasses] = useState([]);
    const [subjects, setSubjects] = useState([]);
    const [attendanceRecords, setAttendanceRecords] = useState([]);
    const [filteredRecords, setFilteredRecords] = useState([]);
    const [selectedClass, setSelectedClass] = useState('');
    const [selectedSubject, setSelectedSubject] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    const auth = getAuth();
    const teacherId = auth.currentUser?.uid;
    const currentDate = new Date().toISOString().split('T')[0];

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
        if (!selectedClass || !selectedSubject) {
            setAttendanceRecords([]);
            setFilteredRecords([]);
            return;
        }
        setIsLoading(true);
        setError(null);
        try {
            const attendanceQuery = query(
                collection(db, 'studentAttendance'),
                where('classId', '==', selectedClass),
                where('subjectId', '==', selectedSubject),
                where('date', '==', currentDate),
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

            // Check if records are editable (within 24 hours)
            const now = new Date();
            const editableRecords = enrichedRecords.filter((record) => {
                const createdAt = new Date(record.createdAt);
                const hoursDiff = (now - createdAt) / (1000 * 60 * 60);
                return hoursDiff < 24;
            });

            setAttendanceRecords(editableRecords);
            setFilteredRecords(editableRecords);
        } catch (error) {
            setError('Error fetching attendance records: ' + error.message);
            toast.error('Error fetching attendance records: ' + error.message);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchAttendanceRecords();
    }, [selectedClass, selectedSubject]);

    // Filter records based on search query
    useEffect(() => {
        if (searchQuery.trim() === '') {
            setFilteredRecords(attendanceRecords);
        } else {
            const filtered = attendanceRecords.filter((record) =>
                record.studentEmail.toLowerCase().includes(searchQuery.toLowerCase())
            );
            setFilteredRecords(filtered);
        }
    }, [searchQuery, attendanceRecords]);

    // Attendance handling
    const handleStatusChange = async (recordId, currentStatus) => {
        setIsLoading(true);
        try {
            const newStatus = currentStatus === 'present' ? 'absent' : 'present';
            await updateDoc(doc(db, 'studentAttendance', recordId), {
                status: newStatus,
                updatedAt: new Date().toISOString(),
            });
            toast.success('Attendance updated successfully');
            fetchAttendanceRecords();
        } catch (error) {
            setError('Error updating attendance: ' + error.message);
            toast.error('Error updating attendance: ' + error.message);
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading) {
        return <LoadingSpinner />;
    }

    if (error) {
        return (
            <div className="edit-container">
                <h2 className="edit-page-title">Edit Attendance (Today: {currentDate})</h2>
                <div className="edit-error-message">{error}</div>
            </div>
        );
    }

    return (
        <div className="edit-container">
            <h2 className="edit-page-title">Edit Attendance (Today: {currentDate})</h2>
            <ClassSubjectSelector
                classes={classes}
                subjects={subjects}
                selectedClass={selectedClass}
                setSelectedClass={setSelectedClass}
                selectedSubject={selectedSubject}
                setSelectedSubject={setSelectedSubject}
            />
            {attendanceRecords.length > 0 ? (
                <>
                    <SearchBar searchQuery={searchQuery} setSearchQuery={setSearchQuery} />
                    <EditableAttendanceTable
                        filteredRecords={filteredRecords}
                        handleStatusChange={handleStatusChange}
                    />
                </>
            ) : (
                <div className="edit-no-records">
                    No editable attendance records found for today.
                </div>
            )}
        </div>
    );
};

export default TeacherEditAttendance;