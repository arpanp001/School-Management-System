// src/components/TeacherDashboardCard/useTeacherGrades.js
import { useState, useEffect, useCallback } from 'react';
import { db, auth } from '../../firebase/config';
import { collection, getDocs } from 'firebase/firestore';
import { toast } from 'react-toastify';

const useTeacherGrades = () => {
    const [classes, setClasses] = useState([]);
    const [subjects, setSubjects] = useState([]);
    const [grades, setGrades] = useState([]);
    const [selectedClass, setSelectedClass] = useState('');
    const [selectedSubject, setSelectedSubject] = useState('');
    const [averageGrades, setAverageGrades] = useState({});
    const [loading, setLoading] = useState(true);

    const fetchData = useCallback(async () => {
        if (!auth.currentUser) return;

        try {
            setLoading(true);

            // Fetch classes assigned to the teacher
            const classTeacherSnap = await getDocs(collection(db, 'classTeacherMapping'));
            const teacherClasses = classTeacherSnap.docs
                .filter(doc => doc.data().teacherId === auth.currentUser.uid)
                .map(doc => doc.data().classId);

            const classesSnap = await getDocs(collection(db, 'classes'));
            const filteredClasses = classesSnap.docs
                .filter(doc => teacherClasses.includes(doc.id))
                .map(doc => ({ id: doc.id, ...doc.data() }));
            setClasses(filteredClasses);

            // Fetch subjects assigned to the teacher
            const teacherSubjects = classTeacherSnap.docs
                .filter(doc => doc.data().teacherId === auth.currentUser.uid)
                .flatMap(doc => (doc.data().subjectIds || []).map(subjectId => ({
                    classId: doc.data().classId,
                    subjectId,
                })));
            const subjectsSnap = await getDocs(collection(db, 'subjects'));
            const allSubjects = subjectsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            const filteredSubjects = allSubjects.filter(subject =>
                teacherSubjects.some(ts => ts.subjectId === subject.id)
            );
            setSubjects(filteredSubjects);

            // Fetch grades
            const gradesSnap = await getDocs(collection(db, 'grades'));
            const teacherGrades = gradesSnap.docs
                .filter(doc => doc.data().teacherId === auth.currentUser.uid)
                .map(doc => ({ id: doc.id, ...doc.data() }));
            setGrades(teacherGrades);

            // Compute initial averages
            computeAverages('', ''); // Initial computation for all classes and subjects
        } catch (error) {
            console.error('Error fetching grades data:', error);
            toast.error('Error fetching grades: ' + error.message);
        } finally {
            setLoading(false);
        }
        // eslint-disable-next-line
    }, []);

    const computeAverages = useCallback((classId, subjectId) => {
        const filteredGrades = grades.filter(grade => {
            const matchesClass = !classId || grade.classId === classId;
            const matchesSubject = !subjectId || grade.subjectId === subjectId;
            return matchesClass && matchesSubject;
        });

        const averages = {};
        filteredGrades.forEach(grade => {
            const classKey = grade.classId;
            if (!averages[classKey]) averages[classKey] = {};
            averages[classKey][grade.subjectId] = averages[classKey][grade.subjectId] || [];
            averages[classKey][grade.subjectId].push(grade.marks);
        });

        const computedAverages = {};
        for (const classId in averages) {
            computedAverages[classId] = {};
            for (const subjectId in averages[classId]) {
                const marks = averages[classId][subjectId];
                computedAverages[classId][subjectId] = marks.length
                    ? (marks.reduce((sum, mark) => sum + mark, 0) / marks.length).toFixed(2)
                    : 0;
            }
        }

        setAverageGrades(computedAverages);
    }, [grades]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    useEffect(() => {
        computeAverages(selectedClass, selectedSubject);
    }, [selectedClass, selectedSubject, computeAverages]);

    return {
        classes,
        subjects,
        averageGrades,
        selectedClass,
        setSelectedClass,
        selectedSubject,
        setSelectedSubject,
        loading,
    };
};

export default useTeacherGrades;