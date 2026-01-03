import React, { useEffect, useState } from 'react';
import { supabase } from '../../../lib/supabase';
import PageHeader from '../../../components/layout/PageHeader';
import LoadingSkeleton from '../../../components/layout/LoadingSkeleton';
import ErrorBanner from '../../../components/layout/ErrorBanner';

const HRReport = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [staff, setStaff] = useState([]);
  const [leaves, setLeaves] = useState([]);
  const [rosters, setRosters] = useState([]);
  const [enrollments, setEnrollments] = useState([]);

  const today = new Date().toISOString().split('T')[0];

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [staffRes, leavesRes, rostersRes, enrollRes] = await Promise.all([
        supabase.from('hr_staff').select('*').order('full_name'),
        supabase.from('hr_leave_requests').select('*, hr_leave_types(name)').order('created_at', { ascending: false }),
        supabase
          .from('hr_roster')
          .select('*, hr_staff(id, full_name, site), hr_shifts(id, name)')
          .eq('work_date', today),
        supabase.from('hr_training_enrollments').select('*')
      ]);

      if (staffRes.error) throw staffRes.error;
      if (leavesRes.error) throw leavesRes.error;
      if (rostersRes.error) throw rostersRes.error;
      if (enrollRes.error) throw enrollRes.error;

      setStaff(staffRes.data || []);
      setLeaves(leavesRes.data || []);
      setRosters(rostersRes.data || []);
      setEnrollments(enrollRes.data || []);
    } catch (err) {
      setError(err.message || String(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Filters
  const [filters, setFilters] = useState({ site: '', department: '' });
  const handleFilterChange = (key, value) => setFilters(prev => ({ ...prev, [key]: value }));
  const clearFilters = () => setFilters({ site: '', department: '' });

  const sitesList = [...new Set(staff.map(s => s.site).filter(Boolean))];
  const departmentsList = [...new Set(staff.map(s => s.department).filter(Boolean))];

  // Filtered datasets (site/department)
  const filteredStaff = staff.filter(s => {
    if (filters.site && s.site !== filters.site) return false;
    if (filters.department && s.department !== filters.department) return false;
    return true;
  });

  const filteredStaffIds = new Set(filteredStaff.map(s => s.id));

  const filteredLeaves = leaves.filter(l => filteredStaffIds.has(l.staff_id));

  const filteredRosters = rosters.filter(r => {
    if (filters.site) {
      if (r.site && r.site !== filters.site) return false;
      if (r.hr_staff && r.hr_staff.site && r.hr_staff.site !== filters.site) return false;
    }
    if (filters.department) {
      if (!r.hr_staff || r.hr_staff.department !== filters.department) return false;
    }
    return true;
  });

  const filteredEnrollments = enrollments.filter(e => filteredStaffIds.has(e.staff_id));

  // Derived metrics (from filtered datasets)
  const totalStaff = filteredStaff.length;
  const activeStaff = filteredStaff.filter(s => s.status === 'active').length;

  const byDepartment = filteredStaff.reduce((acc, s) => {
    const d = s.department || 'Unknown';
    acc[d] = (acc[d] || 0) + 1;
    return acc;
  }, {});

  const byRole = filteredStaff.reduce((acc, s) => {
    const r = s.role || 'Unknown';
    acc[r] = (acc[r] || 0) + 1;
    return acc;
  }, {});

  const leaveCounts = filteredLeaves.reduce((acc, l) => {
    acc[l.status] = (acc[l.status] || 0) + 1;
    return acc;
  }, {});

  const todaysLeaves = filteredLeaves.filter(l => {
    if (l.status !== 'approved') return false;
    const start = l.start_date;
    const end = l.end_date;
    return start <= today && today <= end;
  });

  const rosterCountToday = filteredRosters.length;

  // Training compliance: staff with at least one passed enrollment that has not expired
  const compliantStaffIds = new Set(
    filteredEnrollments
      .filter(e => e.completion_status === 'passed' && e.expiry_at && new Date(e.expiry_at) > new Date())
      .map(e => e.staff_id)
  );

  const compliantCount = Array.from(compliantStaffIds).length;
  const compliancePercent = totalStaff > 0 ? Math.round((compliantCount / totalStaff) * 100) : 0;

  const nonCompliantStaff = filteredStaff.filter(s => !compliantStaffIds.has(s.id) && s.status === 'active');

  if (loading) return <LoadingSkeleton />;

  return (
    <div className="p-6">
      <PageHeader
        title="Human Resources Report"
        subtitle="Overview of staff, training, leave and roster"
        actions={
          <div className="flex items-center gap-2">
            <select
              className="border rounded px-2 py-1 text-sm"
              value={filters.site}
              onChange={e => handleFilterChange('site', e.target.value)}
            >
              <option value="">All sites</option>
              {sitesList.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>

            <select
              className="border rounded px-2 py-1 text-sm"
              value={filters.department}
              onChange={e => handleFilterChange('department', e.target.value)}
            >
              <option value="">All departments</option>
              {departmentsList.map(d => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>

            <button
              className="px-2 py-1 text-sm border rounded"
              onClick={clearFilters}
            >
              Clear
            </button>

            <button
              className="px-3 py-1 rounded bg-blue-600 text-white text-sm"
              onClick={fetchData}
            >
              Refresh
            </button>
          </div>
        }
      />

      {error && <ErrorBanner message={error} />}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 my-6">
        <div className="p-4 bg-white rounded shadow">
          <div className="text-sm text-gray-500">Total staff</div>
          <div className="text-2xl font-bold">{totalStaff}</div>
          <div className="text-sm text-gray-500">Active: {activeStaff}</div>
        </div>

        <div className="p-4 bg-white rounded shadow">
          <div className="text-sm text-gray-500">Today's roster</div>
          <div className="text-2xl font-bold">{rosterCountToday}</div>
          <div className="text-sm text-gray-500">On leave today: {todaysLeaves.length}</div>
        </div>

        <div className="p-4 bg-white rounded shadow">
          <div className="text-sm text-gray-500">Training compliance</div>
          <div className="text-2xl font-bold">{compliancePercent}%</div>
          <div className="text-sm text-gray-500">Compliant: {compliantCount}</div>
        </div>

        <div className="p-4 bg-white rounded shadow">
          <div className="text-sm text-gray-500">Pending leave requests</div>
          <div className="text-2xl font-bold">{leaveCounts.submitted || leaveCounts.draft || 0}</div>
          <div className="text-sm text-gray-500">Approved: {leaveCounts.approved || 0}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <section className="col-span-2 bg-white p-4 rounded shadow">
          <h2 className="text-lg font-semibold mb-3">Non-compliant staff ({nonCompliantStaff.length})</h2>

          {nonCompliantStaff.length === 0 ? (
            <div className="text-gray-600">All active staff have valid training records.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-sm text-gray-500">
                    <th className="py-2">Name</th>
                    <th className="py-2">Role</th>
                    <th className="py-2">Department</th>
                    <th className="py-2">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {nonCompliantStaff.map(s => (
                    <tr key={s.id} className="border-t">
                      <td className="py-2">{s.full_name}</td>
                      <td className="py-2">{s.role}</td>
                      <td className="py-2">{s.department}</td>
                      <td className="py-2">{s.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <aside className="bg-white p-4 rounded shadow">
          <h3 className="text-lg font-semibold mb-3">Headcount by department</h3>
          <ul className="space-y-2">
            {Object.entries(byDepartment)
              .sort((a, b) => b[1] - a[1])
              .slice(0, 8)
              .map(([dept, count]) => (
                <li key={dept} className="flex justify-between text-sm">
                  <span>{dept}</span>
                  <span className="font-semibold">{count}</span>
                </li>
              ))}
          </ul>

          <hr className="my-4" />

          <h3 className="text-lg font-semibold mb-3">Headcount by role</h3>
          <ul className="space-y-2 text-sm">
            {Object.entries(byRole)
              .sort((a, b) => b[1] - a[1])
              .slice(0, 8)
              .map(([role, count]) => (
                <li key={role} className="flex justify-between">
                  <span>{role}</span>
                  <span className="font-semibold">{count}</span>
                </li>
              ))}
          </ul>

          <div className="mt-4">
            <button
              className="px-3 py-1 rounded bg-blue-600 text-white text-sm"
              onClick={fetchData}
            >
              Refresh
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default HRReport;
