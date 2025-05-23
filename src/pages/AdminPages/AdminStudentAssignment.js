import React, { useState, useEffect } from 'react';
import { db } from '../../firebase/config';
import { collection, setDoc, deleteDoc, doc, onSnapshot, getDocs } from 'firebase/firestore';
import { toast } from 'react-toastify';
import '../AdminPagesStyle/AdminStudentAssignments.css';

// Component for the student assignment form
const StudentAssignmentForm = ({ students, classes, formData, setFormData, handleSubmit }) => {
    const handleFormSubmit = async (e) => {
        e.preventDefault();
        if (!formData.studentId || !formData.classId) {
            toast.error('Please select both a student and a class');
            return;
        }
        handleSubmit(e);
    };

    return (
        <form onSubmit={handleFormSubmit} className="student-assignment-form">
            <div className="form-grid">
                <div className="form-group">
                    <select
                        className="form-input"
                        value={formData.studentId}
                        onChange={(e) => setFormData({ ...formData, studentId: e.target.value })}
                        required
                    >
                        <option value="">Select Student</option>
                        {students.map(student => (
                            <option key={student.id} value={student.id}>{student.email}</option>
                        ))}
                    </select>
                </div>
                <div className="form-group">
                    <select
                        className="form-input"
                        value={formData.classId}
                        onChange={(e) => setFormData({ ...formData, classId: e.target.value })}
                        required
                    >
                        <option value="">Select Class</option>
                        {classes.map(cls => (
                            <option key={cls.id} value={cls.id}>{`${cls.className} - ${cls.section}`}</option>
                        ))}
                    </select>
                </div>
            </div>
            <div className="form-buttons">
                <button type="submit" className="btn btn-primary">Assign</button>
            </div>
        </form>
    );
};

// Component for the student assignment table
const StudentAssignmentTable = ({ studentAssignments, students, classes, subjects, teachers, handleDelete }) => (
    <div className="table-container">
        <table className="student-assignment-table">
            <thead>
                <tr>
                    <th>Student</th>
                    <th>Class</th>
                    <th>Subjects</th>
                    <th>Teachers</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
                {studentAssignments.map(assignment => {
                    const student = students.find(s => s.id === assignment.studentId);
                    const classData = classes.find(c => c.id === assignment.classId);
                    return (
                        <tr key={assignment.id}>
                            <td>{student?.email || 'N/A'}</td>
                            <td>{classData ? `${classData.className} - ${classData.section}` : 'N/A'}</td>
                            <td>
                                {assignment.subjects?.map(subId => {
                                    const subject = subjects.find(s => s.id === subId);
                                    return subject ? subject.subjectName : 'Unknown';
                                }).join(', ') || 'No subjects'}
                            </td>
                            <td>
                                {assignment.teachers?.map(teacherId => {
                                    const teacher = teachers.find(t => t.id === teacherId);
                                    return teacher ? teacher.email : 'Unknown';
                                }).join(', ') || 'No teachers'}
                            </td>
                            <td>
                                <button
                                    className="btn btn-delete"
                                    onClick={() => handleDelete(assignment.studentId)}
                                >
                                    Remove
                                </button>
                            </td>
                        </tr>
                    );
                })}
                {studentAssignments.length === 0 && (
                    <tr>
                        <td colSpan="5" className="no-data">
                            No student assignments found
                        </td>
                    </tr>
                )}
            </tbody>
        </table>
    </div>
);

const AdminStudentAssignments = () => {
    // State management
    const [studentAssignments, setStudentAssignments] = useState([]);
    const [classes, setClasses] = useState([]);
    const [students, setStudents] = useState([]);
    const [subjects, setSubjects] = useState([]);
    const [teachers, setTeachers] = useState([]);
    const [formData, setFormData] = useState({
        studentId: '',
        classId: ''
    });

    // Data fetching with real-time updates
    useEffect(() => {
        const unsubClasses = onSnapshot(collection(db, 'classes'), (snapshot) => {
            setClasses(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        });
        const unsubStudents = onSnapshot(collection(db, 'studentLog'), (snapshot) => {
            setStudents(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        });
        const unsubAssignments = onSnapshot(collection(db, 'studentAssignments'), (snapshot) => {
            setStudentAssignments(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        });
        const unsubSubjects = onSnapshot(collection(db, 'subjects'), (snapshot) => {
            setSubjects(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        });
        const unsubTeachers = onSnapshot(collection(db, 'teacherLog'), (snapshot) => {
            setTeachers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        });

        return () => {
            unsubClasses();
            unsubStudents();
            unsubAssignments();
            unsubSubjects();
            unsubTeachers();
        };
    }, []);

    // Firebase operations
    const checkDuplicateAssignment = (studentId, classId) => {
        const existingAssignment = studentAssignments.find(assignment =>
            assignment.studentId === studentId
        );
        return existingAssignment && existingAssignment.classId === classId;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const selectedClass = classes.find(cls => cls.id === formData.classId);
            if (!selectedClass) {
                toast.error('Selected class not found');
                return;
            }

            if (checkDuplicateAssignment(formData.studentId, formData.classId)) {
                toast.error('This class is already assigned to this student');
                return;
            }

            const classSubjects = selectedClass.subjects || [];
            const teacherAssignments = await getDocs(collection(db, 'classTeacherMapping'));
            const classTeachers = teacherAssignments.docs
                .filter(doc => doc.data().classId === formData.classId)
                .map(doc => doc.data().teacherId);

            if (classSubjects.length === 0) {
                toast.warning('No subjects assigned to this class yet');
            }
            if (classTeachers.length === 0) {
                toast.warning('No teachers assigned to this class yet');
            }

            await setDoc(doc(db, 'studentAssignments', formData.studentId), {
                studentId: formData.studentId,
                classId: formData.classId,
                subjects: classSubjects,
                teachers: classTeachers,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            });

            toast.success('Student assigned to class successfully');
            resetForm();
        } catch (error) {
            toast.error('Error assigning student: ' + error.message);
        }
    };

    const handleDelete = async (studentId) => {
        if (window.confirm('Are you sure you want to remove this student assignment?')) {
            try {
                await deleteDoc(doc(db, 'studentAssignments', studentId));
                toast.success('Student assignment removed successfully');
            } catch (error) {
                toast.error('Error removing assignment: ' + error.message);
            }
        }
    };

    const resetForm = () => {
        setFormData({ studentId: '', classId: '' });
    };

    return (
        <div className="container">
            <h2 className="page-title">Assign Students to Classes</h2>

            <StudentAssignmentForm
                students={students}
                classes={classes}
                formData={formData}
                setFormData={setFormData}
                handleSubmit={handleSubmit}
            />

            <div className="table-wrapper">
                <StudentAssignmentTable
                    studentAssignments={studentAssignments}
                    students={students}
                    classes={classes}
                    subjects={subjects}
                    teachers={teachers}
                    handleDelete={handleDelete}
                />
            </div>
        </div>
    );
};

export default AdminStudentAssignments;