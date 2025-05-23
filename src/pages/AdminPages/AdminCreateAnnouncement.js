import React, { useState, useEffect } from 'react';
import { db, auth } from '../../firebase/config';
import { collection, addDoc, getDocs, updateDoc, doc, query, where, serverTimestamp } from 'firebase/firestore';
import { toast } from 'react-toastify';
import emailjs from '@emailjs/browser';
import '../AdminPagesStyle/AdminCreateAnnouncement.css';

const EMAILJS_SERVICE_ID = 'service_l0fenxj';
const EMAILJS_TEMPLATE_ID = 'template_tdsymj8';
const EMAILJS_PUBLIC_KEY = 'sss-GrBLqM_2bdune';

// Component for the announcement form
const AnnouncementForm = ({
    title, setTitle,
    content, setContent,
    link, setLink,
    targetAudience, setTargetAudience,
    selectedClass, setSelectedClass,
    classes, isEditing, handleSubmit
}) => {
    const handleFormSubmit = async (e) => {
        e.preventDefault();
        if (!title.trim() || !content.trim()) {
            toast.error('Title and content are required');
            return;
        }
        if (targetAudience === 'class' && !selectedClass) {
            toast.error('Please select a class');
            return;
        }
        handleSubmit(e);
    };

    return (
        <form onSubmit={handleFormSubmit} className="announcement-form">
            <div className="form-group">
                <label className="form-label">Title</label>
                <input
                    type="text"
                    className="form-input"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Enter announcement title"
                    required
                />
            </div>
            <div className="form-group">
                <label className="form-label">Content</label>
                <textarea
                    className="form-input"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Enter announcement content"
                    required
                    rows="4"
                />
            </div>
            <div className="form-group">
                <label className="form-label">Link (Optional)</label>
                <input
                    type="url"
                    className="form-input"
                    value={link}
                    onChange={(e) => setLink(e.target.value)}
                    placeholder="https://example.com"
                />
            </div>
            <div className="form-group">
                <label className="form-label">Target Audience</label>
                <select
                    className="form-input"
                    value={targetAudience}
                    onChange={(e) => setTargetAudience(e.target.value)}
                >
                    <option value="all">All Users</option>
                    <option value="teachers">Teachers</option>
                    <option value="students">Students</option>
                    <option value="class">Specific Class</option>
                </select>
            </div>
            {targetAudience === 'class' && (
                <div className="form-group">
                    <label className="form-label">Select Class</label>
                    <select
                        className="form-input"
                        value={selectedClass}
                        onChange={(e) => setSelectedClass(e.target.value)}
                        required
                    >
                        <option value="">Select a class</option>
                        {classes.map(cls => (
                            <option key={cls.id} value={cls.id}>
                                {cls.className} - {cls.section}
                            </option>
                        ))}
                    </select>
                </div>
            )}
            <div className="form-buttons">
                <button type="submit" className="btn btn-primary">
                    {isEditing ? 'Update Announcement' : 'Create Announcement'}
                </button>
            </div>
        </form>
    );
};

