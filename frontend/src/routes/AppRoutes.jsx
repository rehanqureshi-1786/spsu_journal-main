import { Routes, Route, Navigate } from 'react-router-dom'
import { lazy, Suspense } from 'react'
import ProtectedRoute from '../components/ProtectedRoute'
import PublicLayout from '../layouts/PublicLayout'
import AuthorLayout from '../layouts/AuthorLayout'
import ReviewerLayout from '../layouts/ReviewerLayout'
import AdminLayout from '../layouts/AdminLayout'

// Public pages (eagerly loaded for fast initial render)
import HomePage from '../views/public/HomePage'
import AboutUs from '../views/public/AboutUs'
import EditorialBoard from '../views/public/EditorialBoard'
import AuthorGuidelines from '../views/public/AuthorGuidelines'
import ReviewerGuidelines from '../views/public/ReviewerGuidelines'
import IssuesAndVolumes from '../views/public/IssuesAndVolumes'
import ContactUs from '../views/public/ContactUs'
import LoginPage from '../views/public/LoginPage'
import SignupPage from '../views/public/SignupPage'
import VerifyCertificate from '../views/public/VerifyCertificate'

// Author pages (lazy loaded)
const AuthorDashboard = lazy(() => import('../views/author/AuthorDashboard'))
const SubmitPaper = lazy(() => import('../views/author/SubmitPaper'))
const MyPapers = lazy(() => import('../views/author/MyPapers'))
const PaperDetail = lazy(() => import('../views/author/PaperDetail'))
const PaperTimeline = lazy(() => import('../views/author/PaperTimeline'))
const ViewReviews = lazy(() => import('../views/author/ViewReviews'))
const UploadRevision = lazy(() => import('../views/author/UploadRevision'))
const AuthorCertificates = lazy(() => import('../views/author/MyCertificates'))

// Reviewer pages (lazy loaded)
const ReviewerDashboard = lazy(() => import('../views/reviewer/ReviewerDashboard'))
const AssignedPapers = lazy(() => import('../views/reviewer/AssignedPapers'))
const ReviewPaper = lazy(() => import('../views/reviewer/ReviewPaper'))
const MyReviews = lazy(() => import('../views/reviewer/MyReviews'))
const ReviewerCertificates = lazy(() => import('../views/reviewer/MyCertificates'))

// Admin pages (lazy loaded)
const AdminDashboard = lazy(() => import('../views/admin/AdminDashboard'))
const ManageUsers = lazy(() => import('../views/admin/ManageUsers'))
const ManageReviewers = lazy(() => import('../views/admin/ManageReviewers'))
const ManagePapers = lazy(() => import('../views/admin/ManagePapers'))
const AssignReviewers = lazy(() => import('../views/admin/AssignReviewers'))
const ManagePublications = lazy(() => import('../views/admin/ManagePublications'))
const AuditLogs = lazy(() => import('../views/admin/AuditLogs'))
const ManageEvents = lazy(() => import('../views/admin/ManageEvents'))
const IssueCertificates = lazy(() => import('../views/admin/IssueCertificates'))
const ManageSlideshow = lazy(() => import('../views/admin/ManageSlideshow'))
const ManageSiteConfig = lazy(() => import('../views/admin/ManageSiteConfig'))
const ManageAnnouncements = lazy(() => import('../views/admin/ManageAnnouncements'))

// Loading fallback
const PageLoader = () => (
  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '200px', color: '#6B7280', fontSize: '0.875rem' }}>
    Loading...
  </div>
)

function AppRoutes() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* Public routes with layout */}
        <Route element={<PublicLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/about" element={<AboutUs />} />
          <Route path="/editorial-board" element={<EditorialBoard />} />
          <Route path="/author-guidelines" element={<AuthorGuidelines />} />
          <Route path="/reviewer-guidelines" element={<ReviewerGuidelines />} />
          <Route path="/issues" element={<IssuesAndVolumes />} />
          <Route path="/contact" element={<ContactUs />} />
          <Route path="/verify-certificate" element={<VerifyCertificate />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
        </Route>
        
        {/* Author routes */}
        <Route
          path="/author"
          element={
            <ProtectedRoute allowedRoles={['author']}>
              <AuthorLayout />
            </ProtectedRoute>
          }
        >
          <Route path="dashboard" element={<AuthorDashboard />} />
          <Route path="submit" element={<SubmitPaper />} />
          <Route path="papers" element={<MyPapers />} />
          <Route path="papers/:paperId" element={<PaperDetail />} />
          <Route path="papers/:paperId/timeline" element={<PaperTimeline />} />
          <Route path="papers/:paperId/reviews" element={<ViewReviews />} />
          <Route path="papers/:paperId/revise" element={<UploadRevision />} />
          <Route path="certificates" element={<AuthorCertificates />} />
          <Route index element={<Navigate to="/author/dashboard" replace />} />
        </Route>
        
        {/* Reviewer routes */}
        <Route
          path="/reviewer"
          element={
            <ProtectedRoute allowedRoles={['reviewer']}>
              <ReviewerLayout />
            </ProtectedRoute>
          }
        >
          <Route path="dashboard" element={<ReviewerDashboard />} />
          <Route path="assignments" element={<AssignedPapers />} />
          <Route path="review/:assignmentId" element={<ReviewPaper />} />
          <Route path="reviews" element={<MyReviews />} />
          <Route path="certificates" element={<ReviewerCertificates />} />
          <Route index element={<Navigate to="/reviewer/dashboard" replace />} />
        </Route>
        
        {/* Admin routes */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="users" element={<ManageUsers />} />
          <Route path="reviewers" element={<ManageReviewers />} />
          <Route path="papers" element={<ManagePapers />} />
          <Route path="assign-reviewers" element={<AssignReviewers />} />
          <Route path="publications" element={<ManagePublications />} />
          <Route path="events" element={<ManageEvents />} />
          <Route path="certificates" element={<IssueCertificates />} />
          <Route path="slideshow" element={<ManageSlideshow />} />
          <Route path="config" element={<ManageSiteConfig />} />
          <Route path="announcements" element={<ManageAnnouncements />} />
          <Route path="audit" element={<AuditLogs />} />
          <Route index element={<Navigate to="/admin/dashboard" replace />} />
        </Route>
        
        {/* Catch all - redirect to home */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  )
}

export default AppRoutes
