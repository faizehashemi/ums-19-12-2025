import { useState, useEffect } from "react";
import { supabase } from "../../../lib/supabaseClient";

const UNIT_CONVERSIONS = {
  "g-kg": 1000,
  "kg-g": 0.001,
  "ml-L": 1000,
  "L-ml": 0.001
};

const MakeRecipes = () => {
  const [recipes, setRecipes] = useState([]);
  const [items, setItems] = useState([]);
  const [showRecipeForm, setShowRecipeForm] = useState(false);
  const [editingRecipe, setEditingRecipe] = useState(null);
  const [recipeName, setRecipeName] = useState("");
  const [yieldType, setYieldType] = useState("thal");
  const [yieldValue, setYieldValue] = useState("");
  const [yieldUnit, setYieldUnit] = useState("");
  const [thalEquivalent, setThalEquivalent] = useState(8);
  const [steps, setSteps] = useState("");
  const [ingredients, setIngredients] = useState([]);
  const [showIngredientForm, setShowIngredientForm] = useState(false);
  const [selectedItem, setSelectedItem] = useState("");
  const [qty, setQty] = useState("");
  const [unit, setUnit] = useState("");
  const [wastagePct, setWastagePct] = useState(0);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [scalePeople, setScalePeople] = useState("");
  const [scaleThals, setScaleThals] = useState("");
  const [scaledIngredients, setScaledIngredients] = useState([]);

  useEffect(() => {
    loadRecipes();
    loadItems();
  }, []);

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

  const loadItems = async () => {
    const { data, error } = await supabase
      .from("mawaid_items")
      .select("*")
      .eq("is_active", true)
      .order("name");

    if (error) {
      setError(`RLS blocked: ${error.message}`);
    } else {
      setItems(data || []);
    }
  };

  const openRecipeForm = (recipe = null) => {
    if (recipe) {
      setEditingRecipe(recipe);
      setRecipeName(recipe.name);
      setYieldType(recipe.yield_type || "thal");
      setYieldValue(recipe.yield_value?.toString() || "");
      setYieldUnit(recipe.yield_unit || "");
      setThalEquivalent(recipe.thal_equivalent_people || 8);
      setSteps(recipe.steps_text || "");
      loadIngredients(recipe.id);
    } else {
      setEditingRecipe(null);
      setRecipeName("");
      setYieldType("thal");
      setYieldValue("");
      setYieldUnit("");
      setThalEquivalent(8);
      setSteps("");
      setIngredients([]);
    }
    setShowRecipeForm(true);
  };

  const loadIngredients = async (recipeId) => {
    const { data, error } = await supabase
      .from("mawaid_recipe_ingredients")
      .select("*, mawaid_items(name)")
      .eq("recipe_id", recipeId);

    if (error) {
      setError(`RLS blocked: ${error.message}`);
    } else {
      setIngredients(data || []);
    }
  };

  const saveRecipe = async () => {
    if (!recipeName.trim()) {
      setError("Recipe name is required");
      return;
    }

    setLoading(true);
    const payload = {
      name: recipeName.trim(),
      yield_type: yieldType,
      yield_value: parseFloat(yieldValue) || null,
      yield_unit: yieldUnit || null,
      thal_equivalent_people: parseInt(thalEquivalent),
      steps_text: steps,
      is_active: true
    };

    if (editingRecipe) {
      const { error } = await supabase
        .from("mawaid_recipes")
        .update(payload)
        .eq("id", editingRecipe.id);

      if (error) {
        setError(`RLS blocked: ${error.message}`);
      } else {
        setShowRecipeForm(false);
        loadRecipes();
      }
    } else {
      const { data, error } = await supabase
        .from("mawaid_recipes")
        .insert(payload)
        .select()
        .single();

      if (error) {
        setError(`RLS blocked: ${error.message}`);
      } else {
        setEditingRecipe(data);
        loadRecipes();
      }
    }
    setLoading(false);
  };

  const addIngredient = async () => {
    if (!editingRecipe) {
      setError("Save recipe first before adding ingredients");
      return;
    }
    if (!selectedItem || !qty || !unit) {
      setError("Item, quantity, and unit are required");
      return;
    }

    const payload = {
      recipe_id: editingRecipe.id,
      item_id: selectedItem,
      qty: parseFloat(qty),
      unit,
      wastage_pct: parseFloat(wastagePct) || 0
    };

    const { error } = await supabase
      .from("mawaid_recipe_ingredients")
      .insert(payload);

    if (error) {
      setError(`RLS blocked: ${error.message}`);
    } else {
      setShowIngredientForm(false);
      setSelectedItem("");
      setQty("");
      setUnit("");
      setWastagePct(0);
      loadIngredients(editingRecipe.id);
    }
  };

  const scaleRecipe = () => {
    if (!editingRecipe || ingredients.length === 0) {
      setError("Load a recipe with ingredients first");
      return;
    }

    let scaleFactor = 1;
    if (scalePeople) {
      const targetPeople = parseInt(scalePeople);
      const basePeople = editingRecipe.thal_equivalent_people || 8;
      scaleFactor = targetPeople / basePeople;
    } else if (scaleThals) {
      const targetThals = parseInt(scaleThals);
      scaleFactor = targetThals;
    }

    const scaled = ingredients.map(ing => {
      const baseQty = parseFloat(ing.qty);
      const wastage = parseFloat(ing.wastage_pct) || 0;
      const adjustedQty = baseQty * (1 + wastage / 100);
      const finalQty = adjustedQty * scaleFactor;
      return {
        item_name: ing.mawaid_items?.name || "Unknown",
        qty: finalQty.toFixed(2),
        unit: ing.unit
      };
    });

    setScaledIngredients(scaled);
  };

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Make Recipes</h1>
        <button
          onClick={() => openRecipeForm()}
          className="bg-blue-600 text-white px-4 py-2 rounded"
        >
          New Recipe
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-300 text-red-800 px-4 py-2 rounded mb-4">
          {error}
        </div>
      )}

      <div className="space-y-3">
        {recipes.map(recipe => (
          <div key={recipe.id} className="border border-gray-300 rounded p-4 hover:bg-gray-50 cursor-pointer" onClick={() => openRecipeForm(recipe)}>
            <div className="font-semibold">{recipe.name}</div>
            <div className="text-sm text-gray-600">
              Yield: {recipe.yield_value} {recipe.yield_unit || recipe.yield_type} | Thal = {recipe.thal_equivalent_people} people
            </div>
          </div>
        ))}
      </div>

      {showRecipeForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
          <div className="bg-white w-full max-w-3xl m-4 rounded-lg p-6 max-h-screen overflow-y-auto">
            <h2 className="text-lg font-bold mb-4">{editingRecipe ? "Edit Recipe" : "New Recipe"}</h2>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium mb-1">Recipe Name</label>
                <input
                  type="text"
                  className="w-full border border-gray-300 rounded px-3 py-2"
                  value={recipeName}
                  onChange={(e) => setRecipeName(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Yield Type</label>
                  <select
                    className="w-full border border-gray-300 rounded px-3 py-2"
                    value={yieldType}
                    onChange={(e) => setYieldType(e.target.value)}
                  >
                    <option value="thal">Thal</option>
                    <option value="portion">Portion</option>
                    <option value="mass">Mass</option>
                    <option value="volume">Volume</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Yield Value</label>
                  <input
                    type="number"
                    className="w-full border border-gray-300 rounded px-3 py-2"
                    value={yieldValue}
                    onChange={(e) => setYieldValue(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Yield Unit</label>
                  <input
                    type="text"
                    className="w-full border border-gray-300 rounded px-3 py-2"
                    value={yieldUnit}
                    onChange={(e) => setYieldUnit(e.target.value)}
                    placeholder="kg, L, etc"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Thal Equivalent (people)</label>
                <input
                  type="number"
                  className="w-full border border-gray-300 rounded px-3 py-2"
                  value={thalEquivalent}
                  onChange={(e) => setThalEquivalent(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Steps</label>
                <textarea
                  className="w-full border border-gray-300 rounded px-3 py-2"
                  rows={4}
                  value={steps}
                  onChange={(e) => setSteps(e.target.value)}
                  placeholder="Cooking instructions"
                />
              </div>
            </div>

            <button
              onClick={saveRecipe}
              disabled={loading}
              className="w-full bg-blue-600 text-white py-2 rounded mb-4 disabled:bg-gray-300"
            >
              {loading ? "Saving..." : "Save Recipe"}
            </button>

            {editingRecipe && (
              <div className="border-t pt-4">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-semibold">Ingredients</h3>
                  <button
                    onClick={() => setShowIngredientForm(!showIngredientForm)}
                    className="text-sm bg-green-600 text-white px-3 py-1 rounded"
                  >
                    Add Ingredient
                  </button>
                </div>

                {showIngredientForm && (
                  <div className="bg-gray-50 p-3 rounded mb-3 space-y-2">
                    <select
                      className="w-full border border-gray-300 rounded px-3 py-2"
                      value={selectedItem}
                      onChange={(e) => setSelectedItem(e.target.value)}
                    >
                      <option value="">Select Item</option>
                      {items.map(item => (
                        <option key={item.id} value={item.id}>{item.name}</option>
                      ))}
                    </select>
                    <div className="grid grid-cols-3 gap-2">
                      <input
                        type="number"
                        placeholder="Qty"
                        className="border border-gray-300 rounded px-3 py-2"
                        value={qty}
                        onChange={(e) => setQty(e.target.value)}
                      />
                      <input
                        type="text"
                        placeholder="Unit"
                        className="border border-gray-300 rounded px-3 py-2"
                        value={unit}
                        onChange={(e) => setUnit(e.target.value)}
                      />
                      <input
                        type="number"
                        placeholder="Wastage %"
                        className="border border-gray-300 rounded px-3 py-2"
                        value={wastagePct}
                        onChange={(e) => setWastagePct(e.target.value)}
                      />
                    </div>
                    <button
                      onClick={addIngredient}
                      className="w-full bg-green-600 text-white py-1 rounded text-sm"
                    >
                      Add
                    </button>
                  </div>
                )}

                <div className="space-y-1">
                  {ingredients.map(ing => (
                    <div key={ing.id} className="text-sm bg-gray-50 p-2 rounded">
                      {ing.mawaid_items?.name}: {ing.qty} {ing.unit} {ing.wastage_pct > 0 && `(+${ing.wastage_pct}% wastage)`}
                    </div>
                  ))}
                </div>

                <div className="border-t mt-4 pt-4">
                  <h3 className="font-semibold mb-2">Scale Recipe</h3>
                  <div className="grid grid-cols-2 gap-4 mb-2">
                    <div>
                      <label className="block text-xs mb-1">People Count</label>
                      <input
                        type="number"
                        className="w-full border border-gray-300 rounded px-3 py-2"
                        value={scalePeople}
                        onChange={(e) => {
                          setScalePeople(e.target.value);
                          setScaleThals("");
                        }}
                        placeholder="e.g. 100"
                      />
                    </div>
                    <div>
                      <label className="block text-xs mb-1">Thal Count</label>
                      <input
                        type="number"
                        className="w-full border border-gray-300 rounded px-3 py-2"
                        value={scaleThals}
                        onChange={(e) => {
                          setScaleThals(e.target.value);
                          setScalePeople("");
                        }}
                        placeholder="e.g. 10"
                      />
                    </div>
                  </div>
                  <button
                    onClick={scaleRecipe}
                    className="w-full bg-purple-600 text-white py-2 rounded mb-2"
                  >
                    Calculate Scaled Ingredients
                  </button>

                  {scaledIngredients.length > 0 && (
                    <div className="bg-purple-50 border border-purple-300 rounded p-3">
                      <h4 className="text-sm font-semibold mb-1">Scaled Ingredients:</h4>
                      {scaledIngredients.map((item, idx) => (
                        <div key={idx} className="text-sm">
                          {item.item_name}: {item.qty} {item.unit}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            <button
              onClick={() => setShowRecipeForm(false)}
              className="w-full bg-gray-300 text-gray-800 py-2 rounded mt-4"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MakeRecipes;
