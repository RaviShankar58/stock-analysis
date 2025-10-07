// src/App.jsx
import React from "react";
import { BrowserRouter,Routes, Route, Navigate } from "react-router-dom";
import Signup from "./pages/Signup";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard"; // ✅ import Dashboard page
import { Toaster } from "react-hot-toast";

export default function App() {
  return (
    <>
        <Toaster position="top-center" reverseOrder={false} />
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />

          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />

          <Route path="/dashboard" element={<Dashboard />} />
        </Routes>
    </>
  );
}
