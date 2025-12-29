import { Navigate } from 'react-router-dom';
import { useUser } from '@clerk/clerk-react';
import Navbar from './hotelOwner/Navbar';
import Sidebar from './hotelOwner/Sidebar';
import { Outlet } from 'react-router-dom';

const OwnerLayout = () => {
  const { isLoaded, isSignedIn, user } = useUser();

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600"></div>
      </div>
    );
  }

  if (!isSignedIn) {
    return <Navigate to="/" replace />;
  }

  const userRole = user?.publicMetadata?.role;
  if (!userRole || userRole === 'guest') {
    return <Navigate to="/" replace />;
  }

  return (
    <div className='flex flex-col h-screen'>
      <Navbar/>
      <div className='flex h-full'>
        <Sidebar />
        <div className='flex-1 p-4 pt-10 md:px-10 h-full overflow-y-auto'>
          <Outlet/>
        </div>
      </div>
    </div>
  );
};

export default OwnerLayout;
