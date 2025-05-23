import React, { useState, useEffect } from 'react';
import { db } from '../../firebase/config';
import { collection, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { toast } from 'react-toastify';
import AdminCreateAnnouncement from './AdminCreateAnnouncement';
import '../../pages/AdminPagesStyle/AdminViewAnnouncements.css';

// Component for the announcement table
const AnnouncementTable = ({
    announcements,
    classes,
    handleEdit,
    handleDelete,
    currentPage,
    itemsPerPage,
    totalPages,
    paginate
}) => {
    const renderTargetAudience = (announcement) => {
        if (announcement.targetAudience === 'class') {
            const classData = classes.find(c => c.id === announcement.classId);
            return classData ? `${classData.className} - ${classData.section}` : 'N/A';
        }
        return announcement.targetAudience.charAt(0).toUpperCase() + announcement.targetAudience.slice(1);
    };

    return (
        <div className="table-container">
            <table className="announcement-table">
                <thead>
                    <tr>
                        <th>Title</th>
                        <th>Content</th>
                        <th>Link</th>
                        <th>Target Audience</th>
                        <th>Created At</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {announcements.map(announcement => (
                        <tr key={announcement.id}>
                            <td>{announcement.title}</td>
                            <td>{announcement.content}</td>
                            <td>
                                {announcement.link ? (
                                    <a href={announcement.link} target="_blank" rel="noopener noreferrer">
                                        Link
                                    </a>
                                ) : (
                                    'N/A'
                                )}
                            </td>
                            <td>{renderTargetAudience(announcement)}</td>
                            <td>{new Date(announcement.createdAt).toLocaleString()}</td>
                            <td>
                                <button
                                    className="btn btn-edit"
                                    onClick={() => handleEdit(announcement)}
                                >
                                    Edit
                                </button>
                                <button
                                    className="btn btn-delete"
                                    onClick={() => handleDelete(announcement.id)}
                                >
                                    Delete
                                </button>
                            </td>
                        </tr>
                    ))}
                    {announcements.length === 0 && (
                        <tr>
                            <td colSpan="6" className="no-data">
                                No announcements found
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
            {announcements.length > itemsPerPage && (
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
};

const AdminViewAnnouncements = () => {
    // State management
    const [announcements, setAnnouncements] = useState([]);
    const [classes, setClasses] = useState([]);
    const [editingAnnouncement, setEditingAnnouncement] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(10);

    // Data fetching
    useEffect(() => {
        fetchAnnouncements();
        fetchClasses();
    }, []);

    const fetchAnnouncements = async () => {
        try {
            const announcementsSnap = await getDocs(collection(db, 'announcements'));
            setAnnouncements(announcementsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        } catch (error) {
            toast.error('Error fetching announcements: ' + error.message);
        }
    };

    const fetchClasses = async () => {
        try {
            const classesSnap = await getDocs(collection(db, 'classes'));
            setClasses(classesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        } catch (error) {
            toast.error('Error fetching classes: ' + error.message);
        }
    };

    // Firebase operations
    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this announcement?')) {
            try {
                await deleteDoc(doc(db, 'announcements', id));
                toast.success('Announcement deleted successfully');
                fetchAnnouncements();
            } catch (error) {
                toast.error('Error deleting announcement: ' + error.message);
            }
        }
    };

    const handleEdit = (announcement) => {
        setEditingAnnouncement(announcement);
    };

    // Pagination calculations
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = announcements.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(announcements.length / itemsPerPage);

    const paginate = (pageNumber) => setCurrentPage(pageNumber);

    return (
        <div className="container">
            <h2 className="page-title">View Announcements</h2>
            {editingAnnouncement ? (
                <AdminCreateAnnouncement
                    initialData={editingAnnouncement}
                    onSave={() => {
                        setEditingAnnouncement(null);
                        fetchAnnouncements();
                    }}
                />
            ) : (
                <div className="table-wrapper">
                    <AnnouncementTable
                        announcements={currentItems}
                        classes={classes}
                        handleEdit={handleEdit}
                        handleDelete={handleDelete}
                        currentPage={currentPage}
                        itemsPerPage={itemsPerPage}
                        totalPages={totalPages}
                        paginate={paginate}
                    />
                </div>
            )}
        </div>
    );
};

export default AdminViewAnnouncements;