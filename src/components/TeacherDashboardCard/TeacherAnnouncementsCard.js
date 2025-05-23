import React, { useState, useEffect } from "react";
import '../TeacherDashboardCardCss/TeacherAnnouncementsCard.css';
import { FaBullhorn } from "react-icons/fa";
import { db, auth } from "../../firebase/config";
import { collection, getDocs, query, where } from "firebase/firestore";
import { toast } from "react-toastify";

const TeacherAnnouncementsCard = () => {
    const [announcements, setAnnouncements] = useState([]);
    const [loading, setLoading] = useState(true);

    const currentUser = auth.currentUser;
    const teacherId = currentUser?.uid;

    useEffect(() => {
        const fetchAnnouncements = async () => {
            if (!teacherId) {
                toast.error("Please log in to view announcements");
                setLoading(false);
                return;
            }

            try {
                setLoading(true);

                // Fetch teacher's assigned classes
                const mappingSnap = await getDocs(
                    query(collection(db, "classTeacherMapping"), where("teacherId", "==", teacherId))
                );
                const classIds = mappingSnap.docs.map(doc => doc.data().classId);

                // Fetch announcements:
                // 1. Teacher's own announcements
                // 2. Admin announcements for "all", "teachers", or teacher's classes
                const announcementsQuery = query(
                    collection(db, "announcements"),
                    where("role", "in", ["teacher", "admin"])
                );
                const announcementsSnap = await getDocs(announcementsQuery);
                const allAnnouncements = announcementsSnap.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data(),
                }));

                // Filter relevant announcements
                const filteredAnnouncements = allAnnouncements.filter(announcement => {
                    if (announcement.role === "teacher" && announcement.createdBy === teacherId) {
                        return true; // Teacher's own announcements
                    }
                    if (announcement.role === "admin") {
                        if (announcement.targetAudience === "all" || announcement.targetAudience === "teachers") {
                            return true; // Admin announcements for all or teachers
                        }
                        if (announcement.targetAudience === "class" && classIds.includes(announcement.classId)) {
                            return true; // Admin announcements for teacher's classes
                        }
                    }
                    return false;
                });

                // Sort by createdAt (descending) and take top 3
                const sortedAnnouncements = filteredAnnouncements
                    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                    .slice(0, 3)
                    .map(announcement => ({
                        text: announcement.title,
                        date: announcement.createdAt,
                    }));

                setAnnouncements(sortedAnnouncements);
            } catch (error) {
                toast.error("Error fetching announcements: " + error.message);
            } finally {
                setLoading(false);
            }
        };

        if (teacherId) {
            fetchAnnouncements();
        }
    }, [teacherId]);

    return (
        <div className="teacher-ann-card-container">
            <div className="teacher-ann-card-header">
                <h3>Announcements</h3>
                <FaBullhorn className="teacher-ann-card-icon" />
            </div>
            {loading ? (
                <div className="teacher-ann-card-loading">Loading announcements...</div>
            ) : announcements.length === 0 ? (
                <div className="teacher-ann-card-empty">No recent announcements.</div>
            ) : (
                <ul className="teacher-ann-card-list">
                    {announcements.map((item, index) => (
                        <li key={index} className="teacher-ann-card-item">
                            <span className="teacher-ann-card-title">{item.text}</span>
                            <span className="teacher-ann-card-date">
                                {new Date(item.date).toLocaleDateString()}
                            </span>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

export default TeacherAnnouncementsCard;