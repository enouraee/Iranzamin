import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import type { ReactNode } from 'react'
import { Providers } from './components/common/Providers'
import { AppShell } from './components/layout/AppShell'
import DashboardScreen from './screens/DashboardScreen'
import FilesScreen from './screens/FilesScreen'
import PropertyDetailScreen from './screens/PropertyDetailScreen'
import AddFileScreen from './screens/AddFileScreen'
import ContractsScreen from './screens/ContractsScreen'
import ContractWizardScreen from './screens/ContractWizardScreen'
import RequestsScreen from './screens/RequestsScreen'
import RequestWizardScreen from './screens/RequestWizardScreen'
import PersonsScreen from './screens/PersonsScreen'
import PersonDetailScreen from './screens/PersonDetailScreen'
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
    <Providers>
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
          path="/files/:id"
          element={
            <RequireAuth>
              <AppShell title="جزئیات ملک">
                <PropertyDetailScreen />
              </AppShell>
            </RequireAuth>
          }
        />
        <Route
          path="/files/new"
          element={
            <RequireAuth>
              <AppShell title="افزودن فایل جدید">
                <AddFileScreen />
              </AppShell>
            </RequireAuth>
          }
        />
        <Route
          path="/persons"
          element={
            <RequireAuth>
              <AppShell title="اشخاص">
                <PersonsScreen />
              </AppShell>
            </RequireAuth>
          }
        />
        <Route
          path="/persons/:id"
          element={
            <RequireAuth>
              <AppShell title="جزئیات شخص">
                <PersonDetailScreen />
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
          path="/contracts/new"
          element={
            <RequireAuth>
              <AppShell title="ثبت قرارداد جدید">
                <ContractWizardScreen />
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
        <Route
          path="/requests"
          element={
            <RequireAuth>
              <AppShell title="درخواست‌ها">
                <RequestsScreen />
              </AppShell>
            </RequireAuth>
          }
        />
        <Route
          path="/requests/new"
          element={
            <RequireAuth>
              <AppShell title="ثبت درخواست">
                <RequestWizardScreen />
              </AppShell>
            </RequireAuth>
          }
        />
        <Route path="*" element={<NotFoundScreen />} />
      </Routes>
    </BrowserRouter>
    </Providers>
  )
}
