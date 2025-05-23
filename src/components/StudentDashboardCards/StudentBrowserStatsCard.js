import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { db, auth } from '../../firebase/config';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { toast } from 'react-toastify';
import { FaSpinner, FaArrowUp, FaArrowDown, FaBook, FaFlask, FaCalculator, FaHistory, FaGlobe } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import '../StudentDashboardCardsCss/StudentBrowserStatsCard.css';

const StudentBrowserStatsCard = () => {
    const [subjects, setSubjects] = useState([]);
    const [grades, setGrades] = useState([]);
    const [classes, setClasses] = useState([]);
    const [selectedClass, setSelectedClass] = useState('all');
    const [loading, setLoading] = useState(true);

    const getColor = (percentage) => {
        if (percentage >= 80) return '#22c55e'; // Green
        if (percentage >= 60) return '#f59e0b'; // Yellow
        return '#ef4444'; // Red
    };

    const getTooltipText = (subjectId) => {
        const subjectGrades = grades.filter(g => g.subjectId === subjectId);
        const marks = subjectGrades.map(g => g.marks).join(', ');
        return `${subjectGrades.length} assessment${subjectGrades.length !== 1 ? 's' : ''}${marks ? `: ${marks}` : ''}`;
    };

    const getTrend = (subjectId) => {
        const subjectGrades = grades
            .filter(g => g.subjectId === subjectId)
            .sort((a, b) => (b.createdAt?.toDate?.() || new Date(b.createdAt)) - (a.createdAt?.toDate?.() || new Date(a.createdAt)));
        if (subjectGrades.length < 2) return null;
        return subjectGrades[0].marks > subjectGrades[1].marks ? 'up' : subjectGrades[0].marks < subjectGrades[1].marks ? 'down' : 'stable';
    };

    const getSubjectIcon = (subjectName) => {
        const name = subjectName.toLowerCase();
        if (name.includes('math')) return <FaCalculator />;
        if (name.includes('science')) return <FaFlask />;
        if (name.includes('history')) return <FaHistory />;
        if (name.includes('geography')) return <FaGlobe />;
        return <FaBook />;
    };

    const fetchClasses = async () => {
        try {
            const classStudentSnap = await getDocs(collection(db, 'studentAssignments'));
            const studentClasses = classStudentSnap.docs
                .filter(doc => doc.data().studentId === auth.currentUser.uid)
                .map(doc => doc.data().classId);
            const classesSnap = await getDocs(collection(db, 'classes'));
            const filteredClasses = classesSnap.docs
                .filter(doc => studentClasses.includes(doc.id))
                .map(doc => ({ id: doc.id, ...doc.data() }));
            setClasses(filteredClasses);
        } catch (error) {
            toast.error('Error fetching classes: ' + error.message);
        }
    };

    const fetchGradesData = useCallback(async () => {
        const currentUser = auth.currentUser;
        if (!currentUser) {
            toast.error('Please log in to view your grades');
            setLoading(false);
            return;
        }

        try {
            // Fetch grades for the student
            const gradesQuery = query(
                collection(db, 'grades'),
                where('studentId', '==', currentUser.uid)
            );
            const gradesSnap = await getDocs(gradesQuery);
            const studentGrades = gradesSnap.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                createdAt: doc.data().createdAt?.toDate ? doc.data().createdAt.toDate() : new Date(doc.data().createdAt),
            }));

            // Fetch subjects
            const subjectsSnap = await getDocs(collection(db, 'subjects'));
            const allSubjects = subjectsSnap.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
            }));

            setGrades(studentGrades);
            setSubjects(allSubjects);
        } catch (error) {
            toast.error('Error fetching grades: ' + error.message);
        } finally {
            setLoading(false);
        }
    }, []);

    const filteredGrades = selectedClass === 'all'
        ? grades
        : grades.filter(g => g.classId === selectedClass);

    const subjectGrades = useMemo(() => {
        return subjects
            .map(subject => {
                const subjectGrades = filteredGrades.filter(g => g.subjectId === subject.id);
                const averageMarks = subjectGrades.length > 0
                    ? subjectGrades.reduce((sum, g) => sum + g.marks, 0) / subjectGrades.length
                    : null;
                return {
                    name: subject.subjectName,
                    percentage: averageMarks ? averageMarks.toFixed(1) : null,
                    color: averageMarks ? getColor(averageMarks) : '#6366f1',
                    id: subject.id,
                };
            })
            .filter(subject => subject.percentage !== null);
    }, [subjects, filteredGrades]);

    useEffect(() => {
        fetchClasses();
        fetchGradesData();
    }, [fetchGradesData]);

    return (
        <div className="student-browser-stats-card" role="region" aria-label="Grade overview">
            <div className="browser-card-header">
                <h3 className="browser-card-title">Grade Overview</h3>
            </div>
            <div className="view-grades">
                <Link to="/student/grades" className="view-grades-link" aria-label="View detailed grades">
                    View Grades
                </Link>
            </div>
            <div className="class-filter">
                <select
                    value={selectedClass}
                    onChange={e => setSelectedClass(e.target.value)}
                    aria-label="Filter grades by class"
                    className="class-filter-select"
                >
                    <option value="all">All Classes</option>
                    {classes.map(cls => (
                        <option key={cls.id} value={cls.id}>
                            {cls.className} - {cls.section}
                        </option>
                    ))}
                </select>
            </div>
            {loading ? (
                <div className="loading-spinner" aria-live="polite" aria-busy="true">
                    <FaSpinner className="spinner" aria-label="Loading grades data" />
                </div>
            ) : subjectGrades.length === 0 ? (
                <p className="no-grades">No grades available</p>
            ) : (
                <div className="browser-list" aria-live="polite">
                    {subjectGrades.map((subject, index) => (
                        <div key={index} className="browser-item">
                            <div className="browser-icon">
                                <div className="subject-icon" style={{ color: subject.color }}>
                                    {getSubjectIcon(subject.name)}
                                </div>
                            </div>
                            <div className="browser-info">
                                <span
                                    className="browser-name"
                                    data-tooltip={getTooltipText(subject.id)}
                                    aria-label={`${subject.name}, ${getTooltipText(subject.id)}`}
                                >
                                    {subject.name}
                                </span>
                            </div>
                            <div className="browser-percentage">
                                <span>
                                    {subject.percentage}%
                                    {getTrend(subject.id) === 'up' && (
                                        <FaArrowUp className="trend-icon up" aria-label="Grade improving" />
                                    )}
                                    {getTrend(subject.id) === 'down' && (
                                        <FaArrowDown className="trend-icon down" aria-label="Grade declining" />
                                    )}
                                </span>
                                <div className="progress-bar">
                                    <div
                                        className="progress-fill"
                                        style={{
                                            width: `${subject.percentage}%`,
                                            backgroundColor: subject.color,
                                        }}
                                    ></div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default StudentBrowserStatsCard;