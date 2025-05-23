import React, { useState, useEffect } from 'react';
import { db, auth } from '../../firebase/config';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { toast } from 'react-toastify';
import '../TeacherPagesStyle/TeacherSubjects.css';

// Loading spinner component (for future use)
const LoadingSpinner = () => (
    <div className="subjects-loading">
        <span>Loading...</span>
    </div>
);

// Component for each assignment card
const AssignmentCard = ({ assignment, classes, subjects }) => {
    const getClassDetails = (classId) => {
        const classData = classes.find((c) => c.id === classId);
        return classData
            ? { name: classData.className, section: classData.section }
            : { name: 'N/A', section: 'N/A' };
    };

    const getSubjectNames = (subjectIds) => {
        if (!subjectIds || subjectIds.length === 0) return 'No subjects assigned';
        return subjectIds
            .map((subjectId) => {
                const subject = subjects.find((s) => s.id === subjectId);
                return subject ? subject.subjectName : 'Unknown';
            })
            .join(', ');
    };

    const { name, section } = getClassDetails(assignment.classId);
    const subjectNames = getSubjectNames(assignment.subjectIds);

    return (
        <div className="subjects-card">
            <div className="subjects-course-name">{name}</div>
            <div className="subjects-details">
                <div className="subjects-subject">
                    <span className="subjects-label">Subjects:</span> {subjectNames}
                </div>
                <div className="subjects-section">
                    <span className="subjects-label">Section:</span> {section}
                </div>
            </div>
        </div>
    );
};

const TeacherSubjects = () => {
    // State management
    const [classes, setClasses] = useState([]);
    const [subjects, setSubjects] = useState([]);
    const [assignments, setAssignments] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    // Data fetching
    useEffect(() => {
        const currentUser = auth.currentUser;
        if (!currentUser) {
            toast.error('Please log in to view your assignments');
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        setError(null);

        const unsubClasses = onSnapshot(
            collection(db, 'classes'),
            (snapshot) => {
                setClasses(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
            },
            (error) => {
                setError('Error fetching classes: ' + error.message);
                toast.error('Error fetching classes: ' + error.message);
            }
        );

        const unsubSubjects = onSnapshot(
            collection(db, 'subjects'),
            (snapshot) => {
                setSubjects(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
            },
            (error) => {
                setError('Error fetching subjects: ' + error.message);
                toast.error('Error fetching subjects: ' + error.message);
            }
        );

        const assignmentsQuery = query(
            collection(db, 'classTeacherMapping'),
            where('teacherId', '==', currentUser.uid)
        );
        const unsubAssignments = onSnapshot(
            assignmentsQuery,
            (snapshot) => {
                setAssignments(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
                setIsLoading(false);
            },
            (error) => {
                setError('Error fetching assignments: ' + error.message);
                toast.error('Error fetching assignments: ' + error.message);
                setIsLoading(false);
            }
        );

        return () => {
            unsubClasses();
            unsubSubjects();
            unsubAssignments();
        };
    }, []);

    if (isLoading) {
        return <LoadingSpinner />;
    }

    if (error) {
        return (
            <div className="subjects-container">
                <h2 className="subjects-title">My Assigned Classes & Subjects</h2>
                <div className="subjects-no-assignments">{error}</div>
            </div>
        );
    }

    return (
        <div className="subjects-container">
            <h2 className="subjects-title">My Assigned Classes & Subjects</h2>
            <div className="subjects-grid-container">
                {assignments.length > 0 ? (
                    assignments.map((assignment) => (
                        <AssignmentCard
                            key={assignment.id}
                            assignment={assignment}
                            classes={classes}
                            subjects={subjects}
                        />
                    ))
                ) : (
                    <div className="subjects-no-assignments">No assignments found</div>
                )}
            </div>
        </div>
    );
};

export default TeacherSubjects;