import React, { useState, useEffect, useRef } from 'react';
import { db } from '../../firebase/config'; // Adjust path
import { collection, onSnapshot } from 'firebase/firestore';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import listPlugin from '@fullcalendar/list';
import interactionPlugin from '@fullcalendar/interaction';
import { Modal, Button, Row, Col } from 'react-bootstrap';
import { FaTree, FaSchool, FaUmbrellaBeach } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import { Tooltip } from 'react-tooltip';
import { toast } from 'react-toastify';
import '../../pages/StudentPagesStyle/StudentEvents.css';

/**
 * StudentEvents Component
 * 
 * A professional calendar interface for displaying school events with various filtering options
 * and interactive UI elements.
 */
const StudentEvents = () => {
    // ==================== STATE MANAGEMENT ====================
    const [events, setEvents] = useState([]);
    const [filteredEvents, setFilteredEvents] = useState([]);
    const [filter, setFilter] = useState('All');
    const [selectedMonth, setSelectedMonth] = useState('All');
    const [showModal, setShowModal] = useState(false);
    const [selectedEvent, setSelectedEvent] = useState(null);
    const calendarRef = useRef(null);

    // ==================== DATA FETCHING ====================
    useEffect(() => {
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
        }, (error) => {
            console.error('Error fetching events:', error);
            toast.error('Failed to load events');
        });
        return () => unsubscribe();
    }, []);

    // ==================== EVENT FILTERING ====================
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

    // ==================== EVENT HANDLERS ====================
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

    // ==================== UTILITY FUNCTIONS ====================
    const getEventIcon = (type) => {
        switch (type) {
            case 'Holiday': return <FaUmbrellaBeach className="se-icon-spacing" />;
            case 'Festival': return <FaTree className="se-icon-spacing" />;
            case 'School Function': return <FaSchool className="se-icon-spacing" />;
            default: return null;
        }
    };

    const changeView = (view) => {
        const calendarApi = calendarRef.current?.getApi();
        if (calendarApi) {
            calendarApi.changeView(view);
        }
    };

    // ==================== CALENDAR CONTENT RENDERERS ====================
    const eventContent = (arg) => {
        const { type, description } = arg.event.extendedProps;
        const eventClassName = `se-event-item se-event-${type.toLowerCase().replace(' ', '-')}`;

        return (
            <motion.div
                className={eventClassName}
                data-tooltip-id={`tooltip-${arg.event.id}`}
                data-tooltip-content={`${arg.event.title}\n${type}\n${description}`}
                whileHover={{ scale: 1.05 }}
                transition={{ duration: 0.2 }}
            >
                {getEventIcon(type)}
                {arg.event.title}
            </motion.div>
        );
    };

    // ==================== DROPDOWN DATA ====================
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

    // ==================== COMPONENT RENDER ====================
    return (
        <div className="se-container">
            <h2 className="se-main-title">My School Events</h2>

            {/* Filter Controls Section */}
            <Row className="se-controls-row">
                <Col xs={12} md={4} className="se-filter-col">
                    <div className="se-filter-wrapper">
                        <label className="se-filter-label">Filter Events:</label>
                        <select
                            className="se-custom-select"
                            value={filter}
                            onChange={(e) => setFilter(e.target.value)}
                        >
                            <option value="All">All Events</option>
                            <option value="Holiday">Holidays</option>
                            <option value="Festival">Festivals</option>
                            <option value="School Function">School Functions</option>
                        </select>
                    </div>
                </Col>
                <Col xs={12} md={4} className="se-month-col">
                    <div className="se-filter-wrapper">
                        <label className="se-filter-label">Select Month:</label>
                        <select
                            className="se-custom-select"
                            value={selectedMonth}
                            onChange={handleMonthChange}
                        >
                            {months.map(month => (
                                <option key={month.value} value={month.value}>{month.label}</option>
                            ))}
                        </select>
                    </div>
                </Col>
                <Col xs={12} md={4} className="se-view-buttons-col">

                </Col>
            </Row>

            {/* Legend Section */}
            <div className="se-legend">
                <span className="se-legend-item se-legend-holiday"><FaUmbrellaBeach /> Holiday</span>
                <span className="se-legend-item se-legend-festival"><FaTree /> Festival</span>
                <span className="se-legend-item se-legend-school-function"><FaSchool /> School Function</span>
            </div>

            {/* Calendar Section */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="se-calendar-wrapper"
            >
                <FullCalendar
                    ref={calendarRef}
                    plugins={[dayGridPlugin, timeGridPlugin, listPlugin, interactionPlugin]}
                    initialView="dayGridMonth"
                    events={filteredEvents}
                    eventContent={eventContent}
                    eventClick={handleEventClick}
                    headerToolbar={{
                        left: 'prev,next today',
                        center: 'title',
                        right: 'dayGridMonth,timeGridWeek,listMonth'
                    }}
                    height="70vh"
                    className="se-calendar"
                    eventDisplay="block"
                    editable={false}
                    dayCellClassNames={(arg) => arg.date.toDateString() === new Date().toDateString() ? 'se-today-cell' : ''}
                />
            </motion.div>

            <Tooltip id="tooltip" place="top" effect="solid" multiline={true} className="se-custom-tooltip" />

            {/* Event Details Modal */}
            <Modal
                show={showModal}
                onHide={() => setShowModal(false)}
                centered
                className="se-modal"
                size="sm"
            >
                <Modal.Header
                    closeButton
                    className={selectedEvent ? `se-modal-header-${selectedEvent.type.toLowerCase().replace(' ', '-')}` : ''}
                >
                    <Modal.Title>{selectedEvent?.title}</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <AnimatePresence>
                        {selectedEvent && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.8 }}
                                transition={{ duration: 0.3 }}
                                className={`se-event-detail-card se-card-${selectedEvent.type.toLowerCase().replace(' ', '-')}`}
                            >
                                <h5>{getEventIcon(selectedEvent.type)}{selectedEvent.title}</h5>
                                <p><strong>Date:</strong> {selectedEvent.date.toLocaleDateString()}</p>
                                <p><strong>Type:</strong> {selectedEvent.type}</p>
                                <p><strong>Description:</strong> {selectedEvent.description}</p>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" className="se-close-btn" onClick={() => setShowModal(false)}>Close</Button>
                </Modal.Footer>
            </Modal>
        </div>
    );
};

export default StudentEvents;