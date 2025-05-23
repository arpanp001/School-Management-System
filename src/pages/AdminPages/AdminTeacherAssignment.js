import React, { useState, useEffect } from 'react';
import { db } from '../../firebase/config';
import { collection, addDoc, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { toast } from 'react-toastify';
import '../AdminPagesStyle/AdminTeacherAssignment.css';

// Component for the teacher assignment form
const TeacherAssignmentForm = ({ classes, teachers, selectedClass, setSelectedClass, selectedTeacher, setSelectedTeacher, handleSubmit }) => {
    const handleFormSubmit = async (e) => {
        e.preventDefault();
        if (!selectedClass || !selectedTeacher) {
            toast.error('Please select both a class and a teacher');
            return;
        }
        handleSubmit(e);
    };

    return (
        <form onSubmit={handleFormSubmit} className="teacher-assignment-form">
            <div className="form-grid">
                <div className="form-group">
                    <select
                        className="form-input"
                        value={selectedClass}
                        onChange={(e) => setSelectedClass(e.target.value)}
                        required
                    >
                        <option value="">Select Class</option>
                        {classes.map(cls => (
                            <option key={cls.id} value={cls.id}>
                                {cls.className} - {cls.section}
                            </option>
                        ))}
                    </select>
                </div>
                <div className="form-group">
                    <select
                        className="form-input"
                        value={selectedTeacher}
                        onChange={(e) => setSelectedTeacher(e.target.value)}
                        required
                    >
                        <option value="">Select Teacher</option>
                        {teachers.map(teacher => (
                            <option key={teacher.id} value={teacher.id}>{teacher.email}</option>
                        ))}
                    </select>
                </div>
            </div>
            <div className="form-buttons">
                <button type="submit" className="btn btn-primary">Assign Teacher</button>
            </div>
        </form>
    );
};

// Component for the teacher assignment table
const TeacherAssignmentTable = ({ assignments, classes, teachers, subjects, handleDelete }) => (
    <div className="table-container">
        <table className="teacher-assignment-table">
            <thead>
                <tr>
                    <th>Class</th>
                    <th>Teacher</th>
                    <th>Subjects</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
                {assignments.map(assignment => {
                    const classData = classes.find(c => c.id === assignment.classId);
                    const teacherData = teachers.find(t => t.id === assignment.teacherId);
                    return (
                        <tr key={assignment.id}>
                            <td>{classData ? `${classData.className} - ${classData.section}` : 'N/A'}</td>
                            <td>{teacherData ? teacherData.email : 'N/A'}</td>
                            <td>
                                {assignment.subjectIds?.map(subId => {
                                    const subject = subjects.find(s => s.id === subId);
                                    return subject ? subject.subjectName : '';
                                }).join(', ') || 'No subjects'}
                            </td>
                            <td>
                                <button
                                    className="btn btn-delete"
                                    onClick={() => handleDelete(assignment.id)}
                                >
                                    Remove
                                </button>
                            </td>
                        </tr>
                    );
                })}
                {assignments.length === 0 && (
                    <tr>
                        <td colSpan="4" className="no-data">
                            No assignments found
                        </td>
                    </tr>
                )}
            </tbody>
        </table>
    </div>
);

const AdminTeacherAssignment = () => {
    // State management
    const [classes, setClasses] = useState([]);
    const [subjects, setSubjects] = useState([]);
    const [teachers, setTeachers] = useState([]);
    const [assignments, setAssignments] = useState([]);
    const [selectedClass, setSelectedClass] = useState('');
    const [selectedTeacher, setSelectedTeacher] = useState('');

    // Data fetching
    useEffect(() => {
        fetchData();
        fetchAssignments();
    }, []);

    const fetchData = async () => {
        try {
            const classesSnap = await getDocs(collection(db, 'classes'));
            setClasses(classesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));

            const subjectsSnap = await getDocs(collection(db, 'subjects'));
            setSubjects(subjectsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));

            const teachersSnap = await getDocs(collection(db, 'teacherLog'));
            setTeachers(teachersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        } catch (error) {
            toast.error('Error fetching data: ' + error.message);
        }
    };

    const fetchAssignments = async () => {
        try {
            const assignmentsSnap = await getDocs(collection(db, 'classTeacherMapping'));
            setAssignments(assignmentsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        } catch (error) {
            toast.error('Error fetching assignments: ' + error.message);
        }
    };

    // Firebase operations
    const checkDuplicateAssignment = (classId, teacherId) => {
        return assignments.some(assignment =>
            assignment.classId === classId && assignment.teacherId === teacherId
        );
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (checkDuplicateAssignment(selectedClass, selectedTeacher)) {
                toast.error('This class is already assigned to this teacher');
                return;
            }

            const selectedClassData = classes.find(cls => cls.id === selectedClass);
            const subjectIds = selectedClassData?.subjects || [];

            await addDoc(collection(db, 'classTeacherMapping'), {
                classId: selectedClass,
                teacherId: selectedTeacher,
                subjectIds,
                createdAt: new Date().toISOString()
            });

            await Promise.all(subjectIds.map(subjectId =>
                addDoc(collection(db, 'teacherSubjects'), {
                    teacherId: selectedTeacher,
                    subjectId,
                    classId: selectedClass,
                    createdAt: new Date().toISOString()
                })
            ));

            toast.success('Teacher assigned successfully with subjects');
            setSelectedClass('');
            setSelectedTeacher('');
            fetchAssignments();
        } catch (error) {
            toast.error('Error assigning teacher: ' + error.message);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to remove this assignment?')) {
            try {
                const assignment = assignments.find(a => a.id === id);
                const teacherSubjectsSnap = await getDocs(collection(db, 'teacherSubjects'));
                const teacherSubjectsToDelete = teacherSubjectsSnap.docs.filter(doc =>
                    doc.data().teacherId === assignment.teacherId &&
                    doc.data().classId === assignment.classId
                );

                await Promise.all([
                    deleteDoc(doc(db, 'classTeacherMapping', id)),
                    ...teacherSubjectsToDelete.map(ts => deleteDoc(doc(db, 'teacherSubjects', ts.id)))
                ]);

                toast.success('Assignment removed successfully');
                fetchAssignments();
            } catch (error) {
                toast.error('Error removing assignment: ' + error.message);
            }
        }
    };

    return (
        <div className="container">
            <h2 className="page-title">Assign Teachers to Classes</h2>

            <TeacherAssignmentForm
                classes={classes}
                teachers={teachers}
                selectedClass={selectedClass}
                setSelectedClass={setSelectedClass}
                selectedTeacher={selectedTeacher}
                setSelectedTeacher={setSelectedTeacher}
                handleSubmit={handleSubmit}
            />

            <div className="table-wrapper">
                <TeacherAssignmentTable
                    assignments={assignments}
                    classes={classes}
                    teachers={teachers}
                    subjects={subjects}
                    handleDelete={handleDelete}
                />
            </div>
        </div>
    );
};

export default AdminTeacherAssignment;