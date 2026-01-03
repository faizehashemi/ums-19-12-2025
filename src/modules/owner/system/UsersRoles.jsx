import { useState, useEffect } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { Users, Shield, Edit, Trash2, X, AlertCircle } from 'lucide-react';
import { ROLES, ROLE_PERMISSIONS, MODULE_KEYS } from '../../../config/rolePermissions';
import { canManageUsers } from '../../../utils/permissions';
import { supabase } from '../../../lib/supabase';

const buildPermissionsForRole = (role, currentPermissions = {}) => {
  const basePermissions = ROLE_PERMISSIONS[role] || {};
  const merged = {};

  Object.keys(basePermissions).forEach((moduleKey) => {
    merged[moduleKey] = {
      read: !!basePermissions[moduleKey]?.read,
      write: !!basePermissions[moduleKey]?.write,
    };
  });

  Object.entries(currentPermissions).forEach(([moduleKey, value]) => {
    if (moduleKey === 'routes') return;
    if (typeof value === 'boolean') {
      merged[moduleKey] = { read: value, write: value };
    } else if (value && typeof value === 'object') {
      merged[moduleKey] = {
        read: !!value.read,
        write: !!value.write,
      };
    }
  });

  return merged;
};

const UsersRoles = () => {
  const { profile: currentUserProfile } = useAuth();

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingUser, setEditingUser] = useState(null);
  const [editRole, setEditRole] = useState('');
  const [editPermissions, setEditPermissions] = useState({});
  const [saving, setSaving] = useState(false);

  const canManage = canManageUsers(currentUserProfile);
  const moduleOrder = Object.values(MODULE_KEYS);

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
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('user_profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      setUsers(data || []);
    } catch (err) {
      console.error('Error fetching users:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const deleteUser = async (userId) => {
    if (!confirm('Are you sure you want to delete this user? This will also delete their authentication account.')) return;

    try {
      // Delete from user_profiles (auth.users will cascade delete due to ON DELETE CASCADE)
      const { error: deleteError } = await supabase
        .from('user_profiles')
        .delete()
        .eq('id', userId);

      if (deleteError) throw deleteError;

      // Note: Deleting from auth.users requires admin API access
      // This only deletes the profile. For full user deletion, you need to use Supabase Admin API
      alert('User profile deleted. Note: To fully delete the authentication account, use Supabase Dashboard.');

      await fetchUsers();
    } catch (err) {
      console.error('Error deleting user:', err);
      alert('Failed to delete user: ' + err.message);
    }
  };

  const startEditing = (user) => {
    setEditingUser(user);
    setEditRole(user.role);
    setEditPermissions(buildPermissionsForRole(user.role, user.permissions));
  };

  const cancelEditing = () => {
    setEditingUser(null);
    setEditRole('');
    setEditPermissions({});
  };

  const togglePermission = (moduleKey, type) => {
    setEditPermissions((prev) => {
      const current = prev[moduleKey] || { read: false, write: false };
      const nextValue = !current[type];
      const next = {
        read: current.read,
        write: current.write,
      };

      if (type === 'read') {
        next.read = nextValue;
        if (!nextValue) {
          next.write = false;
        }
      }

      if (type === 'write') {
        next.write = nextValue;
        if (nextValue) {
          next.read = true;
        }
      }

      return {
        ...prev,
        [moduleKey]: next,
      };
    });
  };

  const saveEdit = async () => {
    if (!editingUser) return;
    try {
      setSaving(true);
      const otherPermissions = Object.fromEntries(
        Object.entries(editingUser.permissions || {}).filter(
          ([key]) => key !== 'routes' && !moduleOrder.includes(key)
        )
      );

      const routes = editingUser.permissions?.routes;
      const permissionsPayload = {
        ...editPermissions,
        ...otherPermissions,
        ...(routes ? { routes } : {}),
      };

      const { error: updateError } = await supabase
        .from('user_profiles')
        .update({
          role: editRole,
          permissions: permissionsPayload,
          updated_at: new Date().toISOString(),
        })
        .eq('id', editingUser.id);

      if (updateError) throw updateError;

      await fetchUsers();
      cancelEditing();
    } catch (err) {
      console.error('Error saving user updates:', err);
      alert('Failed to update user: ' + err.message);
    } finally {
      setSaving(false);
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

  if (error) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">Users & Roles</h1>
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-medium">Error Loading Users</p>
            <p className="text-sm">{error}</p>
            <button
              onClick={fetchUsers}
              className="mt-2 text-sm underline hover:no-underline"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold mb-2 flex items-center gap-2">
            <Users className="w-6 h-6" />
            Users & Roles
          </h1>
          <p className="text-gray-600">Manage user accounts and their roles</p>
        </div>
        <button
          onClick={fetchUsers}
          className="px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors"
        >
          Refresh
        </button>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                User
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Email
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Role
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Created
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {users.length === 0 ? (
              <tr>
                <td colSpan="5" className="px-6 py-8 text-center text-gray-500">
                  No users found
                </td>
              </tr>
            ) : (
              users.map((user) => (
                <tr key={user.id} className={user.id === currentUserProfile?.id ? 'bg-amber-50' : ''}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-amber-500 rounded-full flex items-center justify-center text-white font-semibold">
                        {user.full_name?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || 'U'}
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {user.full_name || 'No Name'}
                          {user.id === currentUserProfile?.id && (
                            <span className="ml-2 text-xs bg-amber-100 text-amber-800 px-2 py-0.5 rounded">You</span>
                          )}
                        </div>
                        <div className="text-sm text-gray-500">ID: {user.id.slice(0, 8)}...</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{user.email}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800 capitalize">
                      <Shield className="w-3 h-3 mr-1" />
                      {user.role.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(user.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => startEditing(user)}
                        className="text-amber-600 hover:text-amber-900 disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Edit role & permissions"
                        disabled={user.id === currentUserProfile?.id}
                      >
                        <Edit className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => deleteUser(user.id)}
                        className="text-red-600 hover:text-red-900 disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Delete user"
                        disabled={user.id === currentUserProfile?.id}
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-6 bg-blue-50 border border-blue-200 text-blue-800 px-4 py-3 rounded-lg">
        <p className="font-medium mb-2">Available Roles:</p>
        <ul className="text-sm space-y-1 ml-4">
          {Object.entries(ROLES).map(([key, value]) => (
            <li key={value} className="capitalize">
              <strong>{key.replace(/_/g, ' ')}</strong>: {value}
            </li>
          ))}
        </ul>
      </div>

      {editingUser && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-2xl max-w-4xl w-full">
            <div className="flex items-center justify-between border-b px-6 py-4">
              <div>
                <h3 className="text-xl font-semibold">Edit User</h3>
                <p className="text-sm text-gray-600">
                  Update role and permissions for {editingUser.full_name || editingUser.email}
                </p>
              </div>
              <button
                onClick={cancelEditing}
                className="text-gray-500 hover:text-gray-700"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
                <select
                  value={editRole}
                  onChange={(e) => {
                    const newRole = e.target.value;
                    setEditRole(newRole);
                    setEditPermissions(buildPermissionsForRole(newRole, editingUser.permissions));
                  }}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                >
                  {Object.entries(ROLES).map(([key, value]) => (
                    <option key={value} value={value}>
                      {key.replace(/_/g, ' ')}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-medium text-gray-700">Permissions</p>
                  <p className="text-xs text-gray-500">Write access automatically enables read</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {moduleOrder.map((moduleKey) => {
                    const perms = editPermissions[moduleKey] || { read: false, write: false };
                    return (
                      <div
                        key={moduleKey}
                        className="border border-gray-200 rounded-lg px-4 py-3 flex items-center justify-between"
                      >
                        <div className="capitalize font-medium text-gray-800">
                          {moduleKey.replace(/_/g, ' ')}
                        </div>
                        <div className="flex items-center gap-4 text-sm">
                          <label className="flex items-center gap-1">
                            <input
                              type="checkbox"
                              checked={perms.read}
                              onChange={() => togglePermission(moduleKey, 'read')}
                              className="rounded border-gray-300 text-amber-600 focus:ring-amber-500"
                            />
                            Read
                          </label>
                          <label className="flex items-center gap-1">
                            <input
                              type="checkbox"
                              checked={perms.write}
                              onChange={() => togglePermission(moduleKey, 'write')}
                              className="rounded border-gray-300 text-amber-600 focus:ring-amber-500"
                            />
                            Write
                          </label>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  onClick={cancelEditing}
                  className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                  disabled={saving}
                >
                  Cancel
                </button>
                <button
                  onClick={saveEdit}
                  className="px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 disabled:opacity-50"
                  disabled={saving}
                >
                  {saving ? 'Saving...' : 'Save changes'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UsersRoles;
