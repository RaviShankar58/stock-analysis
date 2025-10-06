import React, { useEffect, useState, useRef } from "react";
import Navbar from "../components/Navbar";
import WelcomeBanner from "../components/WelcomeBanner";
import AddStockForm from "../components/AddStockForm";
import PortfolioManager from "../components/PortfolioManager";
import NewsList from "../components/NewsList";
import API from "../api/axios";
import { showError, showLoading, dismissToast, showSuccess } from "../lib/toast";

export default function DashboardPage() {
  const [user, setUser] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [profileError, setProfileError] = useState("");

  const [portfolio, setPortfolio] = useState([]);
  const [portfolioValue, setPortfolioValue] = useState(0);
  const [loadingPortfolio, setLoadingPortfolio] = useState(true);

  const fetchProfile = async () => {
    setLoadingProfile(true);
    setProfileError("");
    try {
      const res = await API.get("/user/profile");
      setUser(res.data.user || null);
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || "Failed to load profile";
      setProfileError(msg);
      setUser(null);
      showError(msg);
    } finally {
      setLoadingProfile(false);
    }
  };

  const fetchPortfolio = async () => {
    setLoadingPortfolio(true);
    try {
      const res = await API.get("/user/portfolio");
      const items = res?.data?.portfolio ?? res?.data ?? [];
      setPortfolio(items || []);

      const total = (items || []).reduce((acc, it) => {
        const qty = Number(it.quantity) || 0;
        const price = Number(it.currentPrice ?? it.lastPrice ?? it.avgPrice ?? 0) || 0;
        return acc + qty * price;
      }, 0);

      setPortfolioValue(total);
    } catch (err) {
      console.error("fetchPortfolio error", err);
      setPortfolio([]);
      setPortfolioValue(0);
      const msg = err?.response?.data?.message || err?.message || "Failed to load portfolio";
      showError(msg);
    } finally {
      setLoadingPortfolio(false);
    }
  };

  useEffect(() => {
    fetchProfile();
    fetchPortfolio();

    const onUpdate = () => {
      fetchProfile();
      fetchPortfolio();
    };
    window.addEventListener("portfolio-updated", onUpdate);
    return () => window.removeEventListener("portfolio-updated", onUpdate);
    // eslint-disable-next-line
  }, []);

  const handleLogout = async () => {
    if (!confirm("Logout?")) return;

    const loadingId = showLoading("Logging out...");
    try {
      await API.post("/user/logout");
      dismissToast(loadingId);
      showSuccess("Logged out — redirecting to login");
    } catch (err) {
      dismissToast(loadingId);
      const msg = err?.response?.data?.message || err?.message || "Logout failed";
      showError(msg);
    } finally {
      setTimeout(() => {
        window.location.href = "/login";
      }, 600);
    }
  };

  const newsListRef = useRef(null);
  const onSelectStockFromPortfolio = (stock) => {
    try {
      newsListRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    } catch (e) {}
    window.dispatchEvent(new CustomEvent("open-news-for-stock", { detail: stock }));
  };

  return (
    <div className="min-h-screen bg-black bg-opacity-30 text-neutral-100">

      <Navbar onLogout={handleLogout} />

      <main className="max-w-6xl mx-auto p-4 space-y-6">
        {/* Profile Section */}
        {loadingProfile ? (
          <div className="p-4 rounded-2xl bg-slate-800/60 backdrop-blur border border-white/10 text-center">
            Loading profile...
          </div>
        ) : profileError ? (
          <div className="p-4 rounded-2xl bg-red-900/20 text-red-300 border border-red-500/20">
            <div className="font-medium">Profile error</div>
            <div className="text-sm mt-1">{profileError}</div>
            <div className="mt-3">
              <button
  onClick={fetchProfile}
  className="relative inline-flex items-center justify-center p-0.5 rounded-lg group
    bg-gradient-to-r from-purple-600 via-blue-500 to-purple-600 bg-[length:200%_200%]
    animate-gradient-x
    hover:from-purple-700 hover:via-blue-600 hover:to-purple-700
    text-white text-sm transition"
>
  <span className="relative px-4 py-2 bg-black/70 rounded-md">
    Retry
  </span>
</button>


            </div>
          </div>
        ) : (
          <WelcomeBanner
            name={user?.username || "Ravi"}
            sub={`Welcome back — here's your portfolio and latest news.`}
            portfolioValue={portfolioValue}
          />
        )}

        {/* Portfolio Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 space-y-6">
            <div className="rounded-xl bg-slate-800/60 backdrop-blur p-4 border border-white/10 shadow-md">
              <AddStockForm onAdded={() => window.dispatchEvent(new CustomEvent("portfolio-updated"))} />
            </div>

            <div className="rounded-xl bg-slate-800/60 backdrop-blur p-4 border border-white/10 shadow-md">
              <PortfolioManager onSelectStock={(stock) => onSelectStockFromPortfolio(stock)} />
            </div>
          </div>

          <div className="lg:col-span-2" ref={newsListRef}>
            <div className="rounded-xl bg-slate-800/60 backdrop-blur p-4 border border-white/10 shadow-md">
              <NewsList />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
