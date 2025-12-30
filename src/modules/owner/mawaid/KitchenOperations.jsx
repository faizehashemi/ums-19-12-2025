/* SQL:
CREATE TABLE mawaid_production_batches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID REFERENCES mawaid_sites(id),
  recipe_id UUID REFERENCES mawaid_recipes(id),
  batch_number TEXT UNIQUE NOT NULL,
  production_date DATE NOT NULL,
  quantity_produced NUMERIC NOT NULL,
  status TEXT DEFAULT 'planned', -- planned, in_progress, completed, cancelled
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE mawaid_ingredient_issues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id UUID REFERENCES mawaid_production_batches(id) ON DELETE CASCADE,
  item_id UUID REFERENCES mawaid_items(id),
  quantity_issued NUMERIC NOT NULL,
  issued_at TIMESTAMPTZ DEFAULT now()
);
*/

import { useState, useEffect } from "react";
import { supabase } from "../../../lib/supabaseClient";

const KitchenOperations = () => {
  const [view, setView] = useState("batches"); // batches, batch_form, issue_ingredients
  const [sites, setSites] = useState([]);
  const [selectedSite, setSelectedSite] = useState("");
  const [recipes, setRecipes] = useState([]);
  const [batches, setBatches] = useState([]);
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [recipeDetails, setRecipeDetails] = useState(null);
  const [items, setItems] = useState([]);

  const [batchForm, setBatchForm] = useState({
    recipe_id: "",
    production_date: new Date().toISOString().split("T")[0],
    quantity_produced: "",
    notes: ""
  });

  const [ingredientIssues, setIngredientIssues] = useState([]);

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadSites();
    loadRecipes();
    loadItems();
  }, []);

  useEffect(() => {
    if (selectedSite && view === "batches") {
      loadBatches();
    }
  }, [selectedSite, view]);

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

  const loadRecipes = async () => {
    const { data, error } = await supabase
      .from("mawaid_recipes")
      .select("*")
      .eq("is_active", true)
      .order("name");
    if (error) setError(`RLS blocked action: ${error.message}`);
    else setRecipes(data || []);
  };

  const loadItems = async () => {
    const { data, error } = await supabase
      .from("mawaid_items")
      .select("*")
      .eq("is_active", true)
      .order("name");
    if (error) setError(`RLS blocked action: ${error.message}`);
    else setItems(data || []);
  };

  const loadBatches = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("mawaid_production_batches")
      .select(`
        *,
        recipe:mawaid_recipes(name, base_servings),
        site:mawaid_sites(name)
      `)
      .eq("site_id", selectedSite)
      .order("production_date", { ascending: false })
      .limit(50);
    if (error) setError(`RLS blocked action: ${error.message}`);
    else setBatches(data || []);
    setLoading(false);
  };

  const loadRecipeDetails = async (recipeId) => {
    const { data, error } = await supabase
      .from("mawaid_recipe_ingredients")
      .select(`
        *,
        item:mawaid_items(name, unit)
      `)
      .eq("recipe_id", recipeId);
    if (error) {
      setError(`RLS blocked action: ${error.message}`);
      return null;
    }
    return data || [];
  };

  const handleCreateBatch = async () => {
    if (!batchForm.recipe_id || !batchForm.quantity_produced || !selectedSite) {
      setError("Recipe, quantity, and site are required");
      return;
    }

    setLoading(true);
    const batchNumber = `BATCH-${Date.now()}`;

    const { data: batch, error: batchError } = await supabase
      .from("mawaid_production_batches")
      .insert({
        site_id: selectedSite,
        recipe_id: batchForm.recipe_id,
        batch_number: batchNumber,
        production_date: batchForm.production_date,
        quantity_produced: parseFloat(batchForm.quantity_produced),
        status: "planned",
        notes: batchForm.notes
      })
      .select()
      .single();

    if (batchError) {
      setError(`RLS blocked action: ${batchError.message}`);
    } else {
      setError("");
      setBatchForm({
        recipe_id: "",
        production_date: new Date().toISOString().split("T")[0],
        quantity_produced: "",
        notes: ""
      });
      loadBatches();
      setView("batches");
    }
    setLoading(false);
  };

  const handlePrepareIngredientIssue = async (batch) => {
    setSelectedBatch(batch);
    const ingredients = await loadRecipeDetails(batch.recipe_id);
    if (ingredients) {
      setRecipeDetails(ingredients);
      // Calculate scaled quantities based on batch quantity
      const scaleFactor = batch.quantity_produced / (batch.recipe?.base_servings || 1);
      setIngredientIssues(ingredients.map(ing => ({
        item_id: ing.item_id,
        item_name: ing.item.name,
        unit: ing.item.unit,
        base_quantity: ing.quantity,
        scaled_quantity: (ing.quantity * scaleFactor).toFixed(2),
        quantity_to_issue: (ing.quantity * scaleFactor).toFixed(2)
      })));
      setView("issue_ingredients");
    }
  };

  const handleIssueIngredients = async () => {
    if (!selectedBatch || ingredientIssues.length === 0) {
      setError("No ingredients to issue");
      return;
    }

    setLoading(true);

    // Insert ingredient issues
    const issues = ingredientIssues.map(ing => ({
      batch_id: selectedBatch.id,
      item_id: ing.item_id,
      quantity_issued: parseFloat(ing.quantity_to_issue)
    }));

    const { error: issueError } = await supabase
      .from("mawaid_ingredient_issues")
      .insert(issues);

    if (issueError) {
      setError(`RLS blocked action: ${issueError.message}`);
      setLoading(false);
      return;
    }

    // Update stock for each ingredient
    for (const ing of ingredientIssues) {
      // Record stock movement
      await supabase
        .from("mawaid_stock_movements")
        .insert({
          site_id: selectedSite,
          item_id: ing.item_id,
          movement_type: "issue",
          quantity: parseFloat(ing.quantity_to_issue),
          reference_id: selectedBatch.id,
          notes: `Issued for ${selectedBatch.batch_number}`
        });

      // Update stock quantity
      const { data: currentStock } = await supabase
        .from("mawaid_stock")
        .select("quantity")
        .eq("site_id", selectedSite)
        .eq("item_id", ing.item_id)
        .maybeSingle();

      if (currentStock) {
        const newQty = currentStock.quantity - parseFloat(ing.quantity_to_issue);
        await supabase
          .from("mawaid_stock")
          .update({
            quantity: newQty,
            last_updated: new Date().toISOString()
          })
          .eq("site_id", selectedSite)
          .eq("item_id", ing.item_id);
      }
    }

    // Update batch status
    await supabase
      .from("mawaid_production_batches")
      .update({ status: "in_progress" })
      .eq("id", selectedBatch.id);

    setError("");
    setIngredientIssues([]);
    setSelectedBatch(null);
    loadBatches();
    setView("batches");
    setLoading(false);
  };

  const handleCompleteBatch = async (batchId) => {
    setLoading(true);
    const { error } = await supabase
      .from("mawaid_production_batches")
      .update({ status: "completed" })
      .eq("id", batchId);
    if (error) setError(`RLS blocked action: ${error.message}`);
    else {
      setError("");
      loadBatches();
    }
    setLoading(false);
  };

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Kitchen Operations</h1>
        <div className="flex gap-2">
          {view !== "batches" && (
            <button
              onClick={() => { setView("batches"); setIngredientIssues([]); setSelectedBatch(null); }}
              className="px-3 py-1 rounded text-sm bg-gray-200"
            >
              Back to Batches
            </button>
          )}
          {view === "batches" && (
            <button
              onClick={() => setView("batch_form")}
              className="px-3 py-1 rounded text-sm bg-blue-600 text-white"
            >
              New Batch
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-300 text-red-800 px-4 py-2 rounded mb-4">
          {error}
        </div>
      )}

      {view === "batches" && (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <label className="text-sm font-medium">Site:</label>
            <select
              className="border border-gray-300 rounded px-3 py-2"
              value={selectedSite}
              onChange={(e) => setSelectedSite(e.target.value)}
            >
              {sites.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>

          <h2 className="text-lg font-semibold">Production Batches</h2>
          {loading ? (
            <div className="animate-pulse space-y-3">
              {[1, 2, 3].map(i => <div key={i} className="h-20 bg-gray-200 rounded"></div>)}
            </div>
          ) : (
            <div className="space-y-2">
              {batches.map(batch => (
                <div key={batch.id} className="border border-gray-300 rounded p-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-semibold">{batch.batch_number}</div>
                      <div className="text-sm text-gray-600">Recipe: {batch.recipe?.name}</div>
                      <div className="text-sm text-gray-600">
                        Quantity: {batch.quantity_produced} | Date: {batch.production_date}
                      </div>
                      {batch.notes && <div className="text-xs text-gray-500 mt-1">{batch.notes}</div>}
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <div className={`text-xs px-2 py-1 rounded ${
                        batch.status === "completed" ? "bg-green-100 text-green-800" :
                        batch.status === "in_progress" ? "bg-blue-100 text-blue-800" :
                        batch.status === "planned" ? "bg-yellow-100 text-yellow-800" :
                        "bg-gray-100 text-gray-800"
                      }`}>
                        {batch.status}
                      </div>
                      {batch.status === "planned" && (
                        <button
                          onClick={() => handlePrepareIngredientIssue(batch)}
                          className="text-sm bg-blue-600 text-white px-3 py-1 rounded"
                        >
                          Issue Ingredients
                        </button>
                      )}
                      {batch.status === "in_progress" && (
                        <button
                          onClick={() => handleCompleteBatch(batch.id)}
                          className="text-sm bg-green-600 text-white px-3 py-1 rounded"
                        >
                          Complete
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {view === "batch_form" && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Create Production Batch</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Recipe *</label>
              <select
                className="w-full border border-gray-300 rounded px-3 py-2"
                value={batchForm.recipe_id}
                onChange={(e) => setBatchForm({ ...batchForm, recipe_id: e.target.value })}
              >
                <option value="">Select Recipe</option>
                {recipes.map(recipe => (
                  <option key={recipe.id} value={recipe.id}>
                    {recipe.name} (Base: {recipe.base_servings})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Quantity to Produce *</label>
              <input
                type="number"
                step="0.01"
                className="w-full border border-gray-300 rounded px-3 py-2"
                value={batchForm.quantity_produced}
                onChange={(e) => setBatchForm({ ...batchForm, quantity_produced: e.target.value })}
                placeholder="Number of servings"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Production Date *</label>
              <input
                type="date"
                className="w-full border border-gray-300 rounded px-3 py-2"
                value={batchForm.production_date}
                onChange={(e) => setBatchForm({ ...batchForm, production_date: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Notes</label>
            <textarea
              className="w-full border border-gray-300 rounded px-3 py-2"
              rows={3}
              value={batchForm.notes}
              onChange={(e) => setBatchForm({ ...batchForm, notes: e.target.value })}
              placeholder="Production notes"
            />
          </div>

          <button
            onClick={handleCreateBatch}
            disabled={loading || !batchForm.recipe_id || !batchForm.quantity_produced}
            className="w-full bg-blue-600 text-white font-medium py-3 rounded disabled:bg-gray-300"
          >
            {loading ? "Creating..." : "Create Batch"}
          </button>
        </div>
      )}

      {view === "issue_ingredients" && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Issue Ingredients - {selectedBatch?.batch_number}</h2>

          <div className="bg-blue-50 border border-blue-300 rounded p-3 text-sm">
            <div>Recipe: {selectedBatch?.recipe?.name}</div>
            <div>Base Servings: {selectedBatch?.recipe?.base_servings}</div>
            <div>Producing: {selectedBatch?.quantity_produced} servings</div>
            <div>Scale Factor: {(selectedBatch?.quantity_produced / (selectedBatch?.recipe?.base_servings || 1)).toFixed(2)}x</div>
          </div>

          <div className="border rounded p-3">
            <h3 className="font-medium mb-3">Ingredients to Issue</h3>
            <div className="space-y-2">
              {ingredientIssues.map((ing, index) => (
                <div key={index} className="border-b pb-2">
                  <div className="font-medium text-sm">{ing.item_name}</div>
                  <div className="grid grid-cols-3 gap-2 mt-1 text-xs">
                    <div>Base: {ing.base_quantity} {ing.unit}</div>
                    <div>Scaled: {ing.scaled_quantity} {ing.unit}</div>
                    <div>
                      <input
                        type="number"
                        step="0.01"
                        className="w-full border border-gray-300 rounded px-2 py-1"
                        value={ing.quantity_to_issue}
                        onChange={(e) => {
                          const newIssues = [...ingredientIssues];
                          newIssues[index].quantity_to_issue = e.target.value;
                          setIngredientIssues(newIssues);
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-yellow-50 border border-yellow-300 rounded p-3 text-sm text-yellow-800">
            <strong>Warning:</strong> This will deduct the specified quantities from stock and mark the batch as "In Progress".
          </div>

          <button
            onClick={handleIssueIngredients}
            disabled={loading}
            className="w-full bg-green-600 text-white font-medium py-3 rounded disabled:bg-gray-300"
          >
            {loading ? "Processing..." : "Confirm Ingredient Issue"}
          </button>
        </div>
      )}
    </div>
  );
};

export default KitchenOperations;
