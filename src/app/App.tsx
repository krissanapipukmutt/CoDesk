import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import Layout from '../components/Layout';
import { useRepo } from '../data/repo';
import { LoadingState } from '../components/State';
import { Role } from '../data/types';

const LoginPage = lazy(() => import('../routes/login'));
const BookingPage = lazy(() => import('../routes/booking'));
const DepartmentsPage = lazy(() => import('../routes/departments'));
const EmployeesPage = lazy(() => import('../routes/employees'));
const HolidaysPage = lazy(() => import('../routes/holidays'));
const ReportsPage = lazy(() => import('../routes/reports'));
const AdminUsersPage = lazy(() => import('../routes/adminUsers'));
const UnauthorizedPage = lazy(() => import('../routes/unauthorized'));
const HomeRedirect = lazy(() => import('../routes/home'));

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
    <Suspense fallback={<LoadingState label="กำลังโหลดหน้า..." />}>
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
    </Suspense>
  );
};

export default App;
