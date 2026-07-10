import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AppShell } from './components/layout/AppShell'
import DashboardScreen from './screens/DashboardScreen'
import FilesScreen from './screens/FilesScreen'
import AddFileScreen from './screens/AddFileScreen'
import ContractsScreen from './screens/ContractsScreen'
import ProfileScreen from './screens/ProfileScreen'
import LoginScreen from './screens/LoginScreen'
import NotFoundScreen from './screens/NotFoundScreen'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginScreen />} />
        <Route
          path="/"
          element={
            <AppShell title="داشبورد">
              <DashboardScreen />
            </AppShell>
          }
        />
        <Route
          path="/files"
          element={
            <AppShell title="فایل‌ها">
              <FilesScreen />
            </AppShell>
          }
        />
        <Route
          path="/files/new"
          element={
            <AppShell title="افزودن فایل">
              <AddFileScreen />
            </AppShell>
          }
        />
        <Route
          path="/contracts"
          element={
            <AppShell title="قراردادها">
              <ContractsScreen />
            </AppShell>
          }
        />
        <Route
          path="/profile"
          element={
            <AppShell title="پروفایل">
              <ProfileScreen />
            </AppShell>
          }
        />
        <Route path="*" element={<NotFoundScreen />} />
      </Routes>
    </BrowserRouter>
  )
}
