import React, { useState, useEffect } from 'react';
import { db } from '../firebase/config';
import { collection, query, where, onSnapshot, getDocs } from 'firebase/firestore';
import SummaryCard from '../components/DasboardCards/SummaryCard';
import ChartCard from '../components/DasboardCards/ChartCard';
import TableCard from '../components/DasboardCards/TableCard';
import AnnouncementsCard from '../components/DasboardCards/AnnouncementsCard';
import LibraryActivityCard from '../components/DasboardCards/LibraryActivityCard';
import FeeCollectionCard from '../components/DasboardCards/FeeCollectionCard';
import TeacherAttendanceCard from '../components/DasboardCards/TeacherAttendanceCard';
import UpcomingEventsCard from '../components/DasboardCards/UpcomingEventsCard';
import StudentAttendanceBarChartCard from '../components/DasboardCards/StudentAttendanceBarChartCard';
import './AdminPage.css';

const AdminPage = () => {
  const [totalStudents, setTotalStudents] = useState(0);
  const [totalTeachers, setTotalTeachers] = useState(0);
  const [totalClasses, setTotalClasses] = useState(0);
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [studentAttendanceData, setStudentAttendanceData] = useState({
    labels: [],
    present: [],
    absent: [],
    totalStudentsPerDay: [],
  });
  const [teacherAttendanceLastMonth, setTeacherAttendanceLastMonth] = useState({
    totalHours: 0,
    percentage: '0%',
    statusBreakdown: {},
    avgHoursPerTeacher: '0.00',
  });
  const [feeOverview, setFeeOverview] = useState({
    totalFees: 0,
    totalPaid: 0,
    totalPending: 0,
    percentageCollected: '0%',
    overdueStudents: 0,
    totalOverdue: 0,
  });
  const [libraryOverview, setLibraryOverview] = useState({
    totalBooks: 0,
    totalQuantity: 0,
    booksIssued: 0,
    overdueBooks: 0,
    percentageUsage: '0%',
    pendingRequests: 0,
  });
  const [libraryActivityToday, setLibraryActivityToday] = useState({
    issued: 0,
    returned: 0,
    overdue: 0,
  });
  const [teachers, setTeachers] = useState([]);
  const [selectedTeacher, setSelectedTeacher] = useState('');
  const [teacherAttendanceToday, setTeacherAttendanceToday] = useState({
    present: 0,
    absent: 0,
    onLeave: 0,
    halfDay: 0,
    overtime: 0,
    earlyExit: 0,
  });
  const [todayFeesCollected, setTodayFeesCollected] = useState(0);
  const [recentAnnouncements, setRecentAnnouncements] = useState([]);
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState([]); // Added for student data
  const [grades, setGrades] = useState([]); // Added for grades data

  useEffect(() => {
    const studentsQuery = query(collection(db, 'studentLog'), where('status', '==', 'active'));
    const teachersQuery = query(collection(db, 'teacherLog'), where('status', '==', 'active'));
    const classesQuery = query(collection(db, 'classes'));
    const attendanceQuery = query(collection(db, 'teacherAttendance'));
    const studentLogQuery = query(collection(db, 'studentLog'));
    const booksQuery = query(collection(db, 'books'));
    const issuedBooksQuery = query(collection(db, 'issuedBooks'));
    const bookRequestsQuery = query(collection(db, 'bookRequests'), where('status', '==', 'pending'));
    const leaveRequestsQuery = query(collection(db, 'leave-requests'), where('status', '==', 'Approved'));
    const eventsQuery = query(collection(db, 'events'));
    const gradesQuery = query(collection(db, 'grades')); // Added for grades
    const allStudentsQuery = query(collection(db, 'studentLog')); // Fetch all students

    const unsubscribeStudents = onSnapshot(studentsQuery, (snapshot) => {
      setTotalStudents(snapshot.size);
      setLoading(false);
    }, (error) => {
      console.error('Error fetching students:', error);
      setLoading(false);
    });

    const unsubscribeAllStudents = onSnapshot(allStudentsQuery, (snapshot) => {
      const studentList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
      setStudents(studentList);
      setLoading(false);
    }, (error) => {
      console.error('Error fetching all students:', error);
      setLoading(false);
    });

    const unsubscribeTeachers = onSnapshot(teachersQuery, (snapshot) => {
      setTotalTeachers(snapshot.size);
      const teacherList = snapshot.docs.map(doc => ({
        id: doc.id,
        email: doc.data().email,
      }));
      setTeachers(teacherList);
      setLoading(false);
    }, (error) => {
      console.error('Error fetching teachers:', error);
      setLoading(false);
    });

    const unsubscribeClasses = onSnapshot(classesQuery, (snapshot) => {
      const classList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setTotalClasses(snapshot.size);
      setClasses(classList);
      setLoading(false);
    }, (error) => {
      console.error('Error fetching classes:', error);
      setLoading(false);
    });

    const unsubscribeGrades = onSnapshot(gradesQuery, (snapshot) => {
      const gradesList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setGrades(gradesList);
      setLoading(false);
    }, (error) => {
      console.error('Error fetching grades:', error);
      setLoading(false);
    });

    const unsubscribeAttendance = onSnapshot(attendanceQuery, (snapshot) => {
      const now = new Date();
      const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

      let attendanceData = snapshot.docs
        .map(doc => doc.data())
        .filter(doc => {
          const timestamp = new Date(doc.timestamp);
          return timestamp >= lastMonthStart && timestamp <= lastMonthEnd;
        });

      if (selectedTeacher) {
        attendanceData = attendanceData.filter(doc => doc.teacherId === selectedTeacher);
      }

      const totalHours = attendanceData
        .filter(doc => doc.punchType === 'out' && doc.workHours)
        .reduce((sum, doc) => sum + parseFloat(doc.workHours || 0), 0)
        .toFixed(2);

      const uniqueDays = new Set(attendanceData.map(doc => new Date(doc.timestamp).toDateString())).size;
      const totalDaysLastMonth = lastMonthEnd.getDate();
      const percentage = totalDaysLastMonth > 0
        ? `${Math.round((uniqueDays / totalDaysLastMonth) * 100)}%`
        : '0%';

      const statusBreakdown = attendanceData.reduce((acc, doc) => {
        if (doc.punchType === 'in') {
          acc[doc.status] = (acc[doc.status] || 0) + 1;
        }
        return acc;
      }, {});

      const totalTeachersLastMonth = selectedTeacher
        ? 1
        : new Set(attendanceData.map(doc => doc.teacherId)).size;
      const avgHoursPerTeacher = totalTeachersLastMonth > 0
        ? (totalHours / totalTeachersLastMonth).toFixed(2)
        : '0.00';

      setTeacherAttendanceLastMonth({
        totalHours,
        percentage,
        statusBreakdown,
        avgHoursPerTeacher,
      });
      setLoading(false);
    }, (error) => {
      console.error('Error fetching teacher attendance:', error);
      setLoading(false);
    });

    const unsubscribeFees = onSnapshot(studentLogQuery, async (snapshot) => {
      try {
        setLoading(true);
        const feePromises = snapshot.docs.map(async (studentDoc) => {
          const feeSnapshot = await getDocs(collection(db, 'studentLog', studentDoc.id, 'fees'));
          const feeData = feeSnapshot.docs.find(doc => doc.id === 'current')?.data();
          if (feeData && feeData.categories) {
            const totals = feeData.categories.reduce(
              (acc, category) => ({
                totalFees: acc.totalFees + (category.totalFees || 0),
                totalPaid: acc.totalPaid + (category.paidAmount || 0),
                totalPending: acc.totalPending + (category.pendingAmount || 0),
                totalOverdue: acc.totalOverdue + (category.status === 'Overdue' ? (category.pendingAmount || 0) : 0),
                hasOverdue: acc.hasOverdue || category.status === 'Overdue',
              }),
              { totalFees: 0, totalPaid: 0, totalPending: 0, totalOverdue: 0, hasOverdue: false }
            );
            return totals;
          }
          return { totalFees: 0, totalPaid: 0, totalPending: 0, totalOverdue: 0, hasOverdue: false };
        });

        const feeResults = await Promise.all(feePromises);
        const totals = feeResults.reduce(
          (acc, result) => ({
            totalFees: acc.totalFees + result.totalFees,
            totalPaid: acc.totalPaid + result.totalPaid,
            totalPending: acc.totalPending + result.totalPending,
            totalOverdue: acc.totalOverdue + result.totalOverdue,
            overdueStudents: acc.overdueStudents + (result.hasOverdue ? 1 : 0),
          }),
          { totalFees: 0, totalPaid: 0, totalPending: 0, totalOverdue: 0, overdueStudents: 0 }
        );

        const percentageCollected = totals.totalFees > 0
          ? `${Math.round((totals.totalPaid / totals.totalFees) * 100)}%`
          : '0%';

        setFeeOverview({
          totalFees: totals.totalFees.toFixed(2),
          totalPaid: totals.totalPaid.toFixed(2),
          totalPending: totals.totalPending.toFixed(2),
          percentageCollected,
          overdueStudents: totals.overdueStudents,
          totalOverdue: totals.totalOverdue.toFixed(2),
        });
      } catch (error) {
        console.error('Error fetching fee overview in real-time:', error);
      } finally {
        setLoading(false);
      }
    }, (error) => {
      console.error('Error setting up fee listener:', error);
      setLoading(false);
    });

    let issuedBooksUnsubscribe;
    let requestsUnsubscribe;
    const unsubscribeBooks = onSnapshot(booksQuery, (booksSnapshot) => {
      issuedBooksUnsubscribe = onSnapshot(issuedBooksQuery, (issuedSnapshot) => {
        requestsUnsubscribe = onSnapshot(bookRequestsQuery, (requestsSnapshot) => {
          try {
            setLoading(true);
            const totalBooks = booksSnapshot.size;
            const totalQuantity = booksSnapshot.docs.reduce(
              (sum, doc) => sum + (doc.data().quantity || 0),
              0
            );
            const issuedBooksData = issuedSnapshot.docs.map(doc => doc.data());
            const booksIssued = issuedBooksData.filter(doc => !doc.returned).length;
            const overdueBooks = issuedBooksData.filter(
              doc => !doc.returned && new Date(doc.dueDate) < new Date()
            ).length;
            const percentageUsage = totalQuantity > 0
              ? `${Math.round((booksIssued / totalQuantity) * 100)}%`
              : '0%';
            const pendingRequests = requestsSnapshot.size;

            setLibraryOverview({
              totalBooks,
              totalQuantity,
              booksIssued,
              overdueBooks,
              percentageUsage,
              pendingRequests,
            });
          } catch (error) {
            console.error('Error calculating library overview:', error);
          } finally {
            setLoading(false);
          }
        }, (error) => {
          console.error('Error fetching pending book requests:', error);
          setLoading(false);
        });
      }, (error) => {
        console.error('Error fetching issued books:', error);
        setLoading(false);
      });
    }, (error) => {
      console.error('Error fetching books:', error);
      setLoading(false);
    });

    const fetchTodayFeesCollected = async () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayEnd = new Date();
      todayEnd.setHours(23, 59, 59, 999);

      try {
        setLoading(true);
        const studentsSnapshot = await getDocs(collection(db, 'studentLog'));
        let totalTodayCollected = 0;

        for (const studentDoc of studentsSnapshot.docs) {
          const historySnapshot = await getDocs(collection(db, 'studentLog', studentDoc.id, 'paymentHistory'));
          const todayPayments = historySnapshot.docs
            .map(doc => doc.data())
            .filter(payment => {
              const paymentDate = new Date(payment.date);
              return paymentDate >= today && paymentDate <= todayEnd && payment.status === 'Completed';
            });

          totalTodayCollected += todayPayments.reduce((sum, payment) => sum + parseFloat(payment.amount || 0), 0);
        }

        setTodayFeesCollected(totalTodayCollected.toFixed(2));
      } catch (error) {
        console.error('Error fetching today\'s fees collected:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTodayFeesCollected();

    const fetchTeacherAttendanceToday = () => {
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const todayEnd = new Date();
      todayEnd.setHours(23, 59, 59, 999);
      const today = new Date(todayStart);

      const attendanceQuery = query(
        collection(db, 'teacherAttendance'),
        where('timestamp', '>=', todayStart.toISOString()),
        where('timestamp', '<=', todayEnd.toISOString())
      );

      const unsubscribeAttendance = onSnapshot(attendanceQuery, (attendanceSnapshot) => {
        const unsubscribeLeaves = onSnapshot(leaveRequestsQuery, (leaveSnapshot) => {
          const attendanceRecords = attendanceSnapshot.docs.map(doc => doc.data());
          const leaveRecords = leaveSnapshot.docs.map(doc => doc.data());

          const teacherStatusMap = new Map();
          attendanceRecords.forEach(record => {
            const { teacherId, punchType, punchCategory, status } = record;
            if (punchCategory !== 'main') return;

            if (!teacherStatusMap.has(teacherId)) {
              teacherStatusMap.set(teacherId, { inStatus: null, outStatus: null });
            }

            const currentStatus = teacherStatusMap.get(teacherId);
            if (punchType === 'in') {
              currentStatus.inStatus = status;
            } else if (punchType === 'out') {
              currentStatus.outStatus = status;
            }
          });

          const teachersOnLeave = new Set();
          leaveRecords.forEach(leave => {
            const startDate = new Date(leave.startDate);
            const endDate = new Date(leave.endDate);
            if (today >= startDate && today <= endDate) {
              teachersOnLeave.add(leave.teacherId);
            }
          });

          let presentCount = 0;
          let halfDayCount = 0;
          let overtimeCount = 0;
          let earlyExitCount = 0;
          let onLeaveCount = teachersOnLeave.size;

          teacherStatusMap.forEach((status, teacherId) => {
            if (teachersOnLeave.has(teacherId)) return;

            if (status.inStatus === 'Present') {
              presentCount++;
            } else if (status.inStatus === 'Half-Day') {
              halfDayCount++;
            }

            if (status.outStatus === 'Overtime') {
              overtimeCount++;
            } else if (status.outStatus === 'Early Exit') {
              earlyExitCount++;
            }
          });

          const absentCount = totalTeachers - (teacherStatusMap.size + teachersOnLeave.size);

          setTeacherAttendanceToday({
            present: presentCount,
            absent: absentCount < 0 ? 0 : absentCount,
            onLeave: onLeaveCount,
            halfDay: halfDayCount,
            overtime: overtimeCount,
            earlyExit: earlyExitCount,
          });
        }, (error) => {
          console.error('Error fetching leave requests:', error);
        });

        return () => unsubscribeLeaves && unsubscribeLeaves();
      }, (error) => {
        console.error('Error fetching teacher attendance today:', error);
      });

      return unsubscribeAttendance;
    };

    const unsubscribeAttendanceToday = fetchTeacherAttendanceToday();

    const fetchLibraryActivityToday = () => {
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const todayEnd = new Date();
      todayEnd.setHours(23, 59, 59, 999);

      const unsubscribeIssuedBooks = onSnapshot(issuedBooksQuery, (snapshot) => {
        try {
          setLoading(true);
          const issuedBooksData = snapshot.docs.map(doc => doc.data());

          const booksIssuedToday = issuedBooksData.filter(book => {
            const issueDate = new Date(book.issueDate);
            return issueDate >= todayStart && issueDate <= todayEnd && !book.returned;
          }).length;

          const booksReturnedToday = issuedBooksData.filter(book => {
            const returnDate = book.returnDate ? new Date(book.returnDate) : null;
            return returnDate && returnDate >= todayStart && returnDate <= todayEnd;
          }).length;

          const booksOverdueToday = issuedBooksData.filter(book => {
            const dueDate = new Date(book.dueDate);
            return !book.returned && dueDate < todayStart;
          }).length;

          setLibraryActivityToday({
            issued: booksIssuedToday,
            returned: booksReturnedToday,
            overdue: booksOverdueToday,
          });
        } catch (error) {
          console.error("Error fetching today's library activity:", error);
        } finally {
          setLoading(false);
        }
      }, (error) => {
        console.error('Error fetching issued books for today:', error);
        setLoading(false);
      });

      return unsubscribeIssuedBooks;
    };

    const unsubscribeLibraryActivityToday = fetchLibraryActivityToday();

    const fetchStudentAttendance = () => {
      const today = new Date();
      const sevenSchoolDaysAgo = new Date();
      let daysBack = 0;
      let schoolDaysCount = 0;

      while (schoolDaysCount < 7) {
        sevenSchoolDaysAgo.setDate(today.getDate() - daysBack);
        if (sevenSchoolDaysAgo.getDay() !== 0) {
          schoolDaysCount++;
        }
        daysBack++;
      }

      const attendanceQuery = query(
        collection(db, 'studentAttendance'),
        where('date', '>=', sevenSchoolDaysAgo.toISOString().split('T')[0]),
        where('date', '<=', today.toISOString().split('T')[0])
      );

      const unsubscribeAttendance = onSnapshot(attendanceQuery, (snapshot) => {
        const records = snapshot.docs.map(doc => doc.data());
        const filteredRecords = selectedClass
          ? records.filter(record => record.classId === selectedClass)
          : records;

        const labels = [];
        const present = [];
        const absent = [];
        const totalStudentsPerDay = [];
        let currentDate = new Date(sevenSchoolDaysAgo);
        let daysAdded = 0;

        while (daysAdded < 7) {
          if (currentDate.getDay() !== 0) {
            const dateStr = currentDate.toISOString().split('T')[0];
            labels.push(currentDate.toLocaleDateString('en-US', { weekday: 'short' }));

            const dayRecords = filteredRecords.filter(record => record.date === dateStr);
            const presentCount = dayRecords.filter(record => record.status === 'present').length;
            const absentCount = dayRecords.filter(record => record.status === 'absent').length;
            const totalCount = presentCount + absentCount;
            present.push(presentCount);
            absent.push(absentCount);
            totalStudentsPerDay.push(totalCount || 1);
            daysAdded++;
          }
          currentDate.setDate(currentDate.getDate() + 1);
        }

        setStudentAttendanceData({
          labels,
          present,
          absent,
          totalStudentsPerDay,
        });
      }, (error) => {
        console.error('Error fetching student attendance:', error);
      });

      return unsubscribeAttendance;
    };

    const unsubscribeStudentAttendance = fetchStudentAttendance();

    const fetchRecentAnnouncements = () => {
      const announcementsQuery = query(collection(db, 'announcements'));

      const unsubscribeAnnouncements = onSnapshot(announcementsQuery, (snapshot) => {
        const allAnnouncements = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));

        const sortedAnnouncements = allAnnouncements
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
          .slice(0, 3)
          .map(ann => ({
            text: ann.title,
            date: new Date(ann.createdAt).toISOString().split('T')[0],
          }));

        setRecentAnnouncements(sortedAnnouncements);
      }, (error) => {
        console.error('Error fetching announcements:', error);
      });

      return unsubscribeAnnouncements;
    };

    const unsubscribeRecentAnnouncements = fetchRecentAnnouncements();

    const fetchUpcomingEvents = () => {
      const unsubscribeEvents = onSnapshot(eventsQuery, (snapshot) => {
        const allEvents = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));

        const sortedUpcomingEvents = allEvents
          .filter(event => new Date(event.date) >= new Date())
          .sort((a, b) => new Date(a.date) - new Date(b.date))
          .slice(0, 3)
          .map(event => ({
            name: event.name,
            date: new Date(event.date).toISOString().split('T')[0],
            type: event.type,
          }));

        setUpcomingEvents(sortedUpcomingEvents);
      }, (error) => {
        console.error('Error fetching upcoming events:', error);
      });

      return unsubscribeEvents;
    };

    const unsubscribeUpcomingEvents = fetchUpcomingEvents();

    return () => {
      unsubscribeStudents();
      unsubscribeAllStudents();
      unsubscribeTeachers();
      unsubscribeClasses();
      unsubscribeAttendance();
      unsubscribeFees();
      unsubscribeBooks();
      if (issuedBooksUnsubscribe) issuedBooksUnsubscribe();
      if (requestsUnsubscribe) requestsUnsubscribe();
      unsubscribeAttendanceToday();
      unsubscribeLibraryActivityToday();
      unsubscribeStudentAttendance();
      unsubscribeRecentAnnouncements();
      unsubscribeUpcomingEvents();
      unsubscribeGrades();
    };
  }, [selectedClass, selectedTeacher, totalTeachers]);

  return (
    <div className="admin-dashboard">
      <h1>Admin Dashboard</h1>

      <div className="summary-cards">
        <SummaryCard
          title="Total Students"
          value={loading ? 'Loading...' : totalStudents.toString()}
          percentage={loading ? '0%' : `${Math.round((totalStudents / (totalStudents || 1)) * 100)}%`}
          isPositive={totalStudents > 0}
          description="Active Students"
        />
        <SummaryCard
          title="Total Teachers"
          value={loading ? 'Loading...' : totalTeachers.toString()}
          percentage={loading ? '0%' : `${Math.round((totalTeachers / (totalTeachers || 1)) * 100)}%`}
          isPositive={totalTeachers > 0}
          description="Active Teachers"
        />
        <SummaryCard
          title="Total Classes"
          value={loading ? 'Loading...' : totalClasses.toString()}
          percentage={loading ? '0%' : `${Math.round((totalClasses / (totalClasses || 1)) * 100)}%`}
          isPositive={totalClasses > 0}
          description="Active Classes"
        />
      </div>

      <div className="chart-cards">
        <div className="teacher-attendance-wrapper">
          <div className="teacher-selector">
            <label htmlFor="teacherSelect">Select Teacher: </label>
            <select
              id="teacherSelect"
              value={selectedTeacher}
              onChange={(e) => setSelectedTeacher(e.target.value)}
              disabled={loading}
            >
              <option value="">All Teachers</option>
              {teachers.map(teacher => (
                <option key={teacher.id} value={teacher.id}>
                  {teacher.email}
                </option>
              ))}
            </select>
          </div>
          <ChartCard
            title={
              <>
                Teacher Attendance<br />
                Last Month
                {selectedTeacher && (
                  <> - {teachers.find(t => t.id === selectedTeacher)?.email}</>
                )}
              </>
            }
            value={loading ? 'Loading...' : `${teacherAttendanceLastMonth.totalHours} hrs`}
            percentage={loading ? '0%' : teacherAttendanceLastMonth.percentage}
            isPositive={parseFloat(teacherAttendanceLastMonth.totalHours) > 0}
            chartType="line"
            statusBreakdown={teacherAttendanceLastMonth.statusBreakdown}
            avgHoursPerTeacher={teacherAttendanceLastMonth.avgHoursPerTeacher}
          />
        </div>
        <ChartCard
          title="Fee Collection"
          value={loading ? 'Loading...' : `$${feeOverview.totalPaid}`}
          percentage={loading ? '0%' : feeOverview.percentageCollected}
          isPositive={parseFloat(feeOverview.totalPaid) > 0}
          chartType="line"
          additionalDetails={{
            totalFees: `$${feeOverview.totalFees}`,
            totalPending: `$${feeOverview.totalPending}`,
            overdue: `${feeOverview.overdueStudents} students, $${feeOverview.totalOverdue}`,
          }}
        />
        <ChartCard
          title="Library Usage"
          value={loading ? 'Loading...' : `${libraryOverview.booksIssued}`}
          percentage={loading ? '0%' : libraryOverview.percentageUsage}
          isPositive={libraryOverview.booksIssued > 0}
          chartType="area"
          additionalDetails={{
            totalBooks: `${libraryOverview.totalBooks} titles`,
            totalQuantity: `${libraryOverview.totalQuantity} books`,
            overdueBooks: `${libraryOverview.overdueBooks} overdue`,
            pendingRequests: `${libraryOverview.pendingRequests} pending`,
          }}
        />
      </div>

      <div className="new-cards-row">
        <TeacherAttendanceCard
          title="Teacher Attendance Today"
          present={loading ? 'Loading...' : teacherAttendanceToday.present.toString()}
          absent={loading ? 'Loading...' : teacherAttendanceToday.absent.toString()}
          onLeave={loading ? 'Loading...' : teacherAttendanceToday.onLeave.toString()}
          halfDay={loading ? 'Loading...' : teacherAttendanceToday.halfDay.toString()}
          overtime={loading ? 'Loading...' : teacherAttendanceToday.overtime.toString()}
          earlyExit={loading ? 'Loading...' : teacherAttendanceToday.earlyExit.toString()}
        />
        <FeeCollectionCard
          title="Today's Fee Collection"
          total={feeOverview.totalFees}
          paid={todayFeesCollected}
          pending={feeOverview.totalPending}
        />
        <LibraryActivityCard
          title="Today's Library Activity"
          issued={loading ? 'Loading...' : libraryActivityToday.issued.toString()}
          returned={loading ? 'Loading...' : libraryActivityToday.returned.toString()}
          overdue={loading ? 'Loading...' : libraryActivityToday.overdue.toString()}
        />
      </div>

      <div className="chart-cards">
        <StudentAttendanceBarChartCard
          title="Student Attendance (Last 7 School Days)"
          data={studentAttendanceData}
          classes={classes}
          selectedClass={selectedClass}
          setSelectedClass={setSelectedClass}
          loading={loading}
        />
      </div>

      <div className="new-cards-row">
        <AnnouncementsCard title="Recent Announcements" announcements={recentAnnouncements} />
        <UpcomingEventsCard title="Upcoming Events" events={upcomingEvents} />
      </div>

      <div className="table-card-container">
        <TableCard
          title="Top Graded Students"
          classes={classes}
          grades={grades}
          students={students}
          loading={loading}
        />
      </div>
    </div>
  );
};

export default AdminPage;