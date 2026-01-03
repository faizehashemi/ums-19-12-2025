/* SQL:
-- Reports use existing tables with aggregation queries
-- Key tables: mawaid_meal_sessions, mawaid_serving_sessions,
-- mawaid_stock, mawaid_purchase_orders, mawaid_production_batches
*/

import { useState, useEffect } from "react";
import { supabase } from "../../../lib/supabase";

const MawaidReports = () => {
  const [reportType, setReportType] = useState("daily_summary"); // daily_summary, stock_status, vendor_purchases, production_summary
  const [sites, setSites] = useState([]);
  const [selectedSite, setSelectedSite] = useState("");
  const [dateFrom, setDateFrom] = useState(new Date().toISOString().split("T")[0]);
  const [dateTo, setDateTo] = useState(new Date().toISOString().split("T")[0]);
  const [reportData, setReportData] = useState(null);

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadSites();
  }, []);

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

  const generateDailySummary = async () => {
    setLoading(true);

    // Get meal sessions
    const { data: sessions, error: sessError } = await supabase
      .from("mawaid_meal_sessions")
      .select("*")
      .eq("site_id", selectedSite)
      .gte("service_date", dateFrom)
      .lte("service_date", dateTo)
      .order("service_date, meal_type");

    if (sessError) {
      setError(`RLS blocked action: ${sessError.message}`);
      setLoading(false);
      return;
    }

    // Get serving sessions
    const { data: servings, error: servError } = await supabase
      .from("mawaid_serving_sessions")
      .select(`
        *,
        meal_session:mawaid_meal_sessions(service_date, meal_type)
      `)
      .in("meal_session_id", sessions.map(s => s.id));

    if (servError) {
      setError(`RLS blocked action: ${servError.message}`);
      setLoading(false);
      return;
    }

    // Group by date
    const byDate = {};
    sessions.forEach(s => {
      if (!byDate[s.service_date]) {
        byDate[s.service_date] = { planned_people: 0, planned_thals: 0, actual_people: 0, actual_thals: 0, meals: 0 };
      }
      byDate[s.service_date].planned_people += s.planned_people || 0;
      byDate[s.service_date].planned_thals += s.planned_thals || 0;
      byDate[s.service_date].meals += 1;
    });

    servings?.forEach(s => {
      const date = s.meal_session?.service_date;
      if (date && byDate[date]) {
        byDate[date].actual_people += s.actual_people || 0;
        byDate[date].actual_thals += s.actual_thals || 0;
      }
    });

    setReportData({ type: "daily_summary", data: byDate });
    setLoading(false);
  };

  const generateStockStatus = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("mawaid_stock")
      .select(`
        *,
        item:mawaid_items(name, category, unit, min_stock),
        site:mawaid_sites(name)
      `)
      .eq("site_id", selectedSite)
      .order("item(category), item(name)");

    if (error) {
      setError(`RLS blocked action: ${error.message}`);
    } else {
      const lowStock = data?.filter(s => s.quantity <= (s.item?.min_stock || 0)) || [];
      const byCategory = {};
      data?.forEach(s => {
        const cat = s.item?.category || "Uncategorized";
        if (!byCategory[cat]) byCategory[cat] = [];
        byCategory[cat].push(s);
      });
      setReportData({ type: "stock_status", data, lowStock, byCategory });
    }
    setLoading(false);
  };

  const generateVendorPurchases = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("mawaid_purchase_orders")
      .select(`
        *,
        vendor:mawaid_vendors(name),
        site:mawaid_sites(name)
      `)
      .eq("site_id", selectedSite)
      .gte("order_date", dateFrom)
      .lte("order_date", dateTo)
      .order("order_date", { ascending: false });

    if (error) {
      setError(`RLS blocked action: ${error.message}`);
    } else {
      const byVendor = {};
      let totalAmount = 0;
      data?.forEach(po => {
        const vendorName = po.vendor?.name || "Unknown";
        if (!byVendor[vendorName]) {
          byVendor[vendorName] = { count: 0, totalAmount: 0, orders: [] };
        }
        byVendor[vendorName].count += 1;
        byVendor[vendorName].totalAmount += po.total_amount || 0;
        byVendor[vendorName].orders.push(po);
        totalAmount += po.total_amount || 0;
      });
      setReportData({ type: "vendor_purchases", data, byVendor, totalAmount });
    }
    setLoading(false);
  };

  const generateProductionSummary = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("mawaid_production_batches")
      .select(`
        *,
        recipe:mawaid_recipes(name),
        site:mawaid_sites(name)
      `)
      .eq("site_id", selectedSite)
      .gte("production_date", dateFrom)
      .lte("production_date", dateTo)
      .order("production_date", { ascending: false });

    if (error) {
      setError(`RLS blocked action: ${error.message}`);
    } else {
      const byRecipe = {};
      let totalProduced = 0;
      data?.forEach(batch => {
        const recipeName = batch.recipe?.name || "Unknown";
        if (!byRecipe[recipeName]) {
          byRecipe[recipeName] = { count: 0, totalProduced: 0 };
        }
        byRecipe[recipeName].count += 1;
        byRecipe[recipeName].totalProduced += batch.quantity_produced || 0;
        totalProduced += batch.quantity_produced || 0;
      });
      setReportData({ type: "production_summary", data, byRecipe, totalProduced });
    }
    setLoading(false);
  };

  const handleGenerateReport = () => {
    setError("");
    setReportData(null);
    switch (reportType) {
      case "daily_summary":
        generateDailySummary();
        break;
      case "stock_status":
        generateStockStatus();
        break;
      case "vendor_purchases":
        generateVendorPurchases();
        break;
      case "production_summary":
        generateProductionSummary();
        break;
      default:
        break;
    }
  };

  return (
    <div className="p-4 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Mawaid Reports</h1>

      {error && (
        <div className="bg-red-50 border border-red-300 text-red-800 px-4 py-2 rounded mb-4">
          {error}
        </div>
      )}

      <div className="bg-gray-50 border border-gray-300 rounded p-4 mb-4">
        <h2 className="font-semibold mb-3">Report Parameters</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Report Type</label>
            <select
              className="w-full border border-gray-300 rounded px-3 py-2"
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
            >
              <option value="daily_summary">Daily Summary</option>
              <option value="stock_status">Stock Status</option>
              <option value="vendor_purchases">Vendor Purchases</option>
              <option value="production_summary">Production Summary</option>
            </select>
          </div>
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
          {reportType !== "stock_status" && (
            <>
              <div>
                <label className="block text-sm font-medium mb-1">From Date</label>
                <input
                  type="date"
                  className="w-full border border-gray-300 rounded px-3 py-2"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">To Date</label>
                <input
                  type="date"
                  className="w-full border border-gray-300 rounded px-3 py-2"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                />
              </div>
            </>
          )}
        </div>
        <button
          onClick={handleGenerateReport}
          disabled={loading || !selectedSite}
          className="mt-4 bg-blue-600 text-white px-6 py-2 rounded disabled:bg-gray-300"
        >
          {loading ? "Generating..." : "Generate Report"}
        </button>
      </div>

      {reportData && reportData.type === "daily_summary" && (
        <div className="bg-white border border-gray-300 rounded p-4">
          <h2 className="text-xl font-semibold mb-3">Daily Summary Report</h2>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-gray-300 px-4 py-2 text-left">Date</th>
                  <th className="border border-gray-300 px-4 py-2 text-right">Meals</th>
                  <th className="border border-gray-300 px-4 py-2 text-right">Planned People</th>
                  <th className="border border-gray-300 px-4 py-2 text-right">Planned Thals</th>
                  <th className="border border-gray-300 px-4 py-2 text-right">Actual People</th>
                  <th className="border border-gray-300 px-4 py-2 text-right">Actual Thals</th>
                  <th className="border border-gray-300 px-4 py-2 text-right">Variance %</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(reportData.data).map(([date, stats]) => {
                  const variance = stats.planned_people > 0
                    ? ((stats.actual_people - stats.planned_people) / stats.planned_people * 100).toFixed(1)
                    : 0;
                  return (
                    <tr key={date}>
                      <td className="border border-gray-300 px-4 py-2">{date}</td>
                      <td className="border border-gray-300 px-4 py-2 text-right">{stats.meals}</td>
                      <td className="border border-gray-300 px-4 py-2 text-right">{stats.planned_people}</td>
                      <td className="border border-gray-300 px-4 py-2 text-right">{stats.planned_thals}</td>
                      <td className="border border-gray-300 px-4 py-2 text-right">{stats.actual_people}</td>
                      <td className="border border-gray-300 px-4 py-2 text-right">{stats.actual_thals}</td>
                      <td className={`border border-gray-300 px-4 py-2 text-right ${
                        Math.abs(variance) > 10 ? "bg-yellow-100" : ""
                      }`}>
                        {variance}%
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {reportData && reportData.type === "stock_status" && (
        <div className="space-y-4">
          <div className="bg-white border border-gray-300 rounded p-4">
            <h2 className="text-xl font-semibold mb-3">Stock Status Report</h2>
            {reportData.lowStock.length > 0 && (
              <div className="bg-red-50 border border-red-300 rounded p-3 mb-4">
                <h3 className="font-semibold text-red-800">Low Stock Alert ({reportData.lowStock.length} items)</h3>
                <div className="mt-2 space-y-1">
                  {reportData.lowStock.map(s => (
                    <div key={s.id} className="text-sm text-red-700">
                      {s.item?.name}: {s.quantity} {s.item?.unit} (Min: {s.item?.min_stock})
                    </div>
                  ))}
                </div>
              </div>
            )}
            {Object.entries(reportData.byCategory).map(([category, items]) => (
              <div key={category} className="mb-4">
                <h3 className="font-semibold text-lg mb-2">{category}</h3>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="border border-gray-300 px-4 py-2 text-left">Item</th>
                        <th className="border border-gray-300 px-4 py-2 text-right">Quantity</th>
                        <th className="border border-gray-300 px-4 py-2 text-right">Min Stock</th>
                        <th className="border border-gray-300 px-4 py-2 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map(item => {
                        const isLow = item.quantity <= (item.item?.min_stock || 0);
                        return (
                          <tr key={item.id} className={isLow ? "bg-red-50" : ""}>
                            <td className="border border-gray-300 px-4 py-2">{item.item?.name}</td>
                            <td className="border border-gray-300 px-4 py-2 text-right">
                              {item.quantity} {item.item?.unit}
                            </td>
                            <td className="border border-gray-300 px-4 py-2 text-right">
                              {item.item?.min_stock} {item.item?.unit}
                            </td>
                            <td className="border border-gray-300 px-4 py-2 text-center">
                              {isLow ? (
                                <span className="text-xs bg-red-600 text-white px-2 py-1 rounded">LOW</span>
                              ) : (
                                <span className="text-xs bg-green-600 text-white px-2 py-1 rounded">OK</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {reportData && reportData.type === "vendor_purchases" && (
        <div className="bg-white border border-gray-300 rounded p-4">
          <h2 className="text-xl font-semibold mb-3">Vendor Purchases Report</h2>
          <div className="bg-blue-50 border border-blue-300 rounded p-3 mb-4">
            <div className="text-lg font-semibold">Total Purchases: Rs. {reportData.totalAmount.toFixed(2)}</div>
          </div>
          {Object.entries(reportData.byVendor).map(([vendor, stats]) => (
            <div key={vendor} className="mb-4 border-b pb-4">
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-semibold text-lg">{vendor}</h3>
                <div className="text-right">
                  <div className="text-sm text-gray-600">{stats.count} orders</div>
                  <div className="font-semibold">Rs. {stats.totalAmount.toFixed(2)}</div>
                </div>
              </div>
              <div className="space-y-1">
                {stats.orders.map(po => (
                  <div key={po.id} className="text-sm flex justify-between bg-gray-50 p-2 rounded">
                    <span>{po.po_number} - {po.order_date}</span>
                    <span className={`px-2 py-1 rounded text-xs ${
                      po.status === "received" ? "bg-green-100 text-green-800" :
                      po.status === "partial" ? "bg-yellow-100 text-yellow-800" :
                      "bg-gray-100 text-gray-800"
                    }`}>
                      {po.status} - Rs. {po.total_amount?.toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {reportData && reportData.type === "production_summary" && (
        <div className="bg-white border border-gray-300 rounded p-4">
          <h2 className="text-xl font-semibold mb-3">Production Summary Report</h2>
          <div className="bg-blue-50 border border-blue-300 rounded p-3 mb-4">
            <div className="text-lg font-semibold">Total Produced: {reportData.totalProduced} servings</div>
            <div className="text-sm text-gray-600">{reportData.data.length} batches</div>
          </div>
          <div className="overflow-x-auto mb-4">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-gray-300 px-4 py-2 text-left">Recipe</th>
                  <th className="border border-gray-300 px-4 py-2 text-right">Batches</th>
                  <th className="border border-gray-300 px-4 py-2 text-right">Total Servings</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(reportData.byRecipe).map(([recipe, stats]) => (
                  <tr key={recipe}>
                    <td className="border border-gray-300 px-4 py-2">{recipe}</td>
                    <td className="border border-gray-300 px-4 py-2 text-right">{stats.count}</td>
                    <td className="border border-gray-300 px-4 py-2 text-right">{stats.totalProduced}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div>
            <h3 className="font-semibold mb-2">All Batches</h3>
            <div className="space-y-1">
              {reportData.data.map(batch => (
                <div key={batch.id} className="text-sm flex justify-between bg-gray-50 p-2 rounded">
                  <div>
                    <span className="font-medium">{batch.batch_number}</span>
                    <span className="text-gray-600 ml-2">{batch.recipe?.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span>{batch.quantity_produced} servings</span>
                    <span className={`px-2 py-1 rounded text-xs ${
                      batch.status === "completed" ? "bg-green-100 text-green-800" :
                      batch.status === "in_progress" ? "bg-blue-100 text-blue-800" :
                      "bg-yellow-100 text-yellow-800"
                    }`}>
                      {batch.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {!reportData && !loading && (
        <div className="text-center text-gray-500 py-12">
          Select parameters and click "Generate Report" to view data
        </div>
      )}
    </div>
  );
};

export default MawaidReports;
