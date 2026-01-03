import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Navbar from './hotelOwner/Navbar';
import Sidebar from './hotelOwner/Sidebar';
import { Outlet } from 'react-router-dom';
import patternBg from '../assets/pattern_gold_2x.png';

const OwnerLayout = () => {
  const { isLoaded, isAuthenticated, profile } = useAuth();

  console.log('[OwnerLayout] Auth state:', { isLoaded, isAuthenticated, profile });

  if (!isLoaded) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600"></div>
        <p className="mt-4 text-gray-600">Loading your profile...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    console.log('[OwnerLayout] User not authenticated, redirecting to home');
    return <Navigate to="/" replace />;
  }

  // If authenticated but profile failed to load
  if (!profile) {
    console.error('[OwnerLayout] Profile is null despite being authenticated');
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-gray-50">
        <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
          <div className="flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 text-center mb-2">Profile Load Error</h2>
          <p className="text-gray-600 text-center mb-4">
            Unable to load your user profile. This may be due to:
          </p>
          <ul className="text-sm text-gray-600 mb-4 list-disc list-inside">
            <li>Your profile hasn't been created in the database</li>
            <li>Database permission issues</li>
            <li>Network connectivity problems</li>
          </ul>
          <p className="text-sm text-gray-500 text-center mb-4">
            Check the browser console (F12) for detailed error messages.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="w-full px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const userRole = profile.role;
  console.log('[OwnerLayout] User role:', userRole);

  if (!userRole || userRole === 'guest') {
    console.log('[OwnerLayout] User is guest or has no role, redirecting to home');
    return <Navigate to="/" replace />;
  }

  return (
    <div className='flex flex-col h-screen' style={{ backgroundImage: `url(${patternBg})`, backgroundRepeat: 'repeat' }}>
      <Navbar/>
      <div className='flex h-full'>
        <Sidebar />
        <div className='flex-1 p-4 pt-20 md:px-10 h-full overflow-y-auto'>
          <Outlet/>
        </div>
      </div>
    </div>
  );
};

export default OwnerLayout;
