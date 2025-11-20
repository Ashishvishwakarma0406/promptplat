"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';


const AccountCreationForm = () => {
    const [step, setStep] = useState("form"); // "form" or "otp"
    const [name, setName] = useState("");
    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState(""); // New state for confirm password
    const [otp, setOtp] = useState("");
    const [msg, setMsg] = useState("");
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();



    const handleSendOtp = async (e) => {
        e.preventDefault();
        setError("");
        setMsg("");
        if (!name || !email || !username || !password || !confirmPassword) {
            setError("All fields are required.");
            return;
        }

        if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
            setError("Username can only contain letters, numbers, underscores (_) and hyphens (-).");
            return false;
        }

        if (password !== confirmPassword) {
            setError("Passwords do not match.");
            return;
        }

        if (password.length < 6) {
            setError("Password must be at least 6 characters long.");
            return;
        }

        setIsLoading(true);
        try {
            const res = await fetch("/api/user/send_register_otp", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, username, name, password }),
            });
            const data = await res.json();
            if (res.ok) {
                setMsg(`OTP sent to ${email}`);
                setStep("otp");
            } else {
                setError(data.error || "Failed to send OTP. Please try again.");
            }
        } catch (err) {
            console.error("Send OTP error:", err);
            setError("An unexpected error occurred. Please check your connection.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleVerifyOtp = async (e) => {
        e.preventDefault();
        setError("");
        setMsg("");
        if (!otp) {
            setError("Please enter the OTP.");
            return;
        }
        setIsLoading(true);
        try {
            const res = await fetch("/api/user/verify_register_otp", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, otp, name, username, password }),
            });
            const data = await res.json();
            if (res.ok) {
                setMsg("Registration successful! Redirecting...");
                window.location.href = "/";
            } else {
                setError(data.error || "Invalid OTP. Please try again.");
            }
        } catch (err) {
            console.error("Verify OTP error:", err);
            setError("An unexpected error occurred.");
        } finally {
            setIsLoading(false);
        }
    };

    const renderForm = () => (
        <form className="space-y-6 text-left" onSubmit={handleSendOtp}>
            {/* Full Name Field */}
            <div>
                <label htmlFor="fullName" className="block text-sm font-medium text-white mb-1">
                    Full Name
                </label>
                <input
                    type="text"
                    id="fullName"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-4 py-2 rounded-md bg-[#1a1828] border border-[#3e3b4a] text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#a083f2] transition-colors duration-200"
                    placeholder=" "
                    required
                />
            </div>

            {/* Username Field */}
            <div>
                <label htmlFor="username" className="block text-sm font-medium text-white mb-1">
                    Username
                </label>
                <input
                    type="text"
                    id="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full px-4 py-2 rounded-md bg-[#1a1828] border border-[#3e3b4a] text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#a083f2] transition-colors duration-200"
                    placeholder=" "
                    required
                />
                <p className="mt-1 text-xs text-gray-500">Only letters, numbers, underscores ( _ ) and hyphen ( - ) allowed</p>
            </div>

            {/* Email Field */}
            <div>
                <label htmlFor="email" className="block text-sm font-medium text-white mb-1">
                    Email
                </label>
                <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-2 rounded-md bg-[#1a1828] border border-[#3e3b4a] text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#a083f2] transition-colors duration-200"
                    placeholder=" "
                    required
                />
            </div>

            {/* Password Field */}
            <div>
                <label htmlFor="password" className="block text-sm font-medium text-white mb-1">
                    Password
                </label>
                <input
                    type="password"
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-2 rounded-md bg-[#1a1828] border border-[#3e3b4a] text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#a083f2] transition-colors duration-200"
                    placeholder=" "
                    required
                />
                <p className="mt-1 text-xs text-gray-500">Minimum 6 characters</p>
            </div>

            {/* Confirm Password Field */}
            <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-white mb-1">
                    Confirm Password
                </label>
                <input
                    type="password"
                    id="confirmPassword"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-4 py-2 rounded-md bg-[#1a1828] border border-[#3e3b4a] text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#a083f2] transition-colors duration-200"
                    placeholder=" "
                    required
                />
            </div>

            {/* Checkbox */}
            <div className="flex items-center space-x-2">
                <input
                    type="checkbox"
                    id="newsletter"
                    className="h-4 w-4 text-[#a083f2] rounded border-[#3e3b4a] bg-[#1a1828] focus:ring-[#a083f2]"
                />
                <label htmlFor="newsletter" className="text-sm text-gray-400">
                    Subscribe to our newsletter for weekly prompts, tips, and updates.
                </label>
            </div>

            {/* Submit Button */}
            <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 font-semibold text-lg bg-[#a083f2] text-white rounded-md transition-transform hover:scale-105 duration-200 disabled:opacity-50"
            >
                {isLoading ? "Sending OTP..." : "Create Account"}
            </button>

            {/* Login Link */}
            <div className="text-center text-sm text-gray-400">
                Already have an account? <a href="#" className="font-medium text-[#a083f2] hover:underline">Login here</a>
            </div>
        </form>
    );

    const renderOtp = () => (
        <form className="space-y-6 text-left" onSubmit={handleVerifyOtp}>
            <div className="text-center mb-4">
                <p className="text-sm text-gray-400">An OTP has been sent to your email.</p>
                <p className="text-sm font-bold text-white mt-1">{msg}</p>
            </div>

            {/* OTP Field */}
            <div>
                <label htmlFor="otp" className="block text-sm font-medium text-white mb-1">
                    Enter OTP
                </label>
                <input
                    type="text"
                    id="otp"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    className="w-full px-4 py-2 rounded-md bg-[#1a1828] border border-[#3e3b4a] text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#a083f2] transition-colors duration-200"
                    placeholder=" "
                    required
                />
            </div>

            {/* Verify OTP Button */}
            <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 font-semibold text-lg bg-[#a083f2] text-white rounded-md transition-transform hover:scale-105 duration-200 disabled:opacity-50"
            >
                {isLoading ? "Verifying..." : "Verify OTP"}
            </button>
        </form>
    );

    return (
        <div className="relative flex flex-col items-center justify-center min-h-screen text-center text-white bg-[#110e19] p-4">
            {/* Grid background pattern */}
            <div className="absolute inset-0 z-0 bg-grid-lines opacity-20"></div>

            <div className="relative z-10 max-w-2xl mx-auto">
                {/* Section header */}
                <div className="text-center mb-12">
                    <h1 className="text-4xl font-bold mb-2 text-[#a083f2]">Join The Prompt Index</h1>
                    <p className="text-gray-400">
                        Join our thriving community of prompt engineers! Share your prompts, discover new ones, and help build the ultimate AI prompt database...
                    </p>
                </div>

                {/* Form container */}
                <div className="bg-[#2a273b] p-6 sm:p-12 rounded-lg shadow-lg max-w-md mx-auto">
                    <h2 className="text-2xl font-bold text-center mb-6">Create Your Account</h2>

                    {error && <div className="text-red-500 text-sm mb-4">{error}</div>}
                    {msg && <div className="text-green-500 text-sm mb-4">{msg}</div>}

                    {step === "form" ? renderForm() : renderOtp()}
                </div>
            </div>

            {/* Custom CSS for the grid pattern */}
            <style jsx>{`
                .bg-grid-lines {
                    background-image:
                        linear-gradient(to right, rgba(255, 255, 255, 0.05) 1px, transparent 1px),
                        linear-gradient(to bottom, rgba(255, 255, 255, 0.05) 1px, transparent 1px);
                    background-size: 30px 30px;
                }
            `}</style>
        </div>
    );
};

export default AccountCreationForm;
