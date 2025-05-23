🎓 School Management System
A comprehensive and feature-rich School Management System designed to streamline administrative tasks, enhance communication, and improve overall efficiency within educational institutions.

🚀 Features
🛠️ Admin Dashboard
Real-Time Statistics: View total students, teachers, classes, and more in dynamic cards.

Teacher Work Hours: Monitor last month's work hours with detailed status breakdowns and filters.

Fee Collection Overview: Track total collected fees, pending amounts, and overdue student counts.

Library Usage: Analyze total books, copies, pending requests, and overdue books in real-time.

Daily Attendance: Review teacher attendance statuses including present, absent, on leave, half-day, overtime, and early exits.

Today's Highlights: Summarize today's fee collections and library activities.

Student Attendance Graphs: Visualize attendance over the last 7 school days with class filters and percentage views.

Announcements & Events: Stay updated with recent announcements and upcoming events.

Top Graded Students: Identify high-performing students across different classes.

📚 Course & Subject Management
Subjects: Add, edit, and delete subjects.

Classes: Manage class details efficiently.

Teacher Assignments: Assign or remove teachers for specific classes.

Student Assignments: Allocate students to classes with automatic teacher and subject assignments.
GitHub

🕒 Timetable Management
Create Timetables: Design schedules by specifying class, day, time, subject, and assigned teacher.

View Timetables: Access and filter timetables by class and day.

📢 Announcements
Create Announcements: Draft announcements with title, content, links, and target audiences (all users, teachers, students, specific classes). Integrated with Email.js for notifications.

Manage Announcements: Edit or delete existing announcements.

📝 Leave Requests
Review Requests: Approve or reject teacher leave requests with comments.

Search & Filter: Search by email and filter by status (pending, approved, rejected).

Email Notifications: Automated emails sent upon approval or rejection.

🧪 Exam Schedule
Manage Exams: Create, edit, and delete exam schedules with details like class, exam type, subject, date, time, hall, duration, and invigilators.

Filters: Filter exams by type, class, subject, or date.

📊 Grade Management
Edit Grades: Modify or delete marks uploaded by teachers.

Filters: Filter grades by class, subject, student, or teacher.
GitHub

📅 Event Management
Manage Events: Add, edit, or delete yearly events with details like name, type, date, and description.

Filter Events: Filter events by type.

📖 Library Management
Books: Add, edit, or delete books with details like title, author, ISBN, genre, and quantity.

Issuance: Issue books to teachers or students, with filters by status and return options.

Requests: Approve or reject book requests from teachers or students.

Borrowing History: View borrowing history with search and filter options.

🆔 ID Card Management
Manage ID Cards: Approve, reject, or view reissue requests for student ID cards.

🚌 Transport Management
Buses: Add, edit, or delete buses with details like number, capacity, and model.

Routes: Manage routes with start point, end point, and stops.

Driver Assignments: Add drivers with details and assign them to buses and routes.

Student Assignments: Assign or remove students from buses.

💰 Fees Management
Overview: View total fees collected, pending amounts, and overdue statistics in real-time.

Search & Filter: Search by student email and filter by status (all, paid, pending, overdue).

Manage Fees: Add fees for students and view their fee history.

Email Notifications: Students receive emails upon new fee category additions.
HackMD
+9
spaceship.roadtocode.org
+9
GitHub
+9

📅 Student Attendance
View & Edit: Access all student attendance records and edit statuses.

Filters: Filter by class, subject, date, or student email.
GitHub
+1
GitHub
+1

👩‍🏫 Teacher Management
Add Teachers: Add new teachers with details. Upon submission, teachers receive an email with a password creation link.

Manage Teachers: Delete or deactivate teacher accounts.

👨‍🏫 Teacher Dashboard
Overview: View assigned classes and subjects, average grades, total work hours, punch records, student attendance, today's schedule, announcements, leave requests, exam schedules, top student grades, upcoming events, and library overview.

Attendance Punch: Punch in/out with facial recognition and view attendance records.

Student Attendance: Mark, view, and edit attendance for assigned classes and subjects.

Subjects & Schedule: View assigned subjects and schedules.

Announcements: Create and view announcements for assigned classes.

Leave Requests: Submit leave requests with details and receive email notifications upon approval or rejection.

Exam Schedule: View exam schedules where assigned as invigilators.

Grade Management: Add, edit, or delete grades for assigned classes.

Events & Library: View yearly events and manage library activities.

🎓 Student Dashboard
Profile: View and edit personal, academic, contact, and emergency information.

Attendance: View attendance reports with filters.

Timetable: Access weekly timetables in calendar format.

Announcements: View announcements from teachers and admin.

Grades: View grades per subject and overall average.

Fees & Transactions: View pending and paid fees, make payments (static), and download receipts.

Transport: View assigned transport details.

Library: View available books, request books, and view borrowing history.

Events & Exams: View upcoming events and exam schedules.

ID Card: Download ID card and request reissue if necessary.

🧰 Tech Stack
Frontend: HTML, CSS, JavaScript

Backend: Firebase (Authentication & Database)

Email Integration: Email.js

🔧 Setup Instructions
✅ Firebase Setup
Go to Firebase Console, create a project.

Navigate to Project Settings → Get web configuration.

Replace your Firebase config in your app:

js
Copy
Edit
const firebaseConfig = {
apiKey: "YOUR_API_KEY",
authDomain: "YOUR_AUTH_DOMAIN",
projectId: "YOUR_PROJECT_ID",
storageBucket: "YOUR_STORAGE_BUCKET",
messagingSenderId: "YOUR_MSG_ID",
appId: "YOUR_APP_ID",
};
Set up Authentication → Email/Password in Firebase Console.

Create Firestore Database → Set rules to allow authenticated read/write.

Configure Storage (for images, ID cards).

✅ Email.js Setup
Go to Email.js → Create account.

Create new service (e.g., Gmail).

Create email template with fields like user_email, message, name.

Add your Service ID, Template ID, and User ID to your .env file:

env
Copy
Edit
REACT_APP_EMAILJS_SERVICE_ID=your_service_id
REACT_APP_EMAILJS_TEMPLATE_ID=your_template_id
REACT_APP_EMAILJS_USER_ID=your_user_id
Use in your code:

js
Copy
Edit
emailjs.send(
process.env.REACT_APP_EMAILJS_SERVICE_ID,
process.env.REACT_APP_EMAILJS_TEMPLATE_ID,
templateParams,
process.env.REACT_APP_EMAILJS_USER_ID
);

📬 Contact
Developer: Arpan Pawar

Email: pawararpan1322@gmail.com

LinkedIn: https://www.linkedin.com/in/arpan-pawar-22b0a62aa/
