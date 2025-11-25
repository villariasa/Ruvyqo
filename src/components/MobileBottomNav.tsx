import { NavLink } from "react-router-dom";
import { Home, Bed, Calendar, Users, Settings } from "lucide-react";
import { motion } from "framer-motion";

const tabs = [
  { icon: Home, label: "Home", to: "/" },
  { icon: Bed, label: "Rooms", to: "/rooms" },
  { icon: Calendar, label: "Bookings", to: "/bookings" },
  { icon: Users, label: "Guests", to: "/guests" },
  { icon: Settings, label: "Settings", to: "/settings" },
];

export const MobileBottomNav = () => {
  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-50">
      <div className="glass border-t border-[var(--border)]">
        <div className="flex justify-around py-3">
          {tabs.map((tab) => (
            <NavLink
              key={tab.to}
              to={tab.to}
              className={({ isActive }) =>
                `flex flex-col items-center p-3 rounded-2xl ${isActive ? "text-violet-500" : "text-gray-500"}`
              }
            >
              {({ isActive }) => (
                <>
                  <tab.icon size={24} />
                  <span className="text-xs mt-1">{tab.label}</span>
                  {isActive && (
                    <motion.div
                      layoutId="mobileActive"
                      className="absolute -top-2 left-1/2 w-12 h-1 bg-violet-500 rounded-full -translate-x-1/2"
                    />
                  )}
                </>
              )}
            </NavLink>
          ))}
        </div>
      </div>
    </div>
  );
};