import React, { useState, useEffect, useCallback } from 'react';
import { db, auth } from '../../firebase/config';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { toast } from 'react-toastify';
import '../TeacherDashboardCardCss/TeacherGradesCard.css'; // Adjust the path as necessary

const TeacherGradesCard = () => {
    const [grades, setGrades] = useState([]);
    const [subjects, setSubjects] = useState([]);
    const [selectedSubject, setSelectedSubject] = useState('');
    const [students, setStudents] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const teacherId = auth.currentUser?.uid;

    const fetchData = useCallback(async () => {
        if (!teacherId) return;
        setIsLoading(true);
        try {
            // Fetch subjects assigned to the teacher
            const classTeacherSnap = await getDocs(collection(db, 'classTeacherMapping'));
            const teacherSubjects = classTeacherSnap.docs
                .filter(doc => doc.data().teacherId === teacherId)
                .flatMap(doc => doc.data().subjectIds || []);

            const subjectsSnap = await getDocs(collection(db, 'subjects'));
            const filteredSubjects = subjectsSnap.docs
                .filter(doc => teacherSubjects.includes(doc.id))
                .map(doc => ({ id: doc.id, ...doc.data() }));
            setSubjects(filteredSubjects);
            if (filteredSubjects.length > 0) {
                setSelectedSubject(filteredSubjects[0].id); // Default to first subject
            }

            // Fetch grades for the teacher
            const gradesQuery = query(
                collection(db, 'grades'),
                where('teacherId', '==', teacherId)
            );
            const gradesSnap = await getDocs(gradesQuery);
            const teacherGrades = gradesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setGrades(teacherGrades);

            // Fetch students
            const studentsSnap = await getDocs(collection(db, 'studentLog'));
            setStudents(studentsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        } catch (error) {
            console.error('Error fetching data:', error);
            toast.error('Error loading grades: ' + error.message);
        } finally {
            setIsLoading(false);
        }
    }, [teacherId]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // Filter and sort grades for the selected subject
    const topGrades = selectedSubject
        ? grades
            .filter(grade => grade.subjectId === selectedSubject)
            .sort((a, b) => b.marks - a.marks)
            .slice(0, 3)
        : [];

    if (isLoading) {
        return (
            <div className="grades-card-container">
                <h3>Grades</h3>
                <p>Loading...</p>
            </div>
        );
    }

    return (
        <div className="grades-card-container">
            <h3>Top Student Grades</h3>
            {subjects.length > 0 ? (
                <>
                    <select
                        className="subject-select"
                        value={selectedSubject}
                        onChange={(e) => setSelectedSubject(e.target.value)}
                        disabled={isLoading}
                    >
                        {subjects.map(subject => (
                            <option key={subject.id} value={subject.id}>
                                {subject.subjectName}
                            </option>
                        ))}
                    </select>
                    {topGrades.length > 0 ? (
                        <ul className="grades-list">
                            {topGrades.map((grade, index) => {
                                const student = students.find(s => s.id === grade.studentId);
                                return (
                                    <li key={grade.id} className="grade-item">
                                        <span className="grade-rank">#{index + 1}</span>
                                        <div className="grade-details">
                                            <strong>{student ? student.email : 'Unknown Student'}</strong>
                                            <span>Marks: {grade.marks}%</span>
                                            <span>{grade.comments || 'No comments'}</span>
                                        </div>
                                    </li>
                                );
                            })}
                        </ul>
                    ) : (
                        <p className="no-grades">No grades available for this subject.</p>
                    )}
                </>
            ) : (
                <p className="no-grades">No subjects assigned to you.</p>
            )}
        </div>
    );
};

export default TeacherGradesCard;