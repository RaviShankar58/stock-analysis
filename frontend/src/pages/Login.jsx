import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import API, { setAuthToken } from "../api/axios";
import { showLoading, dismissToast, showSuccess, showError } from "../lib/toast";
import TopNews from "../components/TopNews";

// bg-images  import
import bg1 from "../assets/bg-1.png";
import bg2 from "../assets/bg-2.png";
import bg3 from "../assets/bg-3.png";
import bg4 from "../assets/bg-4.png";
import bg5 from "../assets/bg-5.png";

const images = [bg1, bg2, bg3, bg4, bg5];
const bgImage = images[Math.floor(Math.random() * images.length)];

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
    <div
      className="flex flex-col min-h-screen text-neutral-200 bg-cover bg-center bg-no-repeat relative"
      style={{
        backgroundImage: `url(${bgImage})`,
        backgroundColor: "#071026",
      }}
    >
      <div className="flex-1 flex flex-col md:flex-row items-center justify-center w-full h-full gap-2 px-4 py-8">
        <div className="w-1/2 md:w-1/2 flex items-center justify-center">
          <form
            onSubmit={handleSubmit}
            className="flex flex-col p-6 rounded-2xl shadow-md shadow-white/5 w-4/5 max-w-lg bg-black/60 backdrop-blur-sm"
            style={{
              backgroundImage:
                "linear-gradient(180deg, rgba(255,255,255,0.02), rgba(255,255,255,0.01))",
              backdropFilter: "blur(6px)",
            }}
          >
            <h1 className="text-center text-4xl mb-6 font-semibold" style={{ fontFamily: "Space Grotesk, Inter, sans-serif" }}>
              Welcome back 👋👋
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

        <div className="w-1/2 md:w-1/2 overflow-y-auto max-h-screen">
          <TopNews defaultCountry="in" />
        </div>
      </div>
    </div>
  );
}

