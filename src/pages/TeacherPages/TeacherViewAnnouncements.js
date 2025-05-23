import React, { useState, useEffect } from 'react';
import { db, auth } from '../../firebase/config';
import { collection, getDocs } from 'firebase/firestore';
import { toast } from 'react-toastify';
import '../TeacherPagesStyle/TeacherViewAnnouncements.css';

// Component for displaying loading or no-announcements message
const LoadingMessage = ({ message }) => (
    <div className="view-announcements-message">
        {message}
    </div>
);

// Component for the announcements table
const AnnouncementTable = ({ currentAnnouncements, assignedClasses, renderTargetAudience }) => (
    <div className="view-announcements-table-wrapper">
        <table className="view-announcements-table">
            <thead>
                <tr>
                    <th>Title</th>
                    <th>Content</th>
                    <th>Link</th>
                    <th>Target Audience</th>
                    <th>Created By</th>
                    <th>Created At</th>
                </tr>
            </thead>
            <tbody>
                {currentAnnouncements.length === 0 ? (
                    <tr>
                        <td colSpan="6" className="view-announcements-table-empty">
                            No announcements found
                        </td>
                    </tr>
                ) : (
                    currentAnnouncements.map(announcement => (
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
                            <td>{announcement.role === 'admin' ? 'Admin' : 'Teacher'}</td>
                            <td>{new Date(announcement.createdAt).toLocaleString()}</td>
                        </tr>
                    ))
                )}
            </tbody>
        </table>
    </div>
);

// Component for pagination controls
const PaginationControls = ({ currentPage, totalPages, paginate }) => (
    <nav className="view-announcements-pagination">
        <button
            className="view-announcements-pagination-button"
            onClick={() => paginate(currentPage - 1)}
            disabled={currentPage === 1}
        >
            Previous
        </button>
        {Array.from({ length: totalPages }, (_, i) => (
            <button
                key={i}
                className={`view-announcements-pagination-button ${currentPage === i + 1 ? 'active' : ''}`}
                onClick={() => paginate(i + 1)}
            >
                {i + 1}
            </button>
        ))}
        <button
            className="view-announcements-pagination-button"
            onClick={() => paginate(currentPage + 1)}
            disabled={currentPage === totalPages}
        >
            Next
        </button>
    </nav>
);

const TeacherViewAnnouncements = () => {
    // State management
    const [announcements, setAnnouncements] = useState([]);
    const [assignedClasses, setAssignedClasses] = useState([]);
    const [loadingClasses, setLoadingClasses] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [announcementsPerPage] = useState(5);

    // Helper functions
    const fetchAssignedClasses = async () => {
        const currentUser = auth.currentUser;
        if (!currentUser) {
            toast.error('You must be logged in to view announcements');
            setLoadingClasses(false);
            return;
        }

        try {
            const mappingSnap = await getDocs(collection(db, 'classTeacherMapping'));
            const teacherMappings = mappingSnap.docs
                .filter(doc => doc.data().teacherId === currentUser.uid)
                .map(doc => doc.data().classId);

            const classesSnap = await getDocs(collection(db, 'classes'));
            const classes = classesSnap.docs
                .filter(doc => teacherMappings.includes(doc.id))
                .map(doc => ({ id: doc.id, ...doc.data() }));

            setAssignedClasses(classes);
        } catch (error) {
            toast.error('Error fetching assigned classes: ' + error.message);
        } finally {
            setLoadingClasses(false);
        }
    };

    const fetchAnnouncements = async () => {
        const currentUser = auth.currentUser;
        if (!currentUser) return;

        try {
            const announcementsSnap = await getDocs(collection(db, 'announcements'));
            const allAnnouncements = announcementsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            const teacherAnnouncements = allAnnouncements.filter(announcement => {
                if (announcement.targetAudience === 'all' || announcement.targetAudience === 'teachers') {
                    return true;
                }
                if (announcement.targetAudience === 'class') {
                    return assignedClasses.some(cls => cls.id === announcement.classId);
                }
                return false;
            });

            setAnnouncements(teacherAnnouncements);
            setCurrentPage(1); // Reset to first page when announcements are fetched
        } catch (error) {
            toast.error('Error fetching announcements: ' + error.message);
        }
    };

    const renderTargetAudience = (announcement) => {
        if (announcement.targetAudience === 'class') {
            const classData = assignedClasses.find(c => c.id === announcement.classId);
            return classData ? `${classData.className} - ${classData.section}` : 'N/A';
        }
        return announcement.targetAudience.charAt(0).toUpperCase() + announcement.targetAudience.slice(1);
    };

    // Pagination logic
    const indexOfLastAnnouncement = currentPage * announcementsPerPage;
    const indexOfFirstAnnouncement = indexOfLastAnnouncement - announcementsPerPage;
    const currentAnnouncements = announcements.slice(indexOfFirstAnnouncement, indexOfLastAnnouncement);
    const totalPages = Math.ceil(announcements.length / announcementsPerPage);

    const paginate = (pageNumber) => setCurrentPage(pageNumber);

    useEffect(() => {
        fetchAssignedClasses();
    }, []);

    useEffect(() => {
        if (!loadingClasses) {
            fetchAnnouncements();
        }
    }, [assignedClasses, loadingClasses]);

    // Render states
    if (loadingClasses) {
        return (
            <div className="view-announcements-container">
                <h2 className="view-announcements-title">View Announcements</h2>
                <LoadingMessage message="Loading classes..." />
            </div>
        );
    }

    return (
        <div className="view-announcements-container">
            <h2 className="view-announcements-title">View Announcements</h2>
            <AnnouncementTable
                currentAnnouncements={currentAnnouncements}
                assignedClasses={assignedClasses}
                renderTargetAudience={renderTargetAudience}
            />
            {totalPages > 1 && (
                <PaginationControls
                    currentPage={currentPage}
                    totalPages={totalPages}
                    paginate={paginate}
                />
            )}
        </div>
    );
};

export default TeacherViewAnnouncements;