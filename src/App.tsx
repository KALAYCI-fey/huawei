import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { Layout } from './components/Layout'
import { RequireAuth } from './components/RequireAuth'
import { AttendancePage } from './pages/AttendancePage'
import { DashboardPage } from './pages/DashboardPage'
import { EmployerPage } from './pages/EmployerPage'
import { JobStartsPage } from './pages/JobStartsPage'
import { LoginPage } from './pages/LoginPage'
import { ProgramsPage } from './pages/ProgramsPage'
import { TraineesPage } from './pages/TraineesPage'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/giris" element={<LoginPage />} />
        <Route element={<RequireAuth />}>
          <Route element={<Layout />}>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/programlar" element={<ProgramsPage />} />
            <Route path="/kursiyerler" element={<TraineesPage />} />
            <Route path="/isbasi" element={<JobStartsPage />} />
            <Route path="/yoklama" element={<AttendancePage />} />
            <Route path="/isveren" element={<EmployerPage />} />
          </Route>
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
