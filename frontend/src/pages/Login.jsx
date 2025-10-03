import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import API, { setAuthToken } from "../api/axios";
import { showLoading, dismissToast, showSuccess, showError } from "../lib/toast";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (!email || !password) {
      setError("Please fill email and password");
      return;
    }

    setLoading(true);
    try {
      const res = await API.post("/user/login", { email, password });
    
      if (res?.data?.token) {
        setAuthToken(res.data.token);
        showSuccess("Login successful! 🎉🚀 Redirecting to dashboard...🏃‍♂️💨");
        setTimeout(() => navigate("/dashboard", { replace: true }), 1500);

      } else {
        showError(res?.data?.message || "Login failed! 😢💥 Try again.");
      }
    } catch (err) {
      showError(err?.response?.data?.message || "Network error! 🌐⚠️ Try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col min-h-screen bg-[#071026] text-neutral-200">
      {/* <video
        autoPlay
        muted
        loop
        className="fixed inset-0 w-full h-full object-cover opacity-25 pointer-events-none"
      >
        <source src="/stock-bg.mp4" type="video/mp4" />
      </video> */}

      <div className="container flex-1 flex flex-col items-center max-w-lg mx-auto px-4 py-28">
        <form
          onSubmit={handleSubmit}
          className="flex flex-col p-6 rounded-2xl shadow-md shadow-white/5 w-full"
          style={{
            backgroundImage:
              "linear-gradient(180deg, rgba(255,255,255,0.02), rgba(255,255,255,0.01))",
            backdropFilter: "blur(6px)",
          }}
        >
          <h1 className="text-center text-4xl mb-6 font-semibold" style={{ fontFamily: "Space Grotesk, Inter, sans-serif" }}>
            Welcome back
          </h1>

          {error && (
            <div className="text-red-400 bg-red-900/20 p-2 rounded mb-4 text-sm">
              {error}
            </div>
          )}

          <input
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="email"
            className="w-auto mb-4 mt-2 mx-2 rounded-lg px-4 py-2 text-gray-200 placeholder-gray-400 border border-gray-700 bg-transparent focus:outline-none focus:ring-0 focus:border-blue-500"
            placeholder="Email"
            autoComplete="email"
          />

          <input
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            type="password"
            className="w-auto mb-4 mt-2 mx-2 rounded-lg px-4 py-2 text-gray-200 placeholder-gray-400 border border-gray-700 bg-transparent focus:outline-none focus:ring-0 focus:border-blue-500"
            placeholder="Password"
            autoComplete="current-password"
          />

          <button
            disabled={loading}
            className="relative inline-flex items-center justify-center p-0.5 mb-4 mt-2 mx-2 overflow-hidden text-sm font-medium text-neutral-200 rounded-lg group bg-gradient-to-br from-purple-600 to-blue-500 hover:from-purple-700 hover:to-blue-600"
            type="submit"
          >
            <span className="relative text-lg w-full px-5 py-2.5 transition-all ease-in duration-75 bg-black/70 rounded-md">
              {loading ? "Logging in..." : "Log in"}
            </span>
          </button>

          <div className="text-center text-sm text-neutral-300 mt-4">
            Don't have an account?{" "}
            <Link to="/signup" className="text-blue-400 underline">Create one</Link>
          </div>
        </form>
      </div>
    </div>
  );
}

