import { useState, useEffect } from 'react';
import { useUser } from '@clerk/clerk-react';
import { Users, Shield, Edit, Trash2, Save, X, AlertCircle } from 'lucide-react';
import { ROLES } from '../../../config/rolePermissions';
import { canManageUsers } from '../../../utils/permissions';

const UsersRoles = () => {
  const { user: currentUser } = useUser();

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingUser, setEditingUser] = useState(null);

  const canManage = canManageUsers(currentUser);

  useEffect(() => {
    if (canManage) {
      fetchUsers();
    } else {
      setLoading(false);
    }
  }, [canManage]);

  const fetchUsers = async () => {
    try {
      setLoading(true);

      // TODO: Replace with actual backend API call
      // const response = await fetch('/api/users');
      // const data = await response.json();
      // setUsers(data.users || []);

      // For now, show a message that backend API is needed
      setError('Backend API endpoint required. Please implement /api/users endpoint.');
      setUsers([]);
    } catch (err) {
      console.error('Error fetching users:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const updateUserRole = async (userId, newRole) => {
    try {
      // TODO: Replace with actual backend API call
      // const response = await fetch(`/api/users/${userId}/role`, {
      //   method: 'PATCH',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({
      //     role: newRole,
      //     assignedBy: currentUser.id,
      //     assignedAt: new Date().toISOString()
      //   })
      // });

      //await fetchUsers();
      setEditingUser(null);
      alert('Backend API required for this operation');
    } catch (err) {
      console.error('Error updating user role:', err);
      alert('Failed to update user role: ' + err.message);
    }
  };

  const deleteUser = async (userId) => {
    if (!confirm('Are you sure you want to delete this user?')) return;

    try {
      // TODO: Replace with actual backend API call
      // await fetch(`/api/users/${userId}`, { method: 'DELETE' });
      // await fetchUsers();
      alert('Backend API required for this operation');
    } catch (err) {
      console.error('Error deleting user:', err);
      alert('Failed to delete user: ' + err.message);
    }
  };

  if (!canManage) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">Users & Roles</h1>
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-medium">Access Denied</p>
            <p className="text-sm">You don't have permission to manage users. Only Super Admins can access this page.</p>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">Users & Roles</h1>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Users className="w-7 h-7" />
          Users & Roles
        </h1>
      </div>

      {error && (
        <div className="mb-6 bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <p className="font-medium">Backend API Required</p>
            <p className="text-sm mt-1">{error}</p>
            <div className="mt-3 text-sm">
              <p className="font-medium mb-2">To enable user management, implement these backend endpoints:</p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li><code className="bg-amber-100 px-1 rounded">GET /api/users</code> - List all users</li>
                <li><code className="bg-amber-100 px-1 rounded">PATCH /api/users/:userId/role</code> - Update user role</li>
                <li><code className="bg-amber-100 px-1 rounded">DELETE /api/users/:userId</code> - Delete user</li>
              </ul>
              <p className="mt-2">See the implementation plan for details.</p>
            </div>
          </div>
        </div>
      )}

      {/* Role Permissions Reference */}
      <div>
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <Shield className="w-6 h-6" />
          Available Roles & Permissions
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Object.entries(ROLES).map(([key, value]) => (
            <div key={value} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
              <h3 className="font-semibold text-lg mb-2 text-gray-800">
                {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </h3>
              <div className="space-y-1">
                <div className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-2">Role Value:</div>
                <code className="text-xs bg-gray-100 px-2 py-1 rounded block">{value}</code>
              </div>
              <div className="mt-3 pt-3 border-t border-gray-200">
                <div className="text-xs text-gray-600">
                  {getRoleDescription(value)}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Instructions */}
      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-blue-900 mb-2">How to Assign Roles</h3>
        <div className="text-sm text-blue-800 space-y-2">
          <p>To assign a role to a user:</p>
          <ol className="list-decimal list-inside space-y-1 ml-2">
            <li>Go to your Clerk Dashboard</li>
            <li>Navigate to Users</li>
            <li>Select a user</li>
            <li>Under "Public metadata", add:</li>
          </ol>
          <pre className="bg-blue-100 p-3 rounded mt-2 overflow-x-auto text-xs">
{`{
  "role": "hotel_owner",
  "permissions": {},
  "metadata": {
    "assignedBy": "admin_user_id",
    "assignedAt": "2025-12-29T00:00:00Z"
  }
}`}
          </pre>
          <p className="mt-2">Replace <code className="bg-blue-100 px-1 rounded">"hotel_owner"</code> with any role value from above.</p>
        </div>
      </div>
    </div>
  );
};

// Helper function to get role description
function getRoleDescription(role) {
  const descriptions = {
    'super_admin': 'Full access to all modules including system settings and user management.',
    'hotel_owner': 'Access to all operational modules except system settings.',
    'finance_manager': 'Full access to Accounts module, read-only access to Dashboard, Reservations, and Reports.',
    'kitchen_manager': 'Full access to Mawaid (kitchen) module, read-only access to Dashboard, Reservations, and Reports.',
    'transport_manager': 'Full access to Transport module, read-only access to Dashboard, Reservations, and Reports.',
    'accommodation_manager': 'Full access to Accommodation module, read-only access to Dashboard, Reservations, and Reports.',
    'hr_manager': 'Full access to HR module, read-only access to Dashboard, Reservations, and Reports.',
    'guest': 'Public site access only, can view rooms and make bookings.',
    'audit_access': 'Read-only access to all modules for auditing purposes.',
    'report_view_access': 'Read-only access to Reports module only.'
  };
  return descriptions[role] || 'No description available.';
}

export default UsersRoles;
