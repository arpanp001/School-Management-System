import React, { useState, useEffect, useRef } from 'react';
import { db } from '../../firebase/config';
import { collection, onSnapshot } from 'firebase/firestore';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import listPlugin from '@fullcalendar/list';
import interactionPlugin from '@fullcalendar/interaction';
import { FaTree, FaSchool, FaUmbrellaBeach, FaCalendarAlt, FaFilter, FaExternalLinkAlt } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import { Tooltip } from 'react-tooltip';
import { toast } from 'react-toastify';
import '../../pages/TeacherPagesStyle/TeacherEvents.css';

// Component for displaying loading message with animation
const LoadingMessage = () => (
    <motion.div
        className="events-loading"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1, scale: [0.9, 1.1, 1] }}
        transition={{ duration: 1.5, repeat: Infinity, repeatType: "reverse" }}
    >
        <FaCalendarAlt className="events-loading-icon" />
        <span>Loading events...</span>
    </motion.div>
);

// Enhanced component for filter, month dropdown, and view controls
const EventFilters = ({ filter, setFilter, selectedMonth, handleMonthChange, changeView, months }) => (
    <motion.div
        className="events-controls"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
    >
        <div className="events-filter-container">
            <div className="events-filter-group">
                <FaFilter className="events-filter-icon" />
                <div className="events-filter-wrapper">
                    <label className="events-label">Filter Events:</label>
                    <select
                        className="events-select"
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                    >
                        <option value="All">All Events</option>
                        <option value="Holiday">Holidays</option>
                        <option value="Festival">Festivals</option>
                        <option value="School Function">School Functions</option>
                    </select>
                </div>
            </div>
            <div className="events-filter-group">
                <FaCalendarAlt className="events-filter-icon" />
                <div className="events-filter-wrapper">
                    <label className="events-label">Select Month:</label>
                    <select
                        className="events-select"
                        value={selectedMonth}
                        onChange={handleMonthChange}
                    >
                        {months.map(month => (
                            <option key={month.value} value={month.value}>{month.label}</option>
                        ))}
                    </select>
                </div>
            </div>
        </div>
        <div className="events-view-buttons">
            <motion.button
                className="events-button events-button-month"
                onClick={() => changeView('dayGridMonth')}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                transition={{ type: "spring", stiffness: 400, damping: 17 }}
            >
                Month
            </motion.button>
            <motion.button
                className="events-button events-button-week"
                onClick={() => changeView('timeGridWeek')}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                transition={{ type: "spring", stiffness: 400, damping: 17 }}
            >
                Week
            </motion.button>
            <motion.button
                className="events-button events-button-list"
                onClick={() => changeView('listMonth')}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                transition={{ type: "spring", stiffness: 400, damping: 17 }}
            >
                List
            </motion.button>
        </div>
    </motion.div>
);

// Enhanced component for the event legend
const EventLegend = ({ getEventIcon }) => (
    <motion.div
        className="events-legend"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
    >
        <motion.span
            className="events-legend-item events-legend-holiday"
            whileHover={{ scale: 1.1, boxShadow: "0 4px 8px rgba(0,0,0,0.2)" }}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
        >
            {getEventIcon('Holiday')} Holiday
        </motion.span>
        <motion.span
            className="events-legend-item events-legend-festival"
            whileHover={{ scale: 1.1, boxShadow: "0 4px 8px rgba(0,0,0,0.2)" }}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
        >
            {getEventIcon('Festival')} Festival
        </motion.span>
        <motion.span
            className="events-legend-item events-legend-school-function"
            whileHover={{ scale: 1.1, boxShadow: "0 4px 8px rgba(0,0,0,0.2)" }}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
        >
            {getEventIcon('School Function')} School Function
        </motion.span>
    </motion.div>
);

