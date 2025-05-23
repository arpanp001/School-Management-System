import React, { useState, useEffect } from 'react';
import { db } from '../../firebase/config';
import { collection, addDoc, getDocs, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { toast } from 'react-toastify';
import '../AdminPagesStyle/AdminSubjectManagement.css';

// Component for the subject form
const SubjectForm = ({ subjectName, setSubjectName, isEditing, handleSubmit }) => {
    const handleFormSubmit = async (e) => {
        e.preventDefault();
        if (!subjectName.trim()) {
            toast.error('Subject name cannot be empty');
            return;
        }
        handleSubmit(e);
    };

    return (
        <form onSubmit={handleFormSubmit} className="subject-form">
            <div className="form-group">
                <input
                    type="text"
                    className="form-input"
                    placeholder="Subject Name (e.g., Mathematics)"
                    value={subjectName}
                    onChange={(e) => setSubjectName(e.target.value)}
                    required
                />
            </div>
            <div className="form-buttons">
                <button type="submit" className="btn btn-primary">
                    {isEditing ? 'Update Subject' : 'Add Subject'}
                </button>
            </div>
        </form>
    );
};

// Component for the subject table
const SubjectTable = ({ subjects, handleEdit, handleDelete }) => (
    <div className="table-container">
        <table className="subject-table">
            <thead>
                <tr>
                    <th>Subject Name</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
                {subjects.map((subject) => (
                    <tr key={subject.id}>
                        <td>{subject.subjectName}</td>
                        <td>
                            <button
                                className="btn btn-edit"
                                onClick={() => handleEdit(subject)}
                            >
                                Edit
                            </button>
                            <button
                                className="btn btn-delete"
                                onClick={() => handleDelete(subject.id)}
                            >
                                Delete
                            </button>
                        </td>
                    </tr>
                ))}
                {subjects.length === 0 && (
                    <tr>
                        <td colSpan="2" className="no-data">
                            No subjects found
                        </td>
                    </tr>
                )}
            </tbody>
        </table>
    </div>
);

const AdminSubjectManagement = () => {
    // State management
    const [subjectName, setSubjectName] = useState('');
    const [subjects, setSubjects] = useState([]);
    const [isEditing, setIsEditing] = useState(false);
    const [editId, setEditId] = useState(null);

    // Data fetching
    useEffect(() => {
        fetchSubjects();
    }, []);

    const fetchSubjects = async () => {
        try {
            const querySnapshot = await getDocs(collection(db, 'subjects'));
            const subjectsData = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setSubjects(subjectsData);
        } catch (error) {
            toast.error('Error fetching subjects: ' + error.message);
        }
    };

    // Firebase operations
    const checkDuplicateSubject = (name) => {
        return subjects.some(subject =>
            subject.subjectName.toLowerCase() === name.toLowerCase()
        );
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const trimmedSubjectName = subjectName.trim();

            if (!isEditing && checkDuplicateSubject(trimmedSubjectName)) {
                toast.error('A subject with this name already exists');
                return;
            }

            if (isEditing) {
                const currentSubject = subjects.find(sub => sub.id === editId);
                if (currentSubject.subjectName.toLowerCase() !== trimmedSubjectName.toLowerCase() &&
                    checkDuplicateSubject(trimmedSubjectName)) {
                    toast.error('Another subject with this name already exists');
                    return;
                }

                await updateDoc(doc(db, 'subjects', editId), {
                    subjectName: trimmedSubjectName,
                    updatedAt: new Date().toISOString()
                });
                toast.success('Subject updated successfully');
                setIsEditing(false);
                setEditId(null);
            } else {
                await addDoc(collection(db, 'subjects'), {
                    subjectName: trimmedSubjectName,
                    createdAt: new Date().toISOString()
                });
                toast.success('Subject created successfully');
            }

            setSubjectName('');
            fetchSubjects();
        } catch (error) {
            toast.error('Error saving subject: ' + error.message);
        }
    };

    const handleEdit = (subject) => {
        setIsEditing(true);
        setEditId(subject.id);
        setSubjectName(subject.subjectName);
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this subject?')) {
            try {
                await deleteDoc(doc(db, 'subjects', id));
                toast.success('Subject deleted successfully');
                fetchSubjects();
            } catch (error) {
                toast.error('Error deleting subject: ' + error.message);
            }
        }
    };

    return (
        <div className="container">
            <h2 className="page-title">Manage Subjects</h2>

            <SubjectForm
                subjectName={subjectName}
                setSubjectName={setSubjectName}
                isEditing={isEditing}
                handleSubmit={handleSubmit}
            />

            <div className="table-wrapper">
                <SubjectTable
                    subjects={subjects}
                    handleEdit={handleEdit}
                    handleDelete={handleDelete}
                />
            </div>
        </div>
    );
};

export default AdminSubjectManagement;