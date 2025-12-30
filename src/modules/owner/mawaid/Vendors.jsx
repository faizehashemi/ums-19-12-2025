/* SQL:
CREATE TABLE mawaid_vendors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  contact_person TEXT,
  phone TEXT,
  email TEXT,
  city TEXT,
  address TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE mawaid_vendor_price_lists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID REFERENCES mawaid_vendors(id) ON DELETE CASCADE,
  item_id UUID REFERENCES mawaid_items(id),
  unit_price NUMERIC NOT NULL,
  valid_from DATE,
  valid_to DATE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(vendor_id, item_id, valid_from)
);
*/

import { useState, useEffect } from "react";
import { supabase } from "../../../lib/supabaseClient";

const Vendors = () => {
  const [view, setView] = useState("list"); // list, form, prices
  const [vendors, setVendors] = useState([]);
  const [items, setItems] = useState([]);
  const [selectedVendor, setSelectedVendor] = useState(null);
  const [priceList, setPriceList] = useState([]);

  const [form, setForm] = useState({
    name: "",
    contact_person: "",
    phone: "",
    email: "",
    city: "",
    address: "",
    is_active: true
  });

  const [priceForm, setPriceForm] = useState({
    item_id: "",
    unit_price: "",
    valid_from: new Date().toISOString().split("T")[0],
    valid_to: ""
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadVendors();
    loadItems();
  }, []);

  const loadVendors = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("mawaid_vendors")
      .select("*")
      .order("name");
    if (error) setError(`RLS blocked action: ${error.message}`);
    else setVendors(data || []);
    setLoading(false);
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

  const loadPriceList = async (vendorId) => {
    setLoading(true);
    const { data, error } = await supabase
      .from("mawaid_vendor_price_lists")
      .select(`
        *,
        item:mawaid_items(name, unit)
      `)
      .eq("vendor_id", vendorId)
      .order("valid_from", { ascending: false });
    if (error) setError(`RLS blocked action: ${error.message}`);
    else setPriceList(data || []);
    setLoading(false);
  };

  const resetForm = () => {
    setForm({
      name: "",
      contact_person: "",
      phone: "",
      email: "",
      city: "",
      address: "",
      is_active: true
    });
    setSelectedVendor(null);
  };

  const handleEdit = (vendor) => {
    setSelectedVendor(vendor);
    setForm({
      name: vendor.name,
      contact_person: vendor.contact_person || "",
      phone: vendor.phone || "",
      email: vendor.email || "",
      city: vendor.city || "",
      address: vendor.address || "",
      is_active: vendor.is_active
    });
    setView("form");
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      setError("Vendor name is required");
      return;
    }

    setLoading(true);
    if (selectedVendor) {
      // Update
      const { error } = await supabase
        .from("mawaid_vendors")
        .update(form)
        .eq("id", selectedVendor.id);
      if (error) setError(`RLS blocked action: ${error.message}`);
      else {
        setError("");
        resetForm();
        loadVendors();
        setView("list");
      }
    } else {
      // Create
      const { error } = await supabase
        .from("mawaid_vendors")
        .insert(form);
      if (error) setError(`RLS blocked action: ${error.message}`);
      else {
        setError("");
        resetForm();
        loadVendors();
        setView("list");
      }
    }
    setLoading(false);
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this vendor?")) return;

    setLoading(true);
    const { error } = await supabase
      .from("mawaid_vendors")
      .delete()
      .eq("id", id);
    if (error) setError(`RLS blocked action: ${error.message}`);
    else {
      setError("");
      loadVendors();
    }
    setLoading(false);
  };

  const handlePriceListView = (vendor) => {
    setSelectedVendor(vendor);
    loadPriceList(vendor.id);
    setView("prices");
  };

  const handleAddPrice = async () => {
    if (!priceForm.item_id || !priceForm.unit_price || !priceForm.valid_from) {
      setError("Item, price, and valid from date are required");
      return;
    }

    setLoading(true);
    const { error } = await supabase
      .from("mawaid_vendor_price_lists")
      .insert({
        vendor_id: selectedVendor.id,
        item_id: priceForm.item_id,
        unit_price: parseFloat(priceForm.unit_price),
        valid_from: priceForm.valid_from,
        valid_to: priceForm.valid_to || null,
        is_active: true
      });

    if (error) {
      setError(`RLS blocked action: ${error.message}`);
    } else {
      setError("");
      setPriceForm({
        item_id: "",
        unit_price: "",
        valid_from: new Date().toISOString().split("T")[0],
        valid_to: ""
      });
      loadPriceList(selectedVendor.id);
    }
    setLoading(false);
  };

  const handleDeactivatePrice = async (id) => {
    setLoading(true);
    const { error } = await supabase
      .from("mawaid_vendor_price_lists")
      .update({ is_active: false })
      .eq("id", id);
    if (error) setError(`RLS blocked action: ${error.message}`);
    else {
      setError("");
      loadPriceList(selectedVendor.id);
    }
    setLoading(false);
  };

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Vendors</h1>
        <div className="flex gap-2">
          {view !== "list" && (
            <button
              onClick={() => { setView("list"); resetForm(); }}
              className="px-3 py-1 rounded text-sm bg-gray-200"
            >
              Back to List
            </button>
          )}
          {view === "list" && (
            <button
              onClick={() => { setView("form"); resetForm(); }}
              className="px-3 py-1 rounded text-sm bg-blue-600 text-white"
            >
              Add Vendor
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-300 text-red-800 px-4 py-2 rounded mb-4">
          {error}
        </div>
      )}

      {view === "list" && (
        <div>
          {loading ? (
            <div className="animate-pulse space-y-3">
              {[1, 2, 3].map(i => <div key={i} className="h-20 bg-gray-200 rounded"></div>)}
            </div>
          ) : (
            <div className="space-y-2">
              {vendors.map(vendor => (
                <div key={vendor.id} className="border border-gray-300 rounded p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="font-semibold text-lg">{vendor.name}</div>
                      {vendor.contact_person && (
                        <div className="text-sm text-gray-600">Contact: {vendor.contact_person}</div>
                      )}
                      <div className="text-sm text-gray-600">
                        {vendor.phone && <span>Ph: {vendor.phone}</span>}
                        {vendor.email && <span className="ml-3">Email: {vendor.email}</span>}
                      </div>
                      {vendor.city && <div className="text-sm text-gray-500">{vendor.city}</div>}
                      {vendor.address && <div className="text-xs text-gray-500 mt-1">{vendor.address}</div>}
                    </div>
                    <div className="flex flex-col gap-1">
                      <div className={`text-xs px-2 py-1 rounded text-center ${
                        vendor.is_active ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
                      }`}>
                        {vendor.is_active ? "Active" : "Inactive"}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={() => handleEdit(vendor)}
                      className="text-sm bg-blue-600 text-white px-3 py-1 rounded"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handlePriceListView(vendor)}
                      className="text-sm bg-green-600 text-white px-3 py-1 rounded"
                    >
                      Price List
                    </button>
                    <button
                      onClick={() => handleDelete(vendor.id)}
                      className="text-sm bg-red-600 text-white px-3 py-1 rounded"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {view === "form" && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">{selectedVendor ? "Edit Vendor" : "Add Vendor"}</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Vendor Name *</label>
              <input
                type="text"
                className="w-full border border-gray-300 rounded px-3 py-2"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Vendor name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Contact Person</label>
              <input
                type="text"
                className="w-full border border-gray-300 rounded px-3 py-2"
                value={form.contact_person}
                onChange={(e) => setForm({ ...form, contact_person: e.target.value })}
                placeholder="Contact person"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Phone</label>
              <input
                type="tel"
                className="w-full border border-gray-300 rounded px-3 py-2"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="Phone number"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Email</label>
              <input
                type="email"
                className="w-full border border-gray-300 rounded px-3 py-2"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="Email address"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">City</label>
              <input
                type="text"
                className="w-full border border-gray-300 rounded px-3 py-2"
                value={form.city}
                onChange={(e) => setForm({ ...form, city: e.target.value })}
                placeholder="City"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Status</label>
              <select
                className="w-full border border-gray-300 rounded px-3 py-2"
                value={form.is_active.toString()}
                onChange={(e) => setForm({ ...form, is_active: e.target.value === "true" })}
              >
                <option value="true">Active</option>
                <option value="false">Inactive</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Address</label>
            <textarea
              className="w-full border border-gray-300 rounded px-3 py-2"
              rows={3}
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              placeholder="Full address"
            />
          </div>

          <button
            onClick={handleSave}
            disabled={loading || !form.name.trim()}
            className="w-full bg-blue-600 text-white font-medium py-3 rounded disabled:bg-gray-300"
          >
            {loading ? "Saving..." : selectedVendor ? "Update Vendor" : "Create Vendor"}
          </button>
        </div>
      )}

      {view === "prices" && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Price List - {selectedVendor?.name}</h2>

          <div className="bg-blue-50 border border-blue-300 rounded p-3">
            <h3 className="font-medium mb-3">Add New Price</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <select
                className="border border-gray-300 rounded px-3 py-2"
                value={priceForm.item_id}
                onChange={(e) => setPriceForm({ ...priceForm, item_id: e.target.value })}
              >
                <option value="">Select Item</option>
                {items.map(item => (
                  <option key={item.id} value={item.id}>{item.name} ({item.unit})</option>
                ))}
              </select>
              <input
                type="number"
                step="0.01"
                className="border border-gray-300 rounded px-3 py-2"
                placeholder="Unit Price"
                value={priceForm.unit_price}
                onChange={(e) => setPriceForm({ ...priceForm, unit_price: e.target.value })}
              />
              <input
                type="date"
                className="border border-gray-300 rounded px-3 py-2"
                value={priceForm.valid_from}
                onChange={(e) => setPriceForm({ ...priceForm, valid_from: e.target.value })}
              />
              <input
                type="date"
                className="border border-gray-300 rounded px-3 py-2"
                placeholder="Valid To (optional)"
                value={priceForm.valid_to}
                onChange={(e) => setPriceForm({ ...priceForm, valid_to: e.target.value })}
              />
            </div>
            <button
              onClick={handleAddPrice}
              disabled={loading}
              className="mt-3 w-full bg-green-600 text-white py-2 rounded disabled:bg-gray-300"
            >
              Add Price
            </button>
          </div>

          {loading ? (
            <div className="animate-pulse space-y-3">
              {[1, 2, 3].map(i => <div key={i} className="h-16 bg-gray-200 rounded"></div>)}
            </div>
          ) : (
            <div className="space-y-2">
              <h3 className="font-medium">Current Prices ({priceList.length})</h3>
              {priceList.map(price => (
                <div key={price.id} className="border border-gray-300 rounded p-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-semibold">{price.item?.name}</div>
                      <div className="text-sm text-gray-600">
                        Rs. {price.unit_price} per {price.item?.unit}
                      </div>
                      <div className="text-xs text-gray-500">
                        Valid: {price.valid_from} {price.valid_to ? `to ${price.valid_to}` : "(ongoing)"}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className={`text-xs px-2 py-1 rounded ${
                        price.is_active ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
                      }`}>
                        {price.is_active ? "Active" : "Inactive"}
                      </div>
                      {price.is_active && (
                        <button
                          onClick={() => handleDeactivatePrice(price.id)}
                          className="text-xs bg-red-600 text-white px-2 py-1 rounded"
                        >
                          Deactivate
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
    </div>
  );
};

export default Vendors;
