import React from 'react';
import '../../components/DasboardCardsCss/LibraryActivityCard.css'; // Adjust the path as necessary

const LibraryActivityCard = ({ title, issued, returned, overdue }) => {
    return (
        <div className="library-activity-card">
            <h6 className="library-title">{title}</h6>
            <div className="library-stats">
                <div className="stat-item">
                    <span className="stat-label">Books Issued</span>
                    <span className="stat-value">{issued}</span>
                </div>
                <div className="stat-item">
                    <span className="stat-label">Books Returned</span>
                    <span className="stat-value">{returned}</span>
                </div>
                <div className="stat-item">
                    <span className="stat-label">Overdue</span>
                    <span className="stat-value overdue">{overdue}</span>
                </div>
            </div>
        </div>
    );
};

export default LibraryActivityCard;