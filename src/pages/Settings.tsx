import { motion } from "framer-motion";
import { Building, Moon, Sun, Palette, Bell, Shield } from "lucide-react";
import { GlassCard } from "../components/GlassCard";
import { useEffect, useState } from "react";

export default function Settings() {
  const [isDark, setIsDark] = useState<boolean>(false);

  // This runs ONCE on mount — NO setState inside!
  useEffect(() => {
    const saved = localStorage.getItem("theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const shouldBeDark = saved === "dark" || (!saved && prefersDark);

    // Apply to DOM immediately
    document.documentElement.setAttribute("data-theme", shouldBeDark ? "dark" : "light");

    // Update React state AFTER the DOM is already correct
    // This is the trick — no sync state update!
    setTimeout(() => setIsDark(shouldBeDark), 0);
  }, []);

  const toggleTheme = () => {
    const newTheme = !isDark;
    const themeName = newTheme ? "dark" : "light";

    document.documentElement.setAttribute("data-theme", themeName);
    localStorage.setItem("theme", themeName);
    setIsDark(newTheme);
  };

  return (
    <div className="min-h-screen">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-8 max-w-4xl"
      >
        <h1 className="text-5xl font-bold mb-10 bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent">
          Settings
        </h1>

        <GlassCard>
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
            <Building className="text-violet-500" />
            Hotel Information
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <input
              className="px-6 py-4 rounded-2xl glass border border-[var(--border)] focus:outline-none focus:ring-4 focus:ring-violet-500/30 transition"
              placeholder="Hotel Name"
              defaultValue="Grand Horizon Hotel"
            />
            <input
              className="px-6 py-4 rounded-2xl glass border border-[var(--border)] focus:outline-none focus:ring-4 focus:ring-violet-500/30 transition"
              placeholder="Address"
              defaultValue="123 Luxury Avenue"
            />
            <input
              className="px-6 py-4 rounded-2xl glass border border-[var(--border)]"
              placeholder="Phone"
              defaultValue="+1 (555) 123-4567"
            />
            <input
              className="px-6 py-4 rounded-2xl glass border border-[var(--border)]"
              placeholder="Email"
              defaultValue="info@grandhorizon.com"
            />
          </div>
          <button className="mt-6 bg-violet-600 text-white px-8 py-4 rounded-2xl hover:bg-violet-700 transition font-medium">
            Save Changes
          </button>
        </GlassCard>

        <GlassCard>
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
            <Palette className="text-purple-500" />
            Appearance
          </h2>
          <div className="flex items-center justify-between max-w-md">
            <div className="flex items-center gap-4">
              {isDark ? <Moon className="text-yellow-400" size={28} /> : <Sun className="text-orange-500" size={28} />}
              <div>
                <p className="font-semibold text-lg">Theme</p>
                <p className="text-sm opacity-70">{isDark ? "Dark Mode" : "Light Mode"}</p>
              </div>
            </div>
            <button
              onClick={toggleTheme}
              className={`relative w-20 h-11 rounded-full transition-all duration-300 ${isDark ? "bg-violet-600" : "bg-gray-300"}`}
            >
              <motion.div
                className="absolute top-1 left-1 w-9 h-9 bg-white rounded-full shadow-lg"
                animate={{ x: isDark ? 36 : 4 }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
              />
            </button>
          </div>
        </GlassCard>

        <GlassCard>
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
            <Bell className="text-blue-500" />
            Notifications
          </h2>
          <label className="flex items-center justify-between cursor-pointer">
            <span>New Booking Alerts</span>
            <input type="checkbox" defaultChecked className="w-6 h-6 accent-violet-600 rounded" />
          </label>
        </GlassCard>

        <GlassCard>
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
            <Shield className="text-green-500" />
            Security
          </h2>
          <button className="bg-red-500/20 text-red-500 px-8 py-4 rounded-2xl hover:bg-red-500/30 transition font-medium">
            Change Password
          </button>
        </GlassCard>
      </motion.div>
    </div>
  );
}