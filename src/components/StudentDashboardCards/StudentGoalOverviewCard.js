import React, { useState, useEffect, useCallback } from 'react';
import { db, auth } from '../../firebase/config';
import { collection, getDocs } from 'firebase/firestore';
import { toast } from 'react-toastify';
import { FaSpinner } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import '../StudentDashboardCardsCss/StudentGoalOverviewCard.css';

const StudentGoalOverviewCard = () => {
    const [announcements, setAnnouncements] = useState([]);
    const [assignedClasses, setAssignedClasses] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchAssignedClasses = async () => {
        const currentUser = auth.currentUser;
        if (!currentUser) {
            toast.error('You must be logged in to view announcements');
            setLoading(false);
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
            setLoading(false);
        }
    };

    const fetchAnnouncements = useCallback(async () => {
        const currentUser = auth.currentUser;
        if (!currentUser) return;

        try {
            const announcementsSnap = await getDocs(collection(db, 'announcements'));
            const allAnnouncements = announcementsSnap.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                createdAt: doc.data().createdAt?.toDate ? doc.data().createdAt.toDate() : new Date(doc.data().createdAt),
            }));

            const studentAnnouncements = allAnnouncements.filter(announcement => {
                if (announcement.targetAudience === 'all' || announcement.targetAudience === 'students') {
                    return true;
                }
                if (announcement.targetAudience === 'class') {
                    return assignedClasses.some(cls => cls.id === announcement.classId);
                }
                return false;
            });

            // Sort by createdAt (descending) and take top 3
            const sortedAnnouncements = studentAnnouncements
                .sort((a, b) => b.createdAt - a.createdAt)
                .slice(0, 3);

            setAnnouncements(sortedAnnouncements);
        } catch (error) {
            toast.error('Error fetching announcements: ' + error.message);
        } finally {
            setLoading(false);
        }
    }, [assignedClasses]);

    useEffect(() => {
        fetchAssignedClasses();
    }, []);

    useEffect(() => {
        if (assignedClasses.length > 0) {
            fetchAnnouncements();
        }
    }, [assignedClasses, fetchAnnouncements]);

    const renderTargetAudience = (announcement) => {
        if (announcement.targetAudience === 'class') {
            const classData = assignedClasses.find(c => c.id === announcement.classId);
            return classData ? `${classData.className} - ${classData.section}` : 'N/A';
        }
        return announcement.targetAudience.charAt(0).toUpperCase() + announcement.targetAudience.slice(1);
    };

    const truncateContent = (content, maxLength = 50) => {
        if (content.length <= maxLength) return content;
        return content.slice(0, maxLength) + '...';
    };

    return (
        <div className="sgo-card" role="region" aria-label="Recent announcements">
            <div className="sgo-header">
                <h3 className="sgo-title">Recent Announcements</h3>
                <Link to="/student/announcement" className="sgo-view-all" aria-label="View all announcements">
                    View All
                </Link>
            </div>

            {loading ? (
                <div className="sgo-loading" aria-live="polite" aria-busy="true">
                    <FaSpinner className="sgo-spinner" aria-label="Loading announcements" />
                </div>
            ) : announcements.length === 0 ? (
                <p className="sgo-empty">No recent announcements available.</p>
            ) : (
                <ul className="sgo-list">
                    {announcements.map(announcement => (
                        <li
                            key={announcement.id}
                            className="sgo-item"
                            role="button"
                            tabIndex={0}
                            onKeyDown={e => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                    window.location.href = `/student/announcement#${announcement.id}`;
                                }
                            }}
                            onClick={() => window.location.href = `/student/announcement#${announcement.id}`}
                            aria-label={`Announcement: ${announcement.title}`}
                        >
                            <div className="sgo-content">
                                <h4 className="sgo-item-title">{announcement.title}</h4>
                                <p className="sgo-item-text">{truncateContent(announcement.content)}</p>
                                <div className="sgo-meta">
                                    <span>{renderTargetAudience(announcement)}</span>
                                    <span> • {new Date(announcement.createdAt).toLocaleDateString()}</span>
                                    <span> • {announcement.role === 'admin' ? 'Admin' : 'Teacher'}</span>
                                </div>
                                {announcement.link && (
                                    <a
                                        href={announcement.link}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="sgo-link"
                                        onClick={e => e.stopPropagation()}
                                        aria-label={`External link for ${announcement.title}`}
                                    >
                                        Link
                                    </a>
                                )}
                            </div>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

export default StudentGoalOverviewCard;