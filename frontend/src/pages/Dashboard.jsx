import React, { useEffect, useState, useRef } from "react";
import Navbar from "../components/Navbar";
import WelcomeBanner from "../components/WelcomeBanner";
import AddStockForm from "../components/AddStockForm";
import PortfolioManager from "../components/PortfolioManager";
import NewsList from "../components/NewsList";
import API from "../api/axios";
import { showError, showLoading, dismissToast, showSuccess } from "../lib/toast";
import { clearAuthToken } from "../api/axios";
import { useNavigate } from "react-router-dom";



export default function DashboardPage() {
  const [user, setUser] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [profileError, setProfileError] = useState("");

  const [portfolio, setPortfolio] = useState([]);
  const [portfolioValue, setPortfolioValue] = useState(0);
  const [loadingPortfolio, setLoadingPortfolio] = useState(true);

  const navigate = useNavigate();

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
      clearAuthToken()
      dismissToast(loadingId);
      showSuccess("Logged out — redirecting to login");
      navigate("/login", { replace: true });
    } catch (err) {
      dismissToast(loadingId);
      const msg = err?.response?.data?.message || err?.message || "Logout failed";
      showError(msg);
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
    <div className="min-h-screen bg-gray-50">
      <Navbar onLogout={handleLogout} />

      <main className="max-w-6xl mx-auto p-4 space-y-4">
        {loadingProfile ? (
          <div className="p-4 rounded bg-white text-center">Loading profile...</div>
        ) : profileError ? (
          <div className="p-4 rounded bg-red-50 text-red-700">
            <div className="font-medium">Profile error</div>
            <div className="text-sm mt-1">{profileError}</div>
            <div className="mt-3">
              <button onClick={fetchProfile} className="px-3 py-1 bg-indigo-600 text-white rounded">Retry</button>
            </div>
          </div>
        ) : (
          <WelcomeBanner
            name={user?.username || "Ravi"}
            sub={`Welcome back — here's your portfolio and latest news.`}
            portfolioValue={portfolioValue}
          />
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-1 space-y-4">
            <AddStockForm onAdded={() => window.dispatchEvent(new CustomEvent("portfolio-updated"))} />
            <PortfolioManager onSelectStock={(stock) => onSelectStockFromPortfolio(stock)} />
          </div>

          <div className="lg:col-span-2" ref={newsListRef}>
            <NewsList />
          </div>
        </div>
      </main>
    </div>
  );
}