const AdminCreateAnnouncement = ({ initialData, onSave }) => {
    // State management
    const [title, setTitle] = useState(initialData?.title || '');
    const [content, setContent] = useState(initialData?.content || '');
    const [link, setLink] = useState(initialData?.link || '');
    const [targetAudience, setTargetAudience] = useState(initialData?.targetAudience || 'all');
    const [classes, setClasses] = useState([]);
    const [selectedClass, setSelectedClass] = useState(initialData?.classId || '');
    const [isEditing, setIsEditing] = useState(!!initialData);
    const [editId, setEditId] = useState(initialData?.id || null);

    // Data fetching
    useEffect(() => {
        fetchClasses();
    }, []);

    const fetchClasses = async () => {
        try {
            const classesSnap = await getDocs(collection(db, 'classes'));
            setClasses(classesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        } catch (error) {
            toast.error('Error fetching classes: ' + error.message);
        }
    };

    // Email validation
    const isValidEmail = (email) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    };

    // Fetch target audience emails
    const getTargetAudienceEmails = async (audience, classId) => {
        try {
            let emails = [];
            let snapshot;

            switch (audience) {
                case 'all':
                    const [adminSnap, teacherAllSnap, studentAllSnap] = await Promise.all([
                        getDocs(collection(db, 'adminLog')),
                        getDocs(collection(db, 'teacherLog')),
                        getDocs(collection(db, 'studentLog'))
                    ]);
                    emails = [
                        ...adminSnap.docs.map(doc => doc.data().email),
                        ...teacherAllSnap.docs.map(doc => doc.data().email),
                        ...studentAllSnap.docs.map(doc => doc.data().email)
                    ];
                    break;

                case 'teachers':
                    snapshot = await getDocs(collection(db, 'teacherLog'));
                    emails = snapshot.docs.map(doc => doc.data().email);
                    break;

                case 'students':
                    snapshot = await getDocs(collection(db, 'studentLog'));
                    emails = snapshot.docs.map(doc => doc.data().email);
                    break;

                case 'class':
                    if (!classId) return [];
                    const studentAssignmentsSnap = await getDocs(
                        query(collection(db, 'studentAssignments'), where('classId', '==', classId))
                    );
                    const studentIds = studentAssignmentsSnap.docs.map(doc => doc.data().studentId);
                    const studentsSnap = await getDocs(collection(db, 'studentLog'));
                    emails = studentsSnap.docs
                        .filter(doc => studentIds.includes(doc.id))
                        .map(doc => doc.data().email);
                    break;

                default:
                    return [];
            }

            return emails.filter(email => isValidEmail(email));
        } catch (error) {
            toast.error('Error fetching emails: ' + error.message);
            return [];
        }
    };

    // Send email notifications
    const sendEmailNotifications = async (emails, announcementData) => {
        const emailPromises = emails.map(email => {
            const templateParams = {
                to_email: email,
                announcement_title: announcementData.title,
                announcement_content: announcementData.content,
                announcement_link: announcementData.link || 'No link provided',
                created_at: new Date().toLocaleString()
            };

            return emailjs.send(
                EMAILJS_SERVICE_ID,
                EMAILJS_TEMPLATE_ID,
                templateParams,
                EMAILJS_PUBLIC_KEY
            ).catch(error => {
                console.error(`Failed to send email to ${email}:`, error);
                return null;
            });
        });

        try {
            const results = await Promise.all(emailPromises);
            const successfulSends = results.filter(result => result !== null).length;
            if (successfulSends > 0) {
                toast.success(`Email notifications sent to ${successfulSends} recipients`);
            }
        } catch (error) {
            toast.error('Error sending some email notifications');
        }
    };

    // Send notifications to students
    const sendStudentNotifications = async (studentIds, announcementData) => {
        try {
            const notificationPromises = studentIds.map(studentId => {
                const notification = {
                    message: `New announcement: ${announcementData.title}`,
                    type: 'announcement',
                    read: false,
                    createdAt: serverTimestamp(),
                    link: announcementData.link || '/student/announcements'
                };
                return addDoc(collection(db, 'studentLog', studentId, 'notifications'), notification);
            });
            await Promise.all(notificationPromises);
            toast.success(`Notifications sent to ${studentIds.length} students`);
        } catch (error) {
            console.error('Error sending notifications:', error);
            toast.error('Error sending notifications to students');
        }
    };

    // Get student IDs for notifications
    const getTargetStudentIds = async (audience, classId) => {
        try {
            let studentIds = [];
            if (audience === 'all' || audience === 'students') {
                const studentsSnap = await getDocs(collection(db, 'studentLog'));
                studentIds = studentsSnap.docs.map(doc => doc.id);
            } else if (audience === 'class' && classId) {
                const studentAssignmentsSnap = await getDocs(
                    query(collection(db, 'studentAssignments'), where('classId', '==', classId))
                );
                studentIds = studentAssignmentsSnap.docs.map(doc => doc.data().studentId);
            }
            return studentIds;
        } catch (error) {
            console.error('Error fetching student IDs:', error);
            toast.error('Error fetching students for notifications');
            return [];
        }
    };

    // Form submission
    const handleSubmit = async (e) => {
        e.preventDefault();
        const currentUser = auth.currentUser;
        if (!currentUser) {
            toast.error('You must be logged in to create an announcement');
            return;
        }

        try {
            const announcementData = {
                title: title.trim(),
                content: content.trim(),
                link: link.trim() || null,
                targetAudience,
                classId: targetAudience === 'class' ? selectedClass : null,
                createdBy: currentUser.uid,
                createdAt: isEditing ? initialData.createdAt : new Date().toISOString(),
                role: 'admin'
            };

            if (isEditing) {
                await updateDoc(doc(db, 'announcements', editId), {
                    ...announcementData,
                    updatedAt: new Date().toISOString()
                });
                toast.success('Announcement updated successfully');
            } else {
                await addDoc(collection(db, 'announcements'), announcementData);
                toast.success('Announcement created successfully');

                // Send email notifications only for new announcements
                const targetEmails = await getTargetAudienceEmails(targetAudience, selectedClass);
                if (targetEmails.length > 0) {
                    await sendEmailNotifications(targetEmails, announcementData);
                } else {
                    toast.warning('No valid email addresses found for the target audience');
                }

                // Send notifications to students
                const studentIds = await getTargetStudentIds(targetAudience, selectedClass);
                if (studentIds.length > 0 && (targetAudience === 'all' || targetAudience === 'students' || targetAudience === 'class')) {
                    await sendStudentNotifications(studentIds, announcementData);
                }
            }

            resetForm();
            if (onSave) onSave();
        } catch (error) {
            toast.error('Error saving announcement: ' + error.message);
        }
    };

    const resetForm = () => {
        setTitle('');
        setContent('');
        setLink('');
        setTargetAudience('all');
        setSelectedClass('');
        setIsEditing(false);
        setEditId(null);
    };

    return (
        <div className="container">
            <h2 className="page-title">{isEditing ? 'Edit Announcement' : 'Create Announcement'}</h2>
            <AnnouncementForm
                title={title}
                setTitle={setTitle}
                content={content}
                setContent={setContent}
                link={link}
                setLink={setLink}
                targetAudience={targetAudience}
                setTargetAudience={setTargetAudience}
                selectedClass={selectedClass}
                setSelectedClass={setSelectedClass}
                classes={classes}
                isEditing={isEditing}
                handleSubmit={handleSubmit}
            />
        </div>
    );
};

export default AdminCreateAnnouncement;