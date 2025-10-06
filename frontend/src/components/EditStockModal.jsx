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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-slate-800 text-white rounded-lg w-full max-w-md p-5 shadow-2xl border border-white/10">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Edit Stock</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-200">✕</button>
        </div>

        <div className="space-y-3">
          <input
            placeholder="Stock name"
            value={stockName}
            onChange={(e) => setStockName(e.target.value)}
            className="w-full bg-slate-700 border border-gray-600 px-3 py-2 rounded text-sm placeholder-gray-400 text-white"
          />
          <input
            placeholder="Quantity"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            className="w-full bg-slate-700 border border-gray-600 px-3 py-2 rounded text-sm placeholder-gray-400 text-white"
          />
          <input
            placeholder="Avg price (optional)"
            value={avgPrice}
            onChange={(e) => setAvgPrice(e.target.value)}
            className="w-full bg-slate-700 border border-gray-600 px-3 py-2 rounded text-sm placeholder-gray-400 text-white"
          />
          <select
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            className="w-full bg-slate-700 border border-gray-600 px-3 py-2 rounded text-sm text-white"
          >
            <option value="IN">India (IN)</option>
            <option value="US">United States (US)</option>
            <option value="GB">United Kingdom (GB)</option>
            <option value="SG">Singapore (SG)</option>
            <option value="HK">Hong Kong (HK)</option>
            <option value="JP">Japan (JP)</option>
          </select>
        </div>

        <div className="mt-5 flex justify-end gap-3">
  <button
    onClick={onClose}
    className="px-3 py-1 rounded bg-gray-700 hover:bg-gray-600 text-sm text-gray-200 transition-colors duration-150"
  >
    Cancel
  </button>

  <button
    onClick={handleSave}
    disabled={saving}
    className="relative inline-flex items-center justify-center p-0.5 overflow-hidden text-sm font-medium text-white rounded-lg group bg-gradient-to-br from-purple-600 to-blue-500 hover:from-purple-700 hover:to-blue-600 disabled:opacity-50"
  >
    <span className="relative px-4 py-1.5 bg-slate-800 rounded-md w-full text-center transition-all duration-150 ease-in-out">
      {saving ? "Saving..." : "Save"}
    </span>
  </button>
</div>

      </div>
    </div>
  );
}
