import React, { useState, useEffect } from 'react';
import '../../components/NoticeBoard/NoticeForm.css'
const NoticeForm = ({ onSubmit, initialData, classes, courses, isAdmin, isTeacher }) => {
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [selectedClasses, setSelectedClasses] = useState([]);
    const [selectedCourse, setSelectedCourse] = useState('');

    useEffect(() => {
        if (initialData) {
            setTitle(initialData.title);
            setContent(initialData.content);
            setSelectedClasses(initialData.classIds || []);
            setSelectedCourse(initialData.courseId || '');
        }
    }, [initialData]);

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit({
            title,
            content,
            classIds: isTeacher ? selectedClasses : null,
            courseId: isTeacher ? selectedCourse : null
        });
        setTitle('');
        setContent('');
        setSelectedClasses([]);
        setSelectedCourse('');
    };

    return (
        <form onSubmit={handleSubmit} className="notice-form">
            <div className="form-field">
                <label className="form-label">Title</label>
                <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="form-input"
                    required
                />
            </div>
            <div className="form-field">
                <label className="form-label">Content</label>
                <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    className="form-textarea"
                    rows="4"
                    required
                />
            </div>
            {isTeacher && (
                <>
                    <div className="form-field">
                        <label className="form-label">Select Course</label>
                        <select
                            value={selectedCourse}
                            onChange={(e) => setSelectedCourse(e.target.value)}
                            className="form-select"
                            required
                        >
                            <option value="">Select a course</option>
                            {courses.map(course => (
                                <option key={course.id} value={course.id}>
                                    {course.courseName}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="form-field">
                        <label className="form-label">Select Classes</label>
                        <select
                            multiple
                            value={selectedClasses}
                            onChange={(e) => setSelectedClasses(Array.from(e.target.selectedOptions, option => option.value))}
                            className="form-select"
                            required
                        >
                            {classes.map(cls => (
                                <option key={cls.id} value={cls.id}>
                                    {cls.className}
                                </option>
                            ))}
                        </select>
                    </div>
                </>
            )}
            <button type="submit" className="form-button">
                {initialData ? 'Update Announcement' : 'Post Announcement'}
            </button>
        </form>
    );
};

export default NoticeForm;