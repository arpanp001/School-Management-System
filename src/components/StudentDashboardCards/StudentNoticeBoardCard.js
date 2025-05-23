import React, { useEffect, useState } from 'react';
import '../StudentDashboardCardsCss/StudentNoticeBoardCard.css';
import { db } from '../../firebase/config';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { FaTree, FaSchool, FaUmbrellaBeach } from 'react-icons/fa';

const StudentNoticeBoardCard = () => {
    const [upcomingEvents, setUpcomingEvents] = useState([]);

    useEffect(() => {
        const fetchUpcomingEvents = async () => {
            // Fetch events, sort by date ascending
            const eventsQuery = query(
                collection(db, 'events'),
                orderBy('date', 'asc')
            );
            const eventsSnap = await getDocs(eventsQuery);
            const eventsList = eventsSnap.docs.map(doc => ({
                id: doc.id,
                title: doc.data().name,
                date: new Date(doc.data().date),
                type: doc.data().type,
                description: doc.data().description,
            }));

            // Filter for upcoming events (date >= today) and limit to 3
            const today = new Date();
            today.setHours(0, 0, 0, 0); // Normalize to start of day
            const futureEvents = eventsList
                .filter(event => event.date >= today)
                .slice(0, 3);

            setUpcomingEvents(futureEvents);
        };

        fetchUpcomingEvents();
    }, []);

    // Function to get event icon based on type, matching StudentEvents
    const getEventIcon = (type) => {
        switch (type) {
            case 'Holiday': return <FaUmbrellaBeach className="event-icon" />;
            case 'Festival': return <FaTree className="event-icon" />;
            case 'School Function': return <FaSchool className="event-icon" />;
            default: return null;
        }
    };

    return (
        <div className="student-notice-board-card">
            <h2>Upcoming Events</h2>
            {upcomingEvents.length > 0 ? (
                <ul>
                    {upcomingEvents.map(event => (
                        <li key={event.id} className={`event-item ${event.type.toLowerCase().replace(' ', '-')}`}>
                            <div className="event-title">
                                {getEventIcon(event.type)}
                                <span>{event.title}</span>
                            </div>
                            <div className="event-details">
                                <span>{event.date.toLocaleDateString()}</span>
                                <span className="event-type">{event.type}</span>
                            </div>
                        </li>
                    ))}
                </ul>
            ) : (
                <p className="no-data">No upcoming events.</p>
            )}
        </div>
    );
};

export default StudentNoticeBoardCard;