import React from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { ToastContainer } from "react-toastify";
import { Provider } from 'react-redux';
import store from './redux/slices/store';
import "react-toastify/dist/ReactToastify.css";
import Signup from "./components/Signup";
import Login from "./components/Login";
import VerifyEmail from "./components/VerifyEmail";
import AdminLayout from "./components/Layout/AdminLayout";
import TeacherLayout from "./components/Layout/TeacherLayout";
import StudentLayout from "./components/Layout/StudentLayout";
import AdminPage from "./pages/AdminPage";
import TeacherPage from "./pages/TeacherDashboard";
import StudentPage from "./pages/StudentPage";
import AdminClassManagement from "./pages/AdminPages/AdminClassManagement";
import AdminSubjectManagement from "./pages/AdminPages/AdminSubjectManagement";
import AdminTeacherAssignment from "./pages/AdminPages/AdminTeacherAssignment";
import AdminStudentAssignment from "./pages/AdminPages/AdminStudentAssignment";
import TeacherSubjects from "./pages/TeacherPages/TeacherSubjects";
import StudentSubjects from "./pages/StudentsPages/StudentSubjects";
import AdminCreateTimetable from "./pages/AdminPages/AdminCreateTimetable";
import AdminAssignTimetable from "./pages/AdminPages/AdminAssignTimetable";
import AdminViewTimetable from "./pages/AdminPages/AdminViewTimetable";
import TeacherTimetable from "./pages/TeacherPages/TeacherViewTimetable";
import StudentTimetable from "./pages/StudentsPages/StudentTimetable";
import TeacherLeave from "./pages/TeacherPages/TeacherLeave";
import AdminLeave from "./pages/AdminPages/AdminLeave";
import AdminExamSchedule from "./pages/AdminPages/AdminExamSchedule";
import TeacherExamSchedule from "./pages/TeacherPages/TeacherExamSchedule";
import StudentExamSchedule from "./pages/StudentsPages/StudentExamSchedule";
import TeacherGrades from "./pages/TeacherPages/TeacherGrades";
import AdminGrades from "./pages/AdminPages/AdminGrades";
import StudentGrades from "./pages/StudentsPages/StudentGrades";
import AdminEventManagement from "./pages/AdminPages/AdminEventManagement";
import TeacherEvents from "./pages/TeacherPages/TeacherEvents";
import StudentEvents from "./pages/StudentsPages/StudentEvents";
import AdminLibraryBooks from "./pages/AdminPages/AdminLibraryBooks";
import AdminLibraryIssuance from "./pages/AdminPages/AdminLibraryIssuance";
import AdminLibraryRequests from "./pages/AdminPages/AdminLibraryRequests";
import AdminLibraryHistory from "./pages/AdminPages/AdminLibraryHistory";
import TeacherLibraryBooks from "./pages/TeacherPages/TeacherLibraryBooks";
import TeacherLibraryRequests from "./pages/TeacherPages/TeacherLibraryRequests";
import TeacherLibraryHistory from "./pages/TeacherPages/TeacherLibraryHistory";
import StudentLibraryBooks from "./pages/StudentsPages/StudentLibraryBooks";
import StudentLibraryRequests from "./pages/StudentsPages/StudentLibraryRequests";
import StudentLibraryHistory from "./pages/StudentsPages/StudentLibraryHistory";
import AdminCreateAnnouncement from "./pages/AdminPages/AdminCreateAnnouncement";
import AdminViewAnnouncements from "./pages/AdminPages/AdminViewAnnouncements";
import TeacherCreateAnnouncement from "./pages/TeacherPages/TeacherCreateAnnouncement";
import TeacherViewAnnouncements from "./pages/TeacherPages/TeacherViewAnnouncements";
import StudentViewAnnouncements from "./pages/StudentsPages/StudentViewAnnouncements";
import TeacherPunch from "./pages/TeacherPages/TeacherPunch";
import AdminTeacherAttendance from "./pages/AdminPages/AdminTeacherAttendance";
import StudentProfile from "./pages/StudentsPages/StudentProfile";
import StudentIDCard from "./pages/StudentsPages/StudentIDCard";
import AdminIDCardManagement from "./pages/AdminPages/AdminIDCardManagement";
import AdminBuses from "./pages/AdminPages/AdminBuses";
import AdminRoutes from "./pages/AdminPages/AdminRoutes";
import AdminDriverManagement from "./pages/AdminPages/AdminDriverManagement";
import StudentTransport from "./pages/StudentsPages/StudentTransport";
import AdminStudentBusAssign from "./pages/AdminPages/AdminStudentBusAssign";
import AdminFeeManagement from "./pages/AdminPages/AdminFeeManagement";
import StudentFeeManagement from "./pages/StudentsPages/StudentFeeManagement";
import TeacherMarkAttendance from "./pages/TeacherPages/TeacherMarkAttendance";
import TeacherAttendanceHistory from "./pages/TeacherPages/TeacherAttendanceHistory";
import TeacherEditAttendance from "./pages/TeacherPages/TeacherEditAttendance";
import AdminAttendanceRecord from "./pages/AdminPages/AdminAttendanceRecord";
import StudentAttendance from "./pages/StudentsPages/StudentAttendance";
import AdminTeacherManagement from "./pages/AdminPages/AdminTeacherManagement";
import TeacherSetPassword from "./pages/TeacherPages/TeacherSetPassword";
import AdminManageTeachers from "./pages/AdminPages/AdminManageTeachers";

