import React from "react";

export default function Navbar({ onLogout }) {
  return (
    <nav className="w-full bg-[#0a1124]/80 backdrop-blur border-b border-white/10 px-4 py-3 text-neutral-100 shadow-sm">
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="text-2xl font-semibold text-indigo-400">Stocks</div>
          <div className="text-sm text-gray-400">News + Analysis</div>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={onLogout}
            className="px-3 py-1 rounded bg-red-700 bg-opacity-20 text-red-400 hover:bg-red-700 hover:bg-opacity-40 transition-colors text-sm font-medium"
            aria-label="Log out"
          >
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
}
