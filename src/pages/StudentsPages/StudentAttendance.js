import React, { useState, useEffect } from 'react';
import { db } from '../../firebase/config';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { toast } from 'react-toastify';
import { getAuth } from 'firebase/auth';
import { Modal, Button } from 'react-bootstrap';
import { Eye, Search } from 'react-bootstrap-icons';
import { motion, AnimatePresence } from 'framer-motion';
import '../../pages/StudentPagesStyle/StudentAttendance.css';

const StudentAttendance = () => {
    const [classData, setClassData] = useState(null);
    const [subjects, setSubjects] = useState([]);
    const [attendanceRecords, setAttendanceRecords] = useState([]);
    const [subjectStats, setSubjectStats] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [selectedSubjectRecords, setSelectedSubjectRecords] = useState([]);
    const [selectedSubjectName, setSelectedSubjectName] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const auth = getAuth();
    const studentId = auth.currentUser?.uid;

    const fetchData = async () => {
        setLoading(true);
        setError(null);
        try {
            const studentAssignmentQuery = query(
                collection(db, 'studentAssignments'),
                where('studentId', '==', studentId)
            );
            const studentAssignmentSnap = await getDocs(studentAssignmentQuery);
            if (studentAssignmentSnap.empty) {
                setError('No class assigned to this student.');
                toast.error('No class assigned to this student.');
                return;
            }

            const assignmentData = studentAssignmentSnap.docs[0].data();
            const classId = assignmentData.classId;

            const classSnap = await getDocs(collection(db, 'classes'));
            const classDoc = classSnap.docs.find(doc => doc.id === classId);
            if (!classDoc) {
                setError('Class not found.');
                toast.error('Class not found.');
                return;
            }
            setClassData({ id: classDoc.id, ...classDoc.data() });

            const subjectsSnap = await getDocs(collection(db, 'subjects'));
            const classSubjects = subjectsSnap.docs
                .filter(doc => assignmentData.subjects.includes(doc.id))
                .map(doc => ({ id: doc.id, ...doc.data() }));
            setSubjects(classSubjects);

            const attendanceQuery = query(
                collection(db, 'studentAttendance'),
                where('studentId', '==', studentId),
                where('classId', '==', classId)
            );
            const attendanceSnap = await getDocs(attendanceQuery);
            const records = attendanceSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

            const enrichedRecords = records.map(record => {
                const subject = classSubjects.find(sub => sub.id === record.subjectId);
                return {
                    ...record,
                    subjectName: subject?.subjectName || 'Unknown'
                };
            });
            setAttendanceRecords(enrichedRecords);

            const stats = await Promise.all(classSubjects.map(async subject => {
                const sessionsQuery = query(
                    collection(db, 'classSessions'),
                    where('classId', '==', classId),
                    where('subjectId', '==', subject.id)
                );
                const sessionsSnap = await getDocs(sessionsQuery);
                const totalSessions = sessionsSnap.docs.length;

                const subjectRecords = enrichedRecords.filter(record => record.subjectId === subject.id);
                const attendedSessions = subjectRecords.filter(record => record.status === 'present').length;

                const percentage = totalSessions > 0
                    ? ((attendedSessions / totalSessions) * 100).toFixed(2)
                    : 0;
                const isEligible = percentage >= 75;

                return {
                    subjectId: subject.id,
                    subjectName: subject.subjectName,
                    attendedSessions,
                    totalSessions,
                    percentage,
                    isEligible
                };
            }));
            setSubjectStats(stats);
        } catch (error) {
            setError('Error fetching attendance data: ' + error.message);
            toast.error('Error fetching attendance data');
        } finally {
            setLoading(false);
        }
    };

    const handleViewDetails = (subjectId, subjectName) => {
        const records = attendanceRecords.filter(record => record.subjectId === subjectId);
        setSelectedSubjectRecords(records);
        setSelectedSubjectName(subjectName);
        setShowModal(true);
    };

    const handleSearch = (e) => {
        const query = e.target.value.toLowerCase();
        setSearchQuery(query);

        if (query.trim() === '') {
            setSubjectStats(subjectStats); // Reset to original stats
        } else {
            const filtered = subjectStats.filter(stat =>
                stat.subjectName.toLowerCase().includes(query) ||
                stat.percentage.toString().includes(query)
            );
            setSubjectStats(filtered);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="student-attendance-container"
        >
            <div className="attendance-header">
                <h2>Course Attendance Detail</h2>
                <div className="attendance-actions">
                    <motion.button
                        className="attendance-refresh-button"
                        onClick={fetchData}
                        whileHover={{ scale: 1.05, boxShadow: '0 4px 8px rgba(59, 130, 246, 0.2)' }}
                        whileTap={{ scale: 0.95 }}
                        aria-label="Refresh attendance data"
                    >
                        <Eye /> Refresh
                    </motion.button>
                </div>
            </div>

            <motion.div
                className="attendance-search-bar"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3 }}
            >
                <Search className="attendance-search-icon" />
                <input
                    type="text"
                    placeholder="Search by course or percentage..."
                    value={searchQuery}
                    onChange={handleSearch}
                    className="attendance-search-input"
                    aria-label="Search attendance by course name or percentage"
                />
            </motion.div>

            {loading ? (
                <motion.div
                    className="attendance-loading"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3 }}
                >
                    <Eye className="attendance-loading-spinner" />
                    <span className='loading-spin'>Loading...</span>
                </motion.div>
            ) : error ? (
                <div className="attendance-error">
                    {error}
                    <motion.button
                        className="attendance-retry-button"
                        onClick={fetchData}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        aria-label="Retry loading attendance"
                    >
                        Retry
                    </motion.button>
                </div>
            ) : classData ? (
                <>
                    <p className="attendance-class-info">Class: {classData.className} - {classData.section}</p>
                    {subjectStats.length > 0 ? (
                        <div className="table-responsive">
                            <table className="table table-striped">
                                <thead>
                                    <tr>
                                        <th>Action</th>
                                        <th>Course</th>
                                        <th>Attended Till Date</th>
                                        <th>Total Session Till Date</th>
                                        <th>% Attended</th>
                                        <th>Eligible for the Examination (Yes/No)</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <AnimatePresence>
                                        {subjectStats.map(stat => (
                                            <motion.tr
                                                key={stat.subjectId}
                                                initial={{ opacity: 0, x: -20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                exit={{ opacity: 0, x: 20 }}
                                                transition={{ duration: 0.3 }}
                                            >
                                                <td>
                                                    <button
                                                        className="btn btn-sm btn-primary"
                                                        onClick={() => handleViewDetails(stat.subjectId, stat.subjectName)}
                                                    >
                                                        <Eye />
                                                    </button>
                                                </td>
                                                <td>{stat.subjectName}</td>
                                                <td>{stat.attendedSessions}</td>
                                                <td>{stat.totalSessions}</td>
                                                <td>{stat.percentage}%</td>
                                                <td>{stat.isEligible ? 'Yes' : 'No'}</td>
                                            </motion.tr>
                                        ))}
                                    </AnimatePresence>
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="attendance-empty">No attendance records found.</div>
                    )}
                </>
            ) : (
                <div className="attendance-empty">No class assigned. Please contact the admin.</div>
            )}

            {/* Modal for Attendance History */}
            <Modal
                show={showModal}
                onHide={() => setShowModal(false)}
                centered
                className="attendance-modal"
            >
                <Modal.Header className='close-sm-btn' closeButton>
                    <Modal.Title>[{selectedSubjectName}] Attendance History</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                    >
                        {selectedSubjectRecords.length > 0 ? (
                            <div className="table-responsive">
                                <table className="table table-striped">
                                    <thead>
                                        <tr>
                                            <th>Date</th>
                                            <th>Attendance Type</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <AnimatePresence>
                                            {selectedSubjectRecords.map(record => (
                                                <motion.tr
                                                    key={record.id}
                                                    initial={{ opacity: 0, x: -20 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    exit={{ opacity: 0, x: 20 }}
                                                    transition={{ duration: 0.3 }}
                                                >
                                                    <td>{new Date(record.date).toLocaleDateString()}</td>
                                                    <td className={`attendance-${record.status}`}>
                                                        {record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                                                    </td>
                                                </motion.tr>
                                            ))}
                                        </AnimatePresence>
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="attendance-empty">No attendance records found for this subject.</div>
                        )}
                    </motion.div>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowModal(false)}>
                        Close
                    </Button>
                </Modal.Footer>
            </Modal>
        </motion.div>
    );
};

export default StudentAttendance;