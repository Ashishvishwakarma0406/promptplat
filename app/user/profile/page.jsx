// app\user\profile\page.jsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  User,
  Mail,
  Loader2,
  AlertTriangle,
  CheckCircle,
  Lock,
} from "lucide-react";

export default function EditProfilePage() {
  const [form, setForm] = useState({ name: "", password: "" });
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const router = useRouter();

  useEffect(() => {
    const fetchUser = async () => {
      setIsAuthLoading(true);
      try {
        const res = await fetch("/api/user/me");

        if (res.status === 401) {
          // token missing/expired
          router.push("/user/login");
          return;
        }

        if (res.ok) {
          const data = await res.json();
          if (data.user) {
            setUser(data.user);
            setForm({ name: data.user.name || "", password: "" });
          }
        } else {
          setError("Failed to load profile data.");
        }
      } catch (err) {
        setError("An error occurred while fetching your data.");
      } finally {
        setIsAuthLoading(false);
      }
    };

    fetchUser();
  }, [router]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetch("/api/user/update-profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: user.email, // email from logged-in user
          password: form.password, // entered password
          name: form.name, // new name
        }),
      });

      const result = await res.json();
      if (res.ok) {
        setSuccess(result.message || "Profile updated successfully!");
        setForm({ ...form, password: "" }); // clear password after save
      } else {
        setError(result.error || "Failed to update profile.");
      }
    } catch {
      setError("An unexpected error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex justify-center items-center">
        <Loader2 className="w-12 h-12 text-orange-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col items-center p-4 pt-30">
      <div className="max-w-lg w-full mx-auto bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-lg">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
            Edit Your Profile
          </h2>
          <p className="text-gray-500 dark:text-gray-400">
            Keep your information up to date.
          </p>
        </div>

        {error && (
          <p className="bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-300 p-3 rounded-lg mb-4 text-sm flex items-center gap-2">
            <AlertTriangle size={18} /> {error}
          </p>
        )}
        {success && (
          <p className="bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-300 p-3 rounded-lg mb-4 text-sm flex items-center gap-2">
            <CheckCircle size={18} /> {success}
          </p>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Email (read-only) */}
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="email"
              value={user?.email || ""}
              className="pl-10 text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 p-3 rounded-lg w-full"
              disabled
            />
          </div>

          {/* Name (editable) */}
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              name="name"
              value={form.name}
              placeholder="Your Full Name"
              className="pl-10 text-black dark:text-white bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 p-3 rounded-lg w-full focus:ring-2 focus:ring-orange-500"
              onChange={handleChange}
              required
            />
          </div>

          {/* Password (required for verification) */}
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              name="password"
              type="password"
              value={form.password}
              placeholder="Enter Password to Confirm"
              className="pl-10 text-black dark:text-white bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 p-3 rounded-lg w-full focus:ring-2 focus:ring-orange-500"
              onChange={handleChange}
              required
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex justify-center items-center gap-2 bg-[#8B5CF6] hover:bg-[#7D49E0] text-white font-bold px-4 py-3 rounded-lg transition-colors disabled:bg-orange-400"
          >
            {isLoading ? (
              <>
                <Loader2 className="animate-spin" size={20} /> Saving...
              </>
            ) : (
              "Save Changes"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
