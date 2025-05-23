import React, { useState, useEffect } from 'react';
import { db, auth } from '../../firebase/config';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { toast } from 'react-toastify';
import '../StudentPagesStyle/StudentSubjects.css';

// AssignmentCard Component
const AssignmentCard = ({ assignment, classes, subjects, teachers }) => {
    const getClassDetails = (classId) => {
        const classData = classes.find((c) => c.id === classId);
        return classData ? { name: classData.className, section: classData.section } : { name: 'N/A', section: 'N/A' };
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

    const getTeacherEmails = (teacherIds) => {
        if (!teacherIds || teacherIds.length === 0) return 'No teachers assigned';
        return teacherIds
            .map((teacherId) => {
                const teacher = teachers.find((t) => t.id === teacherId);
                return teacher ? teacher.email : 'Unknown';
            })
            .join(', ');
    };

    const { name, section } = getClassDetails(assignment.classId);

    return (
        <div className="card">
            <h3 className="course-name">{name}</h3>
            <div className="details">
                <div className="detail-item">
                    <span className="label">Section:</span> {section}
                </div>
                <div className="detail-item subject">
                    <span className="label">Subjects:</span> {getSubjectNames(assignment.subjects)}
                </div>
                <div className="detail-item teacher">
                    <span className="label">Teachers:</span> {getTeacherEmails(assignment.teachers)}
                </div>
            </div>
        </div>
    );
};

// Main StudentSubjects Component
const StudentSubjects = () => {
    const [classes, setClasses] = useState([]);
    const [subjects, setSubjects] = useState([]);
    const [teachers, setTeachers] = useState([]);
    const [studentAssignment, setStudentAssignment] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const currentUser = auth.currentUser;
        if (!currentUser) {
            toast.error('Please log in to view your assignments');
            setLoading(false);
            return;
        }

        // Fetch classes
        const unsubClasses = onSnapshot(
            collection(db, 'classes'),
            (snapshot) => {
                setClasses(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
            },
            (error) => {
                toast.error('Failed to fetch classes');
                console.error(error);
            }
        );

        // Fetch subjects
        const unsubSubjects = onSnapshot(
            collection(db, 'subjects'),
            (snapshot) => {
                setSubjects(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
            },
            (error) => {
                toast.error('Failed to fetch subjects');
                console.error(error);
            }
        );

        // Fetch teachers
        const unsubTeachers = onSnapshot(
            collection(db, 'teacherLog'),
            (snapshot) => {
                setTeachers(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
            },
            (error) => {
                toast.error('Failed to fetch teachers');
                console.error(error);
            }
        );

        // Fetch student assignment
        const studentAssignmentQuery = query(
            collection(db, 'studentAssignments'),
            where('studentId', '==', currentUser.uid)
        );
        const unsubStudentAssignment = onSnapshot(
            studentAssignmentQuery,
            (snapshot) => {
                if (!snapshot.empty) {
                    const assignmentData = snapshot.docs[0].data();
                    setStudentAssignment({
                        id: snapshot.docs[0].id,
                        ...assignmentData,
                    });
                } else {
                    setStudentAssignment(null);
                }
                setLoading(false);
            },
            (error) => {
                toast.error('Failed to fetch assignment');
                console.error(error);
                setLoading(false);
            }
        );

        // Cleanup subscriptions
        return () => {
            unsubClasses();
            unsubSubjects();
            unsubTeachers();
            unsubStudentAssignment();
        };
    }, []);

    return (
        <div className="container">
            <h2 className="title">My Assigned Class & Subjects</h2>
            {loading ? (
                <div className="loading">Loading assignments...</div>
            ) : studentAssignment ? (
                <div className="grid">
                    <AssignmentCard
                        assignment={studentAssignment}
                        classes={classes}
                        subjects={subjects}
                        teachers={teachers}
                    />
                </div>
            ) : (
                <div className="no-assignments">No class assignment found</div>
            )}
        </div>
    );
};

export default StudentSubjects;