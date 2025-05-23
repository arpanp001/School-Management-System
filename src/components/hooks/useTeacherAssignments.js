// src/components/TeacherDashboardCard/useTeacherAssignments.js
import { useState, useEffect } from 'react';
import { db, auth } from '../../firebase/config';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { toast } from 'react-toastify';

const useTeacherAssignments = () => {
    const [assignments, setAssignments] = useState([]);
    const [classes, setClasses] = useState([]);
    const [subjects, setSubjects] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const currentUser = auth.currentUser;
        if (!currentUser) {
            toast.error('Please log in to view your assignments');
            setLoading(false);
            return;
        }

        const unsubClasses = onSnapshot(collection(db, 'classes'), (snapshot) => {
            setClasses(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        });

        const unsubSubjects = onSnapshot(collection(db, 'subjects'), (snapshot) => {
            setSubjects(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        });

        const assignmentsQuery = query(
            collection(db, 'classTeacherMapping'),
            where('teacherId', '==', currentUser.uid)
        );
        const unsubAssignments = onSnapshot(assignmentsQuery, (snapshot) => {
            const fetchedAssignments = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setAssignments(fetchedAssignments);
            setLoading(false);
        });

        return () => {
            unsubClasses();
            unsubSubjects();
            unsubAssignments();
        };
    }, []);

    const getClassDetails = (classId) => {
        const classData = classes.find(c => c.id === classId);
        return classData ? { name: classData.className, section: classData.section } : { name: 'N/A', section: 'N/A' };
    };

    const getSubjectNames = (subjectIds) => {
        if (!subjectIds || subjectIds.length === 0) return 'No subjects assigned';
        return subjectIds.map(subjectId => {
            const subject = subjects.find(s => s.id === subjectId);
            return subject ? subject.subjectName : 'Unknown';
        }).join(', ');
    };

    return { assignments, getClassDetails, getSubjectNames, loading };
};

export default useTeacherAssignments;