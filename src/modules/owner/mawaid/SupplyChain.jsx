/* SQL:
CREATE TABLE mawaid_vendors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  contact_person TEXT,
  phone TEXT,
  city TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE mawaid_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category TEXT,
  unit TEXT NOT NULL,
  min_stock NUMERIC DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE mawaid_purchase_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  po_number TEXT UNIQUE NOT NULL,
  vendor_id UUID REFERENCES mawaid_vendors(id),
  site_id UUID REFERENCES mawaid_sites(id),
  order_date DATE NOT NULL,
  expected_date DATE,
  status TEXT DEFAULT 'draft', -- draft, sent, partial, received, cancelled
  total_amount NUMERIC DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE mawaid_po_lines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  po_id UUID REFERENCES mawaid_purchase_orders(id) ON DELETE CASCADE,
  item_id UUID REFERENCES mawaid_items(id),
  quantity NUMERIC NOT NULL,
  unit_price NUMERIC NOT NULL,
  received_qty NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE mawaid_grn (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  grn_number TEXT UNIQUE NOT NULL,
  po_id UUID REFERENCES mawaid_purchase_orders(id),
  received_date DATE NOT NULL,
  received_by TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE mawaid_grn_lines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  grn_id UUID REFERENCES mawaid_grn(id) ON DELETE CASCADE,
  po_line_id UUID REFERENCES mawaid_po_lines(id),
  item_id UUID REFERENCES mawaid_items(id),
  quantity NUMERIC NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);
*/

import { useState, useEffect } from "react";
import { supabase } from "../../../lib/supabaseClient";

