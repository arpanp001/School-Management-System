import React, { useState, useEffect, useCallback } from 'react';
import { db } from '../../firebase/config';
import { collection, addDoc, getDocs, updateDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'react-toastify';
import '../TeacherPagesStyle/TeacherGrades.css';

// Component for displaying loading message
const LoadingMessage = () => (
    <div className="grades-message">Loading...</div>
);

// Component for displaying login message
const LoginMessage = () => (
    <div className="grades-message">Please log in to view grades.</div>
);

// Component for the grade submission form
const GradeForm = ({
    classes,
    availableSubjects,
    availableStudents,
    selectedClass,
    setSelectedClass,
    selectedSubject,
    setSelectedSubject,
    selectedStudent,
    setSelectedStudent,
    marks,
    setMarks,
    comments,
    setComments,
    errors,
    isEditing,
    handleSubmit,
    isLoading,
    validateForm,
}) => (
    <form className="grades-form" onSubmit={handleSubmit} noValidate>
        <div className="grades-form-row">
            <div className="grades-form-group">
                <select
                    className={`grades-form-select ${errors.selectedClass ? 'grades-form-error-input' : ''}`}
                    value={selectedClass}
                    onChange={(e) => setSelectedClass(e.target.value)}
                    onBlur={validateForm}
                    required
                    disabled={isLoading}
                >
                    <option value="">Select Class</option>
                    {classes.map(cls => (
                        <option key={cls.id} value={cls.id}>
                            {cls.className} - {cls.section}
                        </option>
                    ))}
                </select>
                {errors.selectedClass && (
                    <span className="grades-form-error">{errors.selectedClass}</span>
                )}
            </div>
            <div className="grades-form-group">
                <select
                    className={`grades-form-select ${errors.selectedSubject ? 'grades-form-error-input' : ''}`}
                    value={selectedSubject}
                    onChange={(e) => setSelectedSubject(e.target.value)}
                    onBlur={validateForm}
                    required
                    disabled={isLoading || !selectedClass}
                >
                    <option value="">Select Subject</option>
                    {availableSubjects.map(sub => (
                        <option key={sub.id} value={sub.id}>{sub.subjectName}</option>
                    ))}
                </select>
                {errors.selectedSubject && (
                    <span className="grades-form-error">{errors.selectedSubject}</span>
                )}
            </div>
            <div className="grades-form-group">
                <select
                    className={`grades-form-select ${errors.selectedStudent ? 'grades-form-error-input' : ''}`}
                    value={selectedStudent}
                    onChange={(e) => setSelectedStudent(e.target.value)}
                    onBlur={validateForm}
                    required
                    disabled={isLoading || !selectedClass}
                >
                    <option value="">Select Student</option>
                    {availableStudents.map(student => (
                        <option key={student.id} value={student.id}>{student.email}</option>
                    ))}
                </select>
                {errors.selectedStudent && (
                    <span className="grades-form-error">{errors.selectedStudent}</span>
                )}
            </div>
            <div className="grades-form-group grades-form-group-small">
                <input
                    type="number"
                    className={`grades-form-input ${errors.marks ? 'grades-form-error-input' : ''}`}
                    placeholder="Marks"
                    value={marks}
                    onChange={(e) => setMarks(e.target.value)}
                    onBlur={validateForm}
                    min="0"
                    max="100"
                    required
                    disabled={isLoading}
                />
                {errors.marks && (
                    <span className="grades-form-error">{errors.marks}</span>
                )}
            </div>
        </div>
        <div className="grades-form-row">
            <div className="grades-form-group grades-form-group-large">
                <textarea
                    className="grades-form-textarea"
                    placeholder="Comments (optional)"
                    value={comments}
                    onChange={(e) => setComments(e.target.value)}
                    rows="2"
                    disabled={isLoading}
                />
            </div>
            <div className="grades-form-group grades-form-group-small">
                <button
                    type="submit"
                    className="grades-form-button"
                    disabled={isLoading}
                >
                    {isLoading ? 'Processing...' : (isEditing ? 'Update Grade' : 'Add Grade')}
                </button>
            </div>
        </div>
    </form>
);

// Component for the search and filter controls
const GradeFilters = ({
    searchQuery,
    setSearchQuery,
    filterClass,
    setFilterClass,
    filterSubject,
    setFilterSubject,
    classes,
    subjects,
    setCurrentPage,
    isLoading,
}) => (
    <div className="grades-filters">
        <div className="grades-form-group">
            <input
                type="text"
                className="grades-form-input"
                placeholder="Search by student email..."
                value={searchQuery}
                onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                }}
                disabled={isLoading}
            />
        </div>
        <div className="grades-form-group">
            <select
                className="grades-form-select"
                value={filterClass}
                onChange={(e) => {
                    setFilterClass(e.target.value);
                    setCurrentPage(1);
                }}
                disabled={isLoading}
            >
                <option value="">All Classes</option>
                {classes.map(cls => (
                    <option key={cls.id} value={cls.id}>
                        {cls.className} - {cls.section}
                    </option>
                ))}
            </select>
        </div>
        <div className="grades-form-group">
            <select
                className="grades-form-select"
                value={filterSubject}
                onChange={(e) => {
                    setFilterSubject(e.target.value);
                    setCurrentPage(1);
                }}
                disabled={isLoading}
            >
                <option value="">All Subjects</option>
                {subjects.map(sub => (
                    <option key={sub.id} value={sub.id}>{sub.subjectName}</option>
                ))}
            </select>
        </div>
    </div>
);

