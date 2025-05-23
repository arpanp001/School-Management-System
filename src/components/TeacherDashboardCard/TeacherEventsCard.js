import React, { useState, useEffect } from 'react';
import { db } from '../../firebase/config'; // Adjust path to your Firebase config
import { collection, onSnapshot } from 'firebase/firestore';
import { toast } from 'react-toastify';
import { FaUmbrellaBeach, FaTree, FaSchool } from 'react-icons/fa';
import '../TeacherDashboardCardCss/TeacherEventsCard.css';

const TeacherEventsCard = () => {
    const [upcomingEvents, setUpcomingEvents] = useState([]);

    useEffect(() => {
        const unsubscribe = onSnapshot(collection(db, 'events'), (snapshot) => {
            const eventsData = snapshot.docs.map(doc => ({
                id: doc.id,
                title: doc.data().name,
                date: new Date(doc.data().date),
                type: doc.data().type,
            }));

            // Filter for upcoming events (date >= today), sort by date, and take top 3
            const today = new Date();
            today.setHours(0, 0, 0, 0); // Normalize to start of day
            const filteredEvents = eventsData
                .filter(event => event.date >= today)
                .sort((a, b) => a.date - b.date)
                .slice(0, 3);

            setUpcomingEvents(filteredEvents);
        }, (error) => {
            console.error('Error fetching events:', error);
            toast.error('Failed to load events');
        });

        return () => unsubscribe();
    }, []);

    // Function to get icon based on event type
    const getEventIcon = (type) => {
        switch (type) {
            case 'Holiday':
                return <FaUmbrellaBeach className={`event-icon holiday-icon`} />;
            case 'Festival':
                return <FaTree className={`event-icon festival-icon`} />;
            case 'School Function':
                return <FaSchool className={`event-icon school-function-icon`} />;
            default:
                return null;
        }
    };

    return (
        <div className="events-card-container">
            <h3>Upcoming Events</h3>
            {upcomingEvents.length > 0 ? (
                <ul className="events-list">
                    {upcomingEvents.map(event => (
                        <li key={event.id} className={`event-item ${event.type.toLowerCase().replace(' ', '-')}`}>
                            <div className="event-content">
                                {getEventIcon(event.type)}
                                <div className="event-details">
                                    <span className="event-title">{event.title}</span>
                                    <span className="event-date">
                                        {event.date.toLocaleDateString('en-US', {
                                            day: '2-digit',
                                            month: 'short',
                                            year: 'numeric',
                                        })}
                                    </span>
                                    <span className="event-type">{event.type}</span>
                                </div>
                            </div>
                        </li>
                    ))}
                </ul>
            ) : (
                <p className="no-events">No upcoming events available.</p>
            )}
        </div>
    );
};

export default TeacherEventsCard;