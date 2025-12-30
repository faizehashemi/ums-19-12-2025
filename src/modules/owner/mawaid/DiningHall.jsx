/* SQL:
CREATE TABLE mawaid_serving_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meal_session_id UUID REFERENCES mawaid_meal_sessions(id),
  started_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  actual_people INT,
  actual_thals INT,
  status TEXT DEFAULT 'pending', -- pending, active, completed
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE mawaid_thal_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  serving_session_id UUID REFERENCES mawaid_serving_sessions(id) ON DELETE CASCADE,
  thal_number INT NOT NULL,
  logged_at TIMESTAMPTZ DEFAULT now(),
  logged_by TEXT
);
*/

import { useState, useEffect } from "react";
import { supabase } from "../../../lib/supabaseClient";

const MEAL_TYPES = [
  "breakfast", "lunch", "dinner", "labor_lunch", "labor_dinner",
  "vip_dinner", "airport_tosha", "atraaf_tosha", "medina_tosha"
];

const DiningHall = () => {
  const [view, setView] = useState("sessions"); // sessions, active_session, history
  const [sites, setSites] = useState([]);
  const [selectedSite, setSelectedSite] = useState("");
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);
  const [mealSessions, setMealSessions] = useState([]);
  const [activeSession, setActiveSession] = useState(null);
  const [thalLogs, setThalLogs] = useState([]);
  const [servingHistory, setServingHistory] = useState([]);

  const [thalCounter, setThalCounter] = useState("");
  const [actualPeople, setActualPeople] = useState("");
  const [sessionNotes, setSessionNotes] = useState("");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadSites();
  }, []);

  useEffect(() => {
    if (selectedSite && selectedDate && view === "sessions") {
      loadMealSessions();
    }
  }, [selectedSite, selectedDate, view]);

  useEffect(() => {
    if (activeSession && view === "active_session") {
      const interval = setInterval(() => {
        loadThalLogs();
      }, 5000); // Refresh logs every 5 seconds
      return () => clearInterval(interval);
    }
  }, [activeSession, view]);

  const loadSites = async () => {
    const { data, error } = await supabase
      .from("mawaid_sites")
      .select("*")
      .eq("is_active", true)
      .order("name");
    if (error) setError(`RLS blocked action: ${error.message}`);
    else {
      setSites(data || []);
      if (data?.length > 0) setSelectedSite(data[0].id);
    }
  };

  const loadMealSessions = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("mawaid_meal_sessions")
      .select("*")
      .eq("site_id", selectedSite)
      .eq("service_date", selectedDate)
      .order("meal_type");
    if (error) setError(`RLS blocked action: ${error.message}`);
    else setMealSessions(data || []);
    setLoading(false);
  };

  const loadThalLogs = async () => {
    if (!activeSession) return;
    const { data, error } = await supabase
      .from("mawaid_thal_logs")
      .select("*")
      .eq("serving_session_id", activeSession.serving_id)
      .order("logged_at", { ascending: false });
    if (error) setError(`RLS blocked action: ${error.message}`);
    else setThalLogs(data || []);
  };

  const loadServingHistory = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("mawaid_serving_sessions")
      .select(`
        *,
        meal_session:mawaid_meal_sessions(
          service_date,
          meal_type,
          site:mawaid_sites(name)
        )
      `)
      .order("started_at", { ascending: false })
      .limit(50);
    if (error) setError(`RLS blocked action: ${error.message}`);
    else setServingHistory(data || []);
    setLoading(false);
  };

  const handleStartSession = async (mealSession) => {
    setLoading(true);
    const { data, error } = await supabase
      .from("mawaid_serving_sessions")
      .insert({
        meal_session_id: mealSession.id,
        started_at: new Date().toISOString(),
        status: "active"
      })
      .select()
      .single();

    if (error) {
      setError(`RLS blocked action: ${error.message}`);
    } else {
      setActiveSession({
        serving_id: data.id,
        meal_session: mealSession
      });
      setThalLogs([]);
      setView("active_session");
    }
    setLoading(false);
  };

  const handleLogThal = async () => {
    if (!thalCounter || !activeSession) {
      setError("Thal number is required");
      return;
    }

    const thalNum = parseInt(thalCounter);
    if (isNaN(thalNum) || thalNum <= 0) {
      setError("Invalid thal number");
      return;
    }

    setLoading(true);
    const { error } = await supabase
      .from("mawaid_thal_logs")
      .insert({
        serving_session_id: activeSession.serving_id,
        thal_number: thalNum,
        logged_by: "System" // Could be user name from auth context
      });

    if (error) {
      setError(`RLS blocked action: ${error.message}`);
    } else {
      setError("");
      setThalCounter("");
      loadThalLogs();
    }
    setLoading(false);
  };

  const handleEndSession = async () => {
    if (!actualPeople) {
      setError("Actual people count is required");
      return;
    }

    const people = parseInt(actualPeople);
    if (isNaN(people) || people <= 0) {
      setError("Invalid people count");
      return;
    }

    setLoading(true);
    const { error } = await supabase
      .from("mawaid_serving_sessions")
      .update({
        ended_at: new Date().toISOString(),
        actual_people: people,
        actual_thals: thalLogs.length,
        status: "completed",
        notes: sessionNotes
      })
      .eq("id", activeSession.serving_id);

    if (error) {
      setError(`RLS blocked action: ${error.message}`);
    } else {
      setError("");
      setActiveSession(null);
      setThalLogs([]);
      setActualPeople("");
      setSessionNotes("");
      setView("sessions");
      loadMealSessions();
    }
    setLoading(false);
  };

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Dining Hall</h1>
        <div className="flex gap-2">
          <button
            onClick={() => setView("sessions")}
            className={`px-3 py-1 rounded text-sm ${view === "sessions" ? "bg-blue-600 text-white" : "bg-gray-200"}`}
          >
            Sessions
          </button>
          <button
            onClick={() => { setView("history"); loadServingHistory(); }}
            className={`px-3 py-1 rounded text-sm ${view === "history" ? "bg-blue-600 text-white" : "bg-gray-200"}`}
          >
            History
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-300 text-red-800 px-4 py-2 rounded mb-4">
          {error}
        </div>
      )}

      {view === "sessions" && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1">Site</label>
              <select
                className="w-full border border-gray-300 rounded px-3 py-2"
                value={selectedSite}
                onChange={(e) => setSelectedSite(e.target.value)}
              >
                {sites.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Date</label>
              <input
                type="date"
                className="w-full border border-gray-300 rounded px-3 py-2"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
              />
            </div>
          </div>

          <h2 className="text-lg font-semibold">Planned Meal Sessions</h2>
          {loading ? (
            <div className="animate-pulse space-y-3">
              {[1, 2, 3].map(i => <div key={i} className="h-16 bg-gray-200 rounded"></div>)}
            </div>
          ) : (
            <div className="space-y-2">
              {mealSessions.map(session => (
                <div key={session.id} className="border border-gray-300 rounded p-3">
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="font-semibold text-lg capitalize">
                        {session.meal_type.replace(/_/g, " ")}
                      </div>
                      <div className="text-sm text-gray-600">
                        Planned: {session.planned_people} people | {session.planned_thals} thals
                      </div>
                      {session.notes && <div className="text-xs text-gray-500 mt-1">{session.notes}</div>}
                    </div>
                    <button
                      onClick={() => handleStartSession(session)}
                      className="bg-green-600 text-white px-4 py-2 rounded"
                    >
                      Start Serving
                    </button>
                  </div>
                </div>
              ))}
              {mealSessions.length === 0 && (
                <div className="text-center text-gray-500 py-8">
                  No meal sessions planned for this date
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {view === "active_session" && activeSession && (
        <div className="space-y-4">
          <div className="bg-green-50 border border-green-300 rounded p-4">
            <h2 className="text-xl font-bold text-green-800">
              Active Session: {activeSession.meal_session.meal_type.replace(/_/g, " ").toUpperCase()}
            </h2>
            <div className="text-sm text-green-700 mt-1">
              Date: {activeSession.meal_session.service_date}
            </div>
            <div className="text-sm text-green-700">
              Planned: {activeSession.meal_session.planned_people} people | {activeSession.meal_session.planned_thals} thals
            </div>
          </div>

          <div className="border-2 border-blue-500 rounded-lg p-6 bg-blue-50">
            <h3 className="text-lg font-semibold mb-3">Log Thal</h3>
            <div className="flex gap-3">
              <input
                type="number"
                className="flex-1 border-2 border-blue-300 rounded px-4 py-3 text-xl"
                value={thalCounter}
                onChange={(e) => setThalCounter(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === "Enter") handleLogThal();
                }}
                placeholder="Enter thal number"
                autoFocus
              />
              <button
                onClick={handleLogThal}
                disabled={loading}
                className="bg-blue-600 text-white px-6 py-3 rounded text-lg font-medium disabled:bg-gray-300"
              >
                Log
              </button>
            </div>
          </div>

          <div className="bg-white border border-gray-300 rounded p-4">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-lg font-semibold">Thals Served</h3>
              <div className="text-3xl font-bold text-blue-600">{thalLogs.length}</div>
            </div>
            <div className="max-h-64 overflow-y-auto space-y-1">
              {thalLogs.map((log, index) => (
                <div key={log.id} className="flex justify-between text-sm border-b pb-1">
                  <span>Thal #{log.thal_number}</span>
                  <span className="text-gray-500">{new Date(log.logged_at).toLocaleTimeString()}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="border-t pt-4 space-y-3">
            <h3 className="text-lg font-semibold">End Session</h3>
            <div>
              <label className="block text-sm font-medium mb-1">Actual People Count *</label>
              <input
                type="number"
                className="w-full border border-gray-300 rounded px-3 py-2"
                value={actualPeople}
                onChange={(e) => setActualPeople(e.target.value)}
                placeholder="Total people served"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Session Notes</label>
              <textarea
                className="w-full border border-gray-300 rounded px-3 py-2"
                rows={3}
                value={sessionNotes}
                onChange={(e) => setSessionNotes(e.target.value)}
                placeholder="Any notes about this session"
              />
            </div>
            <button
              onClick={handleEndSession}
              disabled={loading || !actualPeople}
              className="w-full bg-red-600 text-white font-medium py-3 rounded disabled:bg-gray-300"
            >
              {loading ? "Ending..." : "End Session"}
            </button>
          </div>
        </div>
      )}

      {view === "history" && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Serving History</h2>
          {loading ? (
            <div className="animate-pulse space-y-3">
              {[1, 2, 3].map(i => <div key={i} className="h-20 bg-gray-200 rounded"></div>)}
            </div>
          ) : (
            <div className="space-y-2">
              {servingHistory.map(session => (
                <div key={session.id} className="border border-gray-300 rounded p-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-semibold">
                        {session.meal_session?.meal_type?.replace(/_/g, " ").toUpperCase() || "N/A"}
                      </div>
                      <div className="text-sm text-gray-600">
                        Site: {session.meal_session?.site?.name} | Date: {session.meal_session?.service_date}
                      </div>
                      <div className="text-sm text-gray-600">
                        Actual: {session.actual_people} people | {session.actual_thals} thals
                      </div>
                      {session.notes && <div className="text-xs text-gray-500 mt-1">{session.notes}</div>}
                    </div>
                    <div className="text-right text-xs text-gray-500">
                      <div>Started: {session.started_at ? new Date(session.started_at).toLocaleString() : "N/A"}</div>
                      <div>Ended: {session.ended_at ? new Date(session.ended_at).toLocaleString() : "N/A"}</div>
                      <div className={`mt-1 px-2 py-1 rounded ${
                        session.status === "completed" ? "bg-green-100 text-green-800" :
                        session.status === "active" ? "bg-blue-100 text-blue-800" :
                        "bg-gray-100 text-gray-800"
                      }`}>
                        {session.status}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DiningHall;
