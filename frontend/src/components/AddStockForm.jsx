import React, { useState } from "react";
import API from "../api/axios";
import { showSuccess, showError } from "../lib/toast";

export default function AddStockForm({ onAdded }) {
  const [stockName, setStockName] = useState("");
  const [quantity, setQuantity] = useState("");
  const [avgPrice, setAvgPrice] = useState("");
  const [country, setCountry] = useState("IN");
  const [adding, setAdding] = useState(false);

  const submit = async (e) => {
    e?.preventDefault();
    const name = (stockName || "").trim();
    if (!name) {
      showError("Wait 🫷🫷!! Stock name is required");
      return;
    }
    const qty = Number(quantity);
    const price = avgPrice === "" ? undefined : Number(avgPrice);
    if (!Number.isFinite(qty) || qty <= 0) {
      showError("Quantity must be a positive number");
      return;
    }

    setAdding(true);
    try {
      const res = await API.post("/user/portfolio/add", {
        stockName: name,
        quantity: qty,
        avgPrice: price,
        country: (country || "IN").toString().toUpperCase(),
      });

      showSuccess(res?.data?.message || "Added to portfolio ✅✅");
      setStockName("");
      setQuantity("");
      setAvgPrice("");
      setCountry("IN");
      onAdded && onAdded();
      window.dispatchEvent(new CustomEvent("portfolio-updated"));
    } catch (err) {
      console.error("Add stock error", err);
      const msg = err?.response?.data?.message || err?.message || "Adding Stock failed";
      showError(msg);
    } finally {
      setAdding(false);
    }
  };

  return (
    <form onSubmit={submit} className="bg-slate-800 p-4 rounded-lg border border-gray-700">
      <div className="flex flex-wrap gap-3 items-center">
        <input
          className="bg-slate-900 border border-gray-700 text-gray-100 placeholder-gray-400 px-3 py-2 rounded w-40 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          placeholder="Stock name (e.g. RELIANCE)"
          value={stockName}
          onChange={(e) => setStockName(e.target.value)}
        />
        <input
          className="bg-slate-900 border border-gray-700 text-gray-100 placeholder-gray-400 px-3 py-2 rounded w-24 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          placeholder="Qty"
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
        />
        <input
          className="bg-slate-900 border border-gray-700 text-gray-100 placeholder-gray-400 px-3 py-2 rounded w-36 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          placeholder="Avg price (opt)"
          value={avgPrice}
          onChange={(e) => setAvgPrice(e.target.value)}
        />
        <select
          className="bg-slate-900 border border-gray-700 text-gray-100 px-3 py-2 rounded w-36 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          value={country}
          onChange={(e) => setCountry(e.target.value)}
        >
          <option value="IN">India (IN)</option>
          <option value="US">United States (US)</option>
          <option value="GB">United Kingdom (GB)</option>
          <option value="SG">Singapore (SG)</option>
          <option value="HK">Hong Kong (HK)</option>
        </select>

        <button
  type="submit"
  disabled={adding}
  className="relative inline-flex items-center justify-center p-0.5 overflow-hidden text-sm font-medium text-neutral-200 rounded-lg group bg-gradient-to-br from-purple-600 to-blue-500 hover:from-purple-700 hover:to-blue-600 disabled:opacity-50 transition"
>
  <span className="relative text-sm w-full px-5 py-2.5 transition-all ease-in duration-75 bg-black/70 rounded-md">
    {adding ? "Adding..." : "Add"}
  </span>
</button>

      </div>
    </form>
  );
}
