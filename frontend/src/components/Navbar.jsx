import React from "react";

export default function Navbar({ onLogout }) {

  return (
    <nav className="w-full bg-white border-b px-4 py-3">
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="text-2xl font-semibold text-indigo-600">Stocks</div>
          <div className="text-sm text-gray-500">News + Analysis</div>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={onLogout}
            className="px-3 py-1 bg-red-50 text-red-700 rounded hover:bg-red-100 text-sm"
            aria-label="Log out"
          >
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
}
