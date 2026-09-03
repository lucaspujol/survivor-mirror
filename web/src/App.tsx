import { Route, Routes } from 'react-router'
import { AppLayout } from '@/components/layout/AppLayout'
import { AuthLayout } from '@/components/layout/AuthLayout'
import { RequireAuth } from '@/components/layout/RequireAuth'
import { AccountPage } from '@/pages/AccountPage'
import { AdminReportsPage } from '@/pages/AdminReportsPage'
import { AdminUsersPage } from '@/pages/AdminUsersPage'
import { ApplicationsPage } from '@/pages/ApplicationsPage'
import { HomePage } from '@/pages/HomePage'
import { LoginPage } from '@/pages/LoginPage'
import { MyOffersPage } from '@/pages/MyOffersPage'
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
        <Route element={<RequireAuth />}>
          <Route path="me" element={<AccountPage />} />
          <Route path="candidatures" element={<ApplicationsPage />} />
          <Route path="mes-offres" element={<MyOffersPage />} />
          <Route path="admin/signalements" element={<AdminReportsPage />} />
          <Route path="admin/utilisateurs" element={<AdminUsersPage />} />
        </Route>
      </Route>
    </Routes>
  )
}

export default App
