import React, { useState, useEffect } from 'react';
import { db } from '../../firebase/config';
import { collection, getDocs, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { toast } from 'react-toastify';
import '../../pages/AdminPagesStyle/AdminManageTeachers.css';

// Loading spinner component
const LoadingSpinner = () => (
    <div className="loading-spinner">
        <div className="spinner"></div>
        <span>Loading...</span>
    </div>
);

// Component for the teacher table
const TeacherTable = ({ teachers, handleDeactivate, handleReactivate, handleDelete, isLoading }) => (
    <div className="table-wrapper">
        <div className="table-header">
            <h4>Teacher List</h4>
        </div>
        <div className="table-container">
            <table className="teacher-table">
                <thead className='teacher-table-header'>
                    <tr>
                        <th>Full Name</th>
                        <th>Email</th>
                        <th>Department</th>
                        <th>Status</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {teachers.length === 0 ? (
                        <tr>
                            <td colSpan="5" className="no-data">
                                No teachers found.
                            </td>
                        </tr>
                    ) : (
                        teachers.map((teacher) => (
                            <tr key={teacher.id} className="teacher-row">
                                <td>{teacher.fullName}</td>
                                <td>{teacher.email}</td>
                                <td>{teacher.department}</td>
                                <td className={`status-${teacher.status}`}>{teacher.status}</td>
                                <td className="action-buttons">
                                    {teacher.status === 'active' && (
                                        <button
                                            className="btn btn-warning"
                                            onClick={() => handleDeactivate(teacher.id, teacher.email)}
                                            disabled={isLoading}
                                        >
                                            Deactivate
                                        </button>
                                    )}
                                    {teacher.status === 'inactive' && (
                                        <button
                                            className="btn btn-success"
                                            onClick={() => handleReactivate(teacher.id, teacher.email)}
                                            disabled={isLoading}
                                        >
                                            Reactivate
                                        </button>
                                    )}
                                    {teacher.status !== 'deleted' && (
                                        <button
                                            className="btn btn-danger"
                                            onClick={() => handleDelete(teacher.id, teacher.email)}
                                            disabled={isLoading}
                                        >
                                            Delete
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
    </div>
);

const AdminManageTeachers = () => {
    // State management
    const [teachers, setTeachers] = useState([]);
    const [isLoading, setIsLoading] = useState(false);

    // Data fetching
    useEffect(() => {
        const fetchTeachers = async () => {
            setIsLoading(true);
            try {
                const teachersRef = collection(db, 'teacherLog');
                const snapshot = await getDocs(teachersRef);
                const teacherList = snapshot.docs.map((doc) => ({
                    id: doc.id,
                    ...doc.data(),
                }));
                setTeachers(teacherList);
            } catch (error) {
                toast.error('Error fetching teachers: ' + error.message);
            } finally {
                setIsLoading(false);
            }
        };
        fetchTeachers();
    }, []);

    // Teacher management actions
    const handleDeactivate = async (teacherId, teacherEmail) => {
        if (!window.confirm('Are you sure you want to deactivate this teacher?')) return;

        setIsLoading(true);
        try {
            await updateDoc(doc(db, 'teacherLog', teacherId), { status: 'inactive' });
            await updateDoc(doc(db, 'users', teacherId), { status: 'inactive' });

            setTeachers((prev) =>
                prev.map((teacher) =>
                    teacher.id === teacherId ? { ...teacher, status: 'inactive' } : teacher
                )
            );

            toast.success(`Teacher ${teacherEmail} deactivated successfully.`);
        } catch (error) {
            toast.error('Error deactivating teacher: ' + error.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleReactivate = async (teacherId, teacherEmail) => {
        if (!window.confirm('Are you sure you want to reactivate this teacher?')) return;

        setIsLoading(true);
        try {
            await updateDoc(doc(db, 'teacherLog', teacherId), { status: 'active' });
            await updateDoc(doc(db, 'users', teacherId), { status: 'active' });

            setTeachers((prev) =>
                prev.map((teacher) =>
                    teacher.id === teacherId ? { ...teacher, status: 'active' } : teacher
                )
            );

            toast.success(`Teacher ${teacherEmail} reactivated successfully.`);
        } catch (error) {
            toast.error('Error reactivating teacher: ' + error.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async (teacherId, teacherEmail) => {
        if (
            !window.confirm(
                'Are you sure you want to delete this teacher? This will remove their data from the system, but their authentication record will remain inactive.'
            )
        )
            return;

        setIsLoading(true);
        try {
            await updateDoc(doc(db, 'teacherLog', teacherId), {
                status: 'deleted',
                deletedAt: new Date().toISOString(),
            });
            await updateDoc(doc(db, 'users', teacherId), {
                status: 'deleted',
                deletedAt: new Date().toISOString(),
            });

            await deleteDoc(doc(db, 'teacherLog', teacherId));
            await deleteDoc(doc(db, 'users', teacherId));

            setTeachers((prev) => prev.filter((teacher) => teacher.id !== teacherId));

            toast.success(`Teacher ${teacherEmail} deleted successfully from the system.`);
        } catch (error) {
            toast.error('Error deleting teacher: ' + error.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="container">
            <h2 className="page-title">Manage Teachers</h2>
            {isLoading ? (
                <LoadingSpinner />
            ) : (
                <TeacherTable
                    teachers={teachers}
                    handleDeactivate={handleDeactivate}
                    handleReactivate={handleReactivate}
                    handleDelete={handleDelete}
                    isLoading={isLoading}
                />
            )}
        </div>
    );
};

export default AdminManageTeachers;