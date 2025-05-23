import React from 'react';
import './TeacherDashboard.css';
import AttendanceCard from '../components/TeacherDashboardCard/AttendanceCard';
import GradesCard from '../components/TeacherDashboardCard/GradesCard';
import TimetableCard from '../components/TeacherDashboardCard/TimetableCard';
import AttendanceTrendChart from '../components/TeacherDashboardCard/AttendanceTrendChart';
import StudentAttendanceChart from '../components/TeacherDashboardCard/StudentAttendanceChart';
import DailyScheduleCard from '../components/TeacherDashboardCard/DailyScheduleCard';
import TeacherAnnouncementsCard from '../components/TeacherDashboardCard/TeacherAnnouncementsCard';
import TeacherLeaveCard from '../components/TeacherDashboardCard/TeacherLeaveCard';
import TeacherExamScheduleCard from '../components/TeacherDashboardCard/TeacherExamScheduleCard';
import TeacherGradesCard from '../components/TeacherDashboardCard/TeacherGradesCard';
import TeacherEventsCard from '../components/TeacherDashboardCard/TeacherEventsCard';
import TeacherLibraryCard from '../components/TeacherDashboardCard/TeacherLibraryCard';

const TeacherPage = () => {
  return (
    <div className="teacher-dashboard-container">
      <h1>Teacher Dashboard</h1>
      <div className="summary-cards">
        <AttendanceCard />
        <GradesCard />
        <TimetableCard />
      </div>
      <div className="chart-section">
        <AttendanceTrendChart />
        <StudentAttendanceChart />
      </div>
      <div className="additional-cards">
        <DailyScheduleCard />
        <TeacherAnnouncementsCard />
      </div>
      <div className="leave-exam-section">
        <TeacherLeaveCard />
        <TeacherExamScheduleCard />
      </div>
      <div className="grades-section">
        <TeacherGradesCard />
      </div>
      <div className="events-library-section">
        <TeacherEventsCard />
        <TeacherLibraryCard />
      </div>
    </div>
  );
};

export default TeacherPage;