import React, { useEffect, useState } from "react";
import API from "../api/axios";
import EditStockModal from "./EditStockModal";
import ConfirmDialog from "./ConfirmDialog";
import { showSuccess, showError } from "../lib/toast";

export default function PortfolioManager({ onSelectStock }) {
  const [portfolio, setPortfolio] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editItem, setEditItem] = useState(null);
  const [confirmRemove, setConfirmRemove] = useState(null);

  const fetch = async () => {
    setLoading(true);
    try {
      const res = await API.get("/user/portfolio");
      const items = res?.data?.portfolio ?? res?.data ?? [];
      setPortfolio(items || []);
    } catch (err) {
      console.error("fetch portfolio", err);
      const msg = err?.response?.data?.message || "Failed to fetch portfolio";
      showError(msg);
      setPortfolio([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetch();
    const onUpdate = () => fetch();
    window.addEventListener("portfolio-updated", onUpdate);
    return () => window.removeEventListener("portfolio-updated", onUpdate);
    // eslint-disable-next-line
  }, []);

  const doRemove = async (item) => {
    const name = item.stockName || item.symbol;
    const ct = item.country || "IN";
    try {
      await API.delete(
        `/user/portfolio/remove/${encodeURIComponent(name)}?country=${encodeURIComponent(ct)}`
      );
      showSuccess("Removed from portfolio");
      await fetch();
      window.dispatchEvent(new CustomEvent("portfolio-updated"));
    } catch (err) {
      console.error(err);
      const msg = err?.response?.data?.message || "Remove failed";
      showError(msg);
    } finally {
      setConfirmRemove(null);
    }
  };

  const saveEdit = async (payload) => {
    try {
      const id = editItem?._id;
      if (id) {
        await API.patch("/user/portfolio/update", { _id: id, ...payload });
      } else {
        await API.patch("/user/portfolio/update", {
          stockName: editItem?.stockName,
          country: editItem?.country,
          ...payload,
        });
      }
      showSuccess("Updated");
      await fetch();
      window.dispatchEvent(new CustomEvent("portfolio-updated"));
      return true;
    } catch (err) {
      console.error(err);
      const msg = err?.response?.data?.message || "Update failed";
      showError(msg);
      throw err;
    }
  };

  return (
    <div className="bg-gray-900 p-4 rounded-lg border border-gray-700 text-gray-300">
      <div className="flex items-center justify-between mb-3">
  <h3 className="text-lg font-semibold">Your Portfolio</h3>
  <button
    onClick={fetch}
    disabled={loading}
    className="relative inline-flex items-center justify-center p-0.5 mb-0 mt-0 mx-2 overflow-hidden text-sm font-medium text-neutral-200 rounded-lg group bg-gradient-to-br from-purple-600 to-blue-500 hover:from-purple-700 hover:to-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
  >
    <span className="relative text-lg w-full px-5 py-2.5 transition-all ease-in duration-75 bg-black/70 rounded-md">
      {loading ? "Refreshing..." : "Refresh"}
    </span>
  </button>
</div>


      {loading ? (
        <div className="text-sm text-gray-500">Loading portfolio...</div>
      ) : portfolio.length === 0 ? (
        <div className="text-sm text-gray-500">No stocks — add one above.</div>
      ) : (
        <ul className="space-y-2">
          {portfolio.map((s) => (
            <li
              key={s._id || `${s.stockName}_${s.country}`}
              className="flex items-center justify-between p-3 rounded border border-gray-700 hover:bg-gray-800 cursor-default"
            >
              <div
                onClick={() => onSelectStock && onSelectStock(s)}
                className="cursor-pointer"
              >
                <div className="font-medium text-white">{s.stockName || s.symbol}</div>
                <div className="text-xs text-gray-400">
                  Qty: {s.quantity} {s.avgPrice !== undefined && `• Avg ${s.avgPrice}`}{" "}
                  {s.country && `• ${s.country}`}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
  onClick={() => setEditItem(s)}
  className="relative inline-flex items-center justify-center p-0.5 rounded-lg group bg-gradient-to-br from-purple-600 to-blue-500 hover:from-purple-700 hover:to-blue-600 text-neutral-200 text-sm transition"
>
  <span className="relative px-4 py-1.5 bg-black/70 rounded-md">
    Edit
  </span>
</button>

<button
  onClick={() => setConfirmRemove(s)}
  className="relative inline-flex items-center justify-center p-0.5 rounded-lg group bg-gradient-to-br from-red-600 to-red-500 hover:from-red-700 hover:to-red-600 text-neutral-200 text-sm transition"
>
  <span className="relative px-4 py-1.5 bg-black/70 rounded-md">
    Remove
  </span>
</button>

              </div>
            </li>
          ))}
        </ul>
      )}

      <EditStockModal open={!!editItem} item={editItem} onSave={saveEdit} onClose={() => setEditItem(null)} />

      <ConfirmDialog
        open={!!confirmRemove}
        title="Remove stock"
        message={`Remove ${confirmRemove?.stockName || confirmRemove?.symbol}?`}
        onConfirm={() => doRemove(confirmRemove)}
        onClose={() => setConfirmRemove(null)}
        confirmText="Remove"
      />
    </div>
  );
}
