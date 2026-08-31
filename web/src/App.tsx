import { Route, Routes } from 'react-router'
import { Layout } from '@/components/layout/Layout'
import { HomePage } from '@/pages/HomePage'
import { LoginPage } from '@/pages/LoginPage'

function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<HomePage />} />
        <Route path="login" element={<LoginPage />} />
      </Route>
    </Routes>
  )
}

export default App