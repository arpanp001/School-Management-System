import React, { useState, useEffect } from 'react';
import { db, auth } from '../../firebase/config';
import { collection, addDoc, getDocs, query, where, serverTimestamp } from 'firebase/firestore';
import { toast } from 'react-toastify';
import emailjs from '@emailjs/browser';
import Select from 'react-select';
import '../TeacherPagesStyle/TeacherCreateAnnouncement.css';

// EmailJS configuration
const EMAILJS_SERVICE_ID = 'service_l0fenxj';
const EMAILJS_TEMPLATE_ID = 'template_tdsymj8';
const EMAILJS_PUBLIC_KEY = 'sss-GrBLqM_2bdune';

// Component for displaying loading or no-classes message
const LoadingMessage = ({ message }) => (
    <div className="announcement-no-classes">
        {message}
    </div>
);

// Component for multi-class selector with react-select
const ClassSelector = ({ assignedClasses, selectedClasses, setSelectedClasses }) => {
    const options = assignedClasses.map(cls => ({
        value: cls.id,
        label: `${cls.className} - ${cls.section}`,
    }));

    const selectedOptions = options.filter(option => selectedClasses.includes(option.value));

    const handleClassChange = (selected) => {
        const selectedClassIds = selected ? selected.map(option => option.value) : [];
        setSelectedClasses(selectedClassIds);
    };

    return (
        <div className="announcement-form-group">
            <label className="announcement-form-label">Select Classes</label>
            <Select
                options={options}
                value={selectedOptions}
                onChange={handleClassChange}
                isMulti
                placeholder="Select classes..."
                className="announcement-form-react-select"
                classNamePrefix="react-select"
            />
        </div>
    );
};

// Component for the announcement preview
const AnnouncementPreview = ({ title, content, link, assignedClasses, selectedClasses, onClose }) => {
    const selectedClassNames = assignedClasses
        .filter(cls => selectedClasses.includes(cls.id))
        .map(cls => `${cls.className} - ${cls.section}`)
        .join(', ');

    return (
        <div className="announcement-preview-modal">
            <div className="announcement-preview-content">
                <h3 className="announcement-preview-title">Announcement Preview</h3>
                <div className="announcement-preview-section">
                    <strong>Title:</strong> {title}
                </div>
                <div className="announcement-preview-section">
                    <strong>Content:</strong> {content}
                </div>
                <div className="announcement-preview-section">
                    <strong>Link:</strong> {link ? <a href={link} target="_blank" rel="noopener noreferrer">{link}</a> : 'No link provided'}
                </div>
                <div className="announcement-preview-section">
                    <strong>Classes:</strong> {selectedClassNames || 'None selected'}
                </div>
                <button className="announcement-preview-close" onClick={onClose}>
                    Close Preview
                </button>
            </div>
        </div>
    );
};

// Component for the announcement form
const AnnouncementForm = ({
    title,
    setTitle,
    content,
    setContent,
    link,
    setLink,
    assignedClasses,
    selectedClasses,
    setSelectedClasses,
    handleSubmit,
    isValidUrl,
    urlError,
    togglePreview,
}) => (
    <form className="announcement-form" onSubmit={handleSubmit}>
        <div className="announcement-form-group">
            <label className="announcement-form-label">Title</label>
            <input
                type="text"
                className="announcement-form-input"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
            />
        </div>
        <div className="announcement-form-group">
            <label className="announcement-form-label">Content</label>
            <textarea
                className="announcement-form-textarea"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                required
                rows="4"
            />
        </div>
        <div className="announcement-form-group">
            <label className="announcement-form-label">Link (Optional)</label>
            <input
                type="url"
                className={`announcement-form-input ${urlError && link ? 'announcement-form-input-error' : ''}`}
                value={link}
                onChange={(e) => setLink(e.target.value)}
                placeholder="https://example.com"
            />
            {urlError && link && (
                <span className="announcement-form-error">
                    {urlError}
                </span>
            )}
        </div>
        <ClassSelector
            assignedClasses={assignedClasses}
            selectedClasses={selectedClasses}
            setSelectedClasses={setSelectedClasses}
        />
        <div className="announcement-form-buttons">
            <button
                type="button"
                className="announcement-form-preview-button"
                onClick={togglePreview}
                disabled={assignedClasses.length === 0}
            >
                Preview Announcement
            </button>
            <button
                type="submit"
                className="announcement-form-button"
                disabled={assignedClasses.length === 0 || selectedClasses.length === 0 || (link && !isValidUrl)}
            >
                Create Announcement
            </button>
        </div>
    </form>
);

