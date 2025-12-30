/*
SQL:
CREATE TABLE hr_training_courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  category TEXT,
  mandatory_for_roles_json TEXT DEFAULT '[]',
  validity_days INT,
  provider TEXT,
  duration_hours DECIMAL(4,2),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE hr_training_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID REFERENCES hr_training_courses(id) ON DELETE CASCADE,
  site TEXT,
  session_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  capacity INT DEFAULT 20,
  trainer_name TEXT,
  status TEXT DEFAULT 'scheduled',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE hr_training_enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES hr_training_sessions(id) ON DELETE CASCADE,
  staff_id UUID REFERENCES hr_staff(id) ON DELETE CASCADE,
  attendance_status TEXT DEFAULT 'enrolled',
  completion_status TEXT DEFAULT 'pending',
  completed_at TIMESTAMPTZ,
  expiry_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_hr_training_enrollments_staff_id ON hr_training_enrollments(staff_id);
CREATE INDEX idx_hr_training_enrollments_session_id ON hr_training_enrollments(session_id);
*/

import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabaseClient';

const Training = () => {
  const [view, setView] = useState('courses'); // 'courses' | 'sessions' | 'compliance'
  const [courses, setCourses] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [showCourseForm, setShowCourseForm] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [courseFormData, setCourseFormData] = useState({
    title: '',
    category: '',
    mandatory_for_roles_json: '[]',
    validity_days: null,
    provider: '',
    duration_hours: null
  });
  const [courseFormErrors, setCourseFormErrors] = useState({});

  const [showSessionForm, setShowSessionForm] = useState(false);
  const [selectedSession, setSelectedSession] = useState(null);
  const [sessionFormData, setSessionFormData] = useState({
    course_id: '',
    site: '',
    session_date: '',
    start_time: '',
    end_time: '',
    capacity: 20,
    trainer_name: '',
    status: 'scheduled'
  });
  const [sessionFormErrors, setSessionFormErrors] = useState({});

  const [showEnrollForm, setShowEnrollForm] = useState(false);
  const [enrollFormSession, setEnrollFormSession] = useState(null);
  const [selectedStaffIds, setSelectedStaffIds] = useState([]);

  const [complianceFilters, setComplianceFilters] = useState({
    site: '',
    role: ''
  });

  const [saving, setSaving] = useState(false);

  const sites = ['Makkah', 'Madinah', 'Riyadh', 'Jeddah'];
  const roles = ['Manager', 'Supervisor', 'Staff', 'Technician', 'Chef', 'Cleaner', 'Receptionist'];
  const categories = ['Safety', 'Customer Service', 'Technical', 'Compliance', 'Soft Skills'];
  const sessionStatuses = ['scheduled', 'completed', 'cancelled'];
  const attendanceStatuses = ['enrolled', 'attended', 'no_show', 'cancelled'];
  const completionStatuses = ['pending', 'passed', 'failed'];

  useEffect(() => {
    fetchStaff();
    if (view === 'courses') fetchCourses();
    if (view === 'sessions') fetchSessions();
    if (view === 'compliance') fetchCompliance();
  }, [view]);

  const fetchStaff = async () => {
    const { data } = await supabase
      .from('hr_staff')
      .select('*')
      .eq('status', 'active')
      .order('full_name');
    if (data) setStaff(data);
  };

  const fetchCourses = async () => {
    try {
      setLoading(true);
      setError(null);
      const { data, error: fetchError } = await supabase
        .from('hr_training_courses')
        .select('*')
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;
      setCourses(data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchSessions = async () => {
    try {
      setLoading(true);
      setError(null);
      const { data, error: fetchError } = await supabase
        .from('hr_training_sessions')
        .select(`
          *,
          hr_training_courses(id, title, category),
          hr_training_enrollments(id, staff_id, attendance_status, completion_status)
        `)
        .order('session_date', { ascending: false });

      if (fetchError) throw fetchError;
      setSessions(data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchCompliance = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data: allEnrollments, error: fetchError } = await supabase
        .from('hr_training_enrollments')
        .select(`
          *,
          hr_staff(id, full_name, role, department, site),
          hr_training_sessions(
            id,
            course_id,
            session_date,
            hr_training_courses(id, title, validity_days, mandatory_for_roles_json)
          )
        `);

      if (fetchError) throw fetchError;
      setEnrollments(allEnrollments || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const openCourseForm = (course = null) => {
    if (course) {
      setCourseFormData(course);
      setSelectedCourse(course);
    } else {
      setCourseFormData({
        title: '',
        category: '',
        mandatory_for_roles_json: '[]',
        validity_days: null,
        provider: '',
        duration_hours: null
      });
      setSelectedCourse(null);
    }
    setCourseFormErrors({});
    setShowCourseForm(true);
  };

  const validateCourseForm = () => {
    const errors = {};
    if (!courseFormData.title?.trim()) errors.title = 'Title is required';

    try {
      JSON.parse(courseFormData.mandatory_for_roles_json || '[]');
    } catch {
      errors.mandatory_for_roles_json = 'Invalid JSON format';
    }

    setCourseFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCourseSave = async (e) => {
    e.preventDefault();
    if (!validateCourseForm()) return;

    try {
      setSaving(true);

      if (selectedCourse) {
        const { error } = await supabase
          .from('hr_training_courses')
          .update(courseFormData)
          .eq('id', selectedCourse.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('hr_training_courses')
          .insert([courseFormData]);

        if (error) throw error;
      }

      setShowCourseForm(false);
      fetchCourses();
      alert(selectedCourse ? 'Course updated' : 'Course created');
    } catch (err) {
      alert('Error: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleCourseDelete = async (id) => {
    if (!confirm('Delete this course? All associated sessions will be deleted.')) return;

    try {
      const { error } = await supabase
        .from('hr_training_courses')
        .delete()
        .eq('id', id);

      if (error) throw error;
      fetchCourses();
      alert('Course deleted');
    } catch (err) {
      alert('Error: ' + err.message);
    }
  };

  const openSessionForm = (session = null) => {
    if (session) {
      setSessionFormData({
        course_id: session.course_id,
        site: session.site || '',
        session_date: session.session_date,
        start_time: session.start_time,
        end_time: session.end_time,
        capacity: session.capacity,
        trainer_name: session.trainer_name || '',
        status: session.status
      });
      setSelectedSession(session);
    } else {
      setSessionFormData({
        course_id: '',
        site: '',
        session_date: '',
        start_time: '',
        end_time: '',
        capacity: 20,
        trainer_name: '',
        status: 'scheduled'
      });
      setSelectedSession(null);
    }
    setSessionFormErrors({});
    setShowSessionForm(true);
  };

  const validateSessionForm = () => {
    const errors = {};
    if (!sessionFormData.course_id) errors.course_id = 'Course is required';
    if (!sessionFormData.session_date) errors.session_date = 'Date is required';
    if (!sessionFormData.start_time) errors.start_time = 'Start time is required';
    if (!sessionFormData.end_time) errors.end_time = 'End time is required';

    setSessionFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSessionSave = async (e) => {
    e.preventDefault();
    if (!validateSessionForm()) return;

    try {
      setSaving(true);

      if (selectedSession) {
        const { error } = await supabase
          .from('hr_training_sessions')
          .update(sessionFormData)
          .eq('id', selectedSession.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('hr_training_sessions')
          .insert([sessionFormData]);

        if (error) throw error;
      }

      setShowSessionForm(false);
      fetchSessions();
      alert(selectedSession ? 'Session updated' : 'Session created');
    } catch (err) {
      alert('Error: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleSessionDelete = async (id) => {
    if (!confirm('Delete this session? All enrollments will be deleted.')) return;

    try {
      const { error } = await supabase
        .from('hr_training_sessions')
        .delete()
        .eq('id', id);

      if (error) throw error;
      fetchSessions();
      alert('Session deleted');
    } catch (err) {
      alert('Error: ' + err.message);
    }
  };

  const openEnrollForm = (session) => {
    setEnrollFormSession(session);
    setSelectedStaffIds([]);
    setShowEnrollForm(true);
  };

  const handleEnroll = async () => {
    if (selectedStaffIds.length === 0) {
      alert('Please select at least one staff member');
      return;
    }

    try {
      const enrollments = selectedStaffIds.map(staff_id => ({
        session_id: enrollFormSession.id,
        staff_id,
        attendance_status: 'enrolled',
        completion_status: 'pending'
      }));

      const { error } = await supabase
        .from('hr_training_enrollments')
        .insert(enrollments);

      if (error) throw error;

      setShowEnrollForm(false);
      fetchSessions();
      alert(`Enrolled ${selectedStaffIds.length} staff members`);
    } catch (err) {
      alert('Error: ' + err.message);
    }
  };

  const handleMarkAttendance = async (enrollmentId, attended) => {
    try {
      const updates = {
        attendance_status: attended ? 'attended' : 'no_show'
      };

      if (attended) {
        updates.completion_status = 'passed';
        updates.completed_at = new Date().toISOString();

        const enrollment = enrollments.find(e => e.id === enrollmentId);
        const validityDays = enrollment?.hr_training_sessions?.hr_training_courses?.validity_days;

        if (validityDays) {
          const expiryDate = new Date();
          expiryDate.setDate(expiryDate.getDate() + validityDays);
          updates.expiry_at = expiryDate.toISOString();
        }
      }

      const { error } = await supabase
        .from('hr_training_enrollments')
        .update(updates)
        .eq('id', enrollmentId);

      if (error) throw error;
      fetchCompliance();
      alert('Attendance updated');
    } catch (err) {
      alert('Error: ' + err.message);
    }
  };

  const getComplianceData = () => {
    let filteredStaff = staff;

    if (complianceFilters.site) {
      filteredStaff = filteredStaff.filter(s => s.site === complianceFilters.site);
    }
    if (complianceFilters.role) {
      filteredStaff = filteredStaff.filter(s => s.role === complianceFilters.role);
    }

    return filteredStaff.map(staffMember => {
      const mandatoryCourses = courses.filter(course => {
        try {
          const roles = JSON.parse(course.mandatory_for_roles_json || '[]');
          return roles.includes(staffMember.role);
        } catch {
          return false;
        }
      });

      const staffEnrollments = enrollments.filter(e => e.staff_id === staffMember.id);

      const completedCourseIds = staffEnrollments
        .filter(e =>
          e.completion_status === 'passed' &&
          (!e.expiry_at || new Date(e.expiry_at) > new Date())
        )
        .map(e => e.hr_training_sessions?.course_id)
        .filter(Boolean);

      const missingMandatory = mandatoryCourses.filter(c => !completedCourseIds.includes(c.id));

      const expiredEnrollments = staffEnrollments.filter(e =>
        e.expiry_at && new Date(e.expiry_at) < new Date()
      );

      return {
        staff: staffMember,
        totalMandatory: mandatoryCourses.length,
        completed: completedCourseIds.length,
        missingMandatory,
        expiredEnrollments,
        compliant: missingMandatory.length === 0 && expiredEnrollments.length === 0
      };
    });
  };

  const complianceData = view === 'compliance' ? getComplianceData() : [];
  const nonCompliantStaff = complianceData.filter(d => !d.compliant);

  if (loading && (courses.length === 0 && sessions.length === 0 && enrollments.length === 0)) {
    return (
      <div className="p-6">
        <div className="text-center py-12">Loading training management...</div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 pb-20">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <h1 className="text-2xl font-bold mb-4 md:mb-0">Staff Training</h1>
        <div className="flex gap-2">
          {view === 'courses' && (
            <button
              onClick={() => openCourseForm()}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              + Add Course
            </button>
          )}
          {view === 'sessions' && (
            <button
              onClick={() => openSessionForm()}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              + Add Session
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
          {error}
        </div>
      )}

      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setView('courses')}
          className={`px-4 py-2 rounded-lg ${view === 'courses' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}
        >
          Courses
        </button>
        <button
          onClick={() => setView('sessions')}
          className={`px-4 py-2 rounded-lg ${view === 'sessions' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}
        >
          Sessions
        </button>
        <button
          onClick={() => setView('compliance')}
          className={`px-4 py-2 rounded-lg ${view === 'compliance' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}
        >
          Compliance {nonCompliantStaff.length > 0 && `(${nonCompliantStaff.length})`}
        </button>
      </div>

      {view === 'courses' && (
        <div className="space-y-3">
          {courses.length === 0 ? (
            <div className="text-center py-12 text-gray-500">No courses found</div>
          ) : (
            courses.map(course => {
              let mandatoryRoles = [];
              try {
                mandatoryRoles = JSON.parse(course.mandatory_for_roles_json || '[]');
              } catch {}

              return (
                <div key={course.id} className="bg-white border border-gray-200 rounded-lg p-4">
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
                    <div className="flex-1">
                      <div className="font-semibold text-lg">{course.title}</div>
                      <div className="text-sm text-gray-600 space-y-1 mt-2">
                        {course.category && (
                          <div>
                            <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded">
                              {course.category}
                            </span>
                          </div>
                        )}
                        {course.provider && <div>Provider: {course.provider}</div>}
                        {course.duration_hours && <div>Duration: {course.duration_hours} hours</div>}
                        {course.validity_days && <div>Valid for: {course.validity_days} days</div>}
                        {mandatoryRoles.length > 0 && (
                          <div>
                            <span className="font-medium">Mandatory for:</span> {mandatoryRoles.join(', ')}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => openCourseForm(course)}
                        className="text-sm text-blue-600 hover:underline"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleCourseDelete(course.id)}
                        className="text-sm text-red-600 hover:underline"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {view === 'sessions' && (
        <div className="space-y-3">
          {sessions.length === 0 ? (
            <div className="text-center py-12 text-gray-500">No sessions found</div>
          ) : (
            sessions.map(session => {
              const enrolledCount = session.hr_training_enrollments?.length || 0;
              const attendedCount = session.hr_training_enrollments?.filter(
                e => e.attendance_status === 'attended'
              ).length || 0;

              return (
                <div key={session.id} className="bg-white border border-gray-200 rounded-lg p-4">
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <div className="font-semibold">{session.hr_training_courses?.title}</div>
                          <div className="text-sm text-gray-600">
                            {session.session_date} • {session.start_time} - {session.end_time}
                          </div>
                        </div>
                        <span className={`px-2 py-1 text-xs rounded ${
                          session.status === 'completed' ? 'bg-green-100 text-green-700' :
                          session.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                          'bg-blue-100 text-blue-700'
                        }`}>
                          {session.status}
                        </span>
                      </div>
                      <div className="text-sm text-gray-600 space-y-1">
                        {session.site && <div>Site: {session.site}</div>}
                        {session.trainer_name && <div>Trainer: {session.trainer_name}</div>}
                        <div>
                          Capacity: {enrolledCount} / {session.capacity}
                          {session.status === 'completed' && ` (${attendedCount} attended)`}
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {session.status === 'scheduled' && (
                        <button
                          onClick={() => openEnrollForm(session)}
                          className="text-sm px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700"
                        >
                          Enroll Staff
                        </button>
                      )}
                      <button
                        onClick={() => openSessionForm(session)}
                        className="text-sm text-blue-600 hover:underline"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleSessionDelete(session.id)}
                        className="text-sm text-red-600 hover:underline"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {view === 'compliance' && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
            <select
              value={complianceFilters.site}
              onChange={(e) => setComplianceFilters({ ...complianceFilters, site: e.target.value })}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
            >
              <option value="">All Sites</option>
              {sites.map(s => <option key={s} value={s}>{s}</option>)}
            </select>

            <select
              value={complianceFilters.role}
              onChange={(e) => setComplianceFilters({ ...complianceFilters, role: e.target.value })}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
            >
              <option value="">All Roles</option>
              {roles.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-4 mb-4">
            <h3 className="font-semibold mb-2">Compliance Summary</h3>
            <div className="text-sm space-y-1">
              <div>Total Staff: {complianceData.length}</div>
              <div className="text-green-600">Compliant: {complianceData.filter(d => d.compliant).length}</div>
              <div className="text-red-600">Non-Compliant: {nonCompliantStaff.length}</div>
            </div>
          </div>

          <div className="space-y-3">
            {nonCompliantStaff.length === 0 ? (
              <div className="text-center py-12 text-green-600">All staff are compliant!</div>
            ) : (
              nonCompliantStaff.map(data => (
                <div key={data.staff.id} className="bg-white border border-red-200 rounded-lg p-4">
                  <div className="font-semibold mb-2">
                    {data.staff.full_name} ({data.staff.staff_code})
                  </div>
                  <div className="text-sm text-gray-600 mb-2">
                    {data.staff.role} - {data.staff.department} - {data.staff.site}
                  </div>

                  {data.missingMandatory.length > 0 && (
                    <div className="bg-orange-50 p-3 rounded-lg mb-2">
                      <div className="text-sm font-medium text-orange-700 mb-1">
                        Missing Mandatory Training ({data.missingMandatory.length})
                      </div>
                      {data.missingMandatory.map(course => (
                        <div key={course.id} className="text-sm text-gray-700">
                          • {course.title}
                        </div>
                      ))}
                    </div>
                  )}

                  {data.expiredEnrollments.length > 0 && (
                    <div className="bg-red-50 p-3 rounded-lg">
                      <div className="text-sm font-medium text-red-700 mb-1">
                        Expired Training ({data.expiredEnrollments.length})
                      </div>
                      {data.expiredEnrollments.map(enrollment => (
                        <div key={enrollment.id} className="text-sm text-gray-700">
                          • {enrollment.hr_training_sessions?.hr_training_courses?.title} - Expired: {enrollment.expiry_at}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </>
      )}

      {/* Course Form */}
      {showCourseForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end md:items-center md:justify-center">
          <div className="bg-white w-full md:w-2/3 lg:w-1/2 md:rounded-lg md:max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold">
                {selectedCourse ? 'Edit Course' : 'New Course'}
              </h2>
              <button onClick={() => setShowCourseForm(false)} className="text-gray-500 hover:text-gray-700">
                ✕
              </button>
            </div>
            <form onSubmit={handleCourseSave} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Title *</label>
                <input
                  type="text"
                  value={courseFormData.title}
                  onChange={(e) => setCourseFormData({ ...courseFormData, title: e.target.value })}
                  className={`w-full px-3 py-2 border rounded-lg ${courseFormErrors.title ? 'border-red-500' : 'border-gray-300'}`}
                />
                {courseFormErrors.title && <p className="text-red-500 text-sm mt-1">{courseFormErrors.title}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Category</label>
                <select
                  value={courseFormData.category}
                  onChange={(e) => setCourseFormData({ ...courseFormData, category: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="">Select Category</option>
                  {categories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Mandatory For Roles (JSON array)</label>
                <input
                  type="text"
                  value={courseFormData.mandatory_for_roles_json}
                  onChange={(e) => setCourseFormData({ ...courseFormData, mandatory_for_roles_json: e.target.value })}
                  placeholder='["Manager","Supervisor"]'
                  className={`w-full px-3 py-2 border rounded-lg ${courseFormErrors.mandatory_for_roles_json ? 'border-red-500' : 'border-gray-300'}`}
                />
                {courseFormErrors.mandatory_for_roles_json && <p className="text-red-500 text-sm mt-1">{courseFormErrors.mandatory_for_roles_json}</p>}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Provider</label>
                  <input
                    type="text"
                    value={courseFormData.provider}
                    onChange={(e) => setCourseFormData({ ...courseFormData, provider: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Duration (hours)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={courseFormData.duration_hours || ''}
                    onChange={(e) => setCourseFormData({ ...courseFormData, duration_hours: e.target.value ? parseFloat(e.target.value) : null })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Validity (days)</label>
                <input
                  type="number"
                  value={courseFormData.validity_days || ''}
                  onChange={(e) => setCourseFormData({ ...courseFormData, validity_days: e.target.value ? parseInt(e.target.value) : null })}
                  placeholder="Leave empty for no expiry"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>

              <div className="sticky bottom-0 bg-white pt-4 border-t border-gray-200 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowCourseForm(false)}
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

      {/* Session Form */}
      {showSessionForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end md:items-center md:justify-center">
          <div className="bg-white w-full md:w-2/3 lg:w-1/2 md:rounded-lg md:max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold">
                {selectedSession ? 'Edit Session' : 'New Session'}
              </h2>
              <button onClick={() => setShowSessionForm(false)} className="text-gray-500 hover:text-gray-700">
                ✕
              </button>
            </div>
            <form onSubmit={handleSessionSave} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Course *</label>
                <select
                  value={sessionFormData.course_id}
                  onChange={(e) => setSessionFormData({ ...sessionFormData, course_id: e.target.value })}
                  className={`w-full px-3 py-2 border rounded-lg ${sessionFormErrors.course_id ? 'border-red-500' : 'border-gray-300'}`}
                >
                  <option value="">Select Course</option>
                  {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                </select>
                {sessionFormErrors.course_id && <p className="text-red-500 text-sm mt-1">{sessionFormErrors.course_id}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Site</label>
                <select
                  value={sessionFormData.site}
                  onChange={(e) => setSessionFormData({ ...sessionFormData, site: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="">Select Site</option>
                  {sites.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Session Date *</label>
                <input
                  type="date"
                  value={sessionFormData.session_date}
                  onChange={(e) => setSessionFormData({ ...sessionFormData, session_date: e.target.value })}
                  className={`w-full px-3 py-2 border rounded-lg ${sessionFormErrors.session_date ? 'border-red-500' : 'border-gray-300'}`}
                />
                {sessionFormErrors.session_date && <p className="text-red-500 text-sm mt-1">{sessionFormErrors.session_date}</p>}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Start Time *</label>
                  <input
                    type="time"
                    value={sessionFormData.start_time}
                    onChange={(e) => setSessionFormData({ ...sessionFormData, start_time: e.target.value })}
                    className={`w-full px-3 py-2 border rounded-lg ${sessionFormErrors.start_time ? 'border-red-500' : 'border-gray-300'}`}
                  />
                  {sessionFormErrors.start_time && <p className="text-red-500 text-sm mt-1">{sessionFormErrors.start_time}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">End Time *</label>
                  <input
                    type="time"
                    value={sessionFormData.end_time}
                    onChange={(e) => setSessionFormData({ ...sessionFormData, end_time: e.target.value })}
                    className={`w-full px-3 py-2 border rounded-lg ${sessionFormErrors.end_time ? 'border-red-500' : 'border-gray-300'}`}
                  />
                  {sessionFormErrors.end_time && <p className="text-red-500 text-sm mt-1">{sessionFormErrors.end_time}</p>}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Capacity</label>
                  <input
                    type="number"
                    value={sessionFormData.capacity}
                    onChange={(e) => setSessionFormData({ ...sessionFormData, capacity: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Status</label>
                  <select
                    value={sessionFormData.status}
                    onChange={(e) => setSessionFormData({ ...sessionFormData, status: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  >
                    {sessionStatuses.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Trainer Name</label>
                <input
                  type="text"
                  value={sessionFormData.trainer_name}
                  onChange={(e) => setSessionFormData({ ...sessionFormData, trainer_name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>

              <div className="sticky bottom-0 bg-white pt-4 border-t border-gray-200 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowSessionForm(false)}
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

      {/* Enroll Form */}
      {showEnrollForm && enrollFormSession && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end md:items-center md:justify-center">
          <div className="bg-white w-full md:w-2/3 lg:w-1/2 md:rounded-lg md:max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold">Enroll Staff</h2>
              <button onClick={() => setShowEnrollForm(false)} className="text-gray-500 hover:text-gray-700">
                ✕
              </button>
            </div>
            <div className="p-6">
              <div className="mb-4">
                <div className="font-semibold">{enrollFormSession.hr_training_courses?.title}</div>
                <div className="text-sm text-gray-600">
                  {enrollFormSession.session_date} • {enrollFormSession.start_time} - {enrollFormSession.end_time}
                </div>
              </div>

              <div className="space-y-2 max-h-96 overflow-y-auto mb-4">
                {staff.map(s => (
                  <label key={s.id} className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedStaffIds.includes(s.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedStaffIds([...selectedStaffIds, s.id]);
                        } else {
                          setSelectedStaffIds(selectedStaffIds.filter(id => id !== s.id));
                        }
                      }}
                      className="w-4 h-4"
                    />
                    <div className="flex-1">
                      <div className="font-medium text-sm">{s.full_name}</div>
                      <div className="text-xs text-gray-600">
                        {s.staff_code} - {s.role} - {s.department}
                      </div>
                    </div>
                  </label>
                ))}
              </div>

              <div className="sticky bottom-0 bg-white pt-4 border-t border-gray-200 flex gap-3">
                <button
                  onClick={() => setShowEnrollForm(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleEnroll}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Enroll ({selectedStaffIds.length})
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Training;
