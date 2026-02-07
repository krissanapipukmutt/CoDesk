import { NavLink, useNavigate } from 'react-router-dom';
import { useRepo } from '../data/repo';
import DemoBanner from './DemoBanner';

const navItems = [
  { to: '/booking', label: 'จองที่นั่ง', roles: ['employee', 'hr', 'admin'] },
  { to: '/holidays', label: 'วันหยุด', roles: ['hr', 'admin'] },
  { to: '/departments', label: 'ฝ่ายงาน', roles: ['hr', 'admin'] },
  { to: '/employees', label: 'พนักงาน', roles: ['hr', 'admin'] },
  { to: '/admin/users', label: 'ผู้ใช้', roles: ['admin'] },
  { to: '/reports', label: 'รายงาน', roles: ['employee', 'hr', 'admin'] }
];

const Layout = ({ children }: { children: React.ReactNode }) => {
  const { profile, repo, isDemo } = useRepo();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await repo.signOut();
    navigate('/login');
  };

  return (
    <div className="min-h-screen">
      <DemoBanner visible={isDemo} />
      <header className="mx-auto mt-6 max-w-6xl px-4">
        <div className="card p-6 flex flex-col gap-4">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-2xl font-display text-ink">CoDesk Booking</h1>
              <p className="text-sm text-slate-500">ระบบจองที่นั่งเข้าออฟฟิศ (Supabase)</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-sm font-semibold text-slate-700">{profile?.name ?? 'Guest'}</p>
                <p className="text-xs text-slate-400">{profile?.role ?? 'unknown'}</p>
              </div>
              {profile && (
                <button className="btn-secondary" onClick={handleSignOut}>
                  ออกจากระบบ
                </button>
              )}
            </div>
          </div>
          <nav className="flex flex-wrap gap-2">
            {navItems
              .filter((item) => !profile || item.roles.includes(profile.role))
              .map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
                >
                  {item.label}
                </NavLink>
              ))}
          </nav>
        </div>
      </header>
      <main className="mx-auto mt-8 max-w-6xl px-4 pb-16">{children}</main>
    </div>
  );
};

export default Layout;
