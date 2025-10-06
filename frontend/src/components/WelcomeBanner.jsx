import React from "react";

export default function WelcomeBanner({ name = "Friend", sub, portfolioValue }) {
  // Get the current hour to determine greeting
  const hour = new Date().getHours();
  const timeWord = hour < 12 
    ? "Good morning" 
    : hour < 17 
    ? "Good afternoon" 
    : "Good evening";

  // Format the portfolio value as Indian Rupees currency
  const formatMoney = (v) => {
    if (typeof v !== "number" || Number.isNaN(v) || v <= 0) return "—";
    return Number(v).toLocaleString("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    });
  };

  return (
    <div className="w-full bg-gradient-to-r from-indigo-900 to-gray-900 border border-gray-700 rounded-lg p-6 shadow-sm">
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-gray-100">
            {timeWord}, <span className="text-indigo-400">{name}</span>{" "}
            <span className="inline-block">👋👋</span>
          </h2>
          <p className="text-sm text-gray-400 mt-1">
            {sub || "Here's your portfolio overview and related news."}
          </p>
        </div>

        {/* Show portfolio value only on small screens and above */}
        <div className="hidden sm:flex items-center gap-3">
          <div className="text-xs text-gray-500">Portfolio value</div>
          <div className="text-lg font-semibold text-gray-100">
            {formatMoney(portfolioValue)}
          </div>
        </div>
      </div>
    </div>
  );
}
