import React, { useState, useEffect, useRef } from 'react';
import { NavLink } from 'react-router-dom';
import { Tooltip } from 'react-tooltip';
import SchoolLogo from '../../assets/School-logo.jpg';
import './Sidebar.css';

const Sidebar = ({ isOpen, toggleSidebar, role }) => {
  const [expandedItems, setExpandedItems] = useState({});
  const sidebarContentRef = useRef(null);
  const [isScrolling, setIsScrolling] = useState(false);
  const scrollTimeoutRef = useRef(null);
  const [hasAnimated, setHasAnimated] = useState(false); // New state to track animation

  useEffect(() => {
    const scrollToActiveLink = () => {
      const activeLink = sidebarContentRef.current?.querySelector('.nav-link.active');
      if (activeLink) {
        activeLink.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    };

    if (isOpen) {
      scrollToActiveLink();
      if (!hasAnimated) {
        setHasAnimated(true); // Set to true after the first render when sidebar opens
      }
    }
  }, [isOpen, hasAnimated]); // Include hasAnimated in dependencies

  const handleScroll = () => {
    if (!isScrolling) {
      setIsScrolling(true);
      sidebarContentRef.current?.classList.add('scrolling');
    }

    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }

    scrollTimeoutRef.current = setTimeout(() => {
      setIsScrolling(false);
      sidebarContentRef.current?.classList.remove('scrolling');
    }, 150);
  };

  useEffect(() => {
    return () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, []);

  const toggleSubmenu = (index) => {
    setExpandedItems(prev => {
      const newState = { ...prev, [index]: !prev[index] };

      setTimeout(() => {
        const activeLink = sidebarContentRef.current?.querySelector('.nav-link.active');
        if (activeLink) {
          activeLink.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
      }, 150);

      return newState;
    });
  };

  const adminNavItems = [
    {
      path: "/admin/home",
      icon: 'bi bi-speedometer',
      label: 'Dashboard'
    },
    {
      path: '/admin/class-subject',
      icon: 'bi bi-journal-bookmark',
      label: 'Courses & Subjects',
      subitems: [
        { path: '/admin/subjects', label: 'Manage Subjects' },
        { path: '/admin/class', label: 'Manage Class' },
        { path: '/admin/assign-teachers', label: 'Assign Teachers' },
        { path: '/admin/assign-students', label: 'Assign Students' },
      ],
    },
    {
      path: '/admin/teacher-attendance',
      icon: 'bi bi-card-checklist',
      label: 'Teacher Attendance'
    },
    {
      path: '/admin/timetable',
      icon: 'bi bi-clock',
      label: 'Timetable Management',
      subitems: [
        { path: '/admin/create-timetable', label: 'Create Timetable' },
        { path: '/admin/assign-timetable', label: 'Assign Timetable' },
        { path: '/admin/view-timetable', label: 'View Timetable' },
      ],
    },
    {
      path: '/admin/announcement',
      icon: 'bi bi-megaphone',
      label: 'Announcement',
      subitems: [
        { path: '/admin/create-announcement', label: 'Create Announcement' },
        { path: '/admin/view-announcement', label: 'View Announcement' },
      ],
    },
    {
      path: '/admin/leave-requests',
      icon: 'bi bi-calendar2-x',
      label: 'Leave Requests'
    },
    {
      path: '/admin/exam-schedule',
      icon: 'bi bi-calendar-week',
      label: 'Exam schedule'
    },
    {
      path: '/admin/grades',
      icon: 'bi bi-clipboard-data',
      label: 'Grade Management'
    },
    {
      path: '/admin/events',
      icon: 'bi bi-calendar4-range',
      label: 'Event Management'
    },
    {
      path: '/admin/library',
      icon: 'bi bi-pencil',
      label: 'Library Management',
      subitems: [
        { path: '/admin/library/books', label: 'Manage Books' },
        { path: '/admin/library/issuance', label: 'Book Issuance' },
        { path: '/admin/library/requests', label: 'Book Requests' },
        { path: '/admin/library/history', label: 'Borrowing History' },
      ],
    },
    {
      path: '/admin/id-card-management',
      icon: 'bi bi-person-vcard',
      label: 'ID Card Management'
    },
    {
      path: '/admin/transport',
      icon: 'bi-truck',
      label: 'Transport Management',
      subitems: [
        { path: '/admin/transport/buses', label: 'Manage Buses' },
        { path: '/admin/transport/routes', label: 'Manage Routes' },
        { path: '/admin/transport/assignments', label: 'Bus Assignments' },
        { path: '/admin/transport/student-assignments', label: 'Student Assignments' }
      ]
    },
    {
      path: '/admin/fee-management',
      icon: 'bi bi-currency-dollar',
      label: 'Fee Management'
    },
    {
      path: '/admin/student-attendance',
      icon: 'bi bi-card-checklist',
      label: 'Student Attendance',
      subitems: [
        { path: '/admin/attendance-record', label: 'Attendance Record' },
      ],
    },
    {
      path: '/admin/teacher-management',
      icon: 'bi bi-person-plus',
      label: 'Teacher Management'
    },
    {
      path: '/admin/manage-teachers',
      icon: 'bi bi-person-gear',
      label: 'Manage Teachers'
    },
  ];

  const teacherNavItems = [
    {
      path: '/teacher/dashboard',
      icon: 'bi bi-speedometer',
      label: 'Dashboard'
    },
    {
      path: '/teacher/punch',
      icon: 'bi bi-person-check',
      label: 'Attendance Punch'
    },
    {
      path: '/teacher/student-attendance',
      icon: 'bi bi-card-checklist',
      label: 'Student Attendance',
      subitems: [
        { path: '/teacher/mark-attendance', label: 'Mark Attendance' },
        { path: '/teacher/attendance-history', label: 'Attendance History' },
        { path: '/teacher/edit-attendance', label: 'Edit Attendance' },
      ],
    },
    {
      path: '/teacher/subject-courses',
      icon: 'bi bi-journal-text',
      label: 'My Subjects and Classes'
    },
    {
      path: '/teacher/timetable',
      icon: 'bi bi-clipboard-data',
      label: 'My Schedule'
    },
    {
      path: '/teacher/announcement',
      icon: 'bi bi-megaphone',
      label: 'Announcement',
      subitems: [
        { path: '/teacher/create-announcement', label: 'Create Announcement' },
        { path: '/teacher/view-announcement', label: 'View Announcement' },
      ],
    },
    {
      path: '/teacher/leave-requests',
      icon: 'bi bi-calendar2-x',
      label: 'Leave Requests'
    },
    {
      path: '/teacher/exam-schedule',
      icon: 'bi bi-calendar-week',
      label: 'Exam Schedule '
    },
    {
      path: '/teacher/grades',
      icon: 'bi bi-pencil-square',
      label: 'Grade Management'
    },
    {
      path: '/teacher/events',
      icon: 'bi bi-calendar4-range',
      label: 'Events'
    },
    {
      path: '/teacher/library',
      icon: 'bi bi-pencil',
      label: 'Library',
      subitems: [
        { path: '/teacher/library/books', label: 'Available Books' },
        { path: '/teacher/library/requests', label: 'My Requests' },
        { path: '/teacher/library/history', label: 'Borrowing History' },
      ],
    },
  ];

  const studentNavItems = [
    {
      path: '/student/dashboard',
      icon: 'bi bi-speedometer',
      label: 'Dashboard'
    },
    {
      path: '/student/subject-courses',
      icon: 'bi bi-journals',
      label: 'My Subjects'
    },
    {
      path: '/student/attendance',
      icon: 'bi bi-person-check',
      label: 'My Attendance'
    },
    {
      path: '/student/timetable',
      icon: 'bi bi-calendar3',
      label: 'Timetable'
    },
    {
      path: '/student/announcement',
      icon: 'bi bi-megaphone',
      label: 'Announcement'
    },
    {
      path: '/student/exam-schedule',
      icon: 'bi bi-calendar3',
      label: 'Exam Schedule'
    },
    {
      path: '/student/grades',
      icon: 'bi-file-earmark-bar-graph',
      label: 'My Grades'
    },
    {
      path: '/student/events',
      icon: 'bi-music-note-beamed',
      label: 'Events'
    },
    {
      path: '/student/library',
      icon: 'bi bi-pencil',
      label: 'Library',
      subitems: [
        { path: '/student/library/books', label: 'Available Books' },
        { path: '/student/library/requests', label: 'My Requests' },
        { path: '/student/library/history', label: 'Borrowing History' },
      ],
    },
    {
      path: '/student/profile',
      icon: 'bi bi-person-square',
      label: 'My Profile'
    },
    {
      path: '/student/id-card',
      icon: 'bi bi-person-vcard',
      label: 'My ID Card'
    },
    {
      path: '/student/transport',
      icon: 'bi-truck',
      label: 'My Transport'
    },
    {
      path: '/student/fee-management',
      icon: 'bi bi-currency-dollar',
      label: 'Fee Management'
    },
  ];

  const navItems = role === 'teacher' ? teacherNavItems : role === 'student' ? studentNavItems : adminNavItems;

  return (
    <div className={`sidebar ${!isOpen ? 'collapsed' : ''}`}>
      <div className="sidebar-header">
        <div className="d-flex align-items-center justify-content-between p-3">
          {isOpen && (
            <img
              src={SchoolLogo}
              alt="School Logo"
              className={`school-logo-sidebar ${!hasAnimated ? 'animate-logo' : ''}`} // Conditionally apply animation class
            />
          )}
          <button
            className="toggle-btn"
            onClick={toggleSidebar}
            aria-label={isOpen ? 'Collapse Sidebar' : 'Expand Sidebar'}
          >
            <i className={`fas ${isOpen ? 'fa-times' : 'fa-bars'}`}></i>
          </button>
        </div>
      </div>

      <div className="sidebar-content" ref={sidebarContentRef} onScroll={handleScroll}>
        <nav>
          <ul className="nav flex-column">
            {navItems.map((item, index) => {
              const tooltipId = `tooltip-${index}`;
              return (
                <li className="nav-item" key={index}>
                  {item.subitems ? (
                    <>
                      <div
                        className={`nav-link d-flex align-items-center justify-content-between ${expandedItems[index] ? 'active' : ''}`}
                        onClick={() => toggleSubmenu(index)}
                        style={{ cursor: 'pointer' }}
                        data-tooltip-id={!isOpen ? tooltipId : undefined}
                        data-tooltip-content={!isOpen ? item.label : undefined}
                        aria-label={item.label}
                      >
                        <div className="nav-link-inner">
                          <i className={`${item.icon} nav-icon`}></i>
                          {isOpen && <span className="nav-label">{item.label}</span>}
                        </div>
                        {isOpen && (
                          <i className={`bi bi-chevron-${expandedItems[index] ? 'down' : 'right'}`}></i>
                        )}
                      </div>
                      {expandedItems[index] && isOpen && (
                        <ul className="nav flex-column submenu">
                          {item.subitems.map((subitem, subIndex) => (
                            <li className="nav-item" key={`${index}-${subIndex}`}>
                              <NavLink
                                to={subitem.path}
                                className={({ isActive }) =>
                                  `nav-link sub-link ${isActive ? 'active' : ''}`
                                }
                                aria-label={subitem.label}
                              >
                                <i className="bi bi-arrow-right-short"></i>
                                <span>{subitem.label}</span>
                              </NavLink>
                            </li>
                          ))}
                        </ul>
                      )}
                      {!isOpen && (
                        <Tooltip
                          id={tooltipId}
                          place="right"
                          delayShow={200}
                          className="sidebar-tooltip"
                          aria-hidden={!isOpen}
                        />
                      )}
                    </>
                  ) : (
                    <>
                      <NavLink
                        to={item.path}
                        className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                        data-tooltip-id={!isOpen ? tooltipId : undefined}
                        data-tooltip-content={!isOpen ? item.label : undefined}
                        aria-label={item.label}
                      >
                        <i className={`${item.icon} nav-icon`}></i>
                        {isOpen && <span className="nav-label">{item.label}</span>}
                      </NavLink>
                      {!isOpen && (
                        <Tooltip
                          id={tooltipId}
                          place="right"
                          delayShow={200}
                          className="sidebar-tooltip"
                          aria-hidden={!isOpen}
                        />
                      )}
                    </>
                  )}
                </li>
              );
            })}
          </ul>
        </nav>
      </div>
    </div>
  );
};

export default Sidebar;