/* SQL:
CREATE TABLE mawaid_sites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  city TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE mawaid_meal_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID REFERENCES mawaid_sites(id),
  service_date DATE NOT NULL,
  meal_type TEXT NOT NULL,
  planned_people INT,
  planned_thals INT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(site_id, service_date, meal_type)
);
*/

import { useState, useEffect } from "react";
import { supabase } from "../../../lib/supabase";

const MEAL_TYPES = [
  "breakfast", "lunch", "dinner", "labor_lunch", "labor_dinner",
  "vip_dinner", "airport_tosha", "atraaf_tosha", "medina_tosha"
];

const ThalCounts = () => {
  const [sites, setSites] = useState([]);
  const [selectedSite, setSelectedSite] = useState("");
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);
  const [selectedMeal, setSelectedMeal] = useState("lunch");
  const [session, setSession] = useState(null);
  const [plannedPeople, setPlannedPeople] = useState("");
  const [plannedThals, setPlannedThals] = useState(0);
  const [overrideThals, setOverrideThals] = useState("");
  const [overrideReason, setOverrideReason] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadSites();
  }, []);

  useEffect(() => {
    if (selectedSite && selectedDate && selectedMeal) {
      loadSession();
    }
  }, [selectedSite, selectedDate, selectedMeal]);

  useEffect(() => {
    if (plannedPeople) {
      const count = parseInt(plannedPeople);
      if (!isNaN(count) && count > 0) {
        setPlannedThals(Math.ceil(count / 8));
      }
    } else {
      setPlannedThals(0);
    }
  }, [plannedPeople]);

  const loadSites = async () => {
    const { data, error } = await supabase
      .from("mawaid_sites")
      .select("*")
      .eq("is_active", true)
      .order("name");

    if (error) {
      setError(`RLS blocked action or table missing: ${error.message}`);
    } else {
      setSites(data || []);
      if (data?.length > 0) setSelectedSite(data[0].id);
    }
  };

  const loadSession = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("mawaid_meal_sessions")
      .select("*")
      .eq("site_id", selectedSite)
      .eq("service_date", selectedDate)
      .eq("meal_type", selectedMeal)
      .maybeSingle();

    if (error) {
      setError(`RLS blocked action: ${error.message}`);
    } else if (data) {
      setSession(data);
      setPlannedPeople(data.planned_people?.toString() || "");
      setPlannedThals(data.planned_thals || 0);
      setNotes(data.notes || "");
    } else {
      setSession(null);
      setPlannedPeople("");
      setPlannedThals(0);
      setNotes("");
    }
    setLoading(false);
  };

  const handleSave = async () => {
    const people = parseInt(plannedPeople);
    if (isNaN(people) || people <= 0) {
      setError("Planned people must be a positive number");
      return;
    }

    let finalThals = plannedThals;
    if (overrideThals) {
      const override = parseInt(overrideThals);
      if (isNaN(override) || override < 0) {
        setError("Override thals must be a non-negative number");
        return;
      }
      if (!overrideReason.trim()) {
        setError("Override reason is required");
        return;
      }
      finalThals = override;
    }

    const payload = {
      site_id: selectedSite,
      service_date: selectedDate,
      meal_type: selectedMeal,
      planned_people: people,
      planned_thals: finalThals,
      notes: overrideReason ? `${notes}\n[Override: ${overrideReason}]` : notes,
    };

    setLoading(true);
    const { error } = await supabase
      .from("mawaid_meal_sessions")
      .upsert(payload, { onConflict: "site_id,service_date,meal_type" });

    if (error) {
      setError(`RLS blocked action: ${error.message}`);
    } else {
      setError("");
      setOverrideThals("");
      setOverrideReason("");
      loadSession();
    }
    setLoading(false);
  };

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Thal Counts</h1>

      {error && (
        <div className="bg-red-50 border border-red-300 text-red-800 px-4 py-2 rounded mb-4">
          {error}
        </div>
      )}

      <div className="space-y-4 mb-6">
        <div>
          <label className="block text-sm font-medium mb-1">Site</label>
          <select
            className="w-full border border-gray-300 rounded px-3 py-2"
            value={selectedSite}
            onChange={(e) => setSelectedSite(e.target.value)}
          >
            {sites.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} ({s.city})
              </option>
            ))}
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

        <div>
          <label className="block text-sm font-medium mb-1">Meal Type</label>
          <select
            className="w-full border border-gray-300 rounded px-3 py-2"
            value={selectedMeal}
            onChange={(e) => setSelectedMeal(e.target.value)}
          >
            {MEAL_TYPES.map((m) => (
              <option key={m} value={m}>
                {m.replace(/_/g, " ").toUpperCase()}
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="animate-pulse space-y-3">
          <div className="h-10 bg-gray-200 rounded"></div>
          <div className="h-10 bg-gray-200 rounded"></div>
        </div>
      ) : (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Planned People</label>
            <input
              type="number"
              className="w-full border border-gray-300 rounded px-3 py-2"
              value={plannedPeople}
              onChange={(e) => setPlannedPeople(e.target.value)}
              placeholder="Enter headcount"
            />
          </div>

          <div className="bg-blue-50 border border-blue-300 rounded p-4">
            <div className="text-sm text-blue-800 font-medium">Computed Thals</div>
            <div className="text-3xl font-bold text-blue-900">{plannedThals}</div>
            <div className="text-xs text-blue-600 mt-1">
              1 Thal = 8 people | Formula: ceil({plannedPeople || 0} / 8)
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Override Thals (optional)</label>
            <input
              type="number"
              className="w-full border border-gray-300 rounded px-3 py-2"
              value={overrideThals}
              onChange={(e) => setOverrideThals(e.target.value)}
              placeholder="Leave blank to use computed value"
            />
          </div>

          {overrideThals && (
            <div>
              <label className="block text-sm font-medium mb-1 text-red-600">Override Reason (required)</label>
              <input
                type="text"
                className="w-full border border-red-300 rounded px-3 py-2"
                value={overrideReason}
                onChange={(e) => setOverrideReason(e.target.value)}
                placeholder="Why override?"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-1">Notes</label>
            <textarea
              className="w-full border border-gray-300 rounded px-3 py-2"
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Additional notes"
            />
          </div>
        </div>
      )}

      <div className="sticky bottom-0 bg-white border-t border-gray-200 pt-4 mt-6">
        <button
          onClick={handleSave}
          disabled={loading || !plannedPeople}
          className="w-full bg-blue-600 text-white font-medium py-3 rounded disabled:bg-gray-300 disabled:cursor-not-allowed"
        >
          {loading ? "Saving..." : session ? "Update Session" : "Create Session"}
        </button>
      </div>
    </div>
  );
};

export default ThalCounts;
