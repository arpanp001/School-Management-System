import React from 'react';
import { FaBullhorn } from 'react-icons/fa';
import '../../components/DasboardCardsCss/AnnouncementsCard.css';

const AnnouncementsCard = ({ title, announcements }) => {
    return (
        <div className="announcements-card">
            <div className="announcements-header">
                <h6 className="announcements-title">{title}</h6>
                <FaBullhorn className="announcements-icon" />
            </div>
            {announcements.length === 0 ? (
                <p className="no-announcements">Loading announcements...</p>
            ) : (
                <ul className="announcements-list">
                    {announcements.map((announcement, index) => (
                        <li key={index} className="announcement-item">
                            <span className="announcement-text">{announcement.text}</span>
                            <span className="announcement-date">{announcement.date}</span>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

export default AnnouncementsCard;