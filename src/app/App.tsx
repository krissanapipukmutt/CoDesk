import { Navigate, Route, Routes } from 'react-router-dom';
import Layout from '../components/Layout';
import { useRepo } from '../data/repo';
import LoginPage from '../routes/login';
import BookingPage from '../routes/booking';
import DepartmentsPage from '../routes/departments';
import EmployeesPage from '../routes/employees';
import HolidaysPage from '../routes/holidays';
import ReportsPage from '../routes/reports';
import AdminUsersPage from '../routes/adminUsers';
import UnauthorizedPage from '../routes/unauthorized';
import HomeRedirect from '../routes/home';
import { LoadingState } from '../components/State';
import { Role } from '../data/types';

const RequireAuth = ({
  roles,
  children
}: {
  roles: Role[];
  children: React.ReactNode;
}) => {
  const { ready, profile } = useRepo();
  if (!ready) return <LoadingState label="กำลังเตรียมระบบ..." />;
  if (!profile) return <Navigate to="/login" replace />;
  if (!roles.includes(profile.role)) return <Navigate to="/unauthorized" replace />;
  return <>{children}</>;
};

const App = () => {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/unauthorized" element={<UnauthorizedPage />} />
      <Route
        path="/"
        element={
          <RequireAuth roles={['employee', 'hr', 'admin']}>
            <Layout>
              <HomeRedirect />
            </Layout>
          </RequireAuth>
        }
      />
      <Route
        path="/booking"
        element={
          <RequireAuth roles={['employee', 'hr', 'admin']}>
            <Layout>
              <BookingPage />
            </Layout>
          </RequireAuth>
        }
      />
      <Route
        path="/departments"
        element={
          <RequireAuth roles={['hr', 'admin']}>
            <Layout>
              <DepartmentsPage />
            </Layout>
          </RequireAuth>
        }
      />
      <Route
        path="/employees"
        element={
          <RequireAuth roles={['hr', 'admin']}>
            <Layout>
              <EmployeesPage />
            </Layout>
          </RequireAuth>
        }
      />
      <Route
        path="/holidays"
        element={
          <RequireAuth roles={['hr', 'admin']}>
            <Layout>
              <HolidaysPage />
            </Layout>
          </RequireAuth>
        }
      />
      <Route
        path="/reports"
        element={
          <RequireAuth roles={['employee', 'hr', 'admin']}>
            <Layout>
              <ReportsPage />
            </Layout>
          </RequireAuth>
        }
      />
      <Route
        path="/admin/users"
        element={
          <RequireAuth roles={['admin']}>
            <Layout>
              <AdminUsersPage />
            </Layout>
          </RequireAuth>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default App;
