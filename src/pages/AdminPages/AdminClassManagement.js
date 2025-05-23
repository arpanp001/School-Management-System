import React, { useState, useEffect } from 'react';
import { db } from '../../firebase/config';
import { collection, addDoc, getDocs, deleteDoc, doc, updateDoc, query, where } from 'firebase/firestore';
import { toast } from 'react-toastify';
import Select from 'react-select';
import '../AdminPagesStyle/AdminClassManagement.css';

// Component for the class form
const ClassForm = ({ className, setClassName, section, setSection, subjects, setSubjects, availableSubjects, isEditing, handleSubmit, handleCancelEdit, formErrors, setFormErrors }) => {
    const validateForm = () => {
        const errors = { className: '', section: '' };
        const trimmedClassName = className.trim();
        const trimmedSection = section.trim();

        if (!trimmedClassName) errors.className = 'Class name is required';
        if (!trimmedSection) errors.section = 'Section is required';

        setFormErrors(errors);
        return !errors.className && !errors.section;
    };

    const handleFormSubmit = async (e) => {
        e.preventDefault();
        if (!validateForm()) return;
        handleSubmit(e);
    };

    const subjectOptions = availableSubjects.map(subject => ({
        value: subject.id,
        label: subject.subjectName,
        id: subject.id
    }));

    const customSelectStyles = {
        control: (provided) => ({
            ...provided,
            borderColor: '#e2e8f0',
            boxShadow: 'none',
            '&:hover': { borderColor: '#cbd5e0' }
        }),
        multiValue: (provided) => ({
            ...provided,
            backgroundColor: '#bee3f8',
        }),
        multiValueLabel: (provided) => ({
            ...provided,
            color: '#2b6cb0',
        }),
        multiValueRemove: (provided) => ({
            ...provided,
            color: '#2b6cb0',
            ':hover': { backgroundColor: '#90cdf4', color: '#1a4971' },
        }),
    };

    return (
        <form onSubmit={handleFormSubmit} className="class-form">
            <div className="form-grid">
                <div className="form-group">
                    <input
                        type="text"
                        className={`form-input ${formErrors.className ? 'input-error' : ''}`}
                        placeholder="Class Name (e.g., 10th Grade)"
                        value={className}
                        onChange={(e) => setClassName(e.target.value)}
                        required
                    />
                    {formErrors.className && <p className="error-text">{formErrors.className}</p>}
                </div>
                <div className="form-group">
                    <input
                        type="text"
                        className={`form-input ${formErrors.section ? 'input-error' : ''}`}
                        placeholder="Section (e.g., A)"
                        value={section}
                        onChange={(e) => setSection(e.target.value)}
                        required
                    />
                    {formErrors.section && <p className="error-text">{formErrors.section}</p>}
                </div>
            </div>

            <div className="form-group">
                <h5 className="form-label">Assign Subjects</h5>
                <Select
                    isMulti
                    options={subjectOptions}
                    value={subjects.map(subject => ({
                        value: subject.id,
                        label: subject.subjectName,
                        id: subject.id
                    }))}
                    onChange={(selectedOptions) => setSubjects(selectedOptions || [])}
                    placeholder="Select subjects..."
                    className="basic-multi-select"
                    classNamePrefix="select"
                    styles={customSelectStyles}
                />
            </div>

            <div className="form-buttons">
                <button
                    type="submit"
                    className="btn btn-primary"
                >
                    {isEditing ? 'Update Class' : 'Add Class'}
                </button>
                {isEditing && (
                    <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={handleCancelEdit}
                    >
                        Cancel
                    </button>
                )}
            </div>
        </form>
    );
};

// Component for the class table
const ClassTable = ({ currentItems, availableSubjects, handleEdit, handleDelete }) => (
    <div className="table-container">
        <table className="class-table">
            <thead>
                <tr>
                    <th>Class Name</th>
                    <th>Section</th>
                    <th>Subjects</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
                {currentItems.map((classItem) => (
                    <tr key={classItem.id}>
                        <td>{classItem.className}</td>
                        <td>{classItem.section}</td>
                        <td>
                            {classItem.subjects?.map(subId => {
                                const subject = availableSubjects.find(s => s.id === subId);
                                return subject ? subject.subjectName : '';
                            }).join(', ') || 'No subjects assigned'}
                        </td>
                        <td>
                            <button
                                className="btn btn-edit"
                                onClick={() => handleEdit(classItem)}
                            >
                                Edit
                            </button>
                            <button
                                className="btn btn-delete"
                                onClick={() => handleDelete(classItem.id)}
                            >
                                Delete
                            </button>
                        </td>
                    </tr>
                ))}
                {currentItems.length === 0 && (
                    <tr>
                        <td colSpan="4" className="no-data">
                            No classes found
                        </td>
                    </tr>
                )}
            </tbody>
        </table>
    </div>
);

