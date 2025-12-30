/*
SQL:
CREATE TABLE hr_shifts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  break_minutes INT DEFAULT 0,
  max_hours DECIMAL(4,2),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE hr_roster (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  work_date DATE NOT NULL,
  staff_id UUID REFERENCES hr_staff(id) ON DELETE CASCADE,
  shift_id UUID REFERENCES hr_shifts(id),
  site TEXT,
  assignment_type TEXT DEFAULT 'shift',
  task_label TEXT,
  status TEXT DEFAULT 'planned',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_hr_roster_work_date ON hr_roster(work_date);
CREATE INDEX idx_hr_roster_staff_id ON hr_roster(staff_id);
CREATE INDEX idx_hr_roster_site ON hr_roster(site);
CREATE INDEX idx_hr_roster_status ON hr_roster(status);
*/

import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabaseClient';

const Scheduling = () => {
  const [rosters, setRosters] = useState([]);
  const [shifts, setShifts] = useState([]);
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [filters, setFilters] = useState({
    site: '',
    shift: '',
    department: '',
    role: '',
    status: ''
  });
  const [showForm, setShowForm] = useState(false);
  const [selectedRoster, setSelectedRoster] = useState(null);
  const [formData, setFormData] = useState({
    work_date: new Date().toISOString().split('T')[0],
    staff_id: '',
    shift_id: '',
    site: '',
    assignment_type: 'shift',
    task_label: '',
    status: 'planned',
    notes: ''
  });
  const [formErrors, setFormErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [todayCounts, setTodayCounts] = useState({
    total: 0,
    onLeave: 0
  });

  const sites = ['Makkah', 'Madinah', 'Riyadh', 'Jeddah'];
  const departments = ['Front Desk', 'Housekeeping', 'Kitchen', 'Maintenance', 'Admin', 'Security'];
  const roles = ['Manager', 'Supervisor', 'Staff', 'Technician', 'Chef', 'Cleaner', 'Receptionist'];
  const assignmentTypes = ['shift', 'task', 'on_call'];
  const statuses = ['planned', 'confirmed', 'completed', 'cancelled'];

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    fetchRosters();
  }, [selectedDate, filters]);

  const fetchInitialData = async () => {
    try {
      const [shiftsRes, staffRes] = await Promise.all([
        supabase.from('hr_shifts').select('*').order('start_time'),
        supabase.from('hr_staff').select('*').eq('status', 'active').order('full_name')
      ]);

      if (shiftsRes.data) setShifts(shiftsRes.data);
      if (staffRes.data) setStaff(staffRes.data);
    } catch (err) {
      console.error('Initial data fetch error:', err);
    }
  };

  const fetchRosters = async () => {
    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from('hr_roster')
        .select(`
          *,
          hr_staff(id, staff_code, full_name, role, department, site),
          hr_shifts(id, name, start_time, end_time)
        `)
        .eq('work_date', selectedDate)
        .order('created_at', { ascending: false });

      if (filters.site) query = query.eq('site', filters.site);
      if (filters.shift) query = query.eq('shift_id', filters.shift);
      if (filters.status) query = query.eq('status', filters.status);

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;

      let filteredData = data || [];

      if (filters.department) {
        filteredData = filteredData.filter(r => r.hr_staff?.department === filters.department);
      }
      if (filters.role) {
        filteredData = filteredData.filter(r => r.hr_staff?.role === filters.role);
      }

      setRosters(filteredData);

      // Calculate today counts
      const { data: leaveData } = await supabase
        .from('hr_leave_requests')
        .select('*')
        .eq('status', 'approved')
        .lte('start_date', selectedDate)
        .gte('end_date', selectedDate);

      setTodayCounts({
        total: filteredData.length,
        onLeave: leaveData?.length || 0
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const openForm = (roster = null) => {
    if (roster) {
      setFormData({
        work_date: roster.work_date,
        staff_id: roster.staff_id,
        shift_id: roster.shift_id || '',
        site: roster.site || '',
        assignment_type: roster.assignment_type,
        task_label: roster.task_label || '',
        status: roster.status,
        notes: roster.notes || ''
      });
      setSelectedRoster(roster);
    } else {
      setFormData({
        work_date: selectedDate,
        staff_id: '',
        shift_id: '',
        site: '',
        assignment_type: 'shift',
        task_label: '',
        status: 'planned',
        notes: ''
      });
      setSelectedRoster(null);
    }
    setFormErrors({});
    setShowForm(true);
  };

  const validateForm = async () => {
    const errors = {};

    if (!formData.work_date) errors.work_date = 'Date is required';
    if (!formData.staff_id) errors.staff_id = 'Staff is required';
    if (formData.assignment_type === 'shift' && !formData.shift_id) {
      errors.shift_id = 'Shift is required for shift assignment';
    }

    if (formData.staff_id && formData.work_date) {
      // Check for approved leave
      const { data: leaveData } = await supabase
        .from('hr_leave_requests')
        .select('*, hr_leave_types(name)')
        .eq('staff_id', formData.staff_id)
        .eq('status', 'approved')
        .lte('start_date', formData.work_date)
        .gte('end_date', formData.work_date);

      if (leaveData && leaveData.length > 0) {
        const leave = leaveData[0];
        errors.staff_id = `Staff has approved ${leave.hr_leave_types?.name || 'leave'} from ${leave.start_date} to ${leave.end_date}`;
      }

      // Check for existing roster on same date
      let query = supabase
        .from('hr_roster')
        .select('id')
        .eq('staff_id', formData.staff_id)
        .eq('work_date', formData.work_date);

      if (selectedRoster) {
        query = query.neq('id', selectedRoster.id);
      }

      const { data: existingRoster } = await query;

      if (existingRoster && existingRoster.length > 0) {
        errors.staff_id = 'Staff already assigned on this date';
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

      const selectedStaff = staff.find(s => s.id === formData.staff_id);
      const payload = {
        ...formData,
        site: formData.site || selectedStaff?.site || ''
      };

      if (selectedRoster) {
        const { error: updateError } = await supabase
          .from('hr_roster')
          .update(payload)
          .eq('id', selectedRoster.id);

        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await supabase
          .from('hr_roster')
          .insert([payload]);

        if (insertError) throw insertError;
      }

      setShowForm(false);
      fetchRosters();
      alert(selectedRoster ? 'Roster updated successfully' : 'Roster created successfully');
    } catch (err) {
      alert('Error: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this roster entry?')) return;

    try {
      const { error } = await supabase
        .from('hr_roster')
        .delete()
        .eq('id', id);

      if (error) throw error;
      fetchRosters();
      alert('Roster deleted successfully');
    } catch (err) {
      alert('Error: ' + err.message);
    }
  };

  const copyYesterdayRoster = async () => {
    if (!confirm('Copy yesterday\'s roster to today? This will create planned entries.')) return;

    try {
      const yesterday = new Date(selectedDate);
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];

      const { data: yesterdayRoster } = await supabase
        .from('hr_roster')
        .select('*')
        .eq('work_date', yesterdayStr);

      if (!yesterdayRoster || yesterdayRoster.length === 0) {
        alert('No roster entries found for yesterday');
        return;
      }

      const newEntries = yesterdayRoster.map(r => ({
        work_date: selectedDate,
        staff_id: r.staff_id,
        shift_id: r.shift_id,
        site: r.site,
        assignment_type: r.assignment_type,
        task_label: r.task_label,
        status: 'planned',
        notes: 'Copied from ' + yesterdayStr
      }));

      const { error } = await supabase
        .from('hr_roster')
        .insert(newEntries);

      if (error) throw error;

      fetchRosters();
      alert(`Copied ${newEntries.length} entries from yesterday`);
    } catch (err) {
      alert('Error: ' + err.message);
    }
  };

  const groupedByShift = rosters.reduce((acc, r) => {
    const shiftName = r.hr_shifts?.name || 'No Shift';
    if (!acc[shiftName]) acc[shiftName] = [];
    acc[shiftName].push(r);
    return acc;
  }, {});

  const groupedBySite = rosters.reduce((acc, r) => {
    const site = r.site || 'No Site';
    if (!acc[site]) acc[site] = [];
    acc[site].push(r);
    return acc;
  }, {});

  if (loading && rosters.length === 0) {
    return (
      <div className="p-6">
        <div className="text-center py-12">Loading scheduling...</div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 pb-20">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <h1 className="text-2xl font-bold mb-4 md:mb-0">Staff Scheduling</h1>
        <div className="flex gap-2">
          <button
            onClick={copyYesterdayRoster}
            className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 text-sm"
          >
            Copy Yesterday
          </button>
          <button
            onClick={() => openForm()}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            + Assign
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="text-sm text-gray-600">Total Scheduled</div>
          <div className="text-2xl font-bold">{todayCounts.total}</div>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="text-sm text-gray-600">Staff on Leave</div>
          <div className="text-2xl font-bold text-yellow-600">{todayCounts.onLeave}</div>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="text-sm text-gray-600">Available Staff</div>
          <div className="text-2xl font-bold text-green-600">
            {staff.length - todayCounts.total - todayCounts.onLeave}
          </div>
        </div>
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">Select Date</label>
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
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
          value={filters.shift}
          onChange={(e) => setFilters({ ...filters, shift: e.target.value })}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
        >
          <option value="">All Shifts</option>
          {shifts.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
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
      </div>

      {rosters.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          No roster entries for this date
        </div>
      ) : (
        <div className="space-y-6">
          {Object.keys(groupedBySite).map(site => (
            <div key={site} className="bg-white border border-gray-200 rounded-lg p-4">
              <h3 className="font-semibold text-lg mb-4">{site}</h3>
              <div className="space-y-4">
                {Object.keys(groupedByShift)
                  .filter(shift => groupedBySite[site].some(r => (r.hr_shifts?.name || 'No Shift') === shift))
                  .map(shift => {
                    const shiftRosters = groupedBySite[site].filter(
                      r => (r.hr_shifts?.name || 'No Shift') === shift
                    );
                    const shiftInfo = shifts.find(s => s.name === shift);

                    return (
                      <div key={shift} className="border-l-4 border-blue-500 pl-4">
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <div className="font-medium">{shift}</div>
                            {shiftInfo && (
                              <div className="text-sm text-gray-600">
                                {shiftInfo.start_time} - {shiftInfo.end_time}
                              </div>
                            )}
                          </div>
                          <span className="text-sm text-gray-600">
                            {shiftRosters.length} assigned
                          </span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                          {shiftRosters.map(r => (
                            <div
                              key={r.id}
                              className="bg-gray-50 border border-gray-200 rounded-lg p-3"
                            >
                              <div className="flex items-start justify-between mb-2">
                                <div>
                                  <div className="font-medium text-sm">
                                    {r.hr_staff?.full_name}
                                  </div>
                                  <div className="text-xs text-gray-600">
                                    {r.hr_staff?.staff_code}
                                  </div>
                                </div>
                                <span className={`px-2 py-1 text-xs rounded ${
                                  r.status === 'confirmed' ? 'bg-green-100 text-green-700' :
                                  r.status === 'completed' ? 'bg-blue-100 text-blue-700' :
                                  r.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                                  'bg-gray-100 text-gray-700'
                                }`}>
                                  {r.status}
                                </span>
                              </div>
                              <div className="text-xs text-gray-600 mb-2">
                                <div>{r.hr_staff?.role} - {r.hr_staff?.department}</div>
                                {r.task_label && <div>Task: {r.task_label}</div>}
                                {r.assignment_type !== 'shift' && (
                                  <div className="mt-1">
                                    <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded">
                                      {r.assignment_type}
                                    </span>
                                  </div>
                                )}
                              </div>
                              <div className="flex gap-2">
                                <button
                                  onClick={() => openForm(r)}
                                  className="text-xs text-blue-600 hover:underline"
                                >
                                  Edit
                                </button>
                                <button
                                  onClick={() => handleDelete(r.id)}
                                  className="text-xs text-red-600 hover:underline"
                                >
                                  Delete
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Form Drawer */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end md:items-center md:justify-center">
          <div className="bg-white w-full md:w-2/3 lg:w-1/2 md:rounded-lg md:max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold">
                {selectedRoster ? 'Edit Assignment' : 'New Assignment'}
              </h2>
              <button onClick={() => setShowForm(false)} className="text-gray-500 hover:text-gray-700">
                ✕
              </button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Work Date *</label>
                <input
                  type="date"
                  value={formData.work_date}
                  onChange={(e) => setFormData({ ...formData, work_date: e.target.value })}
                  className={`w-full px-3 py-2 border rounded-lg ${formErrors.work_date ? 'border-red-500' : 'border-gray-300'}`}
                />
                {formErrors.work_date && <p className="text-red-500 text-sm mt-1">{formErrors.work_date}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Staff *</label>
                <select
                  value={formData.staff_id}
                  onChange={(e) => setFormData({ ...formData, staff_id: e.target.value })}
                  className={`w-full px-3 py-2 border rounded-lg ${formErrors.staff_id ? 'border-red-500' : 'border-gray-300'}`}
                >
                  <option value="">Select Staff</option>
                  {staff.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.full_name} ({s.staff_code}) - {s.role}
                    </option>
                  ))}
                </select>
                {formErrors.staff_id && <p className="text-red-500 text-sm mt-1">{formErrors.staff_id}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Assignment Type</label>
                <select
                  value={formData.assignment_type}
                  onChange={(e) => setFormData({ ...formData, assignment_type: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                >
                  {assignmentTypes.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>

              {formData.assignment_type === 'shift' && (
                <div>
                  <label className="block text-sm font-medium mb-1">Shift *</label>
                  <select
                    value={formData.shift_id}
                    onChange={(e) => setFormData({ ...formData, shift_id: e.target.value })}
                    className={`w-full px-3 py-2 border rounded-lg ${formErrors.shift_id ? 'border-red-500' : 'border-gray-300'}`}
                  >
                    <option value="">Select Shift</option>
                    {shifts.map(s => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.start_time} - {s.end_time})
                      </option>
                    ))}
                  </select>
                  {formErrors.shift_id && <p className="text-red-500 text-sm mt-1">{formErrors.shift_id}</p>}
                </div>
              )}

              {formData.assignment_type === 'task' && (
                <div>
                  <label className="block text-sm font-medium mb-1">Task Label</label>
                  <input
                    type="text"
                    value={formData.task_label}
                    onChange={(e) => setFormData({ ...formData, task_label: e.target.value })}
                    placeholder="e.g., Kitchen Prep A"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium mb-1">Site</label>
                <select
                  value={formData.site}
                  onChange={(e) => setFormData({ ...formData, site: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="">Select Site (defaults to staff site)</option>
                  {sites.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

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
                <label className="block text-sm font-medium mb-1">Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={2}
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
    </div>
  );
};

export default Scheduling;
