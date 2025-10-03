// src/components/DashboardSkeleton.jsx
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
      <div className="min-h-screen bg-gray-50">
        <Navbar user={user} />
        <main className="max-w-6xl mx-auto p-4 space-y-4">
          <WelcomeBanner name={user?.name || "Ravi"} />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-1 space-y-4">
              <AddStockForm />
              <PortfolioManager />
            </div>

            <div className="lg:col-span-2">
              <NewsList />
            </div>
          </div>
        </main>
      </div>
    </ToastProvider>
  );
}
