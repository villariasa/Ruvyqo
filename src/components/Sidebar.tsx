import { NavLink } from "react-router-dom";
import { Home, Bed, Calendar, Users, Settings, LogOut } from "lucide-react";
import { motion } from "framer-motion";

const navItems = [
  { icon: Home, label: "Dashboard", to: "/" },
  { icon: Bed, label: "Rooms", to: "/rooms" },
  { icon: Calendar, label: "Bookings", to: "/bookings" },
  { icon: Users, label: "Guests", to: "/guests" },
  { icon: Settings, label: "Settings", to: "/settings" },
];

export const Sidebar = () => {
  return (
    <aside className="hidden md:block fixed left-0 top-0 h-full w-72 glass border-r border-[var(--border)] z-50">
      <div className="p-8">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent">
          Grand Horizon
        </h1>
      </div>

      <nav className="px-6">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex items-center gap-4 py-4 px-6 rounded-2xl mb-2 transition-all ${
                isActive
                  ? "bg-white/20 text-violet-400 shadow-xl"
                  : "hover:bg-white/10"
              }`
            }
          >
            {({ isActive }) => (
              <>
                <item.icon size={24} />
                <span className="font-medium">{item.label}</span>
                {isActive && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute inset-0 bg-violet-500/20 rounded-2xl -z-10"
                  />
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="absolute bottom-8 left-8 right-8">
        <button className="flex items-center gap-3 w-full py-4 px-6 rounded-2xl bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-all">
          <LogOut size={24} />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
};