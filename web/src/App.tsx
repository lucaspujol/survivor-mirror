import { Route, Routes } from 'react-router'
import { AppLayout } from '@/components/layout/AppLayout'
import { AuthLayout } from '@/components/layout/AuthLayout'
import { RequireAuth } from '@/components/layout/RequireAuth'
import { RequireRole } from '@/components/layout/RequireRole'
import { AccountPage } from '@/pages/AccountPage'
import { AdminReportDetailPage } from '@/pages/AdminReportDetailPage'
import { AdminReportsPage } from '@/pages/AdminReportsPage'
import { AdminUserDetailPage } from '@/pages/AdminUserDetailPage'
import { AdminUsersPage } from '@/pages/AdminUsersPage'
import { ApplicationsPage } from '@/pages/ApplicationsPage'
import { CGUPage } from '@/pages/CGUPage'
import { CompanyPage } from '@/pages/CompanyPage'
import { ConfidentialityPage } from '@/pages/ConfidentialityPage'
import { HomePage } from '@/pages/HomePage'
import { LoginPage } from '@/pages/LoginPage'
import { LegalNoticePage } from '@/pages/LegalNoticePage'
import { MyOffersPage } from '@/pages/MyOffersPage'
import { NotFoundPage } from '@/pages/NotFoundPage'
import { RegisterPage } from '@/pages/RegisterPage'

function App() {
  return (
    <Routes>
      <Route element={<AuthLayout />}>
        <Route path="login" element={<LoginPage />} />
        <Route path="register" element={<RegisterPage />} />
      </Route>

      <Route element={<AppLayout />}>
        <Route index element={<HomePage />} />
        <Route path="entreprises/:employerId" element={<CompanyPage />} />

        {/* Public, reachable from the footer regardless of auth state. */}
        <Route path="cgu" element={<CGUPage />} />
        <Route path="mentions-legales" element={<LegalNoticePage />} />
        <Route path="confidentialite" element={<ConfidentialityPage />} />

        <Route element={<RequireAuth />}>
          <Route path="me" element={<AccountPage />} />
        </Route>

        {/* Each section is restricted to the role that owns its data; the API
            enforces the same rule, this only avoids showing a dead end. */}
        <Route element={<RequireRole roles={['seeker']} />}>
          <Route path="candidatures" element={<ApplicationsPage />} />
        </Route>

        <Route element={<RequireRole roles={['employer']} />}>
          <Route path="mes-offres" element={<MyOffersPage />} />
        </Route>

        <Route element={<RequireRole roles={['admin']} />}>
          <Route path="admin/utilisateurs" element={<AdminUsersPage />} />
          <Route path="admin/utilisateurs/:userId" element={<AdminUserDetailPage />} />
          <Route path="admin/signalements" element={<AdminReportsPage />} />
          <Route path="admin/signalements/:offerId" element={<AdminReportDetailPage />} />
        </Route>

        <Route path="introuvable" element={<NotFoundPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  )
}

export default App
