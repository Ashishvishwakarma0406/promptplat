"use client";

import React, { useState } from "react";
import { FaGoogle } from "react-icons/fa";

const LoginForm = () => {
  const [form, setForm] = useState({ usernameEmail: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setForm({ ...form, [e.target.id]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/user/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include", // Important: include cookies
        body: JSON.stringify(form),
      });

      // Check if response is JSON before parsing
      const contentType = res.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        const text = await res.text();
        console.error("Non-JSON response:", text);
        throw new Error("Server returned an invalid response. Please try again.");
      }

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Login failed");
      }

      // Store user in localStorage (so Navbar can read it)
      if (data.user) {
        localStorage.setItem("user", JSON.stringify(data.user));
      }

      window.location.href = "/"; // redirect to home
    } catch (err) {
      console.error("Login error:", err);
      setError(err.message || "An error occurred during login. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex flex-col items-center justify-center min-h-screen text-center text-white bg-[#110e19] p-4">
      <div className="absolute inset-0 z-0 bg-grid-lines opacity-20"></div>
      <div className="relative z-10 max-w-2xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-2 text-[#a083f2]">
            The AI Prompt Directory
          </h1>
          <p className="text-gray-400 max-w-2xl mx-auto">
            We’re glad you’re here! Please log in to continue exploring our
            comprehensive database of prompts and to show love to other prompt
            creators by upvoting the ones you love and use!
          </p>
        </div>

        <div className="bg-[#2a273b] p-6 sm:p-12 rounded-lg shadow-lg max-w-md mx-auto">
          <h2 className="text-2xl font-bold text-center mb-6">Login</h2>

          {error && <p className="text-red-400 mb-4">{error}</p>}

          <form className="space-y-6 text-left" onSubmit={handleSubmit}>
            <div>
              <label
                htmlFor="usernameEmail"
                className="block text-sm font-medium text-white mb-1"
              >
                Username or Email
              </label>
              <input
                type="text"
                id="usernameEmail"
                value={form.usernameEmail}
                onChange={handleChange}
                className="w-full px-4 py-2 rounded-md bg-[#1a1828] border border-[#3e3b4a] text-white focus:outline-none focus:ring-2 focus:ring-[#a083f2]"
                placeholder=" "
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-white mb-1"
              >
                Password
              </label>
              <input
                type="password"
                id="password"
                value={form.password}
                onChange={handleChange}
                className="w-full px-4 py-2 rounded-md bg-[#1a1828] border border-[#3e3b4a] text-white focus:outline-none focus:ring-2 focus:ring-[#a083f2]"
                placeholder=" "
              />
            </div>

            <div className="flex justify-between items-center pt-4">
              <a
                href="#"
                className="text-sm font-medium text-[#a083f2] hover:underline"
              >
                Forgot your password?
              </a>
              <button
                type="submit"
                disabled={loading}
                className="py-2 px-6 font-semibold text-lg bg-[#a083f2] text-white rounded-md transition-transform hover:scale-105 duration-200"
              >
                {loading ? "Logging in..." : "Login"}
              </button>
            </div>
          </form>

          <div className="my-6 flex items-center">
            <hr className="flex-grow border-t border-[#3e3b4a]" />
            <span className="mx-4 text-xs text-gray-400">or</span>
            <hr className="flex-grow border-t border-[#3e3b4a]" />
          </div>

          <button
            type="button"
            className="w-full py-3 font-semibold text-lg bg-[#a083f2] text-white rounded-md flex items-center justify-center space-x-2 hover:scale-105 duration-200"
          >
            <FaGoogle />
            <span>Continue with Google</span>
          </button>
        </div>
      </div>

      <style jsx>{`
        .bg-grid-lines {
          background-image: linear-gradient(
              to right,
              rgba(255, 255, 255, 0.05) 1px,
              transparent 1px
            ),
            linear-gradient(
              to bottom,
              rgba(255, 255, 255, 0.05) 1px,
              transparent 1px
            );
          background-size: 30px 30px;
        }
      `}</style>
    </div>
  );
};

export default LoginForm;