const TeacherCreateAnnouncement = () => {
    // State management
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [link, setLink] = useState('');
    const [assignedClasses, setAssignedClasses] = useState([]);
    const [selectedClasses, setSelectedClasses] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showPreview, setShowPreview] = useState(false);
    const [isValidUrl, setIsValidUrl] = useState(true);
    const [urlError, setUrlError] = useState('');

    // URL validation logic
    const validateUrl = (url) => {
        if (!url) {
            setIsValidUrl(true);
            setUrlError('');
            return true;
        }
        const urlRegex = /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/;
        const isValid = urlRegex.test(url);
        setIsValidUrl(isValid);
        setUrlError(isValid ? '' : 'Please enter a valid URL (e.g., https://example.com)');
        return isValid;
    };

    useEffect(() => {
        validateUrl(link);
    }, [link]);

    // Helper functions
    const fetchAssignedClasses = async () => {
        const currentUser = auth.currentUser;
        if (!currentUser) {
            toast.error('You must be logged in to create an announcement');
            setIsLoading(false);
            return;
        }

        try {
            setIsLoading(true);
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
            setIsLoading(false);
        }
    };

    const isValidEmail = (email) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    };

    const getClassStudentEmails = async (classId) => {
        try {
            const studentAssignmentsSnap = await getDocs(
                query(collection(db, 'studentAssignments'), where('classId', '==', classId))
            );
            const studentIds = studentAssignmentsSnap.docs.map(doc => doc.data().studentId);

            const studentsSnap = await getDocs(collection(db, 'studentLog'));
            const emails = studentsSnap.docs
                .filter(doc => studentIds.includes(doc.id))
                .map(doc => doc.data().email);

            return emails.filter(email => isValidEmail(email));
        } catch (error) {
            toast.error('Error fetching student emails: ' + error.message);
            return [];
        }
    };

    const sendEmailNotifications = async (emails, announcementData, classId) => {
        const emailPromises = emails.map(email => {
            const templateParams = {
                to_email: email,
                announcement_title: announcementData.title,
                announcement_content: announcementData.content,
                announcement_link: announcementData.link || 'No link provided',
                created_at: new Date().toLocaleString(),
                class_name: assignedClasses.find(cls => cls.id === classId)?.className,
                class_section: assignedClasses.find(cls => cls.id === classId)?.section,
            };

            return emailjs
                .send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, templateParams, EMAILJS_PUBLIC_KEY)
                .catch(error => {
                    console.error(`Failed to send email to ${email}:`, error);
                    return null;
                });
        });

        try {
            const results = await Promise.all(emailPromises);
            const successfulSends = results.filter(result => result !== null).length;
            if (successfulSends > 0) {
                toast.success(`Email notifications sent to ${successfulSends} students for class ${classId}`);
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

    const handleSubmit = async (e) => {
        e.preventDefault();
        const currentUser = auth.currentUser;
        if (!currentUser) {
            toast.error('You must be logged in to create an announcement');
            return;
        }

        if (selectedClasses.length === 0) {
            toast.error('Please select at least one class');
            return;
        }

        try {
            for (const classId of selectedClasses) {
                const announcementData = {
                    title,
                    content,
                    link: link || null,
                    targetAudience: 'class',
                    classId,
                    createdBy: currentUser.uid,
                    createdAt: new Date().toISOString(),
                    role: 'teacher',
                };

                await addDoc(collection(db, 'announcements'), announcementData);

                const studentEmails = await getClassStudentEmails(classId);
                if (studentEmails.length > 0) {
                    await sendEmailNotifications(studentEmails, announcementData, classId);
                } else {
                    toast.warning(`No valid student email addresses found for class ${classId}`);
                }

                // Send notifications to students in the class
                const studentAssignmentsSnap = await getDocs(
                    query(collection(db, 'studentAssignments'), where('classId', '==', classId))
                );
                const studentIds = studentAssignmentsSnap.docs.map(doc => doc.data().studentId);
                if (studentIds.length > 0) {
                    await sendStudentNotifications(studentIds, announcementData);
                } else {
                    toast.warning(`No students found for class ${classId}`);
                }
            }

            toast.success('Announcement created successfully for all selected classes');
            resetForm();
        } catch (error) {
            toast.error('Error creating announcement: ' + error.message);
        }
    };

    const resetForm = () => {
        setTitle('');
        setContent('');
        setLink('');
        setSelectedClasses([]);
        setShowPreview(false);
    };

    const togglePreview = () => {
        setShowPreview(prev => !prev);
    };

    useEffect(() => {
        fetchAssignedClasses();
    }, []);

    // Render states
    if (isLoading) {
        return (
            <div className="announcement-container">
                <h2 className="announcement-title">Create Announcement</h2>
                <LoadingMessage message="Loading classes..." />
            </div>
        );
    }

    if (assignedClasses.length === 0) {
        return (
            <div className="announcement-container">
                <h2 className="announcement-title">Create Announcement</h2>
                <LoadingMessage message="No classes assigned" />
            </div>
        );
    }

    return (
        <div className="announcement-container">
            <h2 className="announcement-title">Create Announcement</h2>
            <AnnouncementForm
                title={title}
                setTitle={setTitle}
                content={content}
                setContent={setContent}
                link={link}
                setLink={setLink}
                assignedClasses={assignedClasses}
                selectedClasses={selectedClasses}
                setSelectedClasses={setSelectedClasses}
                handleSubmit={handleSubmit}
                isValidUrl={isValidUrl}
                urlError={urlError}
                togglePreview={togglePreview}
            />
            {showPreview && (
                <AnnouncementPreview
                    title={title}
                    content={content}
                    link={link}
                    assignedClasses={assignedClasses}
                    selectedClasses={selectedClasses}
                    onClose={togglePreview}
                />
            )}
        </div>
    );
};

export default TeacherCreateAnnouncement;