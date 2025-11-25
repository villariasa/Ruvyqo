import { motion } from "framer-motion";
import { Calendar, User, Bed } from "lucide-react";
import { GlassCard } from "../components/GlassCard";

export default function BookingCreate() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="max-w-2xl mx-auto"
    >
      <h1 className="text-4xl font-bold text-center mb-10">Create New Booking</h1>

      <GlassCard className="p-8">
        <div className="space-y-8">
          <div>
            <label className="flex items-center gap-3 text-lg font-medium mb-3">
              <User /> Guest Name
            </label>
            <input className="w-full px-6 py-4 rounded-2xl glass border border-[var(--border)] focus:outline-none focus:ring-4 focus:ring-violet-500/30" placeholder="John Doe" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="flex items-center gap-3 text-lg font-medium mb-3">
                <Calendar /> Check-in
              </label>
              <input type="date" className="w-full px-6 py-4 rounded-2xl glass border border-[var(--border)]" />
            </div>
            <div>
              <label className="flex items-center gap-3 text-lg font-medium mb-3">
                <Calendar /> Check-out
              </label>
              <input type="date" className="w-full px-6 py-4 rounded-2xl glass border border-[var(--border)]" />
            </div>
          </div>

          <div>
            <label className="flex items-center gap-3 text-lg font-medium mb-3">
              <Bed /> Room
            </label>
            <select className="w-full px-6 py-4 rounded-2xl glass border border-[var(--border)]">
              <option>303 - Presidential Suite</option>
              <option>202 - Double Room</option>
              <option>101 - Single Room</option>
            </select>
          </div>

          <div className="pt-6 border-t border-white/10">
            <div className="flex justify-between items-center text-2xl font-bold">
              <span>Total</span>
              <span className="text-violet-500">$3,995</span>
            </div>
          </div>

          <button className="w-full bg-gradient-to-r from-violet-600 to-purple-600 text-white py-5 rounded-2xl text-xl font-semibold hover:shadow-2xl transition">
            Confirm Booking
          </button>
        </div>
      </GlassCard>
    </motion.div>
  );
}