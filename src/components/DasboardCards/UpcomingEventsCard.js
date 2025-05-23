import React from 'react';
import { FaTree, FaSchool, FaCalendarDay } from 'react-icons/fa'; // Import icons
import '../../components/DasboardCardsCss/UpcomingEventsCard.css'; // Adjust the path as necessary

const UpcomingEventsCard = ({ title, events }) => {
    // Function to map event type to an icon
    const getEventIcon = (type) => {
        switch (type) {
            case 'Holiday':
                return <FaCalendarDay className="event-icon" />;
            case 'Festival':
                return <FaTree className="event-icon" />;
            case 'School Function':
                return <FaSchool className="event-icon" />;
            default:
                return null; // No icon for unrecognized types
        }
    };

    return (
        <div className="upcoming-events-card">
            <h6 className="events-title">{title}</h6>
            {events.length === 0 ? (
                <p className="no-events">Loading events...</p>
            ) : (
                <ul className="events-list">
                    {events.map((event, index) => (
                        <li key={index} className="event-item">
                            <div className="event-content">
                                {getEventIcon(event.type)}
                                <span className="event-text">{event.name}</span>
                            </div>
                            <span className="event-date">{event.date}</span>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

export default UpcomingEventsCard;