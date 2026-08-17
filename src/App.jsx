import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { AcademicProvider } from './context/AcademicContext';
import AppRoutes from './routes/AppRoutes';
import ErrorBoundary from './components/common/ErrorBoundary';

const getBasename = () => {
  if (typeof window !== 'undefined') {
    if (window.location.pathname.startsWith('/nba')) {
      return '/nba';
    }
    if (window.location.pathname.startsWith('/obe')) {
      return '/obe';
    }
  }
  return '/';
};

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <AcademicProvider>
          <BrowserRouter basename={getBasename()}>
            <AppRoutes />
          </BrowserRouter>
        </AcademicProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}
