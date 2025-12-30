/* SQL:
CREATE TABLE mawaid_menu_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID REFERENCES mawaid_sites(id),
  service_date DATE NOT NULL,
  meal_type TEXT NOT NULL,
  items_json JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(site_id, service_date, meal_type)
);
*/

import { useState, useEffect } from "react";
import { supabase } from "../../../lib/supabaseClient";

const MEAL_TYPES = [
  "breakfast", "lunch", "dinner", "labor_lunch", "labor_dinner",
  "vip_dinner", "airport_tosha", "atraaf_tosha", "medina_tosha"
];

const MenuPlanning = () => {
  const [sites, setSites] = useState([]);
  const [recipes, setRecipes] = useState([]);
  const [selectedSite, setSelectedSite] = useState("");
  const [startDate, setStartDate] = useState(new Date().toISOString().split("T")[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split("T")[0]);
  const [selectedMeal, setSelectedMeal] = useState("lunch");
  const [menuPlans, setMenuPlans] = useState([]);
  const [showItemForm, setShowItemForm] = useState(false);
  const [currentPlan, setCurrentPlan] = useState(null);
  const [itemName, setItemName] = useState("");
  const [selectedRecipe, setSelectedRecipe] = useState("");
  const [servingStyle, setServingStyle] = useState("");
  const [itemNotes, setItemNotes] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [ingredientDemand, setIngredientDemand] = useState([]);

  useEffect(() => {
    loadSites();
    loadRecipes();
  }, []);

  useEffect(() => {
    if (selectedSite && startDate && endDate && selectedMeal) {
      loadMenuPlans();
    }
  }, [selectedSite, startDate, endDate, selectedMeal]);

  const loadSites = async () => {
    const { data, error } = await supabase
      .from("mawaid_sites")
      .select("*")
      .eq("is_active", true)
      .order("name");

    if (error) {
      setError(`RLS blocked: ${error.message}`);
    } else {
      setSites(data || []);
      if (data?.length > 0) setSelectedSite(data[0].id);
    }
  };

  const loadRecipes = async () => {
    const { data, error } = await supabase
      .from("mawaid_recipes")
      .select("*")
      .eq("is_active", true)
      .order("name");

    if (error) {
      setError(`RLS blocked: ${error.message}`);
    } else {
      setRecipes(data || []);
    }
  };

  const loadMenuPlans = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("mawaid_menu_plans")
      .select("*")
      .eq("site_id", selectedSite)
      .eq("meal_type", selectedMeal)
      .gte("service_date", startDate)
      .lte("service_date", endDate)
      .order("service_date");

    if (error) {
      setError(`RLS blocked: ${error.message}`);
    } else {
      setMenuPlans(data || []);
      await computeIngredientDemand(data || []);
    }
    setLoading(false);
  };

  const computeIngredientDemand = async (plans) => {
    const recipeIds = [];
    plans.forEach(p => {
      const items = p.items_json || [];
      items.forEach(item => {
        if (item.recipe_id) recipeIds.push(item.recipe_id);
      });
    });

    if (recipeIds.length === 0) {
      setIngredientDemand([]);
      return;
    }

    const { data, error } = await supabase
      .from("mawaid_recipe_ingredients")
      .select("*, mawaid_items(name, base_unit)")
      .in("recipe_id", recipeIds);

    if (error) {
      setError(`RLS blocked: ${error.message}`);
      return;
    }

    const aggregated = {};
    (data || []).forEach(ing => {
      const key = ing.item_id;
      if (!aggregated[key]) {
        aggregated[key] = {
          item_name: ing.mawaid_items?.name || "Unknown",
          unit: ing.unit,
          total_qty: 0
        };
      }
      aggregated[key].total_qty += parseFloat(ing.qty || 0);
    });

    setIngredientDemand(Object.values(aggregated));
  };

  const openItemForm = (plan) => {
    setCurrentPlan(plan);
    setItemName("");
    setSelectedRecipe("");
    setServingStyle("");
    setItemNotes("");
    setShowItemForm(true);
  };

  const addItemToPlan = async () => {
    if (!itemName.trim()) {
      setError("Item name is required");
      return;
    }

    const newItem = {
      menu_item_name: itemName.trim(),
      recipe_id: selectedRecipe || null,
      serving_style: servingStyle,
      notes: itemNotes
    };

    const existingItems = currentPlan?.items_json || [];
    const updatedItems = [...existingItems, newItem];

    const { error } = await supabase
      .from("mawaid_menu_plans")
      .upsert({
        id: currentPlan?.id,
        site_id: selectedSite,
        service_date: currentPlan.service_date,
        meal_type: selectedMeal,
        items_json: updatedItems
      }, { onConflict: "site_id,service_date,meal_type" });

    if (error) {
      setError(`RLS blocked: ${error.message}`);
    } else {
      setShowItemForm(false);
      loadMenuPlans();
    }
  };

  const copyYesterdayMenu = async (targetDate) => {
    const yesterday = new Date(targetDate);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split("T")[0];

    const { data, error } = await supabase
      .from("mawaid_menu_plans")
      .select("*")
      .eq("site_id", selectedSite)
      .eq("meal_type", selectedMeal)
      .eq("service_date", yesterdayStr)
      .maybeSingle();

    if (error || !data) {
      setError("No menu found for yesterday");
      return;
    }

    const { error: insertError } = await supabase
      .from("mawaid_menu_plans")
      .upsert({
        site_id: selectedSite,
        service_date: targetDate,
        meal_type: selectedMeal,
        items_json: data.items_json
      }, { onConflict: "site_id,service_date,meal_type" });

    if (insertError) {
      setError(`RLS blocked: ${insertError.message}`);
    } else {
      loadMenuPlans();
    }
  };

  const getDatesInRange = () => {
    const dates = [];
    const current = new Date(startDate);
    const end = new Date(endDate);
    while (current <= end) {
      dates.push(current.toISOString().split("T")[0]);
      current.setDate(current.getDate() + 1);
    }
    return dates;
  };

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Menu Planning</h1>

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
                {s.name}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Start Date</label>
            <input
              type="date"
              className="w-full border border-gray-300 rounded px-3 py-2"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">End Date</label>
            <input
              type="date"
              className="w-full border border-gray-300 rounded px-3 py-2"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
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
          <div className="h-20 bg-gray-200 rounded"></div>
        </div>
      ) : (
        <div className="space-y-6">
          {getDatesInRange().map(date => {
            const plan = menuPlans.find(p => p.service_date === date) || { service_date: date, items_json: [] };
            return (
              <div key={date} className="border border-gray-300 rounded p-4">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-semibold">{new Date(date + "T00:00").toLocaleDateString()}</h3>
                  <div className="space-x-2">
                    <button
                      onClick={() => copyYesterdayMenu(date)}
                      className="text-sm text-blue-600 hover:underline"
                    >
                      Copy Yesterday
                    </button>
                    <button
                      onClick={() => openItemForm(plan)}
                      className="text-sm bg-blue-600 text-white px-3 py-1 rounded"
                    >
                      Add Item
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  {plan.items_json?.length === 0 && (
                    <p className="text-sm text-gray-400">No items planned</p>
                  )}
                  {plan.items_json?.map((item, idx) => (
                    <div key={idx} className="bg-gray-50 p-2 rounded text-sm">
                      <div className="font-medium">{item.menu_item_name}</div>
                      {item.recipe_id && (
                        <div className="text-xs text-gray-600">
                          Recipe: {recipes.find(r => r.id === item.recipe_id)?.name || "Unknown"}
                        </div>
                      )}
                      {item.serving_style && (
                        <div className="text-xs text-gray-600">Style: {item.serving_style}</div>
                      )}
                      {item.notes && (
                        <div className="text-xs text-gray-600">{item.notes}</div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {ingredientDemand.length > 0 && (
        <div className="mt-6 border border-blue-300 bg-blue-50 rounded p-4">
          <h3 className="font-semibold mb-2">Aggregated Ingredient Demand</h3>
          <div className="space-y-1">
            {ingredientDemand.map((item, idx) => (
              <div key={idx} className="text-sm">
                {item.item_name}: {item.total_qty.toFixed(2)} {item.unit}
              </div>
            ))}
          </div>
        </div>
      )}

      {showItemForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end md:items-center justify-center z-50">
          <div className="bg-white w-full md:w-96 md:rounded-lg p-6 max-h-screen overflow-y-auto">
            <h2 className="text-lg font-bold mb-4">Add Menu Item</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Item Name</label>
                <input
                  type="text"
                  className="w-full border border-gray-300 rounded px-3 py-2"
                  value={itemName}
                  onChange={(e) => setItemName(e.target.value)}
                  placeholder="e.g. Chicken Biryani"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Link Recipe (optional)</label>
                <select
                  className="w-full border border-gray-300 rounded px-3 py-2"
                  value={selectedRecipe}
                  onChange={(e) => setSelectedRecipe(e.target.value)}
                >
                  <option value="">None</option>
                  {recipes.map(r => (
                    <option key={r.id} value={r.id}>{r.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Serving Style</label>
                <input
                  type="text"
                  className="w-full border border-gray-300 rounded px-3 py-2"
                  value={servingStyle}
                  onChange={(e) => setServingStyle(e.target.value)}
                  placeholder="e.g. Buffet, Plated"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Notes</label>
                <textarea
                  className="w-full border border-gray-300 rounded px-3 py-2"
                  rows={2}
                  value={itemNotes}
                  onChange={(e) => setItemNotes(e.target.value)}
                  placeholder="Any special notes"
                />
              </div>
            </div>

            <div className="flex gap-2 mt-6">
              <button
                onClick={() => setShowItemForm(false)}
                className="flex-1 bg-gray-300 text-gray-800 py-2 rounded"
              >
                Cancel
              </button>
              <button
                onClick={addItemToPlan}
                className="flex-1 bg-blue-600 text-white py-2 rounded"
              >
                Add
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MenuPlanning;