// Component for the grades table
const GradeTable = ({ currentGrades, classes, subjects, students, handleEdit, handleDelete, isLoading }) => (
    <div className="grades-table-wrapper">
        <table className="grades-table">
            <thead>
                <tr>
                    <th>Class</th>
                    <th>Subject</th>
                    <th>Student</th>
                    <th>Marks</th>
                    <th>Comments</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
                {currentGrades.length === 0 ? (
                    <tr>
                        <td colSpan="6" className="grades-table-empty">
                            No grades found
                        </td>
                    </tr>
                ) : (
                    currentGrades.map(grade => {
                        const classData = classes.find(c => c.id === grade.classId);
                        const subjectData = subjects.find(s => s.id === grade.subjectId);
                        const studentData = students.find(s => s.id === grade.studentId);
                        return (
                            <tr key={grade.id}>
                                <td>{classData ? `${classData.className} - ${classData.section}` : 'N/A'}</td>
                                <td>{subjectData ? subjectData.subjectName : 'N/A'}</td>
                                <td>{studentData ? studentData.email : 'N/A'}</td>
                                <td>{grade.marks}</td>
                                <td>{grade.comments || '-'}</td>
                                <td>
                                    <button
                                        className="grades-table-button grades-table-button-edit"
                                        onClick={() => handleEdit(grade)}
                                        disabled={isLoading}
                                    >
                                        Edit
                                    </button>
                                    <button
                                        className="grades-table-button grades-table-button-delete"
                                        onClick={() => handleDelete(grade.id)}
                                        disabled={isLoading}
                                    >
                                        Delete
                                    </button>
                                </td>
                            </tr>
                        );
                    })
                )}
            </tbody>
        </table>
    </div>
);

// Component for pagination controls
const PaginationControls = ({ currentPage, totalPages, paginate, isLoading }) => (
    <nav className="grades-pagination">
        <button
            className="grades-pagination-button"
            onClick={() => paginate(currentPage - 1)}
            disabled={currentPage === 1 || isLoading}
        >
            Previous
        </button>
        {Array.from({ length: totalPages }, (_, i) => (
            <button
                key={i}
                className={`grades-pagination-button ${currentPage === i + 1 ? 'active' : ''}`}
                onClick={() => paginate(i + 1)}
                disabled={isLoading}
            >
                {i + 1}
            </button>
        ))}
        <button
            className="grades-pagination-button"
            onClick={() => paginate(currentPage + 1)}
            disabled={currentPage === totalPages || isLoading}
        >
            Next
        </button>
    </nav>
);

