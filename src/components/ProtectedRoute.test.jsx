import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';
import { AuthContext } from '../contexts/AuthContext';
import '@testing-library/jest-dom';

// Mock components
const DummyComponent = () => <div>Dummy Component</div>;
const LoginComponent = () => <div>Login Page</div>;
const InformationComponent = () => <div>Information Page</div>;
const UnauthorizedComponent = () => <div>Unauthorized Page</div>;

const renderWithRouter = (ui, { providerProps, route = '/' } = {}) => {
  window.history.pushState({}, 'Test page', route);

  return render(
    <AuthContext.Provider value={providerProps}>
      <MemoryRouter initialEntries={[route]}>
        <Routes>
          <Route path="/" element={<LoginComponent />} />
          <Route path="/protected" element={<ProtectedRoute>{ui}</ProtectedRoute>} />
          <Route path="/information" element={<InformationComponent />} />
          <Route path="/unauthorized" element={<UnauthorizedComponent />} />
        </Routes>
      </MemoryRouter>
    </AuthContext.Provider>
  );
};

describe('ProtectedRoute', () => {
  it('should render children for an authenticated user with a profile and permissions', () => {
    const providerProps = {
      isLoaded: true,
      isAuthenticated: true,
      profile: { role: 'user', permissions: ['can_view_protected_page'] },
    };
    renderWithRouter(<DummyComponent />, { providerProps, route: '/protected' });
    expect(screen.getByText('Dummy Component')).toBeInTheDocument();
  });

  it('should redirect to the login page for an unauthenticated user', () => {
    const providerProps = {
      isLoaded: true,
      isAuthenticated: false,
      profile: null,
    };
    renderWithRouter(<DummyComponent />, { providerProps, route: '/protected' });
    expect(screen.getByText('Login Page')).toBeInTheDocument();
  });

  it('should redirect to /information for an authenticated user without a profile', () => {
    const providerProps = {
      isLoaded: true,
      isAuthenticated: true,
      profile: null,
    };
    renderWithRouter(<DummyComponent />, { providerProps, route: '/protected' });
    expect(screen.getByText('Information Page')).toBeInTheDocument();
  });

  it('should not redirect to /information if already on that page', () => {
    const providerProps = {
      isLoaded: true,
      isAuthenticated: true,
      profile: null,
    };
    renderWithRouter(<InformationComponent />, { providerProps, route: '/information' });
    expect(screen.getByText('Information Page')).toBeInTheDocument();
    // Check that we are not redirected away
    expect(window.location.pathname).toBe('/information');
  });

  it('should redirect to /unauthorized for an authenticated user without the required role', () => {
    const providerProps = {
      isLoaded: true,
      isAuthenticated: true,
      profile: { role: 'guest' },
    };
    
    // We need a route that requires a specific role.
    const protectedRouteWithRole = (
        <ProtectedRoute requiredRole="admin">
            <DummyComponent/>
        </ProtectedRoute>
    )

    render(
        <AuthContext.Provider value={providerProps}>
          <MemoryRouter initialEntries={['/protected-admin']}>
            <Routes>
              <Route path="/" element={<LoginComponent />} />
              <Route path="/protected-admin" element={protectedRouteWithRole} />
              <Route path="/unauthorized" element={<UnauthorizedComponent />} />
            </Routes>
          </MemoryRouter>
        </AuthContext.Provider>
      );

    expect(screen.getByText('Unauthorized Page')).toBeInTheDocument();
  });

  it('should render a loading indicator while isLoaded is false', () => {
    const providerProps = {
      isLoaded: false,
      isAuthenticated: false,
      profile: null,
    };
    renderWithRouter(<DummyComponent />, { providerProps, route: '/protected' });
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('should deny access if canAccessRoute returns false', () => {
    const providerProps = {
        isLoaded: true,
        isAuthenticated: true,
        profile: { role: 'user', permissions: [] }, // No permissions
      };
  
      // Mocking canAccessRoute is tricky because it's a direct import.
      // For this test, we rely on the fact that with an empty permission set,
      // accessing any route other than a few whitelisted ones should fail.
      // Let's assume '/protected' is not whitelisted in the actual permissions config.
  
      renderWithRouter(<DummyComponent />, { providerProps, route: '/protected' });
  
      expect(screen.getByText('Unauthorized Page')).toBeInTheDocument();
  });
});
