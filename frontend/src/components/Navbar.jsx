import React from "react";

export default function Navbar({ onLogout }) {

  return (
    <nav className="w-full bg-[#0a1124]/80 backdrop-blur border-b border-white/10 px-4 py-3 text-neutral-100 shadow-sm">
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="text-2xl font-semibold text-indigo-400">Stocks</div>
          <div className="text-sm text-gray-200">News + Analysis</div>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={onLogout}
            className="px-4 py-2 rounded-md border border-red-500 bg-red-200 text-red-700 shadow-md hover:bg-red-500 hover:text-white hover:shadow-lg transition-all duration-200 ease-in-out text-sm font-semibold"
            aria-label="Log out"
          >
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
}
