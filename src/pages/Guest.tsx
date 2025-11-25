import { motion } from "framer-motion";
import {  Mail, Phone } from "lucide-react";
import { GlassCard } from "../components/GlassCard";

export default function Guests() {
  const guests = [
    { id: 1, name: "John Doe", email: "john@example.com", phone: "+1234567890", bookings: 5 },
    { id: 2, name: "Sarah Wilson", email: "sarah@example.com", phone: "+1987654321", bookings: 3 },
  ];

  return (
    <div>
      <h1 className="text-4xl font-bold mb-8">Guests</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {guests.map((g, i) => (
          <motion.div
            key={g.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <GlassCard className="p-6 text-center">
              <div className="w-24 h-24 bg-gradient-to-br from-violet-500 to-purple-600 rounded-full mx-auto mb-4 flex items-center justify-center text-4xl text-white font-bold">
                {g.name.split(" ").map(n => n[0]).join("")}
              </div>
              <h3 className="text-2xl font-bold">{g.name}</h3>
              <div className="space-y-3 mt-4 text-left">
                <p className="flex items-center gap-3"><Mail size={18} /> {g.email}</p>
                <p className="flex items-center gap-3"><Phone size={18} /> {g.phone}</p>
                <p className="text-sm opacity-70">Total Bookings: {g.bookings}</p>
              </div>
            </GlassCard>
          </motion.div>
        ))}
      </div>
    </div>
  );
}