import React, { useState, useEffect } from 'react';
import { db } from '../../firebase/config';
import { collection, getDocs, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { toast } from 'react-toastify';
import '../../pages/AdminPagesStyle/AdminGrades.css';

// Component for filter controls
const GradesFilter = ({
    filterClass,
    setFilterClass,
    filterSubject,
    setFilterSubject,
    filterStudent,
    setFilterStudent,
    filterTeacher,
    setFilterTeacher,
    classes,
    subjects,
    students,
    teachers,
}) => (
    <div className="filter-container">
        <div className="form-group">
            <label className="form-label">Filter by Class</label>
            <select
                className="form-input"
                value={filterClass}
                onChange={(e) => setFilterClass(e.target.value)}
            >
                <option value="">Filter by Class</option>
                {classes.map((cls) => (
                    <option key={cls.id} value={cls.id}>
                        {cls.className} - {cls.section}
                    </option>
                ))}
            </select>
        </div>
        <div className="form-group">
            <label className="form-label">Filter by Subject</label>
            <select
                className="form-input"
                value={filterSubject}
                onChange={(e) => setFilterSubject(e.target.value)}
            >
                <option value="">Filter by Subject</option>
                {subjects.map((sub) => (
                    <option key={sub.id} value={sub.id}>{sub.subjectName}</option>
                ))}
            </select>
        </div>
        <div className="form-group">
            <label className="form-label">Filter by Student</label>
            <select
                className="form-input"
                value={filterStudent}
                onChange={(e) => setFilterStudent(e.target.value)}
            >
                <option value="">Filter by Student</option>
                {students.map((student) => (
                    <option key={student.id} value={student.id}>{student.email}</option>
                ))}
            </select>
        </div>
        <div className="form-group">
            <label className="form-label">Filter by Teacher</label>
            <select
                className="form-input"
                value={filterTeacher}
                onChange={(e) => setFilterTeacher(e.target.value)}
            >
                <option value="">Filter by Teacher</option>
                {teachers.map((teacher) => (
                    <option key={teacher.id} value={teacher.id}>{teacher.email}</option>
                ))}
            </select>
        </div>
    </div>
);

// Component for the edit form
const GradesEditForm = ({
    isEditing,
    editMarks,
    setEditMarks,
    editComments,
    setEditComments,
    handleUpdate,
    setIsEditing,
}) => (
    isEditing && (
        <form onSubmit={handleUpdate} className="edit-form">
            <div className="form-row">
                <div className="form-group">
                    <label className="form-label">Marks</label>
                    <input
                        type="number"
                        className="form-input"
                        placeholder="Marks"
                        value={editMarks}
                        onChange={(e) => setEditMarks(e.target.value)}
                        min="0"
                        max="100"
                        required
                    />
                </div>
                <div className="form-group">
                    <label className="form-label">Comments</label>
                    <textarea
                        className="form-input"
                        placeholder="Comments"
                        value={editComments}
                        onChange={(e) => setEditComments(e.target.value)}
                        rows="2"
                    />
                </div>
                <div className="form-group form-buttons">
                    <button type="submit" className="btn btn-primary">
                        Update
                    </button>
                    <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={() => setIsEditing(false)}
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </form>
    )
);

// Component for the grades table
const GradesTable = ({
    currentGrades,
    classes,
    subjects,
    students,
    teachers,
    handleEdit,
    handleDelete,
    currentPage,
    totalPages,
    paginate,
}) => (
    <div className="table-container">
        <table className="grades-table">
            <thead>
                <tr>
                    <th>Class</th>
                    <th>Subject</th>
                    <th>Student</th>
                    <th>Teacher</th>
                    <th>Marks</th>
                    <th>Comments</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
                {currentGrades.map((grade) => {
                    const classData = classes.find((c) => c.id === grade.classId);
                    const subjectData = subjects.find((s) => s.id === grade.subjectId);
                    const studentData = students.find((s) => s.id === grade.studentId);
                    const teacherData = teachers.find((t) => t.id === grade.teacherId);
                    return (
                        <tr key={grade.id}>
                            <td>{classData ? `${classData.className} - ${classData.section}` : 'N/A'}</td>
                            <td>{subjectData ? subjectData.subjectName : 'N/A'}</td>
                            <td>{studentData ? studentData.email : 'N/A'}</td>
                            <td>{teacherData ? teacherData.email : 'N/A'}</td>
                            <td>{grade.marks}</td>
                            <td>{grade.comments || '-'}</td>
                            <td>
                                <button
                                    className="btn btn-edit"
                                    onClick={() => handleEdit(grade)}
                                >
                                    Edit
                                </button>
                                <button
                                    className="btn btn-delete"
                                    onClick={() => handleDelete(grade.id)}
                                >
                                    Delete
                                </button>
                            </td>
                        </tr>
                    );
                })}
                {currentGrades.length === 0 && (
                    <tr>
                        <td colSpan="7" className="no-data">
                            No grades found
                        </td>
                    </tr>
                )}
            </tbody>
        </table>
        {currentGrades.length > 0 && totalPages > 1 && (
            <nav className="pagination-container">
                <ul className="pagination">
                    <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                        <button
                            className="page-link"
                            onClick={() => paginate(currentPage - 1)}
                        >
                            Previous
                        </button>
                    </li>
                    {Array.from({ length: totalPages }, (_, i) => (
                        <li
                            key={i + 1}
                            className={`page-item ${currentPage === i + 1 ? 'active' : ''}`}
                        >
                            <button
                                className="page-link"
                                onClick={() => paginate(i + 1)}
                            >
                                {i + 1}
                            </button>
                        </li>
                    ))}
                    <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                        <button
                            className="page-link"
                            onClick={() => paginate(currentPage + 1)}
                        >
                            Next
                        </button>
                    </li>
                </ul>
            </nav>
        )}
    </div>
);

const AdminGrades = () => {
    // State management
    const [grades, setGrades] = useState([]);
    const [classes, setClasses] = useState([]);
    const [subjects, setSubjects] = useState([]);
    const [students, setStudents] = useState([]);
    const [teachers, setTeachers] = useState([]);
    const [filterClass, setFilterClass] = useState('');
    const [filterSubject, setFilterSubject] = useState('');
    const [filterStudent, setFilterStudent] = useState('');
    const [filterTeacher, setFilterTeacher] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [isEditing, setIsEditing] = useState(false);
    const [editGradeId, setEditGradeId] = useState(null);
    const [editMarks, setEditMarks] = useState('');
    const [editComments, setEditComments] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(10);

    // Data fetching
    useEffect(() => {
        fetchAllData();
    }, []);

    const fetchAllData = async () => {
        try {
            const gradesSnap = await getDocs(collection(db, 'grades'));
            setGrades(gradesSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() })));

            const classesSnap = await getDocs(collection(db, 'classes'));
            setClasses(classesSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() })));

            const subjectsSnap = await getDocs(collection(db, 'subjects'));
            setSubjects(subjectsSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() })));

            const studentsSnap = await getDocs(collection(db, 'studentLog'));
            setStudents(studentsSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() })));

            const teachersSnap = await getDocs(collection(db, 'teacherLog'));
            setTeachers(teachersSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
        } catch (error) {
            toast.error('Error fetching data: ' + error.message);
        }
    };

    // Edit handler
    const handleEdit = (grade) => {
        setIsEditing(true);
        setEditGradeId(grade.id);
        setEditMarks(grade.marks);
        setEditComments(grade.comments || '');
    };

    // Update handler
    const handleUpdate = async (e) => {
        e.preventDefault();
        try {
            await updateDoc(doc(db, 'grades', editGradeId), {
                marks: parseFloat(editMarks),
                comments: editComments,
                updatedAt: new Date().toISOString(),
            });
            toast.success('Grade updated successfully');
            setIsEditing(false);
            setEditGradeId(null);
            setEditMarks('');
            setEditComments('');
            fetchAllData();
        } catch (error) {
            toast.error('Error updating grade: ' + error.message);
        }
    };

    // Delete handler
    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this grade?')) {
            try {
                await deleteDoc(doc(db, 'grades', id));
                toast.success('Grade deleted successfully');
                fetchAllData();
            } catch (error) {
                toast.error('Error deleting grade: ' + error.message);
            }
        }
    };

    // Filter and search logic
    const filteredGrades = grades.filter((grade) => {
        const classData = classes.find((c) => c.id === grade.classId);
        const subjectData = subjects.find((s) => s.id === grade.subjectId);
        const studentData = students.find((s) => s.id === grade.studentId);
        const teacherData = teachers.find((t) => t.id === grade.teacherId);

        const matchesClass = !filterClass || grade.classId === filterClass;
        const matchesSubject = !filterSubject || grade.subjectId === filterSubject;
        const matchesStudent = !filterStudent || grade.studentId === filterStudent;
        const matchesTeacher = !filterTeacher || grade.teacherId === filterTeacher;

        const searchString = `${classData?.className || ''} ${classData?.section || ''} ${subjectData?.subjectName || ''} ${studentData?.email || ''} ${teacherData?.email || ''} ${grade.marks} ${grade.comments || ''}`.toLowerCase();
        const matchesSearch = !searchQuery || searchString.includes(searchQuery.toLowerCase());

        return matchesClass && matchesSubject && matchesStudent && matchesTeacher && matchesSearch;
    });

    // Pagination calculations
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentGrades = filteredGrades.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(filteredGrades.length / itemsPerPage);

    const paginate = (pageNumber) => setCurrentPage(pageNumber);

    return (
        <div className="container">
            <h2 className="page-title">Grade Management</h2>
            <GradesFilter
                filterClass={filterClass}
                setFilterClass={setFilterClass}
                filterSubject={filterSubject}
                setFilterSubject={setFilterSubject}
                filterStudent={filterStudent}
                setFilterStudent={setFilterStudent}
                filterTeacher={filterTeacher}
                setFilterTeacher={setFilterTeacher}
                classes={classes}
                subjects={subjects}
                students={students}
                teachers={teachers}
            />
            <div className="search-container">
                <div className="form-group">
                    <label className="form-label">Search</label>
                    <input
                        type="text"
                        className="form-input"
                        placeholder="Search grades..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>
            <GradesEditForm
                isEditing={isEditing}
                editMarks={editMarks}
                setEditMarks={setEditMarks}
                editComments={editComments}
                setEditComments={setEditComments}
                handleUpdate={handleUpdate}
                setIsEditing={setIsEditing}
            />
            <div className="table-wrapper">
                <GradesTable
                    currentGrades={currentGrades}
                    classes={classes}
                    subjects={subjects}
                    students={students}
                    teachers={teachers}
                    handleEdit={handleEdit}
                    handleDelete={handleDelete}
                    currentPage={currentPage}
                    totalPages={totalPages}
                    paginate={paginate}
                />
            </div>
            {/* Removed duplicate pagination here */}
        </div>
    );
};

export default AdminGrades;