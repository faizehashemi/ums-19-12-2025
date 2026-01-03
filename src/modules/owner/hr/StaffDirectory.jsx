/*
SQL:
CREATE TABLE hr_staff (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_code TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  role TEXT,
  department TEXT,
  site TEXT,
  employment_type TEXT,
  vendor_name TEXT,
  status TEXT DEFAULT 'active',
  join_date DATE,
  manager_id UUID REFERENCES hr_staff(id),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_hr_staff_site ON hr_staff(site);
CREATE INDEX idx_hr_staff_status ON hr_staff(status);
CREATE INDEX idx_hr_staff_department ON hr_staff(department);
CREATE INDEX idx_hr_staff_role ON hr_staff(role);
CREATE INDEX idx_hr_staff_phone ON hr_staff(phone);
*/

import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';

const StaffDirectory = () => {
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({
    site: '',
    department: '',
    role: '',
    status: '',
    employment_type: ''
  });
  const [showForm, setShowForm] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [formData, setFormData] = useState({
    staff_code: '',
    full_name: '',
    phone: '',
    email: '',
    role: '',
    department: '',
    site: '',
    employment_type: 'company',
    vendor_name: '',
    status: 'active',
    join_date: '',
    manager_id: null,
    notes: ''
  });
  const [formErrors, setFormErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [showProfileDrawer, setShowProfileDrawer] = useState(false);
  const [profileData, setProfileData] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(false);

  const sites = ['Makkah', 'Madinah', 'Riyadh', 'Jeddah'];
  const departments = ['Front Desk', 'Housekeeping', 'Kitchen', 'Maintenance', 'Admin', 'Security'];
  const roles = ['Manager', 'Supervisor', 'Staff', 'Technician', 'Chef', 'Cleaner', 'Receptionist'];
  const employmentTypes = ['company', 'contractor'];
  const statuses = ['active', 'inactive', 'terminated'];

  useEffect(() => {
    fetchStaff();
  }, [filters]);

  const fetchStaff = async () => {
    try {
      setLoading(true);
      setError(null);
      let query = supabase
        .from('hr_staff')
        .select('*')
        .order('created_at', { ascending: false });

      if (filters.site) query = query.eq('site', filters.site);
      if (filters.department) query = query.eq('department', filters.department);
      if (filters.role) query = query.eq('role', filters.role);
      if (filters.status) query = query.eq('status', filters.status);
      if (filters.employment_type) query = query.eq('employment_type', filters.employment_type);

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;
      setStaff(data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchStaffProfile = async (staffId) => {
    try {
      setLoadingProfile(true);

      const [staffRes, rosterRes, leaveRes, trainingRes] = await Promise.all([
        supabase.from('hr_staff').select('*').eq('id', staffId).single(),
        supabase
          .from('hr_roster')
          .select('*, hr_shifts(*)')
          .eq('staff_id', staffId)
          .gte('work_date', new Date().toISOString().split('T')[0])
          .order('work_date', { ascending: true })
          .limit(5),
        supabase
          .from('hr_leave_requests')
          .select('*, hr_leave_types(name)')
          .eq('staff_id', staffId)
          .eq('status', 'approved')
          .gte('end_date', new Date().toISOString().split('T')[0])
          .order('start_date', { ascending: true }),
        supabase
          .from('hr_training_enrollments')
          .select(`
            *,
            hr_training_sessions(
              *,
              hr_training_courses(*)
            )
          `)
          .eq('staff_id', staffId)
          .order('created_at', { ascending: false })
      ]);

      if (staffRes.error) throw staffRes.error;

      const staffData = staffRes.data;
      const upcomingShifts = rosterRes.data || [];
      const activeLeaves = leaveRes.data || [];
      const enrollments = trainingRes.data || [];

      // Get mandatory courses for this staff role
      const { data: mandatoryCourses } = await supabase
        .from('hr_training_courses')
        .select('*');

      const mandatory = (mandatoryCourses || []).filter(course => {
        try {
          const roles = JSON.parse(course.mandatory_for_roles_json || '[]');
          return roles.includes(staffData.role);
        } catch {
          return false;
        }
      });

      const completedCourseIds = enrollments
        .filter(e => e.completion_status === 'passed' && (!e.expiry_at || new Date(e.expiry_at) > new Date()))
        .map(e => e.hr_training_sessions?.course_id)
        .filter(Boolean);

      const missingMandatory = mandatory.filter(c => !completedCourseIds.includes(c.id));
      const expiredTraining = enrollments.filter(e =>
        e.expiry_at && new Date(e.expiry_at) < new Date()
      );

      setProfileData({
        staff: staffData,
        upcomingShifts,
        activeLeaves,
        trainingCompliance: {
          missingMandatory,
          expiredTraining,
          totalMandatory: mandatory.length,
          completed: completedCourseIds.length
        }
      });
    } catch (err) {
      console.error('Profile fetch error:', err);
    } finally {
      setLoadingProfile(false);
    }
  };

  const openProfile = (staff) => {
    setSelectedStaff(staff);
    setShowProfileDrawer(true);
    fetchStaffProfile(staff.id);
  };

  const openForm = (staff = null) => {
    if (staff) {
      setFormData(staff);
      setSelectedStaff(staff);
    } else {
      setFormData({
        staff_code: '',
        full_name: '',
        phone: '',
        email: '',
        role: '',
        department: '',
        site: '',
        employment_type: 'company',
        vendor_name: '',
        status: 'active',
        join_date: '',
        manager_id: null,
        notes: ''
      });
      setSelectedStaff(null);
    }
    setFormErrors({});
    setShowForm(true);
  };

  const validateForm = async () => {
    const errors = {};

    if (!formData.staff_code?.trim()) errors.staff_code = 'Staff code is required';
    if (!formData.full_name?.trim()) errors.full_name = 'Full name is required';

    // Check unique staff_code
    if (formData.staff_code) {
      let query = supabase
        .from('hr_staff')
        .select('id')
        .eq('staff_code', formData.staff_code);

      if (selectedStaff) {
        query = query.neq('id', selectedStaff.id);
      }

      const { data } = await query;
      if (data && data.length > 0) {
        errors.staff_code = 'Staff code already exists';
      }
    }

    // Check unique phone
    if (formData.phone) {
      let query = supabase
        .from('hr_staff')
        .select('id')
        .eq('phone', formData.phone);

      if (selectedStaff) {
        query = query.neq('id', selectedStaff.id);
      }

      const { data } = await query;
      if (data && data.length > 0) {
        errors.phone = 'Phone number already exists';
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSave = async (e) => {
    e.preventDefault();

    if (!(await validateForm())) return;

    try {
      setSaving(true);
      const payload = {
        ...formData,
        updated_at: new Date().toISOString()
      };

      if (selectedStaff) {
        const { error: updateError } = await supabase
          .from('hr_staff')
          .update(payload)
          .eq('id', selectedStaff.id);

        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await supabase
          .from('hr_staff')
          .insert([payload]);

        if (insertError) throw insertError;
      }

      setShowForm(false);
      fetchStaff();
      alert(selectedStaff ? 'Staff updated successfully' : 'Staff created successfully');
    } catch (err) {
      alert('Error: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this staff member?')) return;

    try {
      const { error } = await supabase
        .from('hr_staff')
        .delete()
        .eq('id', id);

      if (error) throw error;
      fetchStaff();
      alert('Staff deleted successfully');
    } catch (err) {
      alert('Error: ' + err.message);
    }
  };

  const filteredStaff = staff.filter(s => {
    const searchLower = search.toLowerCase();
    return (
      s.full_name?.toLowerCase().includes(searchLower) ||
      s.staff_code?.toLowerCase().includes(searchLower) ||
      s.phone?.toLowerCase().includes(searchLower) ||
      s.email?.toLowerCase().includes(searchLower)
    );
  });

  const hasLeaveToday = (staffMember) => {
    // This would need to be checked from leave data, simplified here
    return false;
  };

  const hasMissingTraining = (staffMember) => {
    // This would need to be checked from training data, simplified here
    return false;
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-center py-12">Loading staff directory...</div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 pb-20">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <h1 className="text-2xl font-bold mb-4 md:mb-0">Staff Directory</h1>
        <button
          onClick={() => openForm()}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          + Add Staff
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
          {error}
        </div>
      )}

      <div className="mb-4">
        <input
          type="text"
          placeholder="Search by name, code, phone, email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
        <select
          value={filters.site}
          onChange={(e) => setFilters({ ...filters, site: e.target.value })}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
        >
          <option value="">All Sites</option>
          {sites.map(s => <option key={s} value={s}>{s}</option>)}
        </select>

        <select
          value={filters.department}
          onChange={(e) => setFilters({ ...filters, department: e.target.value })}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
        >
          <option value="">All Departments</option>
          {departments.map(d => <option key={d} value={d}>{d}</option>)}
        </select>

        <select
          value={filters.role}
          onChange={(e) => setFilters({ ...filters, role: e.target.value })}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
        >
          <option value="">All Roles</option>
          {roles.map(r => <option key={r} value={r}>{r}</option>)}
        </select>

        <select
          value={filters.status}
          onChange={(e) => setFilters({ ...filters, status: e.target.value })}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
        >
          <option value="">All Status</option>
          {statuses.map(s => <option key={s} value={s}>{s}</option>)}
        </select>

        <select
          value={filters.employment_type}
          onChange={(e) => setFilters({ ...filters, employment_type: e.target.value })}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
        >
          <option value="">All Types</option>
          {employmentTypes.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>

      {filteredStaff.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          No staff members found
        </div>
      ) : (
        <>
          {/* Mobile: Cards */}
          <div className="block md:hidden space-y-3">
            {filteredStaff.map(s => (
              <div
                key={s.id}
                className="bg-white border border-gray-200 rounded-lg p-4 cursor-pointer hover:shadow-md transition"
                onClick={() => openProfile(s)}
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <div className="font-semibold">{s.full_name}</div>
                    <div className="text-sm text-gray-600">{s.staff_code}</div>
                  </div>
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    s.status === 'active' ? 'bg-green-100 text-green-700' :
                    s.status === 'inactive' ? 'bg-gray-100 text-gray-700' :
                    'bg-red-100 text-red-700'
                  }`}>
                    {s.status}
                  </span>
                </div>
                <div className="text-sm text-gray-600 space-y-1">
                  <div>{s.role} - {s.department}</div>
                  <div>{s.site}</div>
                  <div className="flex gap-2 mt-2">
                    {hasLeaveToday(s) && (
                      <span className="px-2 py-1 text-xs bg-yellow-100 text-yellow-700 rounded">
                        Leave Today
                      </span>
                    )}
                    {hasMissingTraining(s) && (
                      <span className="px-2 py-1 text-xs bg-orange-100 text-orange-700 rounded">
                        Training Due
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      openForm(s);
                    }}
                    className="text-sm text-blue-600 hover:underline"
                  >
                    Edit
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(s.id);
                    }}
                    className="text-sm text-red-600 hover:underline"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop: Table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full bg-white border border-gray-200 rounded-lg">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Code</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Name</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Role</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Department</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Site</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Type</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Status</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Badges</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredStaff.map(s => (
                  <tr key={s.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => openProfile(s)}>
                    <td className="px-4 py-3 text-sm">{s.staff_code}</td>
                    <td className="px-4 py-3 text-sm font-medium">{s.full_name}</td>
                    <td className="px-4 py-3 text-sm">{s.role}</td>
                    <td className="px-4 py-3 text-sm">{s.department}</td>
                    <td className="px-4 py-3 text-sm">{s.site}</td>
                    <td className="px-4 py-3 text-sm">{s.employment_type}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        s.status === 'active' ? 'bg-green-100 text-green-700' :
                        s.status === 'inactive' ? 'bg-gray-100 text-gray-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {s.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <div className="flex gap-1">
                        {hasLeaveToday(s) && (
                          <span className="px-2 py-1 text-xs bg-yellow-100 text-yellow-700 rounded">Leave</span>
                        )}
                        {hasMissingTraining(s) && (
                          <span className="px-2 py-1 text-xs bg-orange-100 text-orange-700 rounded">Training</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <div className="flex gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            openForm(s);
                          }}
                          className="text-blue-600 hover:underline"
                        >
                          Edit
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(s.id);
                          }}
                          className="text-red-600 hover:underline"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Form Drawer */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end md:items-center md:justify-center">
          <div className="bg-white w-full md:w-2/3 lg:w-1/2 md:rounded-lg md:max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold">
                {selectedStaff ? 'Edit Staff' : 'Add Staff'}
              </h2>
              <button onClick={() => setShowForm(false)} className="text-gray-500 hover:text-gray-700">
                ✕
              </button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Staff Code *</label>
                <input
                  type="text"
                  value={formData.staff_code}
                  onChange={(e) => setFormData({ ...formData, staff_code: e.target.value })}
                  className={`w-full px-3 py-2 border rounded-lg ${formErrors.staff_code ? 'border-red-500' : 'border-gray-300'}`}
                />
                {formErrors.staff_code && <p className="text-red-500 text-sm mt-1">{formErrors.staff_code}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Full Name *</label>
                <input
                  type="text"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  className={`w-full px-3 py-2 border rounded-lg ${formErrors.full_name ? 'border-red-500' : 'border-gray-300'}`}
                />
                {formErrors.full_name && <p className="text-red-500 text-sm mt-1">{formErrors.full_name}</p>}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Phone</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className={`w-full px-3 py-2 border rounded-lg ${formErrors.phone ? 'border-red-500' : 'border-gray-300'}`}
                  />
                  {formErrors.phone && <p className="text-red-500 text-sm mt-1">{formErrors.phone}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Role</label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="">Select Role</option>
                    {roles.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Department</label>
                  <select
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="">Select Department</option>
                    {departments.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Site</label>
                  <select
                    value={formData.site}
                    onChange={(e) => setFormData({ ...formData, site: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="">Select Site</option>
                    {sites.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Employment Type</label>
                  <select
                    value={formData.employment_type}
                    onChange={(e) => setFormData({ ...formData, employment_type: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  >
                    {employmentTypes.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>

              {formData.employment_type === 'contractor' && (
                <div>
                  <label className="block text-sm font-medium mb-1">Vendor Name</label>
                  <input
                    type="text"
                    value={formData.vendor_name}
                    onChange={(e) => setFormData({ ...formData, vendor_name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  >
                    {statuses.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Join Date</label>
                  <input
                    type="date"
                    value={formData.join_date}
                    onChange={(e) => setFormData({ ...formData, join_date: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>

              <div className="sticky bottom-0 bg-white pt-4 border-t border-gray-200 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Profile Drawer */}
      {showProfileDrawer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end md:items-center md:justify-center">
          <div className="bg-white w-full md:w-2/3 lg:w-1/2 md:rounded-lg md:max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold">Staff Profile</h2>
              <button onClick={() => setShowProfileDrawer(false)} className="text-gray-500 hover:text-gray-700">
                ✕
              </button>
            </div>
            <div className="p-6">
              {loadingProfile ? (
                <div className="text-center py-12">Loading profile...</div>
              ) : profileData ? (
                <div className="space-y-6">
                  <div>
                    <h3 className="font-semibold text-lg mb-2">{profileData.staff.full_name}</h3>
                    <div className="text-sm text-gray-600 space-y-1">
                      <div>Code: {profileData.staff.staff_code}</div>
                      <div>Role: {profileData.staff.role}</div>
                      <div>Department: {profileData.staff.department}</div>
                      <div>Site: {profileData.staff.site}</div>
                      <div>Type: {profileData.staff.employment_type}</div>
                      {profileData.staff.phone && <div>Phone: {profileData.staff.phone}</div>}
                      {profileData.staff.email && <div>Email: {profileData.staff.email}</div>}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2">Upcoming Shifts</h4>
                    {profileData.upcomingShifts.length === 0 ? (
                      <p className="text-sm text-gray-500">No upcoming shifts scheduled</p>
                    ) : (
                      <div className="space-y-2">
                        {profileData.upcomingShifts.map(r => (
                          <div key={r.id} className="text-sm bg-gray-50 p-3 rounded-lg">
                            <div className="font-medium">{r.work_date}</div>
                            <div className="text-gray-600">
                              {r.hr_shifts?.name} ({r.hr_shifts?.start_time} - {r.hr_shifts?.end_time})
                            </div>
                            {r.task_label && <div className="text-gray-600">Task: {r.task_label}</div>}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2">Active Leaves</h4>
                    {profileData.activeLeaves.length === 0 ? (
                      <p className="text-sm text-gray-500">No active leaves</p>
                    ) : (
                      <div className="space-y-2">
                        {profileData.activeLeaves.map(l => (
                          <div key={l.id} className="text-sm bg-yellow-50 p-3 rounded-lg">
                            <div className="font-medium">{l.hr_leave_types?.name}</div>
                            <div className="text-gray-600">
                              {l.start_date} to {l.end_date} ({l.days_count} days)
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2">Training Compliance</h4>
                    <div className="space-y-2">
                      <div className="text-sm">
                        <span className="font-medium">Mandatory Courses: </span>
                        {profileData.trainingCompliance.totalMandatory}
                      </div>
                      {profileData.trainingCompliance.missingMandatory.length > 0 && (
                        <div className="bg-orange-50 p-3 rounded-lg">
                          <div className="text-sm font-medium text-orange-700 mb-1">
                            Missing Mandatory Training
                          </div>
                          {profileData.trainingCompliance.missingMandatory.map(c => (
                            <div key={c.id} className="text-sm text-gray-700">{c.title}</div>
                          ))}
                        </div>
                      )}
                      {profileData.trainingCompliance.expiredTraining.length > 0 && (
                        <div className="bg-red-50 p-3 rounded-lg">
                          <div className="text-sm font-medium text-red-700 mb-1">
                            Expired Training
                          </div>
                          {profileData.trainingCompliance.expiredTraining.map(e => (
                            <div key={e.id} className="text-sm text-gray-700">
                              {e.hr_training_sessions?.hr_training_courses?.title} - Expired: {e.expiry_at}
                            </div>
                          ))}
                        </div>
                      )}
                      {profileData.trainingCompliance.missingMandatory.length === 0 &&
                       profileData.trainingCompliance.expiredTraining.length === 0 && (
                        <div className="text-sm text-green-600">All compliance requirements met</div>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">No profile data</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StaffDirectory;