const SupplyChain = () => {
  const [view, setView] = useState("po_list"); // po_list, po_form, receiving, grn_list
  const [sites, setSites] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [items, setItems] = useState([]);
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [selectedPO, setSelectedPO] = useState(null);
  const [poLines, setPOLines] = useState([]);
  const [grns, setGrns] = useState([]);

  // PO Form state
  const [poForm, setPOForm] = useState({
    vendor_id: "",
    site_id: "",
    order_date: new Date().toISOString().split("T")[0],
    expected_date: "",
    notes: ""
  });
  const [currentLine, setCurrentLine] = useState({ item_id: "", quantity: "", unit_price: "" });
  const [lines, setLines] = useState([]);

  // GRN Form state
  const [grnForm, setGrnForm] = useState({
    po_id: "",
    received_date: new Date().toISOString().split("T")[0],
    received_by: "",
    notes: ""
  });
  const [grnLines, setGrnLines] = useState([]);

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    setLoading(true);
    await Promise.all([loadSites(), loadVendors(), loadItems(), loadPurchaseOrders()]);
    setLoading(false);
  };

  const loadSites = async () => {
    const { data, error } = await supabase
      .from("mawaid_sites")
      .select("*")
      .eq("is_active", true)
      .order("name");
    if (error) setError(`RLS blocked action: ${error.message}`);
    else setSites(data || []);
  };

  const loadVendors = async () => {
    const { data, error } = await supabase
      .from("mawaid_vendors")
      .select("*")
      .eq("is_active", true)
      .order("name");
    if (error) setError(`RLS blocked action: ${error.message}`);
    else setVendors(data || []);
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

  const loadPurchaseOrders = async () => {
    const { data, error } = await supabase
      .from("mawaid_purchase_orders")
      .select(`
        *,
        vendor:mawaid_vendors(name),
        site:mawaid_sites(name)
      `)
      .order("order_date", { ascending: false })
      .limit(50);
    if (error) setError(`RLS blocked action: ${error.message}`);
    else setPurchaseOrders(data || []);
  };

  const loadPOLines = async (poId) => {
    const { data, error } = await supabase
      .from("mawaid_po_lines")
      .select(`
        *,
        item:mawaid_items(name, unit)
      `)
      .eq("po_id", poId);
    if (error) setError(`RLS blocked action: ${error.message}`);
    else setPOLines(data || []);
  };

  const loadGRNs = async () => {
    const { data, error } = await supabase
      .from("mawaid_grn")
      .select(`
        *,
        po:mawaid_purchase_orders(po_number, vendor:mawaid_vendors(name))
      `)
      .order("received_date", { ascending: false })
      .limit(50);
    if (error) setError(`RLS blocked action: ${error.message}`);
    else setGrns(data || []);
  };

  const addLineToCart = () => {
    if (!currentLine.item_id || !currentLine.quantity || !currentLine.unit_price) {
      setError("All fields required for line item");
      return;
    }
    const item = items.find(i => i.id === currentLine.item_id);
    setLines([...lines, {
      item_id: currentLine.item_id,
      item_name: item.name,
      unit: item.unit,
      quantity: parseFloat(currentLine.quantity),
      unit_price: parseFloat(currentLine.unit_price),
      amount: parseFloat(currentLine.quantity) * parseFloat(currentLine.unit_price)
    }]);
    setCurrentLine({ item_id: "", quantity: "", unit_price: "" });
    setError("");
  };

  const removeLine = (index) => {
    setLines(lines.filter((_, i) => i !== index));
  };

  const savePO = async () => {
    if (!poForm.vendor_id || !poForm.site_id || lines.length === 0) {
      setError("Vendor, Site, and at least one line item required");
      return;
    }

    setLoading(true);
    const totalAmount = lines.reduce((sum, line) => sum + line.amount, 0);
    const poNumber = `PO-${Date.now()}`;

    const { data: po, error: poError } = await supabase
      .from("mawaid_purchase_orders")
      .insert({
        po_number: poNumber,
        vendor_id: poForm.vendor_id,
        site_id: poForm.site_id,
        order_date: poForm.order_date,
        expected_date: poForm.expected_date || null,
        status: "draft",
        total_amount: totalAmount,
        notes: poForm.notes
      })
      .select()
      .single();

    if (poError) {
      setError(`RLS blocked action: ${poError.message}`);
      setLoading(false);
      return;
    }

    const lineInserts = lines.map(line => ({
      po_id: po.id,
      item_id: line.item_id,
      quantity: line.quantity,
      unit_price: line.unit_price
    }));

    const { error: linesError } = await supabase
      .from("mawaid_po_lines")
      .insert(lineInserts);

    if (linesError) {
      setError(`RLS blocked action: ${linesError.message}`);
    } else {
      setError("");
      setPOForm({ vendor_id: "", site_id: "", order_date: new Date().toISOString().split("T")[0], expected_date: "", notes: "" });
      setLines([]);
      loadPurchaseOrders();
      setView("po_list");
    }
    setLoading(false);
  };

  const receiveGoods = async () => {
    if (!grnForm.po_id || !grnForm.received_by || grnLines.length === 0) {
      setError("PO, Received By, and at least one line item required");
      return;
    }

    setLoading(true);
    const grnNumber = `GRN-${Date.now()}`;

    const { data: grn, error: grnError } = await supabase
      .from("mawaid_grn")
      .insert({
        grn_number: grnNumber,
        po_id: grnForm.po_id,
        received_date: grnForm.received_date,
        received_by: grnForm.received_by,
        notes: grnForm.notes
      })
      .select()
      .single();

    if (grnError) {
      setError(`RLS blocked action: ${grnError.message}`);
      setLoading(false);
      return;
    }

    const lineInserts = grnLines.map(line => ({
      grn_id: grn.id,
      po_line_id: line.po_line_id,
      item_id: line.item_id,
      quantity: line.quantity
    }));

    const { error: linesError } = await supabase
      .from("mawaid_grn_lines")
      .insert(lineInserts);

    if (linesError) {
      setError(`RLS blocked action: ${linesError.message}`);
    } else {
      // Update received quantities on PO lines
      for (const line of grnLines) {
        await supabase
          .from("mawaid_po_lines")
          .update({ received_qty: supabase.raw(`received_qty + ${line.quantity}`) })
          .eq("id", line.po_line_id);
      }

      setError("");
      setGrnForm({ po_id: "", received_date: new Date().toISOString().split("T")[0], received_by: "", notes: "" });
      setGrnLines([]);
      loadPurchaseOrders();
      setView("grn_list");
    }
    setLoading(false);
  };

  const prepareReceiving = async (po) => {
    setSelectedPO(po);
    await loadPOLines(po.id);
    setGrnForm({ ...grnForm, po_id: po.id });
    setView("receiving");
  };

  useEffect(() => {
    if (view === "receiving" && poLines.length > 0) {
      setGrnLines(poLines.map(line => ({
        po_line_id: line.id,
        item_id: line.item_id,
        item_name: line.item.name,
        unit: line.item.unit,
        ordered_qty: line.quantity,
        received_qty: line.received_qty,
        quantity: Math.max(0, line.quantity - line.received_qty)
      })));
    }
  }, [poLines, view]);

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Supply Chain</h1>
        <div className="flex gap-2">
          <button
            onClick={() => setView("po_list")}
            className={`px-3 py-1 rounded text-sm ${view === "po_list" ? "bg-blue-600 text-white" : "bg-gray-200"}`}
          >
            PO List
          </button>
          <button
            onClick={() => { setView("po_form"); setLines([]); }}
            className={`px-3 py-1 rounded text-sm ${view === "po_form" ? "bg-blue-600 text-white" : "bg-gray-200"}`}
          >
            New PO
          </button>
          <button
            onClick={() => { setView("grn_list"); loadGRNs(); }}
            className={`px-3 py-1 rounded text-sm ${view === "grn_list" ? "bg-blue-600 text-white" : "bg-gray-200"}`}
          >
            GRNs
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-300 text-red-800 px-4 py-2 rounded mb-4">
          {error}
        </div>
      )}

      {view === "po_list" && (
        <div>
          <h2 className="text-lg font-semibold mb-3">Purchase Orders</h2>
          {loading ? (
            <div className="animate-pulse space-y-3">
              {[1, 2, 3].map(i => <div key={i} className="h-16 bg-gray-200 rounded"></div>)}
            </div>
          ) : (
            <div className="space-y-2">
              {purchaseOrders.map(po => (
                <div key={po.id} className="border border-gray-300 rounded p-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-semibold">{po.po_number}</div>
                      <div className="text-sm text-gray-600">{po.vendor?.name} | {po.site?.name}</div>
                      <div className="text-xs text-gray-500">Order: {po.order_date} | Exp: {po.expected_date || "N/A"}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">Rs. {po.total_amount?.toFixed(2)}</div>
                      <div className={`text-xs px-2 py-1 rounded mt-1 ${
                        po.status === "received" ? "bg-green-100 text-green-800" :
                        po.status === "partial" ? "bg-yellow-100 text-yellow-800" :
                        po.status === "sent" ? "bg-blue-100 text-blue-800" :
                        "bg-gray-100 text-gray-800"
                      }`}>
                        {po.status}
                      </div>
                    </div>
                  </div>
                  {po.status !== "received" && po.status !== "cancelled" && (
                    <button
                      onClick={() => prepareReceiving(po)}
                      className="mt-2 text-sm bg-green-600 text-white px-3 py-1 rounded"
                    >
                      Receive Goods
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {view === "po_form" && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Create Purchase Order</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Vendor</label>
              <select
                className="w-full border border-gray-300 rounded px-3 py-2"
                value={poForm.vendor_id}
                onChange={(e) => setPOForm({ ...poForm, vendor_id: e.target.value })}
              >
                <option value="">Select Vendor</option>
                {vendors.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Site</label>
              <select
                className="w-full border border-gray-300 rounded px-3 py-2"
                value={poForm.site_id}
                onChange={(e) => setPOForm({ ...poForm, site_id: e.target.value })}
              >
                <option value="">Select Site</option>
                {sites.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Order Date</label>
              <input
                type="date"
                className="w-full border border-gray-300 rounded px-3 py-2"
                value={poForm.order_date}
                onChange={(e) => setPOForm({ ...poForm, order_date: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Expected Date</label>
              <input
                type="date"
                className="w-full border border-gray-300 rounded px-3 py-2"
                value={poForm.expected_date}
                onChange={(e) => setPOForm({ ...poForm, expected_date: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Notes</label>
            <textarea
              className="w-full border border-gray-300 rounded px-3 py-2"
              rows={2}
              value={poForm.notes}
              onChange={(e) => setPOForm({ ...poForm, notes: e.target.value })}
            />
          </div>

          <div className="border-t pt-4">
            <h3 className="font-medium mb-3">Add Items</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
              <select
                className="border border-gray-300 rounded px-3 py-2"
                value={currentLine.item_id}
                onChange={(e) => setCurrentLine({ ...currentLine, item_id: e.target.value })}
              >
                <option value="">Select Item</option>
                {items.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}
              </select>
              <input
                type="number"
                step="0.01"
                className="border border-gray-300 rounded px-3 py-2"
                placeholder="Qty"
                value={currentLine.quantity}
                onChange={(e) => setCurrentLine({ ...currentLine, quantity: e.target.value })}
              />
              <input
                type="number"
                step="0.01"
                className="border border-gray-300 rounded px-3 py-2"
                placeholder="Price"
                value={currentLine.unit_price}
                onChange={(e) => setCurrentLine({ ...currentLine, unit_price: e.target.value })}
              />
              <button
                onClick={addLineToCart}
                className="bg-blue-600 text-white rounded px-3 py-2"
              >
                Add
              </button>
            </div>
          </div>

          {lines.length > 0 && (
            <div className="border rounded p-3">
              <h3 className="font-medium mb-2">Items ({lines.length})</h3>
              <div className="space-y-2">
                {lines.map((line, index) => (
                  <div key={index} className="flex justify-between items-center text-sm border-b pb-2">
                    <div>
                      <div className="font-medium">{line.item_name}</div>
                      <div className="text-gray-600">{line.quantity} {line.unit} x Rs. {line.unit_price}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">Rs. {line.amount.toFixed(2)}</span>
                      <button
                        onClick={() => removeLine(index)}
                        className="text-red-600 text-xs px-2 py-1 border border-red-600 rounded"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-3 text-right font-bold">
                Total: Rs. {lines.reduce((sum, l) => sum + l.amount, 0).toFixed(2)}
              </div>
            </div>
          )}

          <button
            onClick={savePO}
            disabled={loading || lines.length === 0}
            className="w-full bg-blue-600 text-white font-medium py-3 rounded disabled:bg-gray-300"
          >
            {loading ? "Saving..." : "Create Purchase Order"}
          </button>
        </div>
      )}

      {view === "receiving" && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Receive Goods - {selectedPO?.po_number}</h2>

          <div className="bg-blue-50 border border-blue-300 rounded p-3 text-sm">
            <div>Vendor: {selectedPO?.vendor?.name}</div>
            <div>Site: {selectedPO?.site?.name}</div>
            <div>Order Date: {selectedPO?.order_date}</div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Received Date</label>
              <input
                type="date"
                className="w-full border border-gray-300 rounded px-3 py-2"
                value={grnForm.received_date}
                onChange={(e) => setGrnForm({ ...grnForm, received_date: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Received By</label>
              <input
                type="text"
                className="w-full border border-gray-300 rounded px-3 py-2"
                value={grnForm.received_by}
                onChange={(e) => setGrnForm({ ...grnForm, received_by: e.target.value })}
                placeholder="Name of receiver"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Notes</label>
            <textarea
              className="w-full border border-gray-300 rounded px-3 py-2"
              rows={2}
              value={grnForm.notes}
              onChange={(e) => setGrnForm({ ...grnForm, notes: e.target.value })}
            />
          </div>

          <div className="border rounded p-3">
            <h3 className="font-medium mb-2">Items to Receive</h3>
            <div className="space-y-2">
              {grnLines.map((line, index) => (
                <div key={index} className="border-b pb-2">
                  <div className="font-medium text-sm">{line.item_name}</div>
                  <div className="grid grid-cols-3 gap-2 mt-1 text-xs">
                    <div>Ordered: {line.ordered_qty} {line.unit}</div>
                    <div>Already Received: {line.received_qty} {line.unit}</div>
                    <div>
                      <input
                        type="number"
                        step="0.01"
                        className="w-full border border-gray-300 rounded px-2 py-1"
                        value={line.quantity}
                        onChange={(e) => {
                          const newLines = [...grnLines];
                          newLines[index].quantity = parseFloat(e.target.value) || 0;
                          setGrnLines(newLines);
                        }}
                        placeholder="Receive qty"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={receiveGoods}
            disabled={loading}
            className="w-full bg-green-600 text-white font-medium py-3 rounded disabled:bg-gray-300"
          >
            {loading ? "Processing..." : "Confirm Receipt"}
          </button>
        </div>
      )}

      {view === "grn_list" && (
        <div>
          <h2 className="text-lg font-semibold mb-3">Goods Receipt Notes</h2>
          {loading ? (
            <div className="animate-pulse space-y-3">
              {[1, 2, 3].map(i => <div key={i} className="h-16 bg-gray-200 rounded"></div>)}
            </div>
          ) : (
            <div className="space-y-2">
              {grns.map(grn => (
                <div key={grn.id} className="border border-gray-300 rounded p-3">
                  <div className="font-semibold">{grn.grn_number}</div>
                  <div className="text-sm text-gray-600">PO: {grn.po?.po_number} | Vendor: {grn.po?.vendor?.name}</div>
                  <div className="text-xs text-gray-500">
                    Received: {grn.received_date} | By: {grn.received_by}
                  </div>
                  {grn.notes && <div className="text-xs text-gray-600 mt-1">{grn.notes}</div>}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SupplyChain;
