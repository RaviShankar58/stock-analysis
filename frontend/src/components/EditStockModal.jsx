import React, { useState, useEffect } from "react";
import { showError, showSuccess } from "../lib/toast";

export default function EditStockModal({ open, item, onSave, onClose }) {
  const [stockName, setStockName] = useState("");
  const [quantity, setQuantity] = useState("");
  const [avgPrice, setAvgPrice] = useState("");
  const [country, setCountry] = useState("IN");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (item) {
      setStockName(item.stockName || item.symbol || "");
      setQuantity(item.quantity ?? "");
      setAvgPrice(item.avgPrice ?? "");
      setCountry(item.country || "IN");
    } else {
      setStockName("");
      setQuantity("");
      setAvgPrice("");
      setCountry("IN");
    }
  }, [item]);

  if (!open) return null;

  const handleSave = async () => {
    const qty = Number(quantity);
    const price = avgPrice === "" ? undefined : Number(avgPrice);
    if (!stockName.trim()) return showError("Stock name required");
    if (!Number.isFinite(qty) || qty <= 0) return showError("Quantity must be positive");

    setSaving(true);
    try {
      const payload = {
        stockName: stockName.trim(),
        quantity: qty,
        avgPrice: price,
        country: (country || "IN").toString().toUpperCase()
      };
      // call onSave and wait if it returns a promise
      const res = onSave ? await onSave(payload) : null;
      showSuccess("Stock updated successfully ✅✅");
      onClose && onClose();
      return res;
    } catch (err) {
      console.error(err);
      showError(err?.message || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <div className="bg-white rounded-lg w-full max-w-md p-5 shadow-lg">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold">Edit stock</h3>
          <button onClick={onClose} className="text-gray-500">Close</button>
        </div>

        <div className="mt-4 space-y-3">
          <input placeholder="Stock name" value={stockName} onChange={(e) => setStockName(e.target.value)} className="w-full border px-3 py-2 rounded" />
          <input placeholder="Quantity" value={quantity} onChange={(e) => setQuantity(e.target.value)} className="w-full border px-3 py-2 rounded" />
          <input placeholder="Avg price (optional)" value={avgPrice} onChange={(e) => setAvgPrice(e.target.value)} className="w-full border px-3 py-2 rounded" />
          <select value={country} onChange={(e) => setCountry(e.target.value)} className="w-full border px-3 py-2 rounded">
            <option value="IN">India (IN)</option>
            <option value="US">United States (US)</option>
            <option value="GB">United Kingdom (GB)</option>
            <option value="SG">Singapore (SG)</option>
            <option value="HK">Hong Kong (HK)</option>
            <option value="JP">Japan (JP)</option>
          </select>
        </div>

        <div className="mt-4 flex justify-end gap-3">
          <button onClick={onClose} className="px-3 py-1 rounded bg-gray-100 text-sm">Cancel</button>
          <button onClick={handleSave} disabled={saving} className="px-3 py-1 rounded bg-indigo-600 text-white text-sm">
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}