// Component for pagination
const Pagination = ({ currentPage, totalPages, paginate }) => (
    <nav className="pagination">
        <ul>
            <li>
                <button
                    className={`page-btn ${currentPage === 1 ? 'disabled' : ''}`}
                    onClick={() => paginate(currentPage - 1)}
                    disabled={currentPage === 1}
                >
                    Previous
                </button>
            </li>
            {Array.from({ length: totalPages }, (_, i) => (
                <li key={i + 1}>
                    <button
                        className={`page-btn ${currentPage === i + 1 ? 'active' : ''}`}
                        onClick={() => paginate(i + 1)}
                    >
                        {i + 1}
                    </button>
                </li>
            ))}
            <li>
                <button
                    className={`page-btn ${currentPage === totalPages ? 'disabled' : ''}`}
                    onClick={() => paginate(currentPage + 1)}
                    disabled={currentPage === totalPages}
                >
                    Next
                </button>
            </li>
        </ul>
    </nav>
);

const AdminClassManagement = () => {
    // State management
    const [className, setClassName] = useState('');
    const [section, setSection] = useState('');
    const [subjects, setSubjects] = useState([]);
    const [classes, setClasses] = useState([]);
    const [isEditing, setIsEditing] = useState(false);
    const [editId, setEditId] = useState(null);
    const [availableSubjects, setAvailableSubjects] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(10);
    const [formErrors, setFormErrors] = useState({ className: '', section: '' });

    // Data fetching
    useEffect(() => {
        fetchClasses();
        fetchSubjects();
    }, []);

    const fetchClasses = async () => {
        try {
            const querySnapshot = await getDocs(collection(db, 'classes'));
            const classesData = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setClasses(classesData);
        } catch (error) {
            toast.error('Error fetching classes: ' + error.message);
        }
    };

    const fetchSubjects = async () => {
        try {
            const subjectsSnap = await getDocs(collection(db, 'subjects'));
            setAvailableSubjects(subjectsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        } catch (error) {
            toast.error('Error fetching subjects: ' + error.message);
        }
    };

    // Firebase operations
    const checkDuplicateClass = (newClassName, newSection, newSubjectIds) => {
        return classes.some(cls => {
            const sameClassName = cls.className.toLowerCase() === newClassName.toLowerCase();
            const sameSection = cls.section.toLowerCase() === newSection.toLowerCase();
            const sameSubjects = JSON.stringify(cls.subjects?.sort() || []) === JSON.stringify(newSubjectIds?.sort() || []);
            return sameClassName && sameSection && sameSubjects;
        });
    };

    const updateRelatedData = async (classId, newClassData) => {
        try {
            const teacherAssignmentsSnap = await getDocs(query(collection(db, 'classTeacherMapping'), where('classId', '==', classId)));
            await Promise.all(teacherAssignmentsSnap.docs.map(async (assignmentDoc) => {
                await updateDoc(doc(db, 'classTeacherMapping', assignmentDoc.id), {
                    subjectIds: newClassData.subjects,
                    updatedAt: new Date().toISOString()
                });

                const teacherSubjectsSnap = await getDocs(query(
                    collection(db, 'teacherSubjects'),
                    where('classId', '==', classId),
                    where('teacherId', '==', assignmentDoc.data().teacherId)
                ));
                await Promise.all(teacherSubjectsSnap.docs.map(tsDoc => deleteDoc(doc(db, 'teacherSubjects', tsDoc.id))));
                await Promise.all(newClassData.subjects.map(subjectId =>
                    addDoc(collection(db, 'teacherSubjects'), {
                        teacherId: assignmentDoc.data().teacherId,
                        subjectId,
                        classId,
                        createdAt: new Date().toISOString()
                    })
                ));
            }));

            const studentAssignmentsSnap = await getDocs(query(collection(db, 'studentAssignments'), where('classId', '==', classId)));
            await Promise.all(studentAssignmentsSnap.docs.map(async (assignmentDoc) => {
                const teacherIds = teacherAssignmentsSnap.docs.map(doc => doc.data().teacherId);
                await updateDoc(doc(db, 'studentAssignments', assignmentDoc.id), {
                    subjects: newClassData.subjects,
                    teachers: teacherIds,
                    updatedAt: new Date().toISOString()
                });
            }));
        } catch (error) {
            toast.error('Error updating related data: ' + error.message);
        }
    };

    const deleteRelatedData = async (classId) => {
        try {
            const teacherAssignmentsSnap = await getDocs(query(collection(db, 'classTeacherMapping'), where('classId', '==', classId)));
            await Promise.all(teacherAssignmentsSnap.docs.map(async (docSnap) => {
                await deleteDoc(doc(db, 'classTeacherMapping', docSnap.id));
            }));

            const teacherSubjectsSnap = await getDocs(query(collection(db, 'teacherSubjects'), where('classId', '==', classId)));
            await Promise.all(teacherSubjectsSnap.docs.map(tsDoc => deleteDoc(doc(db, 'teacherSubjects', tsDoc.id))));

            const studentAssignmentsSnap = await getDocs(query(collection(db, 'studentAssignments'), where('classId', '==', classId)));
            await Promise.all(studentAssignmentsSnap.docs.map(docSnap => deleteDoc(doc(db, 'studentAssignments', docSnap.id))));
        } catch (error) {
            toast.error('Error deleting related data: ' + error.message);
        }
    };

    // Form handling
    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const trimmedClassName = className.trim();
            const trimmedSection = section.trim();
            const newSubjectIds = subjects.map(sub => sub.id);

            if (!isEditing && checkDuplicateClass(trimmedClassName, trimmedSection, newSubjectIds)) {
                toast.error('A class with this name, section, and subject combination already exists');
                return;
            }

            const classData = {
                className: trimmedClassName,
                section: trimmedSection,
                subjects: newSubjectIds,
                updatedAt: new Date().toISOString()
            };

            if (isEditing) {
                const currentClass = classes.find(cls => cls.id === editId);
                const isSameAsCurrent =
                    currentClass.className.toLowerCase() === trimmedClassName.toLowerCase() &&
                    currentClass.section.toLowerCase() === trimmedSection.toLowerCase() &&
                    JSON.stringify(currentClass.subjects?.sort() || []) === JSON.stringify(newSubjectIds.sort() || []);

                if (!isSameAsCurrent && checkDuplicateClass(trimmedClassName, trimmedSection, newSubjectIds)) {
                    toast.error('Another class with this name, section, and subject combination already exists');
                    return;
                }

                await updateDoc(doc(db, 'classes', editId), classData);
                await updateRelatedData(editId, classData);
                toast.success('Class updated successfully');
                setIsEditing(false);
                setEditId(null);
            } else {
                const newDocRef = await addDoc(collection(db, 'classes'), {
                    ...classData,
                    createdAt: new Date().toISOString()
                });
                toast.success('Class created successfully');
                await updateRelatedData(newDocRef.id, classData);
            }

            setClassName('');
            setSection('');
            setSubjects([]);
            setFormErrors({ className: '', section: '' });
            fetchClasses();
        } catch (error) {
            toast.error('Error saving class: ' + error.message);
        }
    };

    const handleEdit = (classItem) => {
        setIsEditing(true);
        setEditId(classItem

            .id);
        setClassName(classItem.className);
        setSection(classItem.section);
        setSubjects(availableSubjects.filter(sub => classItem.subjects?.includes(sub.id)));
        setFormErrors({ className: '', section: '' });
    };

    const handleCancelEdit = () => {
        setIsEditing(false);
        setEditId(null);
        setClassName('');
        setSection('');
        setSubjects([]);
        setFormErrors({ className: '', section: '' });
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this class? This will also remove related teacher and student assignments.')) {
            try {
                await deleteRelatedData(id);
                await deleteDoc(doc(db, 'classes', id));
                toast.success('Class and related assignments deleted successfully');
                fetchClasses();
            } catch (error) {
                toast.error('Error deleting class: ' + error.message);
            }
        }
    };

    // Pagination logic
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = classes.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(classes.length / itemsPerPage);

    const paginate = (pageNumber) => setCurrentPage(pageNumber);

    return (
        <div className="container">
            <h2 className="page-title">Manage Classes & Sections</h2>

            <ClassForm
                className={className}
                setClassName={setClassName}
                section={section}
                setSection={setSection}
                subjects={subjects}
                setSubjects={setSubjects}
                availableSubjects={availableSubjects}
                isEditing={isEditing}
                handleSubmit={handleSubmit}
                handleCancelEdit={handleCancelEdit}
                formErrors={formErrors}
                setFormErrors={setFormErrors}
            />

            <div className="table-wrapper">
                <ClassTable
                    currentItems={currentItems}
                    availableSubjects={availableSubjects}
                    handleEdit={handleEdit}
                    handleDelete={handleDelete}
                />
                {classes.length > itemsPerPage && (
                    <Pagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        paginate={paginate}
                    />
                )}
            </div>
        </div>
    );
};

export default AdminClassManagement;