import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";
import StudentLayout from "./layouts/StudentLayout";
import AdminLayout from "./layouts/AdminLayout";
import LeaderLayout from "./layouts/LeaderLayout";
import Home from "./pages/Home.jsx";
import Login from "./pages/auth/Login.jsx";
import Register from "./pages/Register.jsx";
import Forbidden403 from "./pages/Forbidden403.jsx";

// Admin
import AdminDashboard from "./pages/admin/AdminDashboard.jsx";
import ManageUsers from "./pages/admin/ManageUsers.jsx";
import AdminClubsPage from "./pages/admin/AdminClubsPage.jsx";
import AdminClubDetailPage from "./pages/admin/AdminClubDetailPage.jsx";
import AdminClubRecruitmentPage from "./pages/admin/AdminClubRecruitmentPage.jsx";
import AdminAnnouncement from "./pages/admin/AdminAnnouncement.jsx";
import ManageEvents from "./pages/admin/ManageEvents.jsx";
import CreateEvent from "./pages/admin/CreateEvent.jsx";
import ClubLeaderDashboard from "./pages/admin/ClubLeaderDashboard.jsx";
import OrganizerEventList from "./pages/admin/OrganizerEventList.jsx";
import AdminAttendance from "./pages/admin/AdminAttendance.jsx";
import AdminChatRoom from "./pages/admin/AdminChatRoom.jsx";
import AdminProfile from "./pages/admin/AdminProfile.jsx";
import CertificateDistributionPage from "./pages/admin/CertificateDistributionPage.jsx";
import CertificateDesigner from "./pages/admin/CertificateDesigner.jsx";
import AdminCertificatesPage from "./pages/admin/AdminCertificatesPage.jsx";

// Student
import StudentDashboard from "./pages/student/StudentDashboard.jsx";
import StudentEvents from "./pages/student/StudentEvents.jsx";
import StudentCertificates from "./pages/student/StudentCertificates.jsx";
import EventDetails from "./pages/student/EventDetails.jsx";
import EventRegistration from "./pages/student/EventRegistration.jsx";
import RegistrationSuccess from "./pages/student/RegistrationSuccess.jsx";
import MyRegistrations from "./pages/student/MyRegistrations.jsx";
import StudentPortfolio from "./pages/student/StudentPortfolio.jsx";
import EventNotFound from "./pages/student/EventNotFound.jsx";
import ClubDirectory from "./pages/student/ClubDirectory.jsx";
import ClubProfile from "./pages/student/ClubProfile.jsx";
import StudentRecruitmentPage from "./pages/student/StudentRecruitmentPage.jsx";
import ApplyToDrivePage from "./pages/student/ApplyToDrivePage.jsx";
import MyApplicationsPage from "./pages/student/MyApplicationsPage.jsx";
import StudentChatPage from "./pages/student/StudentChatPage.jsx";

// Leader
import LeaderDashboard from "./pages/leader/LeaderDashboard.jsx";
import LeaderClub from "./pages/leader/LeaderClub.jsx";
import LeaderEvents from "./pages/leader/LeaderEvents.jsx";
import LeaderParticipants from "./pages/leader/LeaderParticipants.jsx";
import LeaderAttendance from "./pages/leader/LeaderAttendance.jsx";
import LeaderAnnouncements from "./pages/leader/LeaderAnnouncements.jsx";
import LeaderCertificates from "./pages/leader/LeaderCertificates.jsx";
import LeaderChatRoom from "./pages/leader/LeaderChatRoom.jsx";
import LeaderProfile from "./pages/leader/LeaderProfile.jsx";
import LeaderRecruitmentPage from "./pages/leader/LeaderRecruitmentPage.jsx";
import LeaderApplicationsPage from "./pages/leader/LeaderApplicationsPage.jsx";
import ClubTeamPage from "./pages/leader/ClubTeamPage.jsx";
import VerificationPortal from "./pages/VerificationPortal.jsx";

