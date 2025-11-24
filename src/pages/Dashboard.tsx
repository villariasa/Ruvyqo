import { GlassCard } from "../components/GlassCard";
import { motion } from "framer-motion";
import { BedDouble, CalendarCheck, Users, TrendingUp } from "lucide-react";

const metrics = [
  { label: "Total Rooms", value: "156", icon: BedDouble, color: "from-violet-500 to-purple-600" },
  { label: "Occupied", value: "89%", icon: TrendingUp, color: "from-blue-500 to-cyan-600" },
  { label: "Today's Bookings", value: "12", icon: CalendarCheck, color: "from-green-500 to-emerald-600" },
  { label: "Active Guests", value: "342", icon: Users, color: "from-orange-500 to-red-600" },
];

export default function Dashboard() {
  return (
    <div className="min-h-screen pb-20 md:pb-0">
      <div className="bg-blob" />
      <div className="bg-blob" style={{ animationDelay: "10s" }} />

      <div className="p-6">
        <motion.h1 initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-4xl font-bold mb-8">
          Welcome back, Admin
        </motion.h1>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-10">
          {metrics.map((m, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
              <GlassCard>
                <div className={`w-12 h-12 bg-gradient-to-br ${m.color} rounded-2xl flex items-center justify-center mb-4`}>
                  <m.icon className="text-white" size={24} />
                </div>
                <p className="text-sm opacity-70">{m.label}</p>
                <p className="text-3xl font-bold mt-2">{m.value}</p>
              </GlassCard>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}