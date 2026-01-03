/*
SQL:
CREATE TABLE hr_leave_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  paid BOOLEAN DEFAULT true,
  max_days_per_year INT,
  requires_attachment BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE hr_leave_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id UUID REFERENCES hr_staff(id) ON DELETE CASCADE,
  leave_type_id UUID REFERENCES hr_leave_types(id),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  days_count INT NOT NULL,
  reason TEXT,
  attachment_url TEXT,
  status TEXT DEFAULT 'draft',
  approved_by UUID REFERENCES hr_staff(id),
  approved_at TIMESTAMPTZ,
  rejected_by UUID REFERENCES hr_staff(id),
  rejected_at TIMESTAMPTZ,
  rejection_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_hr_leave_requests_staff_id ON hr_leave_requests(staff_id);
CREATE INDEX idx_hr_leave_requests_status ON hr_leave_requests(status);
CREATE INDEX idx_hr_leave_requests_dates ON hr_leave_requests(start_date, end_date);
*/

import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';

const LeaveManagement = () => {
  const [leaves, setLeaves] = useState([]);
  const [leaveTypes, setLeaveTypes] = useState([]);
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [view, setView] = useState('list'); // 'list' | 'calendar' | 'pending'
  const [filters, setFilters] = useState({
    status: '',
    leave_type: '',
    staff: ''
  });
  const [showForm, setShowForm] = useState(false);
  const [selectedLeave, setSelectedLeave] = useState(null);
  const [formData, setFormData] = useState({
    staff_id: '',
    leave_type_id: '',
    start_date: '',
    end_date: '',
    days_count: 0,
    reason: '',
    attachment_url: '',
    status: 'draft'
  });
  const [formErrors, setFormErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [approvalLeave, setApprovalLeave] = useState(null);
  const [approvalAction, setApprovalAction] = useState('approve'); // 'approve' | 'reject'
  const [rejectionReason, setRejectionReason] = useState('');
  const [counts, setCounts] = useState({
    pending: 0,
    approved: 0,
    today: 0
  });

  const statuses = ['draft', 'submitted', 'approved', 'rejected', 'cancelled'];

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    fetchLeaves();
  }, [filters, view]);

  const fetchInitialData = async () => {
    try {
      const [leaveTypesRes, staffRes] = await Promise.all([
        supabase.from('hr_leave_types').select('*').order('name'),
        supabase.from('hr_staff').select('*').eq('status', 'active').order('full_name')
      ]);

      if (leaveTypesRes.data) setLeaveTypes(leaveTypesRes.data);
      if (staffRes.data) setStaff(staffRes.data);
    } catch (err) {
      console.error('Initial data fetch error:', err);
    }
  };

  const fetchLeaves = async () => {
    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from('hr_leave_requests')
        .select(`
          *,
          hr_staff!hr_leave_requests_staff_id_fkey(id, staff_code, full_name, department, role),
          hr_leave_types(id, name, paid),
          approved_by_staff:hr_staff!hr_leave_requests_approved_by_fkey(full_name),
          rejected_by_staff:hr_staff!hr_leave_requests_rejected_by_fkey(full_name)
        `)
        .order('created_at', { ascending: false });

      if (filters.status) query = query.eq('status', filters.status);
      if (filters.leave_type) query = query.eq('leave_type_id', filters.leave_type);
      if (filters.staff) query = query.eq('staff_id', filters.staff);

      if (view === 'pending') {
        query = query.eq('status', 'submitted');
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;
      setLeaves(data || []);

      // Calculate counts
      const today = new Date().toISOString().split('T')[0];
      const { data: allLeaves } = await supabase
        .from('hr_leave_requests')
        .select('*');

      const pending = allLeaves?.filter(l => l.status === 'submitted').length || 0;
      const approved = allLeaves?.filter(l => l.status === 'approved').length || 0;
      const todayLeaves = allLeaves?.filter(l =>
        l.status === 'approved' &&
        l.start_date <= today &&
        l.end_date >= today
      ).length || 0;

      setCounts({ pending, approved, today: todayLeaves });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const openForm = (leave = null) => {
    if (leave) {
      setFormData({
        staff_id: leave.staff_id,
        leave_type_id: leave.leave_type_id,
        start_date: leave.start_date,
        end_date: leave.end_date,
        days_count: leave.days_count,
        reason: leave.reason || '',
        attachment_url: leave.attachment_url || '',
        status: leave.status
      });
      setSelectedLeave(leave);
    } else {
      setFormData({
        staff_id: '',
        leave_type_id: '',
        start_date: '',
        end_date: '',
        days_count: 0,
        reason: '',
        attachment_url: '',
        status: 'draft'
      });
      setSelectedLeave(null);
    }
    setFormErrors({});
    setShowForm(true);
  };

  const calculateDays = (start, end) => {
    if (!start || !end) return 0;
    const startDate = new Date(start);
    const endDate = new Date(end);
    const diffTime = Math.abs(endDate - startDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return diffDays;
  };

  useEffect(() => {
    if (formData.start_date && formData.end_date) {
      const days = calculateDays(formData.start_date, formData.end_date);
      setFormData(prev => ({ ...prev, days_count: days }));
    }
  }, [formData.start_date, formData.end_date]);

  const validateForm = async () => {
    const errors = {};

    if (!formData.staff_id) errors.staff_id = 'Staff is required';
    if (!formData.leave_type_id) errors.leave_type_id = 'Leave type is required';
    if (!formData.start_date) errors.start_date = 'Start date is required';
    if (!formData.end_date) errors.end_date = 'End date is required';

    if (formData.start_date && formData.end_date) {
      if (new Date(formData.start_date) > new Date(formData.end_date)) {
        errors.end_date = 'End date must be after start date';
      }
    }

    const selectedType = leaveTypes.find(t => t.id === formData.leave_type_id);
    if (selectedType?.requires_attachment && !formData.attachment_url) {
      errors.attachment_url = 'Attachment is required for this leave type';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSave = async (e) => {
    e.preventDefault();

    if (!(await validateForm())) return;

    try {
      setSaving(true);

      if (selectedLeave) {
        const { error: updateError } = await supabase
          .from('hr_leave_requests')
          .update(formData)
          .eq('id', selectedLeave.id);

        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await supabase
          .from('hr_leave_requests')
          .insert([formData]);

        if (insertError) throw insertError;
      }

      setShowForm(false);
      fetchLeaves();
      alert(selectedLeave ? 'Leave request updated' : 'Leave request created');
    } catch (err) {
      alert('Error: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this leave request?')) return;

    try {
      const { error } = await supabase
        .from('hr_leave_requests')
        .delete()
        .eq('id', id);

      if (error) throw error;
      fetchLeaves();
      alert('Leave request deleted');
    } catch (err) {
      alert('Error: ' + err.message);
    }
  };

  const handleSubmit = async (id) => {
    if (!confirm('Submit this leave request for approval?')) return;

    try {
      const { error } = await supabase
        .from('hr_leave_requests')
        .update({ status: 'submitted' })
        .eq('id', id);

      if (error) throw error;
      fetchLeaves();
      alert('Leave request submitted for approval');
    } catch (err) {
      alert('Error: ' + err.message);
    }
  };

  const openApprovalModal = (leave, action) => {
    setApprovalLeave(leave);
    setApprovalAction(action);
    setRejectionReason('');
    setShowApprovalModal(true);
  };

  const handleApproval = async () => {
    if (!approvalLeave) return;

    if (approvalAction === 'reject' && !rejectionReason.trim()) {
      alert('Please provide a rejection reason');
      return;
    }

    try {
      const currentUserId = 'admin-user-id'; // In real app, get from auth context

      const updates = {
        status: approvalAction === 'approve' ? 'approved' : 'rejected'
      };

      if (approvalAction === 'approve') {
        updates.approved_by = currentUserId;
        updates.approved_at = new Date().toISOString();

        // Check for roster conflicts
        const { data: rosterConflicts } = await supabase
          .from('hr_roster')
          .select('*')
          .eq('staff_id', approvalLeave.staff_id)
          .gte('work_date', approvalLeave.start_date)
          .lte('work_date', approvalLeave.end_date);

        if (rosterConflicts && rosterConflicts.length > 0) {
          const conflictMsg = `WARNING: This staff member has ${rosterConflicts.length} roster entries during this leave period. These may need to be cancelled or reassigned.`;
          if (!confirm(conflictMsg + '\n\nApprove anyway?')) {
            return;
          }
        }
      } else {
        updates.rejected_by = currentUserId;
        updates.rejected_at = new Date().toISOString();
        updates.rejection_reason = rejectionReason;
      }

      const { error } = await supabase
        .from('hr_leave_requests')
        .update(updates)
        .eq('id', approvalLeave.id);

      if (error) throw error;

      setShowApprovalModal(false);
      fetchLeaves();
      alert(`Leave request ${approvalAction === 'approve' ? 'approved' : 'rejected'}`);
    } catch (err) {
      alert('Error: ' + err.message);
    }
  };

  const groupedByDate = leaves.reduce((acc, leave) => {
    const startDate = leave.start_date;
    if (!acc[startDate]) acc[startDate] = [];
    acc[startDate].push(leave);
    return acc;
  }, {});

  const sortedDates = Object.keys(groupedByDate).sort((a, b) => new Date(b) - new Date(a));

  if (loading && leaves.length === 0) {
    return (
      <div className="p-6">
        <div className="text-center py-12">Loading leave management...</div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 pb-20">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <h1 className="text-2xl font-bold mb-4 md:mb-0">Leave Management</h1>
        <button
          onClick={() => openForm()}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          + New Request
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="text-sm text-gray-600">Pending Approvals</div>
          <div className="text-2xl font-bold text-orange-600">{counts.pending}</div>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="text-sm text-gray-600">On Leave Today</div>
          <div className="text-2xl font-bold text-yellow-600">{counts.today}</div>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="text-sm text-gray-600">Total Approved</div>
          <div className="text-2xl font-bold text-green-600">{counts.approved}</div>
        </div>
      </div>

      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setView('list')}
          className={`px-4 py-2 rounded-lg ${view === 'list' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}
        >
          List
        </button>
        <button
          onClick={() => setView('calendar')}
          className={`px-4 py-2 rounded-lg ${view === 'calendar' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}
        >
          Calendar
        </button>
        <button
          onClick={() => setView('pending')}
          className={`px-4 py-2 rounded-lg ${view === 'pending' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}
        >
          Pending ({counts.pending})
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
        <select
          value={filters.status}
          onChange={(e) => setFilters({ ...filters, status: e.target.value })}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
        >
          <option value="">All Status</option>
          {statuses.map(s => <option key={s} value={s}>{s}</option>)}
        </select>

        <select
          value={filters.leave_type}
          onChange={(e) => setFilters({ ...filters, leave_type: e.target.value })}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
        >
          <option value="">All Leave Types</option>
          {leaveTypes.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>

        <select
          value={filters.staff}
          onChange={(e) => setFilters({ ...filters, staff: e.target.value })}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
        >
          <option value="">All Staff</option>
          {staff.map(s => <option key={s.id} value={s.id}>{s.full_name}</option>)}
        </select>
      </div>

      {leaves.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          No leave requests found
        </div>
      ) : view === 'calendar' ? (
        <div className="space-y-4">
          {sortedDates.map(date => (
            <div key={date} className="bg-white border border-gray-200 rounded-lg p-4">
              <h3 className="font-semibold mb-3">{date}</h3>
              <div className="space-y-2">
                {groupedByDate[date].map(leave => (
                  <div key={leave.id} className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="font-medium text-sm">
                          {leave.hr_staff?.full_name} ({leave.hr_staff?.staff_code})
                        </div>
                        <div className="text-xs text-gray-600">
                          {leave.hr_leave_types?.name} - {leave.days_count} days
                        </div>
                        <div className="text-xs text-gray-600">
                          {leave.start_date} to {leave.end_date}
                        </div>
                      </div>
                      <span className={`px-2 py-1 text-xs rounded ${
                        leave.status === 'approved' ? 'bg-green-100 text-green-700' :
                        leave.status === 'submitted' ? 'bg-orange-100 text-orange-700' :
                        leave.status === 'rejected' ? 'bg-red-100 text-red-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {leave.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {leaves.map(leave => (
            <div key={leave.id} className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <div className="font-semibold">
                        {leave.hr_staff?.full_name} ({leave.hr_staff?.staff_code})
                      </div>
                      <div className="text-sm text-gray-600">
                        {leave.hr_staff?.department} - {leave.hr_staff?.role}
                      </div>
                    </div>
                    <span className={`px-3 py-1 text-sm rounded ${
                      leave.status === 'approved' ? 'bg-green-100 text-green-700' :
                      leave.status === 'submitted' ? 'bg-orange-100 text-orange-700' :
                      leave.status === 'rejected' ? 'bg-red-100 text-red-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {leave.status}
                    </span>
                  </div>
                  <div className="text-sm space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{leave.hr_leave_types?.name}</span>
                      {leave.hr_leave_types?.paid && (
                        <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded">Paid</span>
                      )}
                    </div>
                    <div className="text-gray-600">
                      {leave.start_date} to {leave.end_date} ({leave.days_count} days)
                    </div>
                    {leave.reason && (
                      <div className="text-gray-600">
                        <span className="font-medium">Reason:</span> {leave.reason}
                      </div>
                    )}
                    {leave.status === 'approved' && leave.approved_by_staff && (
                      <div className="text-sm text-green-600">
                        Approved by {leave.approved_by_staff.full_name} on {new Date(leave.approved_at).toLocaleDateString()}
                      </div>
                    )}
                    {leave.status === 'rejected' && (
                      <div className="text-sm text-red-600">
                        Rejected by {leave.rejected_by_staff?.full_name || 'Unknown'} - {leave.rejection_reason}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {leave.status === 'draft' && (
                    <>
                      <button
                        onClick={() => handleSubmit(leave.id)}
                        className="text-sm text-green-600 hover:underline"
                      >
                        Submit
                      </button>
                      <button
                        onClick={() => openForm(leave)}
                        className="text-sm text-blue-600 hover:underline"
                      >
                        Edit
                      </button>
                    </>
                  )}
                  {leave.status === 'submitted' && (
                    <>
                      <button
                        onClick={() => openApprovalModal(leave, 'approve')}
                        className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => openApprovalModal(leave, 'reject')}
                        className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
                      >
                        Reject
                      </button>
                    </>
                  )}
                  {(leave.status === 'draft' || leave.status === 'rejected') && (
                    <button
                      onClick={() => handleDelete(leave.id)}
                      className="text-sm text-red-600 hover:underline"
                    >
                      Delete
                    </button>
                  )}
                </div>
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
                {selectedLeave ? 'Edit Leave Request' : 'New Leave Request'}
              </h2>
              <button onClick={() => setShowForm(false)} className="text-gray-500 hover:text-gray-700">
                ✕
              </button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
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
                      {s.full_name} ({s.staff_code}) - {s.department}
                    </option>
                  ))}
                </select>
                {formErrors.staff_id && <p className="text-red-500 text-sm mt-1">{formErrors.staff_id}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Leave Type *</label>
                <select
                  value={formData.leave_type_id}
                  onChange={(e) => setFormData({ ...formData, leave_type_id: e.target.value })}
                  className={`w-full px-3 py-2 border rounded-lg ${formErrors.leave_type_id ? 'border-red-500' : 'border-gray-300'}`}
                >
                  <option value="">Select Leave Type</option>
                  {leaveTypes.map(t => (
                    <option key={t.id} value={t.id}>
                      {t.name} {t.paid ? '(Paid)' : '(Unpaid)'}
                    </option>
                  ))}
                </select>
                {formErrors.leave_type_id && <p className="text-red-500 text-sm mt-1">{formErrors.leave_type_id}</p>}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Start Date *</label>
                  <input
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                    className={`w-full px-3 py-2 border rounded-lg ${formErrors.start_date ? 'border-red-500' : 'border-gray-300'}`}
                  />
                  {formErrors.start_date && <p className="text-red-500 text-sm mt-1">{formErrors.start_date}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">End Date *</label>
                  <input
                    type="date"
                    value={formData.end_date}
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                    className={`w-full px-3 py-2 border rounded-lg ${formErrors.end_date ? 'border-red-500' : 'border-gray-300'}`}
                  />
                  {formErrors.end_date && <p className="text-red-500 text-sm mt-1">{formErrors.end_date}</p>}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Days Count</label>
                <input
                  type="number"
                  value={formData.days_count}
                  readOnly
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Reason</label>
                <textarea
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Attachment URL
                  {leaveTypes.find(t => t.id === formData.leave_type_id)?.requires_attachment && ' *'}
                </label>
                <input
                  type="text"
                  value={formData.attachment_url}
                  onChange={(e) => setFormData({ ...formData, attachment_url: e.target.value })}
                  placeholder="https://..."
                  className={`w-full px-3 py-2 border rounded-lg ${formErrors.attachment_url ? 'border-red-500' : 'border-gray-300'}`}
                />
                {formErrors.attachment_url && <p className="text-red-500 text-sm mt-1">{formErrors.attachment_url}</p>}
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

      {/* Approval Modal */}
      {showApprovalModal && approvalLeave && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h2 className="text-xl font-bold mb-4">
              {approvalAction === 'approve' ? 'Approve' : 'Reject'} Leave Request
            </h2>
            <div className="mb-4 text-sm space-y-2">
              <div><strong>Staff:</strong> {approvalLeave.hr_staff?.full_name}</div>
              <div><strong>Leave Type:</strong> {approvalLeave.hr_leave_types?.name}</div>
              <div><strong>Period:</strong> {approvalLeave.start_date} to {approvalLeave.end_date}</div>
              <div><strong>Days:</strong> {approvalLeave.days_count}</div>
            </div>
            {approvalAction === 'reject' && (
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Rejection Reason *</label>
                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  placeholder="Please provide a reason for rejection"
                />
              </div>
            )}
            <div className="flex gap-3">
              <button
                onClick={() => setShowApprovalModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleApproval}
                className={`flex-1 px-4 py-2 text-white rounded-lg ${
                  approvalAction === 'approve' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'
                }`}
              >
                {approvalAction === 'approve' ? 'Approve' : 'Reject'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LeaveManagement;
