import React from "react";
import Navbar from "./Navbar";
import WelcomeBanner from "./WelcomeBanner";
import ToastProvider from "./ToastProvider";
import AddStockForm from "./AddStockForm";
import PortfolioManager from "./PortfolioManager";
import NewsList from "./NewsList";

export default function DashboardSkeleton({ user }) {
  return (
    <ToastProvider>
      <div className="min-h-screen bg-[#0a1124] text-neutral-100">
        {/* Navbar */}
        <Navbar user={user} />

        {/* Main Dashboard Content */}
        <main className="max-w-6xl mx-auto p-4 space-y-4">
          <WelcomeBanner name={user?.name || "Ravi"} />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Left Sidebar: Add + Portfolio */}
            <div className="lg:col-span-1 space-y-4">
              <div className="rounded-xl bg-slate-800/60 backdrop-blur p-4 border border-white/10 shadow-md">
                <AddStockForm />
              </div>
              <div className="rounded-xl bg-slate-800/60 backdrop-blur p-4 border border-white/10 shadow-md">
                <PortfolioManager />
              </div>
            </div>

            {/* Right Section: News */}
            <div className="lg:col-span-2">
              <div className="rounded-xl bg-slate-800/60 backdrop-blur p-4 border border-white/10 shadow-md">
                <NewsList />
              </div>
            </div>
          </div>
        </main>
      </div>
    </ToastProvider>
  );
}
