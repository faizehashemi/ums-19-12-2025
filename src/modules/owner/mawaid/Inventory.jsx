/* SQL:
CREATE TABLE mawaid_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category TEXT,
  unit TEXT NOT NULL,
  min_stock NUMERIC DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE mawaid_stock (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID REFERENCES mawaid_sites(id),
  item_id UUID REFERENCES mawaid_items(id),
  quantity NUMERIC DEFAULT 0,
  last_updated TIMESTAMPTZ DEFAULT now(),
  UNIQUE(site_id, item_id)
);

CREATE TABLE mawaid_stock_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID REFERENCES mawaid_sites(id),
  item_id UUID REFERENCES mawaid_items(id),
  movement_type TEXT NOT NULL, -- receipt, issue, adjustment, transfer_in, transfer_out
  quantity NUMERIC NOT NULL,
  reference_id UUID, -- links to GRN, production batch, etc.
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
*/

import { useState, useEffect } from "react";
import { supabase } from "../../../lib/supabase";

const CATEGORIES = ["Vegetables", "Fruits", "Grains", "Spices", "Dairy", "Meat", "Other"];
const UNITS = ["kg", "g", "L", "mL", "pcs", "dozen", "bag", "box"];

const Inventory = () => {
  const [view, setView] = useState("items"); // items, stock, movements, item_form
  const [items, setItems] = useState([]);
  const [sites, setSites] = useState([]);
  const [selectedSite, setSelectedSite] = useState("");
  const [stock, setStock] = useState([]);
  const [movements, setMovements] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);

  const [itemForm, setItemForm] = useState({
    name: "",
    category: "",
    unit: "kg",
    min_stock: 0,
    is_active: true
  });

  const [movementForm, setMovementForm] = useState({
    item_id: "",
    movement_type: "adjustment",
    quantity: "",
    notes: ""
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadItems();
    loadSites();
  }, []);

  useEffect(() => {
    if (selectedSite && view === "stock") {
      loadStock();
    }
  }, [selectedSite, view]);

  const loadItems = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("mawaid_items")
      .select("*")
      .order("category, name");
    if (error) setError(`RLS blocked action: ${error.message}`);
    else setItems(data || []);
    setLoading(false);
  };

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

  const loadStock = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("mawaid_stock")
      .select(`
        *,
        item:mawaid_items(name, category, unit, min_stock)
      `)
      .eq("site_id", selectedSite)
      .order("item(name)");
    if (error) setError(`RLS blocked action: ${error.message}`);
    else setStock(data || []);
    setLoading(false);
  };

  const loadMovements = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("mawaid_stock_movements")
      .select(`
        *,
        item:mawaid_items(name, unit),
        site:mawaid_sites(name)
      `)
      .eq("site_id", selectedSite)
      .order("created_at", { ascending: false })
      .limit(100);
    if (error) setError(`RLS blocked action: ${error.message}`);
    else setMovements(data || []);
    setLoading(false);
  };

  const resetItemForm = () => {
    setItemForm({
      name: "",
      category: "",
      unit: "kg",
      min_stock: 0,
      is_active: true
    });
    setSelectedItem(null);
  };

  const handleEditItem = (item) => {
    setSelectedItem(item);
    setItemForm({
      name: item.name,
      category: item.category || "",
      unit: item.unit,
      min_stock: item.min_stock || 0,
      is_active: item.is_active
    });
    setView("item_form");
  };

  const handleSaveItem = async () => {
    if (!itemForm.name.trim() || !itemForm.unit) {
      setError("Item name and unit are required");
      return;
    }

    setLoading(true);
    if (selectedItem) {
      // Update
      const { error } = await supabase
        .from("mawaid_items")
        .update(itemForm)
        .eq("id", selectedItem.id);
      if (error) setError(`RLS blocked action: ${error.message}`);
      else {
        setError("");
        resetItemForm();
        loadItems();
        setView("items");
      }
    } else {
      // Create
      const { error } = await supabase
        .from("mawaid_items")
        .insert(itemForm);
      if (error) setError(`RLS blocked action: ${error.message}`);
      else {
        setError("");
        resetItemForm();
        loadItems();
        setView("items");
      }
    }
    setLoading(false);
  };

  const handleDeleteItem = async (id) => {
    if (!confirm("Are you sure you want to delete this item?")) return;

    setLoading(true);
    const { error } = await supabase
      .from("mawaid_items")
      .delete()
      .eq("id", id);
    if (error) setError(`RLS blocked action: ${error.message}`);
    else {
      setError("");
      loadItems();
    }
    setLoading(false);
  };

  const handleStockMovement = async () => {
    if (!movementForm.item_id || !movementForm.quantity || !selectedSite) {
      setError("Item, quantity, and site are required");
      return;
    }

    const qty = parseFloat(movementForm.quantity);
    if (isNaN(qty)) {
      setError("Invalid quantity");
      return;
    }

    setLoading(true);

    // Insert movement record
    const { error: movError } = await supabase
      .from("mawaid_stock_movements")
      .insert({
        site_id: selectedSite,
        item_id: movementForm.item_id,
        movement_type: movementForm.movement_type,
        quantity: qty,
        notes: movementForm.notes
      });

    if (movError) {
      setError(`RLS blocked action: ${movError.message}`);
      setLoading(false);
      return;
    }

    // Update stock - upsert pattern
    const { data: currentStock } = await supabase
      .from("mawaid_stock")
      .select("quantity")
      .eq("site_id", selectedSite)
      .eq("item_id", movementForm.item_id)
      .maybeSingle();

    const currentQty = currentStock?.quantity || 0;
    const newQty = movementForm.movement_type === "issue" ? currentQty - qty : currentQty + qty;

    const { error: stockError } = await supabase
      .from("mawaid_stock")
      .upsert({
        site_id: selectedSite,
        item_id: movementForm.item_id,
        quantity: newQty,
        last_updated: new Date().toISOString()
      }, { onConflict: "site_id,item_id" });

    if (stockError) {
      setError(`RLS blocked action: ${stockError.message}`);
    } else {
      setError("");
      setMovementForm({
        item_id: "",
        movement_type: "adjustment",
        quantity: "",
        notes: ""
      });
      loadStock();
      loadMovements();
    }
    setLoading(false);
  };

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Inventory</h1>
        <div className="flex gap-2">
          <button
            onClick={() => setView("items")}
            className={`px-3 py-1 rounded text-sm ${view === "items" ? "bg-blue-600 text-white" : "bg-gray-200"}`}
          >
            Items
          </button>
          <button
            onClick={() => setView("stock")}
            className={`px-3 py-1 rounded text-sm ${view === "stock" ? "bg-blue-600 text-white" : "bg-gray-200"}`}
          >
            Stock
          </button>
          <button
            onClick={() => { setView("movements"); loadMovements(); }}
            className={`px-3 py-1 rounded text-sm ${view === "movements" ? "bg-blue-600 text-white" : "bg-gray-200"}`}
          >
            Movements
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-300 text-red-800 px-4 py-2 rounded mb-4">
          {error}
        </div>
      )}

      {view === "items" && (
        <div>
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-lg font-semibold">Item Master</h2>
            <button
              onClick={() => { setView("item_form"); resetItemForm(); }}
              className="bg-blue-600 text-white px-3 py-2 rounded text-sm"
            >
              Add Item
            </button>
          </div>
          {loading ? (
            <div className="animate-pulse space-y-3">
              {[1, 2, 3].map(i => <div key={i} className="h-16 bg-gray-200 rounded"></div>)}
            </div>
          ) : (
            <div className="space-y-2">
              {items.map(item => (
                <div key={item.id} className="border border-gray-300 rounded p-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-semibold">{item.name}</div>
                      <div className="text-sm text-gray-600">
                        Category: {item.category || "N/A"} | Unit: {item.unit}
                      </div>
                      <div className="text-xs text-gray-500">Min Stock: {item.min_stock} {item.unit}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className={`text-xs px-2 py-1 rounded ${
                        item.is_active ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
                      }`}>
                        {item.is_active ? "Active" : "Inactive"}
                      </div>
                      <button
                        onClick={() => handleEditItem(item)}
                        className="text-sm bg-blue-600 text-white px-2 py-1 rounded"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteItem(item.id)}
                        className="text-sm bg-red-600 text-white px-2 py-1 rounded"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {view === "item_form" && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">{selectedItem ? "Edit Item" : "Add Item"}</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Item Name *</label>
              <input
                type="text"
                className="w-full border border-gray-300 rounded px-3 py-2"
                value={itemForm.name}
                onChange={(e) => setItemForm({ ...itemForm, name: e.target.value })}
                placeholder="Item name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Category</label>
              <select
                className="w-full border border-gray-300 rounded px-3 py-2"
                value={itemForm.category}
                onChange={(e) => setItemForm({ ...itemForm, category: e.target.value })}
              >
                <option value="">Select Category</option>
                {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Unit *</label>
              <select
                className="w-full border border-gray-300 rounded px-3 py-2"
                value={itemForm.unit}
                onChange={(e) => setItemForm({ ...itemForm, unit: e.target.value })}
              >
                {UNITS.map(unit => <option key={unit} value={unit}>{unit}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Min Stock</label>
              <input
                type="number"
                step="0.01"
                className="w-full border border-gray-300 rounded px-3 py-2"
                value={itemForm.min_stock}
                onChange={(e) => setItemForm({ ...itemForm, min_stock: parseFloat(e.target.value) || 0 })}
                placeholder="Minimum stock level"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Status</label>
              <select
                className="w-full border border-gray-300 rounded px-3 py-2"
                value={itemForm.is_active.toString()}
                onChange={(e) => setItemForm({ ...itemForm, is_active: e.target.value === "true" })}
              >
                <option value="true">Active</option>
                <option value="false">Inactive</option>
              </select>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleSaveItem}
              disabled={loading || !itemForm.name.trim()}
              className="flex-1 bg-blue-600 text-white font-medium py-3 rounded disabled:bg-gray-300"
            >
              {loading ? "Saving..." : selectedItem ? "Update Item" : "Create Item"}
            </button>
            <button
              onClick={() => { setView("items"); resetItemForm(); }}
              className="px-6 bg-gray-200 font-medium py-3 rounded"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {view === "stock" && (
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

          <div className="bg-blue-50 border border-blue-300 rounded p-3">
            <h3 className="font-medium mb-3">Quick Stock Movement</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <select
                className="border border-gray-300 rounded px-3 py-2"
                value={movementForm.item_id}
                onChange={(e) => setMovementForm({ ...movementForm, item_id: e.target.value })}
              >
                <option value="">Select Item</option>
                {items.filter(i => i.is_active).map(item => (
                  <option key={item.id} value={item.id}>{item.name} ({item.unit})</option>
                ))}
              </select>
              <select
                className="border border-gray-300 rounded px-3 py-2"
                value={movementForm.movement_type}
                onChange={(e) => setMovementForm({ ...movementForm, movement_type: e.target.value })}
              >
                <option value="receipt">Receipt (+)</option>
                <option value="issue">Issue (-)</option>
                <option value="adjustment">Adjustment (+/-)</option>
              </select>
              <input
                type="number"
                step="0.01"
                className="border border-gray-300 rounded px-3 py-2"
                placeholder="Quantity"
                value={movementForm.quantity}
                onChange={(e) => setMovementForm({ ...movementForm, quantity: e.target.value })}
              />
              <input
                type="text"
                className="border border-gray-300 rounded px-3 py-2"
                placeholder="Notes"
                value={movementForm.notes}
                onChange={(e) => setMovementForm({ ...movementForm, notes: e.target.value })}
              />
            </div>
            <button
              onClick={handleStockMovement}
              disabled={loading}
              className="mt-3 w-full bg-green-600 text-white py-2 rounded disabled:bg-gray-300"
            >
              Record Movement
            </button>
          </div>

          <h3 className="font-semibold">Current Stock Levels</h3>
          {loading ? (
            <div className="animate-pulse space-y-3">
              {[1, 2, 3].map(i => <div key={i} className="h-16 bg-gray-200 rounded"></div>)}
            </div>
          ) : (
            <div className="space-y-2">
              {stock.map(s => {
                const isLowStock = s.quantity <= (s.item?.min_stock || 0);
                return (
                  <div key={s.id} className={`border rounded p-3 ${isLowStock ? "bg-red-50 border-red-300" : "border-gray-300"}`}>
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="font-semibold">{s.item?.name}</div>
                        <div className="text-sm text-gray-600">Category: {s.item?.category || "N/A"}</div>
                      </div>
                      <div className="text-right">
                        <div className={`text-lg font-bold ${isLowStock ? "text-red-600" : ""}`}>
                          {s.quantity} {s.item?.unit}
                        </div>
                        <div className="text-xs text-gray-500">Min: {s.item?.min_stock} {s.item?.unit}</div>
                        {isLowStock && <div className="text-xs text-red-600 font-medium">LOW STOCK</div>}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {view === "movements" && (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <label className="text-sm font-medium">Site:</label>
            <select
              className="border border-gray-300 rounded px-3 py-2"
              value={selectedSite}
              onChange={(e) => { setSelectedSite(e.target.value); loadMovements(); }}
            >
              {sites.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>

          <h3 className="font-semibold">Recent Movements</h3>
          {loading ? (
            <div className="animate-pulse space-y-3">
              {[1, 2, 3].map(i => <div key={i} className="h-16 bg-gray-200 rounded"></div>)}
            </div>
          ) : (
            <div className="space-y-2">
              {movements.map(mov => (
                <div key={mov.id} className="border border-gray-300 rounded p-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-semibold">{mov.item?.name}</div>
                      <div className="text-sm text-gray-600">
                        {mov.movement_type.toUpperCase()}: {mov.quantity} {mov.item?.unit}
                      </div>
                      {mov.notes && <div className="text-xs text-gray-500 mt-1">{mov.notes}</div>}
                    </div>
                    <div className="text-xs text-gray-500">
                      {new Date(mov.created_at).toLocaleString()}
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

export default Inventory;