function App() {
  return (
    <Provider store={store}>
      <AuthProvider>
        <Router>
          <ToastContainer
            position="top-right"
            autoClose={3000}
            hideProgressBar={false}
            newestOnTop={false}
            closeOnClick
            rtl={false}
            pauseOnFocusLoss
            draggable
            pauseOnHover
            theme="light"
          />
          <Routes>
            <Route path="/" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/verify-email" element={<VerifyEmail />} />
            {/* Student Routes */}
            <Route
              path="/student"
              element={
                <ProtectedRoute allowedRoles={['student']}>
                  <StudentLayout />
                </ProtectedRoute>
              }
            />

            {/* Teacher Routes */}
            <Route
              path="/teacher"
              element={
                <ProtectedRoute allowedRoles={['teacher']}>
                  <TeacherLayout />
                </ProtectedRoute>
              }
            />

            {/* Admin Routes */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminLayout />
                </ProtectedRoute>
              }
            />
            {/* Admin Sub-Routes */}
            <Route path="/admin/home" element={<AdminLayout><AdminPage /></AdminLayout>} />
            <Route path="/admin/class" element={<AdminLayout><AdminClassManagement /></AdminLayout>} />
            <Route path="/admin/subjects" element={<AdminLayout><AdminSubjectManagement /></AdminLayout>} />
            <Route path="/admin/assign-teachers" element={<AdminLayout><AdminTeacherAssignment /></AdminLayout>} />
            <Route path="/admin/assign-students" element={<AdminLayout><AdminStudentAssignment /></AdminLayout>} />
            <Route path="/admin/create-timetable" element={<AdminLayout><AdminCreateTimetable /></AdminLayout>} />
            <Route path="/admin/assign-timetable" element={<AdminLayout><AdminAssignTimetable /></AdminLayout>} />
            <Route path="/admin/view-timetable" element={<AdminLayout><AdminViewTimetable /></AdminLayout>} />
            <Route path="/admin/leave-requests" element={<AdminLayout><AdminLeave /></AdminLayout>} />
            <Route path="/admin/exam-schedule" element={<AdminLayout><AdminExamSchedule /></AdminLayout>} />
            <Route path="/admin/grades" element={<AdminLayout><AdminGrades /></AdminLayout>} />
            <Route path="/admin/events" element={<AdminLayout><AdminEventManagement /></AdminLayout>} />
            <Route path="/admin/library/books" element={<AdminLayout><AdminLibraryBooks /></AdminLayout>} />
            <Route path="/admin/library/issuance" element={<AdminLayout><AdminLibraryIssuance /></AdminLayout>} />
            <Route path="/admin/library/requests" element={<AdminLayout><AdminLibraryRequests /></AdminLayout>} />
            <Route path="/admin/library/history" element={<AdminLayout><AdminLibraryHistory /></AdminLayout>} />
            <Route path="/admin/create-announcement" element={<AdminLayout><AdminCreateAnnouncement /></AdminLayout>} />
            <Route path="/admin/view-announcement" element={<AdminLayout><AdminViewAnnouncements /></AdminLayout>} />
            <Route path="/admin/teacher-attendance" element={<AdminLayout><AdminTeacherAttendance /></AdminLayout>} />
            <Route path="/admin/id-card-management" element={<AdminLayout><AdminIDCardManagement /></AdminLayout>} />
            <Route path="/admin/transport/buses" element={<AdminLayout><AdminBuses /></AdminLayout>} />
            <Route path="/admin/transport/routes" element={<AdminLayout><AdminRoutes /></AdminLayout>} />
            <Route path="/admin/transport/assignments" element={<AdminLayout><AdminDriverManagement /></AdminLayout>} />
            <Route path="/admin/transport/student-assignments" element={<AdminLayout><AdminStudentBusAssign /></AdminLayout>} />

            <Route path="/admin/attendance-record" element={<AdminLayout><AdminAttendanceRecord /></AdminLayout>} />

            <Route
              path="/admin/fee-management"
              element={
                <AdminLayout>
                  <AdminFeeManagement />
                </AdminLayout>
              }
            />

            <Route
              path="/admin/teacher-management"
              element={
                <AdminLayout>
                  <AdminTeacherManagement />
                </AdminLayout>
              }
            />
            <Route
              path="/admin/manage-teachers"
              element={
                <AdminLayout>
                  <AdminManageTeachers />
                </AdminLayout>
              }
            />

            {/* Teacher Sub-Routes */}
            <Route path="/teacher/subject-courses" element={<TeacherLayout><TeacherSubjects /></TeacherLayout>} />
            <Route path="/teacher/dashboard" element={<TeacherLayout><TeacherPage /></TeacherLayout>} />
            <Route path="/teacher/timetable" element={<TeacherLayout><TeacherTimetable /></TeacherLayout>} />
            <Route path="/teacher/leave-requests" element={<TeacherLayout><TeacherLeave /></TeacherLayout>} />
            <Route path="/teacher/exam-schedule" element={<TeacherLayout><TeacherExamSchedule /></TeacherLayout>} />
            <Route path="/teacher/grades" element={<TeacherLayout><TeacherGrades /></TeacherLayout>} />
            <Route path="/teacher/events" element={<TeacherLayout><TeacherEvents /></TeacherLayout>} />
            <Route path="/teacher/events" element={<TeacherLayout><TeacherEvents /></TeacherLayout>} />
            <Route path="/teacher/library/books" element={<TeacherLayout><TeacherLibraryBooks /></TeacherLayout>} />
            <Route path="/teacher/library/requests" element={<TeacherLayout><TeacherLibraryRequests /></TeacherLayout>} />
            <Route path="/teacher/library/history" element={<TeacherLayout><TeacherLibraryHistory /></TeacherLayout>} />
            <Route path="/teacher/create-announcement" element={<TeacherLayout><TeacherCreateAnnouncement /></TeacherLayout>} />
            <Route path="/teacher/view-announcement" element={<TeacherLayout><TeacherViewAnnouncements /></TeacherLayout>} />
            <Route path="/teacher/view-announcement" element={<TeacherLayout><TeacherViewAnnouncements /></TeacherLayout>} />
            <Route path="/teacher/punch" element={<TeacherLayout><TeacherPunch /></TeacherLayout>} />

            <Route path="/teacher/mark-attendance" element={<TeacherLayout><TeacherMarkAttendance /></TeacherLayout>} />
            <Route path="/teacher/attendance-history" element={<TeacherLayout><TeacherAttendanceHistory /></TeacherLayout>} />
            <Route path="/teacher/edit-attendance" element={<TeacherLayout><TeacherEditAttendance /></TeacherLayout>} />

            <Route
              path="/teacher/set-password/:tempPassword"
              element={<TeacherSetPassword />}
            />

            {/* Student Sub-Routes */}
            <Route path="/student/dashboard" element={<StudentLayout><StudentPage /></StudentLayout>} />
            <Route path="/student/subject-courses" element={<StudentLayout><StudentSubjects /></StudentLayout>} />
            <Route path="/student/timetable" element={<StudentLayout><StudentTimetable /></StudentLayout>} />
            <Route path="/student/exam-schedule" element={<StudentLayout><StudentExamSchedule /></StudentLayout>} />
            <Route path="/student/grades" element={<StudentLayout><StudentGrades /></StudentLayout>} />
            <Route path="/student/events" element={<StudentLayout><StudentEvents /></StudentLayout>} />
            <Route path="/student/library/books" element={<StudentLayout><StudentLibraryBooks /></StudentLayout>} />
            <Route path="/student/library/requests" element={<StudentLayout><StudentLibraryRequests /></StudentLayout>} />
            <Route path="/student/library/history" element={<StudentLayout><StudentLibraryHistory /></StudentLayout>} />
            <Route path="/student/announcement" element={<StudentLayout><StudentViewAnnouncements /></StudentLayout>} />
            <Route path="/student/profile" element={<StudentLayout><StudentProfile /></StudentLayout>} />
            <Route path="/student/id-card" element={<StudentLayout><StudentIDCard /></StudentLayout>} />
            <Route path="/student/transport" element={<StudentLayout><StudentTransport /></StudentLayout>} />
            <Route path="/student/attendance" element={<StudentLayout><StudentAttendance /></StudentLayout>} />
            <Route
              path="/student/fee-management"
              element={
                <StudentLayout>
                  <StudentFeeManagement />
                </StudentLayout>
              }
            />

          </Routes>
        </Router>
      </AuthProvider>
    </Provider>
  );
}

export default App;