import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../../lib/supabase";
import { AlertTriangle, Filter, Lightbulb, ShoppingCart, TrendingUp, Utensils } from "lucide-react";

const MawaidReport = () => {
  const [sites, setSites] = useState([]);
  const [selectedSite, setSelectedSite] = useState("");
  const [dateFrom, setDateFrom] = useState(new Date().toISOString().split("T")[0]);
  const [dateTo, setDateTo] = useState(new Date().toISOString().split("T")[0]);

  const [sessions, setSessions] = useState([]);
  const [servings, setServings] = useState([]);
  const [stock, setStock] = useState([]);
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [batches, setBatches] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadSites = async () => {
      try {
        const { data, error: err } = await supabase
          .from("mawaid_sites")
          .select("id, name")
          .eq("is_active", true)
          .order("name");
        if (err) throw err;
        setSites(data || []);
        if (data && data.length > 0) setSelectedSite(data[0].id);
      } catch (err) {
        console.error("Failed to load sites", err);
        setError(err.message || "Unable to load sites");
        setLoading(false);
      }
    };
    loadSites();
  }, []);

  useEffect(() => {
    const loadData = async () => {
      if (!selectedSite) return;
      try {
        setLoading(true);
        setError("");

        const { data: sessionData, error: sessionErr } = await supabase
          .from("mawaid_meal_sessions")
          .select("*")
          .eq("site_id", selectedSite)
          .gte("service_date", dateFrom)
          .lte("service_date", dateTo)
          .order("service_date, meal_type");
        if (sessionErr) throw sessionErr;

        let servingData = [];
        if (sessionData && sessionData.length > 0) {
          const ids = sessionData.map((s) => s.id);
          const { data, error: servErr } = await supabase
            .from("mawaid_serving_sessions")
            .select("*, meal_session:mawaid_meal_sessions(service_date, meal_type, site_id)")
            .in("meal_session_id", ids);
          if (servErr) throw servErr;
          servingData = data || [];
        }

        const [{ data: stockData, error: stockErr }, { data: poData, error: poErr }, { data: batchData, error: batchErr }] =
          await Promise.all([
            supabase
              .from("mawaid_stock")
              .select("*, item:mawaid_items(name, category, unit, min_stock)")
              .eq("site_id", selectedSite),
            supabase
              .from("mawaid_purchase_orders")
              .select("*, vendor:mawaid_vendors(name)")
              .eq("site_id", selectedSite)
              .gte("order_date", dateFrom)
              .lte("order_date", dateTo),
            supabase
              .from("mawaid_production_batches")
              .select("*, recipe:mawaid_recipes(name)")
              .eq("site_id", selectedSite)
              .gte("production_date", dateFrom)
              .lte("production_date", dateTo),
          ]);

        if (stockErr) throw stockErr;
        if (poErr) throw poErr;
        if (batchErr) throw batchErr;

        setSessions(sessionData || []);
        setServings(servingData || []);
        setStock(stockData || []);
        setPurchaseOrders(poData || []);
        setBatches(batchData || []);
      } catch (err) {
        console.error("Failed to load mawaid data", err);
        setError(err.message || "Unable to load mawaid data");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [selectedSite, dateFrom, dateTo]);

  const stats = useMemo(() => {
    const plannedMeals = sessions.length;
    const plannedPeople = sessions.reduce((sum, s) => sum + (s.planned_people || 0), 0);
    const plannedThals = sessions.reduce((sum, s) => sum + (s.planned_thals || 0), 0);

    const actualPeople = servings.reduce((sum, s) => sum + (s.actual_people || 0), 0);
    const actualThals = servings.reduce((sum, s) => sum + (s.actual_thals || 0), 0);

    const fulfillmentPeople = plannedPeople ? ((actualPeople / plannedPeople) * 100).toFixed(1) : "0.0";
    const fulfillmentThals = plannedThals ? ((actualThals / plannedThals) * 100).toFixed(1) : "0.0";
    const avgActualPerMeal = plannedMeals ? (actualPeople / plannedMeals).toFixed(1) : "0.0";

    const totalSpend = purchaseOrders.reduce((sum, po) => sum + (po.total_amount || 0), 0);
    const lowStock = stock.filter((s) => s.quantity <= (s.item?.min_stock || 0));

    const vendorSpend = purchaseOrders.reduce((acc, po) => {
      const key = po.vendor?.name || "Unknown";
      acc[key] = (acc[key] || 0) + (po.total_amount || 0);
      return acc;
    }, {});

    const productionCount = batches.length;
    const producedTotal = batches.reduce((sum, b) => sum + (b.quantity_produced || 0), 0);
    const productionByRecipe = batches.reduce((acc, b) => {
      const key = b.recipe?.name || "Unknown";
      acc[key] = (acc[key] || 0) + (b.quantity_produced || 0);
      return acc;
    }, {});

    const varianceThals = plannedThals ? (((actualThals - plannedThals) / plannedThals) * 100).toFixed(1) : "0.0";

    return {
      plannedMeals,
      plannedPeople,
      plannedThals,
      actualPeople,
      actualThals,
      fulfillmentPeople,
      fulfillmentThals,
      avgActualPerMeal,
      totalSpend,
      lowStock,
      vendorSpend,
      productionCount,
      producedTotal,
      productionByRecipe,
      varianceThals,
    };
  }, [sessions, servings, stock, purchaseOrders, batches]);

  const topList = (obj, limit = 5) =>
    Object.entries(obj || {})
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit);

  if (loading) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">Mawaid Report</h1>
        <div className="flex items-center gap-3 text-gray-600">
          <div className="h-10 w-10 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
          <div>Loading mawaid data...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">Mawaid Report</h1>
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded">{error}</div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Mawaid Overview</h1>
          <p className="text-gray-600">Meals, production, stock alerts, and spend for the selected window.</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Filter className="w-4 h-4" />
          <span>{stats.plannedMeals} meal sessions</span>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Site</label>
            <select
              value={selectedSite}
              onChange={(e) => setSelectedSite(e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2"
            >
              {sites.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">From</label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">To</label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Planned People" value={stats.plannedPeople} icon={<Utensils className="w-4 h-4 text-amber-600" />} />
        <StatCard title="Actual People Served" value={stats.actualPeople} icon={<Utensils className="w-4 h-4 text-green-600" />} />
        <StatCard title="People Fulfillment" value={`${stats.fulfillmentPeople}%`} />
        <StatCard title="Thals Fulfillment" value={`${stats.fulfillmentThals}%`} />
        <StatCard title="Avg People / Meal" value={stats.avgActualPerMeal} />
        <StatCard title="Purchase Spend" value={`Rs. ${stats.totalSpend.toFixed(2)}`} icon={<ShoppingCart className="w-4 h-4 text-blue-600" />} />
        <StatCard title="Low Stock Items" value={stats.lowStock.length} icon={<AlertTriangle className="w-4 h-4 text-red-600" />} />
        <StatCard title="Production" value={`${stats.productionCount} batches`} icon={<TrendingUp className="w-4 h-4 text-purple-600" />} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <BreakdownCard
          title="Planned vs Actual"
          data={{
            "Planned People": stats.plannedPeople,
            "Actual People": stats.actualPeople,
            "Planned Thals": stats.plannedThals,
            "Actual Thals": stats.actualThals,
            "Thal Variance %": `${stats.varianceThals}%`,
          }}
        />
        <BreakdownCard
          title="Top Vendors (Spend)"
          data={Object.fromEntries(topList(stats.vendorSpend, 5).map(([k, v]) => [k, `Rs. ${v.toFixed(2)}`]))}
          icon={<ShoppingCart className="w-4 h-4 text-blue-600" />}
        />
        <BreakdownCard
          title="Top Production (Servings)"
          data={Object.fromEntries(topList(stats.productionByRecipe, 5))}
          icon={<TrendingUp className="w-4 h-4 text-purple-600" />}
        />
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-3">
          <AlertTriangle className="w-4 h-4 text-red-600" />
          <h3 className="font-semibold text-gray-800">Low Stock Alerts</h3>
        </div>
        {stats.lowStock.length === 0 ? (
          <div className="text-sm text-gray-500">All tracked items are above minimums.</div>
        ) : (
          <div className="space-y-2 text-sm">
            {stats.lowStock.slice(0, 8).map((s) => (
              <div key={s.id} className="flex items-center justify-between">
                <span className="text-gray-700">
                  {s.item?.name} ({s.item?.unit})
                </span>
                <span className="text-red-700">
                  {s.quantity} / Min {s.item?.min_stock || 0}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-3">
          <Lightbulb className="w-5 h-5 text-amber-500" />
          <h3 className="font-semibold text-gray-800">Cost Control & Leakage Prevention</h3>
        </div>
        <ul className="list-disc pl-5 text-sm text-gray-700 space-y-2">
          <li>Compare planned vs. actual thals daily; investigate >10% overrun to curb over-serving or pilferage.</li>
          <li>Require dual sign-off on GRN vs. PO totals; flag vendors with sudden price jumps in Top Vendors list.</li>
          <li>Limit issuance of high-value items to production batches with matching recipes to prevent unauthorized use.</li>
          <li>Rotate stock to minimize waste; prioritize low-stock and expiring items in upcoming meal plans.</li>
          <li>Run surprise counts on items with chronic low-stock alerts; reconcile variances against serving totals.</li>
        </ul>
      </div>
    </div>
  );
};

const StatCard = ({ title, value, icon }) => (
  <div className="bg-white border border-gray-200 rounded-lg p-4">
    <div className="flex items-center justify-between mb-2">
      <div className="text-sm text-gray-600">{title}</div>
      {icon}
    </div>
    <div className="text-2xl font-semibold text-gray-900">{value}</div>
  </div>
);

const BreakdownCard = ({ title, data, icon }) => {
  const entries = Object.entries(data || {});
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <div className="flex items-center gap-2 mb-3">
        {icon}
        <h3 className="font-semibold text-gray-800">{title}</h3>
      </div>
      {entries.length === 0 ? (
        <div className="text-sm text-gray-500">No data</div>
      ) : (
        <div className="space-y-2">
          {entries.map(([key, val]) => (
            <div key={key} className="flex items-center justify-between text-sm">
              <span className="text-gray-700">{key}</span>
              <span className="font-semibold">{val}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MawaidReport;
