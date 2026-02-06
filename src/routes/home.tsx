import { Navigate } from 'react-router-dom';
import { useRepo } from '../data/repo';

const HomeRedirect = () => {
  const { profile } = useRepo();
  if (!profile) return <Navigate to="/login" replace />;
  if (profile.role === 'employee') return <Navigate to="/booking" replace />;
  if (profile.role === 'hr') return <Navigate to="/booking" replace />;
  return <Navigate to="/reports" replace />;
};

export default HomeRedirect;
