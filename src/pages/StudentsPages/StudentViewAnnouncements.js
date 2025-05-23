import React, { useState, useEffect, useCallback } from 'react';
import { db, auth } from '../../firebase/config';
import { collection, getDocs } from 'firebase/firestore';
import { toast } from 'react-toastify';
import '../StudentPagesStyle/StudentViewAnnouncements.css';

const StudentViewAnnouncements = () => {
    const [announcements, setAnnouncements] = useState([]);
    const [assignedClasses, setAssignedClasses] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    // Pagination states
    const [currentPage, setCurrentPage] = useState(1);
    const [announcementsPerPage] = useState(5);
    const [totalPages, setTotalPages] = useState(0);

    const fetchAssignedClasses = async () => {
        const currentUser = auth.currentUser;
        if (!currentUser) {
            toast.error('You must be logged in to view announcements');
            setIsLoading(false);
            return;
        }

        try {
            const mappingSnap = await getDocs(collection(db, 'studentAssignments'));
            const studentMappings = mappingSnap.docs
                .filter(doc => doc.data().studentId === currentUser.uid)
                .map(doc => doc.data().classId);

            const classesSnap = await getDocs(collection(db, 'classes'));
            const classes = classesSnap.docs
                .filter(doc => studentMappings.includes(doc.id))
                .map(doc => ({ id: doc.id, ...doc.data() }));

            setAssignedClasses(classes);
        } catch (error) {
            toast.error('Error fetching assigned classes: ' + error.message);
            setIsLoading(false);
        }
    };

    const fetchAnnouncements = useCallback(async () => {
        const currentUser = auth.currentUser;
        if (!currentUser) return;

        try {
            setIsLoading(true);
            const announcementsSnap = await getDocs(collection(db, 'announcements'));
            const allAnnouncements = announcementsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            const studentAnnouncements = allAnnouncements.filter(announcement => {
                if (announcement.targetAudience === 'all' || announcement.targetAudience === 'students') {
                    return true;
                }
                if (announcement.targetAudience === 'class') {
                    return assignedClasses.some(cls => cls.id === announcement.classId);
                }
                return false;
            });

            // Sort announcements by date (newest first)
            studentAnnouncements.sort((a, b) => b.createdAt - a.createdAt);

            setAnnouncements(studentAnnouncements);
            setTotalPages(Math.ceil(studentAnnouncements.length / announcementsPerPage));
            setIsLoading(false);
        } catch (error) {
            toast.error('Error fetching announcements: ' + error.message);
            setIsLoading(false);
        }
    }, [assignedClasses, announcementsPerPage]);

    useEffect(() => {
        fetchAssignedClasses();
    }, []);

    useEffect(() => {
        if (assignedClasses.length > 0) {
            fetchAnnouncements();
        }
    }, [fetchAnnouncements, assignedClasses]);

    const renderTargetAudience = (announcement) => {
        if (announcement.targetAudience === 'class') {
            const classData = assignedClasses.find(c => c.id === announcement.classId);
            return classData ? `${classData.className} - ${classData.section}` : 'N/A';
        }
        return announcement.targetAudience.charAt(0).toUpperCase() + announcement.targetAudience.slice(1);
    };

    const formatDate = (timestamp) => {
        if (!timestamp) return 'N/A';
        const date = new Date(timestamp);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    // Get current announcements for pagination
    const indexOfLastAnnouncement = currentPage * announcementsPerPage;
    const indexOfFirstAnnouncement = indexOfLastAnnouncement - announcementsPerPage;
    const currentAnnouncements = announcements.slice(
        indexOfFirstAnnouncement,
        indexOfLastAnnouncement
    );

    // Change page
    const paginate = (pageNumber) => setCurrentPage(pageNumber);

    // Go to next page
    const nextPage = () => {
        if (currentPage < totalPages) {
            setCurrentPage(currentPage + 1);
        }
    };

    // Go to previous page
    const prevPage = () => {
        if (currentPage > 1) {
            setCurrentPage(currentPage - 1);
        }
    };

    // Check if announcement is new (less than 24 hours old)
    const isNewAnnouncement = (timestamp) => {
        if (!timestamp) return false;
        const now = new Date();
        const announcementDate = new Date(timestamp);
        return (now - announcementDate) < (24 * 60 * 60 * 1000);
    };

    return (
        <div className="sva-container">
            <div className="sva-header">
                <h2 className="sva-title">Announcements</h2>
                <div className="sva-header-decoration"></div>
            </div>

            {isLoading ? (
                <div className="sva-loading">
                    <div className="sva-spinner"></div>
                    <p>Loading announcements...</p>
                </div>
            ) : assignedClasses.length === 0 ? (
                <div className="sva-no-data">
                    <p className="sva-warning">No classes assigned yet. Please contact your administrator.</p>
                </div>
            ) : announcements.length === 0 ? (
                <div className="sva-no-data">
                    <p>No announcements available at this time.</p>
                </div>
            ) : (
                <>
                    <div className="sva-announcement-list">
                        {currentAnnouncements.map(announcement => (
                            <div key={announcement.id} className={`sva-announcement-card ${isNewAnnouncement(announcement.createdAt) ? 'sva-new-announcement' : ''}`}>
                                <div className="sva-announcement-header">
                                    <h3 className="sva-announcement-title">
                                        {announcement.title}
                                        {isNewAnnouncement(announcement.createdAt) && (
                                            <span className="sva-new-badge">NEW</span>
                                        )}
                                    </h3>
                                    <span className="sva-announcement-badge">
                                        {renderTargetAudience(announcement)}
                                    </span>
                                </div>

                                <div className="sva-announcement-body">
                                    <p className="sva-announcement-content">{announcement.content}</p>

                                    {announcement.link && (
                                        <div className="sva-announcement-link">
                                            <a
                                                href={announcement.link}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="sva-link"
                                            >
                                                View Resource
                                            </a>
                                        </div>
                                    )}
                                </div>

                                <div className="sva-announcement-footer">
                                    <div className="sva-metadata">
                                        <span className="sva-author">
                                            Posted by: {announcement.role === 'admin' ? 'Administrator' : 'Teacher'}
                                        </span>
                                        <span className="sva-date">
                                            {formatDate(announcement.createdAt)}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="sva-pagination">
                            <button
                                onClick={prevPage}
                                disabled={currentPage === 1}
                                className="sva-pagination-button"
                            >
                                Previous
                            </button>

                            <div className="sva-pagination-numbers">
                                {[...Array(totalPages).keys()].map(number => (
                                    <button
                                        key={number + 1}
                                        onClick={() => paginate(number + 1)}
                                        className={`sva-page-number ${currentPage === number + 1 ? 'sva-active-page' : ''}`}
                                    >
                                        {number + 1}
                                    </button>
                                ))}
                            </div>

                            <button
                                onClick={nextPage}
                                disabled={currentPage === totalPages}
                                className="sva-pagination-button"
                            >
                                Next
                            </button>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default StudentViewAnnouncements;