import React, { useState, useEffect } from 'react';
import { db } from '../../firebase/config';
import { collection, getDocs, updateDoc, doc } from 'firebase/firestore';
import { toast } from 'react-toastify';
import '../AdminPagesStyle/AdminAttendanceRecord.css';

// Component for the filter controls
const AttendanceFilters = ({
    selectedClass,
    setSelectedClass,
    selectedSubject,
    setSelectedSubject,
    selectedDate,
    setSelectedDate,
    selectedStudentEmail,
    setSelectedStudentEmail,
    classes,
    subjects,
}) => (
    <div className="filter-panel">
        <div className="form-group">
            <select
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                className="form-input"
            >
                <option value="">All Classes</option>
                {classes.map((cls) => (
                    <option key={cls.id} value={cls.id}>
                        {cls.className} - {cls.section}
                    </option>
                ))}
            </select>
        </div>
        <div className="form-group">
            <select
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
                className="form-input"
            >
                <option value="">All Subjects</option>
                {subjects.map((subject) => (
                    <option key={subject.id} value={subject.id}>
                        {subject.subjectName}
                    </option>
                ))}
            </select>
        </div>
        <div className="form-group">
            <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="form-input"
            />
        </div>
        <div className="form-group">
            <input
                type="text"
                placeholder="Search by student email"
                value={selectedStudentEmail}
                onChange={(e) => setSelectedStudentEmail(e.target.value)}
                className="form-input"
            />
        </div>
    </div>
);

