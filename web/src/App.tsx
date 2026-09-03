import { Route, Routes } from 'react-router'
import { AppLayout } from '@/components/layout/AppLayout'
import { AuthLayout } from '@/components/layout/AuthLayout'
import { RequireAuth } from '@/components/layout/RequireAuth'
import { RequireRole } from '@/components/layout/RequireRole'
import { AccountPage } from '@/pages/AccountPage'
import { AdminUsersPage } from '@/pages/AdminUsersPage'
import { ApplicationsPage } from '@/pages/ApplicationsPage'
import { HomePage } from '@/pages/HomePage'
import { LoginPage } from '@/pages/LoginPage'
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
        </Route>

        <Route path="introuvable" element={<NotFoundPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  )
}

export default App
