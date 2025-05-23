import React from 'react';
import '../DasboardCardsCss/SummaryCard.css'; // Assuming you have a CSS file for styling

const SummaryCard = ({ title, value, percentage, isPositive, description, icon: Icon, onClick }) => {
    return (
        <div
            className={`summary-card ${isPositive ? 'positive' : 'negative'}`}
            onClick={onClick}
            role={onClick ? 'button' : undefined}
            tabIndex={onClick ? 0 : undefined}
            onKeyPress={onClick ? (e) => e.key === 'Enter' && onClick() : undefined}
        >
            <div className="summary-header">
                <h6 className="summary-title">{title}</h6>
                {Icon ? (
                    <Icon
                        className={`summary-icon ${isPositive ? 'icon-positive' : 'icon-negative'}`}
                        aria-label={`${title} icon`}
                    />
                ) : (
                    <span className="summary-icon-fallback">📊</span>
                )}
            </div>
            <div className="summary-content">
                <span className="summary-value">{value}</span>
                <span
                    className="summary-percentage"
                    title={`Percentage change: ${percentage}`}
                >
                    {percentage}
                </span>
            </div>
            <p className="summary-description">{description}</p>
            <div className="progress-bar">
                <div
                    className="progress-fill"
                    style={{ width: percentage.replace('%', '') + '%' }}
                ></div>
            </div>
        </div>
    );
};

export default SummaryCard;