const TeacherGrades = () => {
    // State management
    const { currentUser } = useAuth();
    const [classes, setClasses] = useState([]);
    const [subjects, setSubjects] = useState([]);
    const [availableSubjects, setAvailableSubjects] = useState([]);
    const [students, setStudents] = useState([]);
    const [availableStudents, setAvailableStudents] = useState([]);
    const [grades, setGrades] = useState([]);
    const [selectedClass, setSelectedClass] = useState('');
    const [selectedSubject, setSelectedSubject] = useState('');
    const [selectedStudent, setSelectedStudent] = useState('');
    const [marks, setMarks] = useState('');
    const [comments, setComments] = useState('');
    const [isEditing, setIsEditing] = useState(false);
    const [editGradeId, setEditGradeId] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [gradesPerPage] = useState(10);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterClass, setFilterClass] = useState('');
    const [filterSubject, setFilterSubject] = useState('');
    const [errors, setErrors] = useState({});
    const [isLoading, setIsLoading] = useState(true);

    // Helper functions
    const fetchTeacherData = useCallback(async () => {
        if (!currentUser) return;
        try {
            const classTeacherSnap = await getDocs(collection(db, 'classTeacherMapping'));
            const teacherClasses = classTeacherSnap.docs
                .filter(doc => doc.data().teacherId === currentUser.uid)
                .map(doc => doc.data().classId);

            if (teacherClasses.length === 0) {
                console.warn('No classes found for teacher:', currentUser.uid);
                toast.warn('You are not assigned to any classes.');
            } else {
                console.log('Teacher classes:', teacherClasses);
            }

            const classesSnap = await getDocs(collection(db, 'classes'));
            const filteredClasses = classesSnap.docs
                .filter(doc => teacherClasses.includes(doc.id))
                .map(doc => ({ id: doc.id, ...doc.data() }));
            setClasses(filteredClasses);
            console.log('Filtered classes:', filteredClasses);

            const subjectsSnap = await getDocs(collection(db, 'subjects'));
            const allSubjects = subjectsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            console.log('All subjects:', allSubjects);

            const teacherSubjects = classTeacherSnap.docs
                .filter(doc => doc.data().teacherId === currentUser.uid)
                .flatMap(doc =>
                    (doc.data().subjectIds || []).map(subjectId => ({
                        classId: doc.data().classId,
                        subjectId
                    }))
                );
            console.log('Teacher subject assignments:', teacherSubjects);

            const filteredSubjects = allSubjects.filter(subject =>
                teacherSubjects.some(ts => ts.subjectId === subject.id)
            );
            setSubjects(filteredSubjects);
            console.log('Filtered subjects for teacher:', filteredSubjects);

            const studentSnap = await getDocs(collection(db, 'studentAssignments'));
            const filteredStudentIds = studentSnap.docs
                .filter(doc => teacherClasses.includes(doc.data().classId))
                .map(doc => doc.data().studentId);
            const studentsSnap = await getDocs(collection(db, 'studentLog'));
            const filteredStudents = studentsSnap.docs
                .filter(doc => filteredStudentIds.includes(doc.id))
                .map(doc => ({ id: doc.id, ...doc.data() }));
            setStudents(filteredStudents);
            console.log('Filtered students:', filteredStudents);
        } catch (error) {
            console.error('Error fetching teacher data:', error);
            toast.error('Error fetching data: ' + error.message);
        }
    }, [currentUser]);

    const fetchGrades = useCallback(async () => {
        if (!currentUser) return;
        try {
            const gradesSnap = await getDocs(collection(db, 'grades'));
            const teacherGrades = gradesSnap.docs
                .filter(doc => doc.data().teacherId === currentUser.uid)
                .map(doc => ({ id: doc.id, ...doc.data() }));
            setGrades(teacherGrades);
            setCurrentPage(1);
            console.log('Teacher grades:', teacherGrades);
        } catch (error) {
            console.error('Error fetching grades:', error);
            toast.error('Error fetching grades: ' + error.message);
        }
    }, [currentUser]);

    const validateForm = () => {
        const newErrors = {};
        if (!selectedClass) newErrors.selectedClass = 'Class is required';
        if (!selectedSubject) newErrors.selectedSubject = 'Subject is required';
        if (!selectedStudent) newErrors.selectedStudent = 'Student is required';
        if (!marks) {
            newErrors.marks = 'Marks are required';
        } else {
            const marksValue = parseFloat(marks);
            if (isNaN(marksValue) || marksValue < 0 || marksValue > 100) {
                newErrors.marks = 'Marks must be a number between 0 and 100';
            }
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateForm()) {
            toast.error('Please fix the errors in the form');
            return;
        }
        setIsLoading(true);
        try {
            let gradeId;
            if (isEditing) {
                await updateDoc(doc(db, 'grades', editGradeId), {
                    classId: selectedClass,
                    subjectId: selectedSubject,
                    studentId: selectedStudent,
                    marks: parseFloat(marks),
                    comments,
                    updatedAt: new Date().toISOString()
                });
                gradeId = editGradeId;
                toast.success('Grade updated successfully');
            } else {
                const gradeDoc = await addDoc(collection(db, 'grades'), {
                    classId: selectedClass,
                    subjectId: selectedSubject,
                    studentId: selectedStudent,
                    teacherId: currentUser.uid,
                    marks: parseFloat(marks),
                    comments,
                    createdAt: new Date().toISOString()
                });
                gradeId = gradeDoc.id;
                toast.success('Grade added successfully');

                // Create notification for the student
                const classData = classes.find(c => c.id === selectedClass);
                const subjectData = subjects.find(s => s.id === selectedSubject);
                const notificationMessage = `New grade added for ${subjectData?.subjectName || 'Subject'}`;

                await addDoc(collection(db, 'studentLog', selectedStudent, 'notifications'), {
                    message: notificationMessage,
                    type: 'grade',
                    read: false,
                    createdAt: serverTimestamp(),
                    link: '/student/grades'
                });
            }
            resetForm();
            await fetchGrades();
        } catch (error) {
            console.error('Error saving grade:', error);
            toast.error('Error saving grade: ' + error.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleEdit = (grade) => {
        setIsEditing(true);
        setEditGradeId(grade.id);
        setSelectedClass(grade.classId);
        setSelectedSubject(grade.subjectId);
        setSelectedStudent(grade.studentId);
        setMarks(grade.marks.toString());
        setComments(grade.comments || '');
        setErrors({});
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this grade?')) {
            setIsLoading(true);
            try {
                await deleteDoc(doc(db, 'grades', id));
                toast.success('Grade deleted successfully');
                await fetchGrades();
            } catch (error) {
                console.error('Error deleting grade:', error);
                toast.error('Error deleting grade: ' + error.message);
            } finally {
                setIsLoading(false);
            }
        }
    };

    const resetForm = () => {
        setIsEditing(false);
        setEditGradeId(null);
        setSelectedClass('');
        setSelectedSubject('');
        setSelectedStudent('');
        setMarks('');
        setComments('');
        setErrors({});
    };

    // Update available subjects and students when the selected class changes
    useEffect(() => {
        let isMounted = true; // Flag to prevent state updates after unmount or logout

        const fetchSubjectsAndStudents = async () => {
            if (!currentUser || !selectedClass || !isMounted) {
                // Exit if user is logged out or component is unmounted
                setAvailableSubjects([]);
                setAvailableStudents([]);
                setSelectedSubject('');
                setSelectedStudent('');
                return;
            }

            try {
                const classTeacherSnap = await getDocs(collection(db, 'classTeacherMapping'));
                const teacherSubjectsForClassDocs = classTeacherSnap.docs
                    .filter(doc =>
                        doc.data().teacherId === currentUser.uid &&
                        doc.data().classId === selectedClass
                    );

                const teacherSubjectsForClass = teacherSubjectsForClassDocs
                    .flatMap(doc => doc.data().subjectIds || []);
                console.log(`Subjects assigned to teacher for class ${selectedClass}:`, teacherSubjectsForClass);

                const filteredSubjects = subjects.filter(sub =>
                    teacherSubjectsForClass.includes(sub.id)
                );
                if (isMounted) {
                    setAvailableSubjects(filteredSubjects);
                    console.log(`Available subjects for class ${selectedClass}:`, filteredSubjects);
                    setSelectedSubject('');
                }

                if (filteredSubjects.length === 0) {
                    console.warn(`No subjects found for class ${selectedClass} and teacher ${currentUser.uid}`);
                    if (isMounted) {
                        toast.warn('No subjects assigned to you for this class.');
                    }
                }

                const studentSnap = await getDocs(collection(db, 'studentAssignments'));
                const classStudentIds = studentSnap.docs
                    .filter(doc => doc.data().classId === selectedClass)
                    .map(doc => doc.data().studentId);
                console.log(`Student IDs for class ${selectedClass}:`, classStudentIds);

                const filteredStudents = students.filter(student =>
                    classStudentIds.includes(student.id)
                );
                if (isMounted) {
                    setAvailableStudents(filteredStudents);
                    console.log(`Available students for class ${selectedClass}:`, filteredStudents);
                    setSelectedStudent('');
                }

                if (filteredStudents.length === 0) {
                    console.warn(`No students found for class ${selectedClass}`);
                    if (isMounted) {
                        toast.warn('No students enrolled in this class.');
                    }
                }
            } catch (error) {
                console.error('Error filtering subjects and students:', error);
                if (isMounted) {
                    toast.error('Error loading data: ' + error.message);
                }
            }
        };

        if (selectedClass && subjects.length > 0 && students.length > 0) {
            fetchSubjectsAndStudents();
        } else {
            setAvailableSubjects([]);
            setAvailableStudents([]);
            setSelectedSubject('');
            setSelectedStudent('');
            if (selectedClass && subjects.length === 0) {
                console.warn('No subjects loaded yet for filtering');
            }
        }

        // Cleanup function to prevent state updates after unmount or logout
        return () => {
            isMounted = false;
        };
    }, [selectedClass, subjects, students, currentUser]);

    // Initial data fetching and reset on logout
    useEffect(() => {
        if (!currentUser) {
            setIsLoading(false);
            resetForm(); // Reset form state on logout
            setClasses([]);
            setSubjects([]);
            setStudents([]);
            setGrades([]);
            setAvailableSubjects([]);
            setAvailableStudents([]);
            return;
        }
        const loadData = async () => {
            setIsLoading(true);
            await Promise.all([fetchTeacherData(), fetchGrades()]);
            setIsLoading(false);
        };
        loadData();
    }, [currentUser, fetchTeacherData, fetchGrades]);

    // Filtering and pagination
    const filteredGrades = grades.filter(grade => {
        const student = students.find(s => s.id === grade.studentId);
        const studentEmail = student ? student.email.toLowerCase() : '';
        const matchesSearch = searchQuery ? studentEmail.includes(searchQuery.toLowerCase()) : true;
        const matchesClass = filterClass ? grade.classId === filterClass : true;
        const matchesSubject = filterSubject ? grade.subjectId === filterSubject : true;
        return matchesSearch && matchesClass && matchesSubject;
    });

    const indexOfLastGrade = currentPage * gradesPerPage;
    const indexOfFirstGrade = indexOfLastGrade - gradesPerPage;
    const currentGrades = filteredGrades.slice(indexOfFirstGrade, indexOfLastGrade);
    const totalPages = Math.ceil(filteredGrades.length / gradesPerPage);

    const paginate = (pageNumber) => setCurrentPage(pageNumber);

    // Render states
    if (isLoading) return <LoadingMessage />;
    if (!currentUser) return <LoginMessage />;

    return (
        <div className="grades-container">
            <h2 className="grades-title">Grade Management</h2>
            <GradeForm
                classes={classes}
                availableSubjects={availableSubjects}
                availableStudents={availableStudents}
                selectedClass={selectedClass}
                setSelectedClass={setSelectedClass}
                selectedSubject={selectedSubject}
                setSelectedSubject={setSelectedSubject}
                selectedStudent={selectedStudent}
                setSelectedStudent={setSelectedStudent}
                marks={marks}
                setMarks={setMarks}
                comments={comments}
                setComments={setComments}
                errors={errors}
                isEditing={isEditing}
                handleSubmit={handleSubmit}
                isLoading={isLoading}
                validateForm={validateForm}
            />
            <GradeFilters
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                filterClass={filterClass}
                setFilterClass={setFilterClass}
                filterSubject={filterSubject}
                setFilterSubject={setFilterSubject}
                classes={classes}
                subjects={subjects}
                setCurrentPage={setCurrentPage}
                isLoading={isLoading}
            />
            <GradeTable
                currentGrades={currentGrades}
                classes={classes}
                subjects={subjects}
                students={students}
                handleEdit={handleEdit}
                handleDelete={handleDelete}
                isLoading={isLoading}
            />
            {totalPages > 1 && (
                <PaginationControls
                    currentPage={currentPage}
                    totalPages={totalPages}
                    paginate={paginate}
                    isLoading={isLoading}
                />
            )}
        </div>
    );
};

export default TeacherGrades;