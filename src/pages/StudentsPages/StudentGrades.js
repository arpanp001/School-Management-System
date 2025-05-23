// src/pages/StudentsPages/StudentGrades.js
import React, { useState, useEffect, useCallback } from 'react';
import { db } from '../../firebase/config';
import { collection, getDocs } from 'firebase/firestore';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'react-toastify';
import '../StudentPagesStyle/StudentGrades.css';

const StudentGrades = () => {
    const { currentUser } = useAuth();
    const [grades, setGrades] = useState([]);
    const [classes, setClasses] = useState([]);
    const [subjects, setSubjects] = useState([]);
    const [teachers, setTeachers] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedSubject, setSelectedSubject] = useState('all');

    const fetchStudentGrades = useCallback(async () => {
        if (!currentUser) return;
        try {
            setIsLoading(true);

            // Fetch student class assignments
            const classStudentSnap = await getDocs(collection(db, 'studentAssignments'));
            const studentClasses = classStudentSnap.docs
                .filter(doc => doc.data().studentId === currentUser.uid)
                .map(doc => doc.data().classId);

            // Fetch class details
            const classesSnap = await getDocs(collection(db, 'classes'));
            const filteredClasses = classesSnap.docs
                .filter(doc => studentClasses.includes(doc.id))
                .map(doc => ({ id: doc.id, ...doc.data() }));
            setClasses(filteredClasses);

            // Fetch grades
            const gradesSnap = await getDocs(collection(db, 'grades'));
            const studentGrades = gradesSnap.docs
                .filter(doc => doc.data().studentId === currentUser.uid)
                .map(doc => ({ id: doc.id, ...doc.data() }));
            setGrades(studentGrades);

            // Fetch subjects
            const subjectsSnap = await getDocs(collection(db, 'subjects'));
            setSubjects(subjectsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));

            // Fetch teachers
            const teachersSnap = await getDocs(collection(db, 'teacherLog'));
            setTeachers(teachersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));

            setIsLoading(false);
        } catch (error) {
            console.error('Error fetching student grades:', error);
            toast.error('Error fetching grades: ' + error.message);
            setIsLoading(false);
        }
    }, [currentUser]);

    useEffect(() => {
        if (!currentUser) {
            setIsLoading(false);
            return;
        }
        fetchStudentGrades();
    }, [currentUser, fetchStudentGrades]);

    // Filtered grades based on subject selection
    const filteredGrades = selectedSubject === 'all'
        ? grades
        : grades.filter(grade => grade.subjectId === selectedSubject);

    // Calculate overall average
    const calculateOverallAverage = () => {
        if (grades.length === 0) return 0;
        const total = grades.reduce((sum, grade) => sum + grade.marks, 0);
        return (total / grades.length).toFixed(2);
    };

    // Helper to get performance category
    const getPerformanceCategory = (marks) => {
        if (marks >= 90) return { label: 'Excellent', class: 'sg-performance-excellent' };
        if (marks >= 80) return { label: 'Very Good', class: 'sg-performance-very-good' };
        if (marks >= 70) return { label: 'Good', class: 'sg-performance-good' };
        if (marks >= 60) return { label: 'Satisfactory', class: 'sg-performance-satisfactory' };
        return { label: 'Needs Improvement', class: 'sg-performance-needs-improvement' };
    };

    if (isLoading) {
        return (
            <div className="sg-container">
                <div className="sg-loading-spinner">
                    <div className="sg-spinner"></div>
                    <p>Loading your academic records...</p>
                </div>
            </div>
        );
    }

    if (!currentUser) {
        return (
            <div className="sg-container">
                <div className="sg-auth-message">
                    <i className="sg-icon-lock"></i>
                    <h3>Authentication Required</h3>
                    <p>Please log in to view your academic records and grades.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="sg-container">
            <div className="sg-header">
                <h2 className="sg-title">Academic Performance Dashboard</h2>
                <div className="sg-overview-card">
                    <div className="sg-overview-item">
                        <span className="sg-overview-label">Overall Average</span>
                        <span className="sg-overview-value">{calculateOverallAverage()}%</span>
                    </div>
                    <div className="sg-overview-item">
                        <span className="sg-overview-label">Subjects</span>
                        <span className="sg-overview-value">{new Set(grades.map(g => g.subjectId)).size}</span>
                    </div>
                    <div className="sg-overview-item">
                        <span className="sg-overview-label">Assessments</span>
                        <span className="sg-overview-value">{grades.length}</span>
                    </div>
                </div>
            </div>

            <div className="sg-content">
                <div className="sg-filters">
                    <h3 className="sg-section-title">Grades Summary</h3>
                    <div className="sg-filter-control">
                        <label htmlFor="subjectFilter" className="sg-filter-label">Filter by Subject:</label>
                        <select
                            id="subjectFilter"
                            className="sg-select"
                            value={selectedSubject}
                            onChange={(e) => setSelectedSubject(e.target.value)}
                        >
                            <option value="all">All Subjects</option>
                            {subjects.map(subject => (
                                <option key={subject.id} value={subject.id}>
                                    {subject.subjectName}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="sg-table-container">
                    <table className="sg-table">
                        <thead className="sg-table-header">
                            <tr>
                                <th className="sg-table-cell">Class</th>
                                <th className="sg-table-cell">Subject</th>
                                <th className="sg-table-cell">Teacher</th>
                                <th className="sg-table-cell">Marks</th>
                                <th className="sg-table-cell">Performance</th>
                                <th className="sg-table-cell">Comments</th>
                            </tr>
                        </thead>
                        <tbody className="sg-table-body">
                            {filteredGrades.map(grade => {
                                const classData = classes.find(c => c.id === grade.classId);
                                const subjectData = subjects.find(s => s.id === grade.subjectId);
                                const teacherData = teachers.find(t => t.id === grade.teacherId);
                                const performance = getPerformanceCategory(grade.marks);

                                return (
                                    <tr key={grade.id} className="sg-table-row">
                                        <td className="sg-table-cell">
                                            {classData
                                                ? `${classData.className} - ${classData.section}`
                                                : 'N/A'}
                                        </td>
                                        <td className="sg-table-cell">{subjectData ? subjectData.subjectName : 'N/A'}</td>
                                        <td className="sg-table-cell">{teacherData ? teacherData.email : 'N/A'}</td>
                                        <td className="sg-table-cell sg-marks">{grade.marks}%</td>
                                        <td className={`sg-table-cell ${performance.class}`}>
                                            {performance.label}
                                        </td>
                                        <td className="sg-table-cell sg-comments">{grade.comments || '-'}</td>
                                    </tr>
                                );
                            })}
                            {filteredGrades.length === 0 && (
                                <tr className="sg-table-row sg-empty-row">
                                    <td colSpan="6" className="sg-table-cell sg-empty-message">
                                        No grades available for the selected criteria
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {grades.length > 0 && (
                    <div className="sg-subject-breakdown">
                        <h3 className="sg-section-title">Subject Performance Analysis</h3>
                        <div className="sg-cards-grid">
                            {subjects
                                .filter(subject =>
                                    grades.some(grade => grade.subjectId === subject.id)
                                )
                                .map(subject => {
                                    const subjectGrades = grades.filter(g => g.subjectId === subject.id);
                                    const averageMarks = subjectGrades.length > 0
                                        ? (subjectGrades.reduce((sum, g) => sum + g.marks, 0) / subjectGrades.length).toFixed(2)
                                        : 0;
                                    const highestMark = Math.max(...subjectGrades.map(g => g.marks));
                                    const performance = getPerformanceCategory(averageMarks);

                                    return (
                                        <div key={subject.id} className="sg-subject-card">
                                            <div className="sg-subject-header">
                                                <h4 className="sg-subject-title">{subject.subjectName}</h4>
                                                <span className={`sg-subject-performance ${performance.class}`}>
                                                    {performance.label}
                                                </span>
                                            </div>
                                            <div className="sg-subject-content">
                                                <div className="sg-subject-stats">
                                                    <div className="sg-stat-item">
                                                        <span className="sg-stat-label">Average</span>
                                                        <span className="sg-stat-value">{averageMarks}%</span>
                                                    </div>
                                                    <div className="sg-stat-item">
                                                        <span className="sg-stat-label">Highest</span>
                                                        <span className="sg-stat-value">{highestMark}%</span>
                                                    </div>
                                                    <div className="sg-stat-item">
                                                        <span className="sg-stat-label">Assessments</span>
                                                        <span className="sg-stat-value">{subjectGrades.length}</span>
                                                    </div>
                                                </div>
                                                <div className="sg-progress-container">
                                                    <div
                                                        className="sg-progress-bar"
                                                        style={{ width: `${averageMarks}%` }}
                                                    ></div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default StudentGrades;