function PlaceholderPage({ title }) {
  return (
    <div className="mx-auto max-w-2xl p-8 text-center">
      <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{title}</h1>
      <p className="mt-2 text-slate-500 dark:text-slate-400">Coming soon.</p>
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/verify" element={<VerificationPortal />} />
      <Route path="/verify/:verificationId" element={<VerificationPortal />} />

      {/* Student: requireAuth + role student */}
      <Route
        path="/student"
        element={
          <ProtectedRoute allowedRoles={["student", "faculty"]}>
            <StudentLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/student/dashboard" replace />} />
        <Route path="dashboard" element={<StudentDashboard />} />
        <Route path="clubs" element={<ClubDirectory />} />
        <Route path="clubs/:clubId" element={<ClubProfile />} />
        <Route path="recruitment" element={<StudentRecruitmentPage />} />
        <Route path="recruitment/apply/:driveId" element={<ApplyToDrivePage />} />
        <Route path="my-applications" element={<MyApplicationsPage />} />
        <Route path="events" element={<StudentEvents />} />
        <Route path="events/:eventId" element={<EventDetails />} />
        <Route path="events/:eventId/register" element={<EventRegistration />} />
        <Route path="events/:eventId/success" element={<RegistrationSuccess />} />
        <Route path="my-registrations" element={<MyRegistrations />} />
        <Route path="chat" element={<StudentChatPage />} />
        <Route path="certificates" element={<StudentCertificates />} />
        <Route path="profile" element={<StudentPortfolio />} />
        <Route path="attendance" element={<PlaceholderPage title="Attendance" />} />
      </Route>

      {/* Leader: requireAuth + role club_leader OR club member (per-route checks on leader pages) */}
      <Route
        path="/leader"
        element={
          <ProtectedRoute allowedRoles={["club_leader", "admin"]}>
            <LeaderLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<LeaderDashboard />} />
        <Route path="recruitment" element={<LeaderRecruitmentPage />} />
        <Route path="drives/:driveId/applications" element={<LeaderApplicationsPage />} />
        <Route path="club/team" element={<ClubTeamPage useLeaderApi />} />
        <Route path="club" element={<LeaderClub />} />
        <Route path="events" element={<LeaderEvents />} />
        <Route path="participants" element={<LeaderParticipants />} />
        <Route path="attendance" element={<LeaderAttendance />} />
        <Route path="announcements" element={<LeaderAnnouncements />} />
        <Route path="certificates" element={<LeaderCertificates />} />
        <Route path="chat" element={<LeaderChatRoom />} />
        <Route path="profile" element={<LeaderProfile />} />
      </Route>

      {/* Admin: requireAuth + role admin */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<AdminDashboard />} />
        <Route path="clubs" element={<AdminClubsPage />} />
        <Route path="clubs/:clubId" element={<AdminClubDetailPage />} />
        <Route path="club-recruitment" element={<AdminClubRecruitmentPage />} />
        <Route path="users" element={<ManageUsers />} />
        <Route path="announcements" element={<AdminAnnouncement />} />
        <Route path="events" element={<ManageEvents />} />
        <Route path="events/create" element={<CreateEvent />} />
        <Route path="certificates" element={<AdminCertificatesPage />} />
        <Route path="certificates/designer" element={<CertificateDesigner />} />
        <Route path="club-leader" element={<ClubLeaderDashboard />} />
        <Route path="organizer/events" element={<OrganizerEventList />} />
        <Route path="events/:eventId/certificates" element={<CertificateDistributionPage />} />
        <Route path="attendance" element={<AdminAttendance />} />
        <Route path="chat" element={<AdminChatRoom />} />
        <Route path="analytics" element={<PlaceholderPage title="Analytics" />} />
        <Route path="audit" element={<PlaceholderPage title="Audit Logs" />} />
        <Route path="settings" element={<PlaceholderPage title="Settings" />} />
        <Route path="profile" element={<AdminProfile />} />
      </Route>

      <Route path="/" element={<Home />} />
      <Route path="/403" element={<Forbidden403 />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