// Enhanced component for the event details modal
const EventModal = ({ showModal, setShowModal, selectedEvent, getEventIcon }) => {
    // Variants for animation
    const backdropVariants = {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { duration: 0.3 } }
    };

    const modalVariants = {
        hidden: { opacity: 0, scale: 0.8, y: 20 },
        visible: {
            opacity: 1,
            scale: 1,
            y: 0,
            transition: {
                type: "spring",
                stiffness: 300,
                damping: 25,
                delay: 0.1
            }
        },
        exit: {
            opacity: 0,
            scale: 0.8,
            transition: { duration: 0.2 }
        }
    };

    return (
        <AnimatePresence>
            {showModal && (
                <motion.div
                    className="events-modal"
                    initial="hidden"
                    animate="visible"
                    exit="hidden"
                    variants={backdropVariants}
                    onClick={(e) => {
                        if (e.target.classList.contains('events-modal')) {
                            setShowModal(false);
                        }
                    }}
                >
                    <motion.div
                        className="events-modal-content"
                        variants={modalVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                    >
                        <div
                            className="events-modal-header"
                            style={{
                                background: selectedEvent
                                    ? `linear-gradient(135deg, var(--event-${selectedEvent.type.toLowerCase().replace(' ', '-')}-start), var(--event-${selectedEvent.type.toLowerCase().replace(' ', '-')}-end))`
                                    : '#f8f9fa',
                            }}
                        >
                            <h5 className="events-modal-title">
                                {getEventIcon(selectedEvent?.type)} {selectedEvent?.title}
                            </h5>
                            <motion.button
                                className="events-modal-close"
                                onClick={() => setShowModal(false)}
                                whileHover={{ scale: 1.2, rotate: 90 }}
                                transition={{ duration: 0.2 }}
                            >
                                ×
                            </motion.button>
                        </div>
                        <div className="events-modal-body">
                            {selectedEvent && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.3, delay: 0.2 }}
                                    className="events-modal-card"
                                    style={{
                                        background: `linear-gradient(135deg, var(--event-${selectedEvent.type.toLowerCase().replace(' ', '-')}-start)10, var(--event-${selectedEvent.type.toLowerCase().replace(' ', '-')}-end)10)`
                                    }}
                                >
                                    <div className="events-modal-info">
                                        <p className="events-modal-date">
                                            <span className="events-modal-label">Date:</span>
                                            <span className="events-modal-value">{selectedEvent.date.toLocaleDateString('en-US', {
                                                weekday: 'long',
                                                year: 'numeric',
                                                month: 'long',
                                                day: 'numeric'
                                            })}</span>
                                        </p>
                                        <p className="events-modal-type">
                                            <span className="events-modal-label">Type:</span>
                                            <span className="events-modal-value events-modal-badge" style={{
                                                background: `linear-gradient(135deg, var(--event-${selectedEvent.type.toLowerCase().replace(' ', '-')}-start), var(--event-${selectedEvent.type.toLowerCase().replace(' ', '-')}-end))`
                                            }}>{selectedEvent.type}</span>
                                        </p>
                                        <div className="events-modal-description">
                                            <span className="events-modal-label">Description:</span>
                                            <p className="events-modal-value">{selectedEvent.description}</p>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </div>
                        <div className="events-modal-footer">
                            <motion.button
                                className="events-button events-button-close"
                                onClick={() => setShowModal(false)}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                transition={{ type: "spring", stiffness: 400, damping: 17 }}
                            >
                                Close
                            </motion.button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

// Custom list event component for list view
const ListEventCard = ({ event, handleEventClick }) => {
    const eventType = event.extendedProps.type;
    const eventClass = `events-list-event events-event-${eventType.toLowerCase().replace(' ', '-')}`;

    // Get the appropriate icon for this event type
    const getEventIcon = (type) => {
        switch (type) {
            case 'Holiday': return <FaUmbrellaBeach className="events-icon" />;
            case 'Festival': return <FaTree className="events-icon" />;
            case 'School Function': return <FaSchool className="events-icon" />;
            default: return null;
        }
    };

    return (
        <motion.div
            className={eventClass}
            whileHover={{ scale: 1.02, boxShadow: "0 6px 12px rgba(0,0,0,0.15)" }}
            onClick={() => handleEventClick({ event })}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
        >
            <div className="events-list-event-date">
                {new Date(event.start).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric'
                })}
            </div>
            <div className="events-list-event-content">
                <div className="events-list-event-title">
                    {getEventIcon(eventType)} {event.title}
                </div>
                <div className="events-list-event-type">
                    {eventType}
                </div>
            </div>
            <div className="events-list-event-icon">
                <FaExternalLinkAlt />
            </div>
        </motion.div>
    );
};

// Event Stats Summary Component
const EventStats = ({ events }) => {
    const holidays = events.filter(event => event.extendedProps.type === 'Holiday').length;
    const festivals = events.filter(event => event.extendedProps.type === 'Festival').length;
    const schoolFunctions = events.filter(event => event.extendedProps.type === 'School Function').length;

    return (
        <motion.div
            className="events-stats"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
        >
            <div className="events-stats-title">Event Summary</div>
            <div className="events-stats-container">
                <motion.div
                    className="events-stats-item events-stats-holiday"
                    whileHover={{ scale: 1.05 }}
                >
                    <FaUmbrellaBeach className="events-stats-icon" />
                    <div className="events-stats-count">{holidays}</div>
                    <div className="events-stats-label">Holidays</div>
                </motion.div>
                <motion.div
                    className="events-stats-item events-stats-festival"
                    whileHover={{ scale: 1.05 }}
                >
                    <FaTree className="events-stats-icon" />
                    <div className="events-stats-count">{festivals}</div>
                    <div className="events-stats-label">Festivals</div>
                </motion.div>
                <motion.div
                    className="events-stats-item events-stats-school"
                    whileHover={{ scale: 1.05 }}
                >
                    <FaSchool className="events-stats-icon" />
                    <div className="events-stats-count">{schoolFunctions}</div>
                    <div className="events-stats-label">School Functions</div>
                </motion.div>
            </div>
        </motion.div>
    );
};

// Enhanced TeacherEvents Component
const TeacherEvents = () => {
    // State management
    const [events, setEvents] = useState([]);
    const [filteredEvents, setFilteredEvents] = useState([]);
    const [filter, setFilter] = useState('All');
    const [selectedMonth, setSelectedMonth] = useState('All');
    const [showModal, setShowModal] = useState(false);
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [currentView, setCurrentView] = useState('dayGridMonth');
    const [showStats, setShowStats] = useState(true);
    const calendarRef = useRef(null);

    const months = [
        { value: 'All', label: 'All Months' },
        { value: '0', label: 'January' },
        { value: '1', label: 'February' },
        { value: '2', label: 'March' },
        { value: '3', label: 'April' },
        { value: '4', label: 'May' },
        { value: '5', label: 'June' },
        { value: '6', label: 'July' },
        { value: '7', label: 'August' },
        { value: '8', label: 'September' },
        { value: '9', label: 'October' },
        { value: '10', label: 'November' },
        { value: '11', label: 'December' },
    ];

    // Helper functions
    const getEventClass = (type) => {
        const formattedType = type.toLowerCase().replace(' ', '-');
        return `events-event-${formattedType}`;
    };

    const getEventIcon = (type) => {
        switch (type) {
            case 'Holiday': return <FaUmbrellaBeach className="events-icon" />;
            case 'Festival': return <FaTree className="events-icon" />;
            case 'School Function': return <FaSchool className="events-icon" />;
            default: return null;
        }
    };

    const handleEventClick = (info) => {
        setSelectedEvent({
            id: info.event.id,
            title: info.event.title,
            date: info.event.start,
            type: info.event.extendedProps.type,
            description: info.event.extendedProps.description,
        });
        setShowModal(true);
    };

    const eventContent = (arg) => {
        const { type, description } = arg.event.extendedProps;
        const eventClass = getEventClass(type);

        return (
            <motion.div
                className={`events-event-custom ${eventClass}`}
                data-tooltip-id={`tooltip-${arg.event.id}`}
                data-tooltip-content={`${arg.event.title} (${type})`}
                whileHover={{ scale: 1.05, boxShadow: '0 6px 12px rgba(0,0,0,0.2)' }}
                transition={{ duration: 0.2 }}
            >
                {getEventIcon(type)}
                <span className="events-event-title">{arg.event.title}</span>
            </motion.div>
        );
    };

    // Custom rendering for list view
    const renderEventContent = (eventInfo) => {
        if (currentView === 'listMonth') {
            return <ListEventCard event={eventInfo.event} handleEventClick={handleEventClick} />;
        }
        return eventContent(eventInfo);
    };

    const changeView = (view) => {
        const calendarApi = calendarRef.current?.getApi();
        if (calendarApi) {
            calendarApi.changeView(view);
            setCurrentView(view);
            // Show stats only in month view
            setShowStats(view === 'dayGridMonth');
        }
    };

    const handleMonthChange = (e) => {
        const month = e.target.value;
        setSelectedMonth(month);
        const calendarApi = calendarRef.current?.getApi();
        if (calendarApi) {
            const currentYear = new Date().getFullYear();
            if (month === 'All') {
                calendarApi.gotoDate(new Date(currentYear, 0, 1));
            } else {
                const monthNum = parseInt(month);
                calendarApi.gotoDate(new Date(currentYear, monthNum, 1));
            }
        }
    };

    // Data fetching
    useEffect(() => {
        setIsLoading(true);
        const unsubscribe = onSnapshot(collection(db, 'events'), (snapshot) => {
            const eventsData = snapshot.docs.map(doc => ({
                id: doc.id,
                title: doc.data().name,
                date: new Date(doc.data().date).toISOString().split('T')[0],
                extendedProps: {
                    type: doc.data().type,
                    description: doc.data().description,
                },
            }));
            setEvents(eventsData);
            setFilteredEvents(eventsData);
            setIsLoading(false);

            // Show success toast
            toast.success(`${eventsData.length} events loaded successfully!`, {
                position: "top-right",
                autoClose: 3000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
                progress: undefined,
            });
        }, (error) => {
            console.error('Error fetching events:', error);
            toast.error('Failed to load events. Please try again later.', {
                position: "top-right",
                autoClose: false,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
                progress: undefined,
            });
            setIsLoading(false);
        });
        return () => unsubscribe();
    }, []);

    // Filtering logic
    useEffect(() => {
        let tempEvents = events;
        if (filter !== 'All') {
            tempEvents = tempEvents.filter(event => event.extendedProps.type === filter);
        }
        if (selectedMonth !== 'All') {
            const currentYear = new Date().getFullYear();
            tempEvents = tempEvents.filter(event => {
                const eventDate = new Date(event.date);
                return eventDate.getFullYear() === currentYear && eventDate.getMonth() === parseInt(selectedMonth);
            });
        }
        setFilteredEvents(tempEvents);
    }, [filter, selectedMonth, events]);

    // Enhanced view change handler
    const handleViewChange = (info) => {
        setCurrentView(info.view.type);
        // Show stats only in month view
        setShowStats(info.view.type === 'dayGridMonth');
    };

    // Render
    return (
        <motion.div
            className="events-container"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
        >
            <motion.h2
                className="events-title"
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.1, duration: 0.5 }}
            >
                <FaCalendarAlt className="events-title-icon" /> School Events Calendar
            </motion.h2>

            {isLoading ? (
                <LoadingMessage />
            ) : (
                <>
                    <EventFilters
                        filter={filter}
                        setFilter={setFilter}
                        selectedMonth={selectedMonth}
                        handleMonthChange={handleMonthChange}
                        changeView={changeView}
                        months={months}
                    />

                    <EventLegend getEventIcon={getEventIcon} />

                    {showStats && <EventStats events={filteredEvents} />}

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.3 }}
                        className="events-calendar-wrapper"
                    >
                        <FullCalendar
                            ref={calendarRef}
                            plugins={[dayGridPlugin, timeGridPlugin, listPlugin, interactionPlugin]}
                            initialView="dayGridMonth"
                            events={filteredEvents}
                            eventContent={renderEventContent}
                            eventClick={handleEventClick}
                            headerToolbar={{
                                left: 'prev,today,next',
                                center: 'title',
                                right: 'dayGridMonth,timeGridWeek,listMonth'
                            }}
                            viewDidMount={handleViewChange}
                            height="auto"
                            className="events-fullcalendar"
                            eventDisplay="block"
                            editable={false}
                            dayCellClassNames={(arg) => arg.date.toDateString() === new Date().toDateString() ? 'events-today-highlight events-today-pulse' : ''}
                            noEventsContent={() => (
                                <div className="events-no-events">
                                    <FaCalendarAlt className="events-no-events-icon" />
                                    <p>No events to display</p>
                                </div>
                            )}
                        />
                    </motion.div>

                    <Tooltip id="tooltip" place="top" effect="solid" className="events-tooltip" />

                    <EventModal
                        showModal={showModal}
                        setShowModal={setShowModal}
                        selectedEvent={selectedEvent}
                        getEventIcon={getEventIcon}
                    />
                </>
            )}
        </motion.div>
    );
};

export default TeacherEvents;