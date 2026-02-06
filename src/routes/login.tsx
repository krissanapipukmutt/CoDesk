import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRepo } from '../data/repo';
import { LoadingState } from '../components/State';

const LoginPage = () => {
  const { repo, isDemo, profile, ready } = useRepo();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const demoUsers = repo.getDemoUsers?.() ?? [];

  useEffect(() => {
    if (profile) navigate('/');
  }, [profile, navigate]);

  if (!ready) return <LoadingState label="กำลังโหลด..." />;

  const handleSubmit = async (evt: React.FormEvent) => {
    evt.preventDefault();
    setLoading(true);
    setError('');
    try {
      await repo.signIn(email, password);
      navigate('/');
    } catch (err) {
      setError('อีเมลหรือรหัสผ่านไม่ถูกต้อง');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto mt-12 max-w-md">
      <div className="card p-8">
        <h2 className="text-xl font-display mb-2">เข้าสู่ระบบ</h2>
        <p className="text-sm text-slate-500 mb-6">ใช้บัญชี Supabase Auth หรือบัญชี DEMO</p>
        {error && <div className="mb-4 rounded-xl bg-rose/10 px-4 py-2 text-rose text-sm">{error}</div>}
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="text-sm text-slate-600">อีเมล</label>
            <input className="input" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div>
            <label className="text-sm text-slate-600">รหัสผ่าน</label>
            <input
              className="input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <button className="btn-primary w-full" type="submit" disabled={loading}>
            {loading ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}
          </button>
        </form>
        {isDemo && (
          <div className="mt-6">
            <p className="text-xs uppercase tracking-wide text-slate-400">Demo Users</p>
            <div className="mt-2 grid gap-2">
              {demoUsers.map((u) => (
                <button
                  key={u.email}
                  className="btn-secondary justify-between"
                  onClick={async () => {
                    setEmail(u.email);
                    setPassword('demo');
                    await repo.signIn(u.email, 'demo');
                    navigate('/');
                  }}
                >
                  <span>{u.name}</span>
                  <span className="text-xs text-slate-400">{u.role}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LoginPage;
