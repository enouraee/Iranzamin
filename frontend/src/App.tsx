import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import type { ReactNode } from 'react'
import { AppShell } from './components/layout/AppShell'
import DashboardScreen from './screens/DashboardScreen'
import FilesScreen from './screens/FilesScreen'
import AddFileScreen from './screens/AddFileScreen'
import ContractsScreen from './screens/ContractsScreen'
import ProfileScreen from './screens/ProfileScreen'
import LoginScreen from './screens/LoginScreen'
import NotFoundScreen from './screens/NotFoundScreen'

function RequireAuth({ children }: { children: ReactNode }) {
  const isAuthenticated = !!localStorage.getItem('access_token')
  if (!isAuthenticated) return <Navigate to="/login" replace />
  return <>{children}</>
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginScreen />} />
        <Route
          path="/"
          element={
            <RequireAuth>
              <AppShell title="داشبورد">
                <DashboardScreen />
              </AppShell>
            </RequireAuth>
          }
        />
        <Route
          path="/files"
          element={
            <RequireAuth>
              <AppShell title="فایل‌ها">
                <FilesScreen />
              </AppShell>
            </RequireAuth>
          }
        />
        <Route
          path="/files/new"
          element={
            <RequireAuth>
              <AppShell title="افزودن فایل">
                <AddFileScreen />
              </AppShell>
            </RequireAuth>
          }
        />
        <Route
          path="/contracts"
          element={
            <RequireAuth>
              <AppShell title="قراردادها">
                <ContractsScreen />
              </AppShell>
            </RequireAuth>
          }
        />
        <Route
          path="/profile"
          element={
            <RequireAuth>
              <AppShell title="پروفایل">
                <ProfileScreen />
              </AppShell>
            </RequireAuth>
          }
        />
        <Route path="*" element={<NotFoundScreen />} />
      </Routes>
    </BrowserRouter>
  )
}
