import React, { useEffect, useState } from 'react';
import './StudentPage.css';
import StudentStatsCard from '../components/StudentDashboardCards/StudentStatsCard';
import StudentRevenueReportCard from '../components/StudentDashboardCards/StudentRevenueReportCard';
import StudentEarningsCard from '../components/StudentDashboardCards/StudentEarningsCard';
import StudentBrowserStatsCard from '../components/StudentDashboardCards/StudentBrowserStatsCard';
import StudentGoalOverviewCard from '../components/StudentDashboardCards/StudentGoalOverviewCard';
import StudentTransactionsCard from '../components/StudentDashboardCards/StudentTransactionsCard';
import StudentAssignmentCard from '../components/StudentDashboardCards/StudentAssignmentCard';
import StudentExamScheduleCard from '../components/StudentDashboardCards/StudentExamScheduleCard';
import StudentNoticeBoardCard from '../components/StudentDashboardCards/StudentNoticeBoardCard';
import StudentProgressTrackerCard from '../components/StudentDashboardCards/StudentProgressTrackerCard';
import { auth, db } from '../firebase/config';
import { doc, getDoc } from 'firebase/firestore';
import { collection, getDocs, query, where } from 'firebase/firestore';

const StudentPage = () => {
  const [studentData, setStudentData] = useState(null);
  const [attendanceData, setAttendanceData] = useState(null);

  useEffect(() => {
    const fetchStudentData = async () => {
      const user = auth.currentUser;
      if (user) {
        const profileRef = doc(db, 'students-profile', user.uid);
        const profileSnap = await getDoc(profileRef);
        if (profileSnap.exists()) {
          const profileData = profileSnap.data();

          const idCardRef = doc(db, 'student-id-cards', user.uid);
          const idCardSnap = await getDoc(idCardRef);
          const idCardData = idCardSnap.exists() ? idCardSnap.data() : { uniqueID: 'N/A' };

          setStudentData({
            profilePicture: profileData.profilePicture,
            name: profileData.name,
            className: profileData.class,
            rollNumber: profileData.rollNumber,
            studentId: idCardData.uniqueID,
          });
        }
      }
    };

    const fetchAttendanceData = async () => {
      const user = auth.currentUser;
      if (user) {
        const attendanceQuery = query(
          collection(db, 'studentAttendance'),
          where('studentId', '==', user.uid)
        );
        const attendanceSnap = await getDocs(attendanceQuery);
        const records = attendanceSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        const totalDays = records.length;
        const present = records.filter(r => r.status === 'present').length;
        const absent = records.filter(r => r.status === 'absent').length;
        const halfDay = records.filter(r => r.status === 'halfday').length;
        const late = records.filter(r => r.status.includes('late')).length;

        const last7Days = [];
        const today = new Date();
        for (let i = 6; i >= 0; i--) {
          const date = new Date(today);
          date.setDate(today.getDate() - i);
          const found = records.find(r => new Date(r.date).toDateString() === date.toDateString());
          last7Days.push(found ? found.status : null);
        }

        setAttendanceData({ totalDays, present, absent, halfDay, late, last7Days });
      }
    };

    fetchStudentData();
    fetchAttendanceData();
  }, []);

  return (
    <div className="student-dashboard-container">
      <h1 className="student-dashboard-title">Student Dashboard</h1>

      <div className="stats-cards-row">
        {studentData ? (
          <StudentStatsCard
            profilePicture={studentData.profilePicture}
            name={studentData.name}
            className={studentData.className}
            rollNumber={studentData.rollNumber}
            studentId={studentData.studentId}
          />
        ) : (
          <div>Loading...</div>
        )}

        {attendanceData && (
          <StudentRevenueReportCard attendanceData={attendanceData} />
        )}
      </div>

      <div className="middle-cards-row">
        {attendanceData && (
          <StudentEarningsCard attendanceData={attendanceData} />
        )}
        <StudentGoalOverviewCard />
      </div>

      <div className="bottom-cards-row">
        <StudentBrowserStatsCard />
        <StudentTransactionsCard />
      </div>

      <div className="extra-cards-row">
        <div className="assignment-exam-group">
          <StudentAssignmentCard />
          <StudentExamScheduleCard />
        </div>
        <div className="notice-progress-group">
          <StudentNoticeBoardCard />
          <StudentProgressTrackerCard />
        </div>
      </div>
    </div>
  );
};

export default StudentPage;