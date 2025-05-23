import React, { useState, useEffect, useRef, useCallback } from 'react';
import { db, auth } from '../../firebase/config';
import { doc, setDoc, collection, query, orderBy, getDocs } from 'firebase/firestore';
import { toast } from 'react-toastify';
import Webcam from 'react-webcam';
import '../../pages/TeacherPagesStyle/TeacherPunch.css';

const TeacherPunch = () => {
    const [punchType, setPunchType] = useState(null);
    const [punchCategory, setPunchCategory] = useState('main'); // 'main' or 'break'
    const [showCamera, setShowCamera] = useState(false);
    const [attendanceLogs, setAttendanceLogs] = useState([]);
    const [viewMode, setViewMode] = useState('daily');
    const [totalWorkHours, setTotalWorkHours] = useState(0);
    const [loading, setLoading] = useState(false);
    const [hasMainPunchInToday, setHasMainPunchInToday] = useState(false);
    const [hasMainPunchOutToday, setHasMainPunchOutToday] = useState(false);
    const [isOnBreak, setIsOnBreak] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [recordsPerPage] = useState(10);
    const webcamRef = useRef(null);
    const user = auth.currentUser;

    const determinePunchInStatus = (time, category) => {
        if (category === 'break') return 'Break End'; // Status for break punch-in

        const punchHour = time.getHours();
        const punchMinutes = time.getMinutes();
        const totalMinutes = punchHour * 60 + punchMinutes;
        const startTime = 10 * 60;
        const lateTime = 10 * 60 + 30;

        if (totalMinutes < startTime) return 'Invalid';
        if (totalMinutes >= startTime && totalMinutes <= lateTime) return 'Present';
        if (totalMinutes > lateTime) return 'Half-Day';
        return 'Invalid';
    };

    const determinePunchOutStatus = (time, category) => {
        if (category === 'break') return 'Break Start'; // Status for break punch-out

        const punchHour = time.getHours();
        const punchMinutes = time.getMinutes();
        const totalMinutes = punchHour * 60 + punchMinutes;
        const normalStart = 17 * 60;
        const normalEnd = 17 * 60 + 30;

        if (totalMinutes < normalStart) return 'Early Exit';
        if (totalMinutes >= normalStart && totalMinutes <= normalEnd) return 'Normal';
        if (totalMinutes > normalEnd) return 'Overtime';
        return 'Invalid';
    };

    const calculateWorkHours = async (punchOutTime, isBreak = false) => {
        const today = new Date(punchOutTime).setHours(0, 0, 0, 0);
        const q = query(collection(db, 'teacherAttendance'), orderBy('timestamp', 'asc'));
        const querySnapshot = await getDocs(q);
        const dayLogs = querySnapshot.docs
            .filter(doc => doc.data().teacherId === user.uid && new Date(doc.data().timestamp).setHours(0, 0, 0, 0) === today)
            .map(doc => doc.data());

        const mainPunchIn = dayLogs.find(log => log.punchType === 'in' && log.punchCategory === 'main' && log.status !== 'Invalid');
        if (!mainPunchIn) return null;

        const lastPunch = isBreak
            ? dayLogs.filter(log => log.punchCategory === 'main' || (log.punchCategory === 'break' && log.punchType === 'in'))
                .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))[0]
            : mainPunchIn;

        const diffMs = punchOutTime - new Date(lastPunch.timestamp);
        if (diffMs < 0) return null;

        return (diffMs / (1000 * 60 * 60)).toFixed(2);
    };

    const captureImage = async () => {
        const imageSrc = webcamRef.current.getScreenshot();
        if (!imageSrc) {
            toast.error('Failed to capture image');
            return;
        }

        setLoading(true);
        const punchTime = new Date();
        const status = punchType === 'in'
            ? determinePunchInStatus(punchTime, punchCategory)
            : determinePunchOutStatus(punchTime, punchCategory);

        try {
            const attendanceData = {
                teacherId: user.uid,
                email: user.email,
                punchType,
                punchCategory,
                timestamp: punchTime.toISOString(),
                image: imageSrc,
                status,
                workHours: punchType === 'out' ? await calculateWorkHours(punchTime, punchCategory === 'break') : null
            };

            await setDoc(doc(db, 'teacherAttendance', `${user.uid}_${Date.now()}`), attendanceData);
            toast.success(`Punch ${punchType} (${punchCategory}) recorded! Status: ${status}`);

            if (punchCategory === 'main' && punchType === 'in') setHasMainPunchInToday(true);
            if (punchCategory === 'main' && punchType === 'out') setHasMainPunchOutToday(true);
            if (punchCategory === 'break' && punchType === 'out') setIsOnBreak(true);
            if (punchCategory === 'break' && punchType === 'in') setIsOnBreak(false);

            setShowCamera(false);
            fetchAttendanceLogs();
        } catch (error) {
            toast.error('Error recording punch: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const checkDailyPunchStatus = useCallback(async () => {
        const today = new Date().setHours(0, 0, 0, 0);
        const q = query(collection(db, 'teacherAttendance'), orderBy('timestamp', 'desc'));
        const querySnapshot = await getDocs(q);
        const dayLogs = querySnapshot.docs
            .filter(doc => doc.data().teacherId === user.uid && new Date(doc.data().timestamp).setHours(0, 0, 0, 0) === today)
            .map(doc => doc.data());

        const hasMainIn = dayLogs.some(log => log.punchType === 'in' && log.punchCategory === 'main' && log.status !== 'Invalid');
        const hasMainOut = dayLogs.some(log => log.punchType === 'out' && log.punchCategory === 'main');
        const lastBreak = dayLogs.filter(log => log.punchCategory === 'break')
            .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))[0];

        setHasMainPunchInToday(hasMainIn);
        setHasMainPunchOutToday(hasMainOut);
        setIsOnBreak(hasMainIn && lastBreak?.punchType === 'out');
    }, [user?.uid]);

    const fetchAttendanceLogs = useCallback(async () => {
        setLoading(true);
        try {
            const q = query(collection(db, 'teacherAttendance'), orderBy('timestamp', 'desc'));
            const querySnapshot = await getDocs(q);
            const logs = querySnapshot.docs
                .filter(doc => doc.data().teacherId === user.uid)
                .map(doc => ({ id: doc.id, ...doc.data() }));

            const filteredLogs = logs.filter(log => {
                const logDate = new Date(log.timestamp);
                const now = new Date();
                if (viewMode === 'daily') return logDate.toDateString() === now.toDateString();
                if (viewMode === 'weekly') {
                    const weekStart = new Date(now.setDate(now.getDate() - now.getDay()));
                    return logDate >= weekStart;
                }
                if (viewMode === 'monthly') return logDate.getMonth() === now.getMonth();
                return true;
            });

            let totalHours = 0;
            const logsWithWorkHours = filteredLogs.map(log => {
                if (log.punchType === 'out' && log.workHours === null) {
                    const dayLogs = filteredLogs.filter(l => new Date(l.timestamp).toDateString() === new Date(log.timestamp).toDateString());
                    const lastPunch = log.punchCategory === 'break'
                        ? dayLogs.filter(l => l.punchCategory === 'main' || (l.punchCategory === 'break' && l.punchType === 'in'))
                            .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))[0]
                        : dayLogs.find(l => l.punchType === 'in' && l.punchCategory === 'main' && l.status !== 'Invalid');

                    if (lastPunch) {
                        const diffMs = new Date(log.timestamp) - new Date(lastPunch.timestamp);
                        if (diffMs >= 0) {
                            log.workHours = (diffMs / (1000 * 60 * 60)).toFixed(2);
                            totalHours += parseFloat(log.workHours);
                        }
                    }
                } else if (log.workHours) {
                    totalHours += parseFloat(log.workHours);
                }
                return log;
            });

            setTotalWorkHours(totalHours.toFixed(2));
            setAttendanceLogs(logsWithWorkHours);
            setCurrentPage(1);
            await checkDailyPunchStatus();
        } catch (error) {
            toast.error('Error fetching attendance logs: ' + error.message);
        } finally {
            setLoading(false);
        }
    }, [user?.uid, viewMode, checkDailyPunchStatus]);

    useEffect(() => {
        fetchAttendanceLogs();
    }, [fetchAttendanceLogs]);

    const indexOfLastRecord = currentPage * recordsPerPage;
    const indexOfFirstRecord = indexOfLastRecord - recordsPerPage;
    const currentRecords = attendanceLogs.slice(indexOfFirstRecord, indexOfLastRecord);
    const totalPages = Math.ceil(attendanceLogs.length / recordsPerPage);

    const paginate = (pageNumber) => setCurrentPage(pageNumber);

    const getStatusBadgeClass = (status) => {
        switch (status) {
            case 'Present': return 'badge bg-success';
            case 'Half-Day': return 'badge bg-warning';
            case 'Early Exit': return 'badge bg-danger';
            case 'Normal': return 'badge bg-info';
            case 'Overtime': return 'badge bg-primary';
            case 'Break Start': return 'badge bg-secondary';
            case 'Break End': return 'badge bg-secondary';
            default: return 'badge bg-secondary';
        }
    };

    const handlePunchClick = (type, category) => {
        if (category === 'main' && type === 'in' && hasMainPunchInToday) {
            toast.warn('Main punch-in already recorded for today');
            return;
        }
        if (category === 'main' && type === 'out' && hasMainPunchOutToday) {
            toast.warn('Main punch-out already recorded for today');
            return;
        }
        if (category === 'break' && type === 'out' && !hasMainPunchInToday) {
            toast.warn('Cannot take break without main punch-in');
            return;
        }
        if (category === 'break' && type === 'in' && !isOnBreak) {
            toast.warn('Cannot punch in from break when not on break');
            return;
        }
        if (category === 'main' && type === 'out' && !hasMainPunchInToday) {
            toast.warn('Cannot punch out without main punch-in');
            return;
        }

        setPunchType(type);
        setPunchCategory(category);
        setShowCamera(true);
    };

    return (
        <div className="container mt-4">
            <h2>Teacher Attendance</h2>

            <div className="mb-3">
                <button
                    className="btn btn-primary me-2"
                    onClick={() => handlePunchClick('in', 'main')}
                    disabled={loading || hasMainPunchInToday}
                    title={hasMainPunchInToday ? 'Already punched in today' : ''}
                >
                    Main Punch In
                </button>
                <button
                    className="btn btn-secondary me-2"
                    onClick={() => handlePunchClick('out', 'main')}
                    disabled={loading || hasMainPunchOutToday || !hasMainPunchInToday}
                    title={hasMainPunchOutToday ? 'Already punched out today' : !hasMainPunchInToday ? 'Punch-in required first' : ''}
                >
                    Main Punch Out
                </button>
                <button
                    className="btn btn-info me-2"
                    onClick={() => handlePunchClick('out', 'break')}
                    disabled={loading || !hasMainPunchInToday || isOnBreak}
                    title={!hasMainPunchInToday ? 'Punch-in required first' : isOnBreak ? 'Already on break' : ''}
                >
                    Break Start
                </button>
                <button
                    className="btn btn-info"
                    onClick={() => handlePunchClick('in', 'break')}
                    disabled={loading || !isOnBreak}
                    title={!isOnBreak ? 'Not on break' : ''}
                >
                    Break End
                </button>
            </div>

            {showCamera && (
                <div className="webcam-container mb-3">
                    <Webcam audio={false} ref={webcamRef} screenshotFormat="image/jpeg" width={320} height={240} />
                    <div className="mt-2">
                        <button className="btn btn-success me-2" onClick={captureImage} disabled={loading}>
                            {loading ? 'Capturing...' : 'Capture'}
                        </button>
                        <button className="btn btn-danger" onClick={() => setShowCamera(false)} disabled={loading}>
                            Cancel
                        </button>
                    </div>
                </div>
            )}

            <div className="total-hours mb-3">
                <h4>Total Work Hours: <span className="badge bg-dark">{loading ? 'Calculating...' : `${totalWorkHours} hrs`}</span></h4>
            </div>

            <div className="attendance-logs mb-3">
                <h4>Attendance Logs {loading && <span className="badge bg-secondary">Loading...</span>}</h4>
                <div className="btn-group mb-3">
                    <button className={`btn btn-outline-primary ${viewMode === 'daily' ? 'active' : ''}`} onClick={() => setViewMode('daily')} disabled={loading}>Daily</button>
                    <button className={`btn btn-outline-primary ${viewMode === 'weekly' ? 'active' : ''}`} onClick={() => setViewMode('weekly')} disabled={loading}>Weekly</button>
                    <button className={`btn btn-outline-primary ${viewMode === 'monthly' ? 'active' : ''}`} onClick={() => setViewMode('monthly')} disabled={loading}>Monthly</button>
                </div>

                <table className="table table-striped">
                    <thead>
                        <tr>
                            <th>Date</th>
                            <th>Category</th>
                            <th>Type</th>
                            <th>Time</th>
                            <th>Status</th>
                            <th>Work Hours</th>
                        </tr>
                    </thead>
                    <tbody>
                        {currentRecords.map(log => (
                            <tr key={log.id}>
                                <td>{new Date(log.timestamp).toLocaleDateString()}</td>
                                <td>{log.punchCategory}</td>
                                <td>{log.punchType}</td>
                                <td>{new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                                <td><span className={getStatusBadgeClass(log.status)}>{log.status}</span></td>
                                <td>{log.workHours || '-'}</td>
                            </tr>
                        ))}
                        {currentRecords.length === 0 && (
                            <tr>
                                <td colSpan="6" className="text-center">No records found</td>
                            </tr>
                        )}
                    </tbody>
                </table>

                {totalPages > 1 && (
                    <nav>
                        <ul className="pagination justify-content-center mt-3">
                            <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                                <button className="page-link" onClick={() => paginate(currentPage - 1)} disabled={loading}>
                                    Previous
                                </button>
                            </li>
                            {Array.from({ length: totalPages }, (_, i) => (
                                <li key={i} className={`page-item ${currentPage === i + 1 ? 'active' : ''}`}>
                                    <button className="page-link" onClick={() => paginate(i + 1)} disabled={loading}>
                                        {i + 1}
                                    </button>
                                </li>
                            ))}
                            <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                                <button className="page-link" onClick={() => paginate(currentPage + 1)} disabled={loading}>
                                    Next
                                </button>
                            </li>
                        </ul>
                    </nav>
                )}
            </div>
        </div>
    );
};

export default TeacherPunch;