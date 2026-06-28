import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { tokenCookies } from '../utils/tokenCookies';

interface ProtectedRouteProps {
  allowedRoles?: string[];
}

const normalizeRole = (role?: string) => {
  if (role === 'admin') return 'super_admin';
  return role;
};

const ProtectedRoute = ({ allowedRoles }: ProtectedRouteProps) => {
  const { user } = useAuthStore();
  const token = tokenCookies.getAccessToken();
  if (!token || !user) return <Navigate to="/login" replace />;
  if (allowedRoles?.length && !allowedRoles.map(normalizeRole).includes(normalizeRole(user.role))) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
