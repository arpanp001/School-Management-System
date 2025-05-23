import React from 'react';
import '../../components/NoticeBoard/NoticeList.css'
const NoticeList = ({ notices, onEdit, onDelete, loading, isAdmin, isTeacher, isStudent }) => {
    if (loading) {
        return <div>Loading announcements...</div>;
    }

    return (
        <div className="notice-list">
            {notices.map(notice => (
                <div key={notice.id} className="notice-card">
                    <div className="notice-header">
                        <div>
                            <h3 className="notice-title">{notice.title}</h3>
                            <p className="notice-content">{notice.content}</p>
                            <div className="notice-meta">
                                Posted on: {new Date(notice.createdAt).toLocaleDateString()}
                                {notice.type === 'teacher' && ' by Teacher'}
                            </div>
                        </div>
                        {(isAdmin || (isTeacher && notice.teacherEmail === JSON.parse(localStorage.getItem('userData')).email)) && (
                            <div className="action-buttons">
                                <button
                                    onClick={() => onEdit(notice)}
                                    className="edit-button"
                                >
                                    Edit
                                </button>
                                <button
                                    onClick={() => onDelete(notice.id)}
                                    className="delete-button"
                                >
                                    Delete
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            ))}
            {notices.length === 0 && (
                <div className="empty-text">No announcements available.</div>
            )}
        </div>
    );
};

export default NoticeList;