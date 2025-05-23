import React, { useState } from 'react';
import Sidebar from '../Sidebar/Sidebar';
import Navbar from '../Navbar/Navbar';
const StudentLayout = ({ children }) => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);

    const toggleSidebar = () => {
        setIsSidebarOpen(!isSidebarOpen);
    };

    return (
        <div className="student-layout">
            <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} role="student" />
            <div className={`content-wrapper ${!isSidebarOpen ? 'sidebar-collapsed' : ''}`}>
                <Navbar className={!isSidebarOpen ? 'sidebar-collapsed' : ''} role="student" />
                <main className="main-content">
                    {children}
                </main>
            </div>
        </div>
    );
};

export default StudentLayout;
