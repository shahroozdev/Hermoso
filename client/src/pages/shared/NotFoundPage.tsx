import { Link } from 'react-router-dom';

const NotFoundPage = () => {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 p-6">
      <div className="w-full max-w-xl shell-panel rounded-2xl p-8 text-center">
        <p className="text-sm font-semibold uppercase tracking-[0.14em] text-muted">Error 404</p>
        <h1 className="mt-2 text-3xl font-bold">Page Not Found</h1>
        <p className="mt-3 text-slate-600">
          The page you are looking for does not exist or has been moved.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Link to="/login" className="rounded bg-primary px-4 py-2 text-white">
            Go to Login
          </Link>
          <Link to="/" className="rounded border border-slate-300 px-4 py-2 text-slate-700">
            Go Home
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NotFoundPage;
