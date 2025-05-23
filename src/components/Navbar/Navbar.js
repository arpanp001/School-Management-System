import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../../firebase/config';
import { signOut } from 'firebase/auth';
import { collection, query, where, onSnapshot, doc, updateDoc, getDocs } from 'firebase/firestore';
import './Navbar.css';

const Navbar = ({ isOpen, role = 'unknown' }) => {
  const [userDetails, setUserDetails] = useState({ email: '', role: '' });
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notificationLoading, setNotificationLoading] = useState(true);
  const [newNotification, setNewNotification] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const user = auth.currentUser;
    if (user) {
      setUserDetails({
        email: user.email,
        role: localStorage.getItem('userRole') || 'Unknown Role',
      });

      if (role === 'student') {
        const q = query(
          collection(db, 'studentLog', user.uid, 'notifications'),
          where('read', '==', false)
        );
        const unsubscribe = onSnapshot(
          q,
          (snapshot) => {
            const notifs = snapshot.docs.map((doc) => ({
              id: doc.id,
              ...doc.data(),
            }));
            setNotifications(notifs.sort((a, b) => b.createdAt.toDate() - a.createdAt.toDate()));
            setNotificationLoading(false);
            if (notifs.length > notifications.length && notifications.length > 0) {
              setNewNotification(true);
              setTimeout(() => setNewNotification(false), 2000);
            }
          },
          (error) => {
            console.error('Error fetching notifications:', error);
            setNotificationLoading(false);
          }
        );
        return () => unsubscribe();
      }
    }
  }, [role, notifications.length]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      localStorage.removeItem('userRole');
      navigate('/');
    } catch (error) {
      console.error('Error logging out:', error.message);
    }
  };

  const createRipple = (event) => {
    const button = event.currentTarget;
    const ripple = document.createElement('span');
    const diameter = Math.max(button.clientWidth, button.clientHeight);
    const radius = diameter / 2;

    ripple.style.width = ripple.style.height = `${diameter}px`;
    ripple.style.left = `${event.clientX - button.getBoundingClientRect().left - radius}px`;
    ripple.style.top = `${event.clientY - button.getBoundingClientRect().top - radius}px`;
    ripple.classList.add('ripple');

    button.appendChild(ripple);

    setTimeout(() => {
      ripple.remove();
    }, 600);
  };

  const markNotificationAsRead = async (notificationId, link) => {
    try {
      const notifRef = doc(db, 'studentLog', auth.currentUser.uid, 'notifications', notificationId);
      await updateDoc(notifRef, { read: true });
      navigate(link || '/student/fee-management');
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllNotificationsAsRead = async () => {
    try {
      const notifRef = collection(db, 'studentLog', auth.currentUser.uid, 'notifications');
      const q = query(notifRef, where('read', '==', false));
      const snapshot = await getDocs(q);
      const updates = snapshot.docs.map((doc) =>
        updateDoc(doc.ref, { read: true })
      );
      await Promise.all(updates);
      setNotifications([]);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const formatRelativeTime = (date) => {
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);
    if (diffInSeconds < 60) return `${diffInSeconds} seconds ago`;
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) return `${diffInMinutes} minute${diffInMinutes === 1 ? '' : 's'} ago`;
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours} hour${diffInHours === 1 ? '' : 's'} ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays} day${diffInDays === 1 ? '' : 's'} ago`;
  };

  return (
    <nav className={`navbar ${!isOpen ? 'sidebar-collapsed' : ''}`}>
      <div className="container-fluid px-4">
        <div className="d-flex align-items-center w-100">
          <div className="search-container me-auto"></div>

          <div className="navbar-items">
            {role === 'student' && (
              <div className={`notifications position-relative me-3 ${newNotification ? 'shake' : ''}`}>
                <button
                  className="btn btn-link p-0 ripple-btn notification-bell"
                  onClick={(e) => {
                    setNotificationsOpen(!notificationsOpen);
                    createRipple(e);
                  }}
                  aria-label="View notifications"
                >
                  <i className="bi bi-bell-fill" style={{ fontSize: '1.7rem', color: '#ff9500' }}></i>
                  {notifications.length > 0 && (
                    <span className="notification-badge">
                      {notifications.length}
                    </span>
                  )}
                </button>
                {notificationsOpen && (
                  <div
                    className="dropdown-menu dropdown-menu-end shadow notification-dropdown"
                    style={{
                      display: 'block',
                      top: '120%',
                      right: '0',
                      background: 'rgba(255, 255, 255, 0.15)',
                      backdropFilter: 'blur(15px)',
                      border: '1px solid rgba(255, 255, 255, 0.3)',
                      borderRadius: '10px',
                      maxHeight: '400px',
                      width: '300px',
                      padding: '0',
                      transition: 'opacity 0.3s ease, transform 0.3s ease',
                      opacity: notificationsOpen ? 1 : 0,
                      transform: notificationsOpen ? 'translateY(0)' : 'translateY(-10px)',
                    }}
                  >
                    <div className="notification-header">
                      <div className="notification-title">
                        <span>Notifications</span>
                      </div>
                      <button
                        className="mark-all-btn"
                        onClick={markAllNotificationsAsRead}
                        aria-label="Mark all notifications as read"
                        style={{ display: notifications.length > 0 ? 'block' : 'none' }}
                      >
                        Mark All as Read
                      </button>
                      <button
                        className="close-btn"
                        onClick={() => setNotificationsOpen(false)}
                        aria-label="Close notifications"
                      >
                        <i className="bi bi-x"></i>
                      </button>
                    </div>
                    <div className="notification-list">
                      {notificationLoading ? (
                        <div className="notification-loading">Loading notifications...</div>
                      ) : notifications.length > 0 ? (
                        notifications.map((notif, index) => (
                          <div
                            key={notif.id}
                            className="notification-item"
                            onClick={() => markNotificationAsRead(notif.id, notif.link)}
                          >
                            <i
                              className={`bi ${notif.type === 'new_book' ? 'bi-book' :
                                notif.type === 'grade' ? 'bi-award' :
                                  notif.type === 'exam_schedule' ? 'bi-calendar-event' :
                                    notif.type === 'attendance' ? 'bi-person-x' :
                                      notif.type === 'announcement' ? 'bi-megaphone' :
                                        'bi-currency-dollar'} notification-icon`}
                              style={{ color: '#00bcd4' }}
                            ></i>
                            <div className="notification-content">
                              <strong>{notif.message}</strong>
                              <small>{formatRelativeTime(notif.createdAt.toDate())}</small>
                            </div>
                            {index < notifications.length - 1 && <div className="notification-divider"></div>}
                          </div>
                        ))
                      ) : (
                        <div className="notification-empty">
                          <i className="bi bi-bell notification-empty-icon"></i>
                          <span>No new notifications</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="user-info me-4">
              <span className="user-email">{userDetails.email}</span>
              <span className="badge bg-info ms-2">{userDetails.role.toUpperCase()}</span>
            </div>

            <div className="user-profile position-relative d-flex align-items-center">
              <button
                className="btn btn-link p-0 ripple-btn"
                onClick={(e) => {
                  setDropdownOpen(!dropdownOpen);
                  createRipple(e);
                }}
                aria-label="Toggle user menu"
              >
                <i className="bi bi-chevron-down" style={{ fontSize: '1.7rem', color: 'white' }}></i>
              </button>

              <button
                className="btn btn-link p-0 ripple-btn ms-2"
                onClick={createRipple}
                aria-label="User profile"
              >
                <i className="bi bi-person-circle" style={{ fontSize: '2rem', color: 'white' }}></i>
              </button>

              {dropdownOpen && (
                <div
                  className="dropdown-menu dropdown-menu-end shadow"
                  style={{
                    display: 'block',
                    position: 'absolute',
                    top: '100%',
                    right: '0',
                    background: 'rgba(255, 255, 255, 0.1)',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '8px',
                  }}
                >
                  <button
                    className="dropdown-item ripple-btn"
                    onClick={(e) => {
                      handleLogout();
                      createRipple(e);
                    }}
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default React.memo(Navbar);