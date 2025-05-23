import React, { useState } from 'react';
import Sidebar from '../Sidebar/Sidebar';
import Navbar from '../Navbar/Navbar';
import './TeacherLayout.css';

const TeacherLayout = ({ children }) => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);

    const toggleSidebar = () => {
        setIsSidebarOpen(!isSidebarOpen);
    };

    return (
        <div className="teacher-layout">
            <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} role="teacher" />
            <div className={`content-wrapper ${!isSidebarOpen ? 'sidebar-collapsed' : ''}`}>
                <Navbar className={!isSidebarOpen ? 'sidebar-collapsed' : ''} role="teacher" />
                <main className="main-content">
                    {children}
                </main>
            </div>
        </div>
    );
};

export default TeacherLayout;