// Component for the attendance table
const AttendanceTable = ({ currentRecords, handleStatusChange }) => (
    <div className="table-wrapper">
        <div className="table-header">
            <h4>Attendance Records</h4>
        </div>
        <div className="table-container">
            <table className="attendance-table">
                <thead>
                    <tr>
                        <th>Student Email</th>
                        <th>Class</th>
                        <th>Subject</th>
                        <th>Date</th>
                        <th>Status</th>
                        <th>Action</th>
                    </tr>
                </thead>
                <tbody>
                    {currentRecords.map((record) => (
                        <tr key={record.id}>
                            <td>{record.studentEmail}</td>
                            <td>{record.className}</td>
                            <td>{record.subjectName}</td>
                            <td>{record.date}</td>
                            <td>{record.status}</td>
                            <td>
                                <button
                                    className="btn btn-warning"
                                    onClick={() => handleStatusChange(record.id, record.status)}
                                >
                                    Toggle Status
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
            {currentRecords.length === 0 && (
                <div className="no-data">No attendance records found for the selected criteria.</div>
            )}
        </div>
    </div>
);

// Component for pagination
const AttendancePagination = ({ currentPage, totalPages, handlePageChange, filteredRecords }) => (
    <nav className="pagination-container">
        <ul className="pagination">
            <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                <button
                    className="page-link"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                >
                    Previous
                </button>
            </li>
            {Array.from({ length: totalPages }, (_, i) => (
                <li
                    key={i + 1}
                    className={`page-item ${currentPage === i + 1 ? 'active' : ''}`}
                >
                    <button
                        className="page-link"
                        onClick={() => handlePageChange(i + 1)}
                    >
                        {i + 1}
                    </button>
                </li>
            ))}
            <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                <button
                    className="page-link"
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                >
                    Next
                </button>
            </li>
        </ul>
        <div className="pagination-info">
            Showing {(currentPage - 1) * 10 + 1} to {Math.min(currentPage * 10, filteredRecords.length)} of{' '}
            {filteredRecords.length} records
        </div>
    </nav>
);

const AdminAttendanceRecord = () => {
    // State management
    const [classes, setClasses] = useState([]);
    const [subjects, setSubjects] = useState([]);
    const [students, setStudents] = useState([]);
    const [attendanceRecords, setAttendanceRecords] = useState([]);
    const [filteredRecords, setFilteredRecords] = useState([]);
    const [selectedClass, setSelectedClass] = useState('');
    const [selectedSubject, setSelectedSubject] = useState('');
    const [selectedDate, setSelectedDate] = useState('');
    const [selectedStudentEmail, setSelectedStudentEmail] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const recordsPerPage = 10;

    // Data fetching
    useEffect(() => {
        fetchInitialData();
    }, []);

    const fetchInitialData = async () => {
        try {
            const classesSnap = await getDocs(collection(db, 'classes'));
            setClasses(classesSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() })));

            const subjectsSnap = await getDocs(collection(db, 'subjects'));
            setSubjects(subjectsSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() })));

            const studentsSnap = await getDocs(collection(db, 'studentLog'));
            setStudents(studentsSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() })));

            const attendanceSnap = await getDocs(collection(db, 'studentAttendance'));
            const records = attendanceSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

            const enrichedRecords = await Promise.all(
                records.map(async (record) => {
                    const student = studentsSnap.docs.find((doc) => doc.id === record.studentId)?.data();
                    const classData = classesSnap.docs.find((doc) => doc.id === record.classId)?.data();
                    const subjectData = subjectsSnap.docs.find((doc) => doc.id === record.subjectId)?.data();
                    return {
                        ...record,
                        studentEmail: student?.email || 'Unknown',
                        className: classData ? `${classData.className} - ${classData.section}` : 'Unknown',
                        subjectName: subjectData?.subjectName || 'Unknown',
                    };
                })
            );

            setAttendanceRecords(enrichedRecords);
            setFilteredRecords(enrichedRecords);
        } catch (error) {
            toast.error('Error fetching data: ' + error.message);
        }
    };

    const applyFilters = () => {
        let filtered = [...attendanceRecords];

        if (selectedClass) {
            filtered = filtered.filter((record) => record.classId === selectedClass);
        }
        if (selectedSubject) {
            filtered = filtered.filter((record) => record.subjectId === selectedSubject);
        }
        if (selectedDate) {
            filtered = filtered.filter((record) => record.date === selectedDate);
        }
        if (selectedStudentEmail) {
            filtered = filtered.filter((record) =>
                record.studentEmail.toLowerCase().includes(selectedStudentEmail.toLowerCase())
            );
        }

        setFilteredRecords(filtered);
        setCurrentPage(1); // Reset to first page when filters change
    };

    useEffect(() => {
        applyFilters();
    }, [selectedClass, selectedSubject, selectedDate, selectedStudentEmail, attendanceRecords]);

    const handleStatusChange = async (recordId, currentStatus) => {
        try {
            const newStatus = currentStatus === 'present' ? 'absent' : 'present';
            await updateDoc(doc(db, 'studentAttendance', recordId), {
                status: newStatus,
                updatedAt: new Date().toISOString(),
            });
            toast.success('Attendance updated successfully');

            setAttendanceRecords((prev) =>
                prev.map((record) => (record.id === recordId ? { ...record, status: newStatus } : record))
            );
        } catch (error) {
            toast.error('Error updating attendance: ' + error.message);
        }
    };

    // Pagination Logic
    const totalPages = Math.ceil(filteredRecords.length / recordsPerPage);
    const startIndex = (currentPage - 1) * recordsPerPage;
    const endIndex = startIndex + recordsPerPage;
    const currentRecords = filteredRecords.slice(startIndex, endIndex);

    const handlePageChange = (pageNumber) => {
        setCurrentPage(pageNumber);
        window.scrollTo(0, 0); // Scroll to top when changing pages
    };

    return (
        <div className="container">
            <h2 className="page-title">Attendance Records</h2>
            <AttendanceFilters
                selectedClass={selectedClass}
                setSelectedClass={setSelectedClass}
                selectedSubject={selectedSubject}
                setSelectedSubject={setSelectedSubject}
                selectedDate={selectedDate}
                setSelectedDate={setSelectedDate}
                selectedStudentEmail={selectedStudentEmail}
                setSelectedStudentEmail={setSelectedStudentEmail}
                classes={classes}
                subjects={subjects}
            />
            <AttendanceTable currentRecords={currentRecords} handleStatusChange={handleStatusChange} />
            {filteredRecords.length > 0 && (
                <AttendancePagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    handlePageChange={handlePageChange}
                    filteredRecords={filteredRecords} // Pass filteredRecords as a prop
                />
            )}
        </div>
    );
};

export default AdminAttendanceRecord;