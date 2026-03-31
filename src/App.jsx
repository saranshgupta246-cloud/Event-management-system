import React, { Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";
import StudentLayout from "./layouts/StudentLayout";
import AdminLayout from "./layouts/AdminLayout";
import LeaderLayout from "./layouts/LeaderLayout";

const Home = React.lazy(() => import("./pages/Home.jsx"));
const PublicClubs = React.lazy(() => import("./pages/PublicClubs.jsx"));
const PublicClubDetails = React.lazy(() => import("./pages/PublicClubDetails.jsx"));
const Login = React.lazy(() => import("./pages/auth/Login.jsx"));
const AuthCallback = React.lazy(() => import("./pages/AuthCallback.jsx"));
const VerificationPortal = React.lazy(() => import("./pages/VerificationPortal.jsx"));
const Forbidden403 = React.lazy(() => import("./pages/Forbidden403.jsx"));

// Admin
const AdminDashboard = React.lazy(() => import("./pages/admin/AdminDashboard.jsx"));
const ManageUsers = React.lazy(() => import("./pages/admin/ManageUsers.jsx"));
const AdminClubsPage = React.lazy(() => import("./pages/admin/AdminClubsPage.jsx"));
const AdminClubDetailPage = React.lazy(() => import("./pages/admin/AdminClubDetailPage.jsx"));
const AdminClubRecruitmentPage = React.lazy(() => import("./pages/admin/AdminClubRecruitmentPage.jsx"));
const AdminAnnouncement = React.lazy(() => import("./pages/admin/AdminAnnouncement.jsx"));
const ManageEvents = React.lazy(() => import("./pages/admin/ManageEvents.jsx"));
const CreateEvent = React.lazy(() => import("./pages/admin/CreateEvent.jsx"));
const AdminEventDetails = React.lazy(() => import("./pages/admin/AdminEventDetails.jsx"));
const AdminEventParticipants = React.lazy(() => import("./pages/admin/AdminEventParticipants.jsx"));
const ClubLeaderDashboard = React.lazy(() => import("./pages/admin/ClubLeaderDashboard.jsx"));
const OrganizerEventList = React.lazy(() => import("./pages/admin/OrganizerEventList.jsx"));
const AdminAttendance = React.lazy(() => import("./pages/admin/AdminAttendance.jsx"));
const AdminChatRoom = React.lazy(() => import("./pages/admin/AdminChatRoom.jsx"));
const AdminProfile = React.lazy(() => import("./pages/admin/AdminProfile.jsx"));
const CertificateDistributionPage = React.lazy(() => import("./pages/admin/CertificateDistributionPage.jsx"));
const CertificateEditorPage = React.lazy(() => import("./pages/admin/CertificateEditorPage.jsx"));
const CertificateDesigner = React.lazy(() => import("./pages/admin/CertificateDesigner.jsx"));
const AdminCertificatesPage = React.lazy(() => import("./pages/admin/AdminCertificatesPage.jsx"));
const AuditLogsPage = React.lazy(() => import("./pages/admin/AuditLogsPage.jsx"));

// Student
const StudentDashboard = React.lazy(() => import("./pages/student/StudentDashboard.jsx"));
const StudentEvents = React.lazy(() => import("./pages/student/StudentEvents.jsx"));
const StudentCertificates = React.lazy(() => import("./pages/student/StudentCertificates.jsx"));
const EventDetails = React.lazy(() => import("./pages/student/EventDetails.jsx"));
const EventRegistration = React.lazy(() => import("./pages/student/EventRegistration.jsx"));
const RegistrationSuccess = React.lazy(() => import("./pages/student/RegistrationSuccess.jsx"));
const MyRegistrations = React.lazy(() => import("./pages/student/MyRegistrations.jsx"));
const StudentPortfolio = React.lazy(() => import("./pages/student/StudentPortfolio.jsx"));
const ClubDirectory = React.lazy(() => import("./pages/student/ClubDirectory.jsx"));
const ClubProfile = React.lazy(() => import("./pages/student/ClubProfile.jsx"));
const StudentRecruitmentPage = React.lazy(() => import("./pages/student/StudentRecruitmentPage.jsx"));
const ApplyToDrivePage = React.lazy(() => import("./pages/student/ApplyToDrivePage.jsx"));
const MyApplicationsPage = React.lazy(() => import("./pages/student/MyApplicationsPage.jsx"));
const StudentChatPage = React.lazy(() => import("./pages/student/StudentChatPage.jsx"));
const JoinClubPage = React.lazy(() => import("./pages/student/JoinClubPage.jsx"));
const StudentAttendance = React.lazy(() => import("./pages/student/StudentAttendance.jsx"));

// Leader
const LeaderDashboard = React.lazy(() => import("./pages/leader/LeaderDashboard.jsx"));
const LeaderClub = React.lazy(() => import("./pages/leader/LeaderClub.jsx"));
const LeaderEvents = React.lazy(() => import("./pages/leader/LeaderEvents.jsx"));
const LeaderParticipants = React.lazy(() => import("./pages/leader/LeaderParticipants.jsx"));
const LeaderAttendance = React.lazy(() => import("./pages/leader/LeaderAttendance.jsx"));
const LeaderAnnouncements = React.lazy(() => import("./pages/leader/LeaderAnnouncements.jsx"));
const LeaderCertificates = React.lazy(() => import("./pages/leader/LeaderCertificatesManager.jsx"));
const LeaderMyCertificates = React.lazy(() => import("./pages/leader/LeaderCertificates.jsx"));
const LeaderChatRoom = React.lazy(() => import("./pages/leader/LeaderChatRoom.jsx"));
const LeaderProfile = React.lazy(() => import("./pages/leader/LeaderProfile.jsx"));
const LeaderRecruitmentPage = React.lazy(() => import("./pages/leader/LeaderRecruitmentPage.jsx"));
const LeaderApplicationsPage = React.lazy(() => import("./pages/leader/LeaderApplicationsPage.jsx"));
const ClubTeamPage = React.lazy(() => import("./pages/leader/ClubTeamPage.jsx"));

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
    <Suspense
      fallback={
        <div className="mx-auto flex min-h-[50vh] max-w-2xl items-center justify-center p-8 text-center">
          <div className="text-sm font-semibold text-slate-600 dark:text-slate-300">Loading…</div>
        </div>
      }
    >
      <Routes>
      {/* Public */}
      <Route path="/login" element={<Login />} />
      <Route path="/auth/callback" element={<AuthCallback />} />
      <Route path="/verify" element={<VerificationPortal />} />
      <Route path="/verify/:verificationId" element={<VerificationPortal />} />
      <Route path="/clubs" element={<PublicClubs />} />
      <Route path="/clubs/:slug" element={<PublicClubDetails />} />

      {/* Student: primarily student/faculty; admin & coordinator can open shared views (e.g. club preview) */}
      <Route
        path="/student"
        element={
          <ProtectedRoute allowedRoles={["student", "faculty", "faculty_coordinator", "admin"]}>
            <StudentLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/student/dashboard" replace />} />
        <Route path="dashboard" element={<StudentDashboard />} />
        <Route path="clubs" element={<ClubDirectory />} />
        <Route path="clubs/:slug" element={<ClubProfile />} />
        <Route path="clubs/:slug/join" element={<JoinClubPage />} />
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
        <Route path="attendance" element={<StudentAttendance />} />
      </Route>

      {/* Faculty Coordinator: requireAuth + role faculty_coordinator */}
      <Route
        path="/leader"
        element={
          <ProtectedRoute allowedRoles={["faculty_coordinator", "admin", "student"]}>
            <LeaderLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<LeaderDashboard />} />
        <Route path="recruitment" element={<LeaderRecruitmentPage />} />
        <Route path="drives/:driveId/applications" element={<LeaderApplicationsPage />} />
        {/* Club-scoped routes used from Admin -> Club Detail and leader views */}
        <Route path="clubs/:clubId/recruitment" element={<LeaderRecruitmentPage />} />
        <Route path="clubs/:clubId/drives/:driveId/applications" element={<LeaderApplicationsPage />} />
        <Route path="clubs/:clubId/team" element={<ClubTeamPage useLeaderApi />} />
        <Route path="clubs/:clubId/preview" element={<ClubProfile />} />
        {/* Backwards-compatible routes without explicit clubId */}
        <Route path="club/team" element={<ClubTeamPage useLeaderApi />} />
        <Route path="club" element={<LeaderClub />} />
        <Route path="events" element={<LeaderEvents />} />
        <Route path="participants" element={<LeaderParticipants />} />
        <Route path="attendance" element={<LeaderAttendance />} />
        <Route path="announcements" element={<LeaderAnnouncements />} />
        <Route path="certificates" element={<LeaderCertificates />} />
        <Route path="my-certificates" element={<LeaderMyCertificates />} />
        <Route path="events/:eventId/certificates" element={<CertificateDistributionPage />} />
        <Route path="events/:eventId/certificate-editor" element={<CertificateEditorPage />} />
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
        <Route path="clubs/:clubId/preview" element={<ClubProfile />} />
        <Route path="clubs/:clubId/recruitment" element={<LeaderRecruitmentPage basePath="admin" />} />
        <Route path="clubs/:clubId/drives/:driveId/applications" element={<LeaderApplicationsPage basePath="admin" />} />
        <Route path="clubs/:clubId/team" element={<ClubTeamPage />} />
        <Route path="clubs/:clubId" element={<AdminClubDetailPage />} />
        <Route path="club-recruitment" element={<AdminClubRecruitmentPage />} />
        <Route path="users" element={<ManageUsers />} />
        <Route path="announcements" element={<AdminAnnouncement />} />
        <Route path="events" element={<ManageEvents />} />
        <Route path="events/create" element={<CreateEvent />} />
        <Route path="events/:eventId" element={<AdminEventDetails />} />
        <Route path="events/:eventId/participants" element={<AdminEventParticipants />} />
        <Route path="certificates" element={<AdminCertificatesPage />} />
        <Route path="certificates/designer" element={<CertificateDesigner />} />
        <Route path="club-leader" element={<ClubLeaderDashboard />} />
        <Route path="organizer/events" element={<OrganizerEventList />} />
        <Route path="events/:eventId/certificates" element={<CertificateDistributionPage />} />
        <Route path="events/:eventId/certificate-editor" element={<CertificateEditorPage />} />
        <Route path="attendance" element={<AdminAttendance />} />
        <Route path="chat" element={<AdminChatRoom />} />
        <Route path="analytics" element={<PlaceholderPage title="Analytics" />} />
        <Route path="audit" element={<AuditLogsPage />} />
        <Route path="settings" element={<PlaceholderPage title="Settings" />} />
        <Route path="profile" element={<AdminProfile />} />
      </Route>

      <Route path="/" element={<Home />} />
      <Route path="/403" element={<Forbidden403 />} />
      <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}
