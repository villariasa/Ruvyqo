import { motion } from "framer-motion";
import { Calendar, DollarSign, Clock } from "lucide-react";
import { GlassCard } from "../components/GlassCard";

export default function Bookings() {
  const bookings = [
    { id: 1, guest: "John Doe", room: "303", checkIn: "2025-12-20", checkOut: "2025-12-25", total: 3995, status: "confirmed" },
    { id: 2, guest: "Sarah Wilson", room: "202", checkIn: "2025-12-22", checkOut: "2025-12-24", total: 298, status: "checked-in" },
  ];

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold">Bookings</h1>
        <button className="bg-violet-600 text-white px-6 py-3 rounded-2xl flex items-center gap-2 hover:bg-violet-700 transition">
          <Calendar size={20} /> New Booking
        </button>
      </div>

      <div className="space-y-6">
        {bookings.map((b, i) => (
          <motion.div
            key={b.id}
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <GlassCard className="p-6 hover:shadow-2xl transition">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <h3 className="text-2xl font-bold">{b.guest}</h3>
                  <p className="text-lg opacity-80">Room {b.room}</p>
                </div>
                <div className="flex gap-8 text-center">
                  <div>
                    <Clock className="mx-auto mb-1 text-blue-500" size={20} />
                    <p className="text-sm opacity-70">Check-in</p>
                    <p className="font-semibold">{b.checkIn}</p>
                  </div>
                  <div>
                    <Calendar className="mx-auto mb-1 text-green-500" size={20} />
                    <p className="text-sm opacity-70">Check-out</p>
                    <p className="font-semibold">{b.checkOut}</p>
                  </div>
                  <div>
                    <DollarSign className="mx-auto mb-1 text-violet-500" size={20} />
                    <p className="text-sm opacity-70">Total</p>
                    <p className="font-semibold">${b.total}</p>
                  </div>
                </div>
                <span className={`px-4 py-2 rounded-full text-sm font-medium ${
                  b.status === "confirmed" ? "bg-green-100 text-green-800" : "bg-blue-100 text-blue-800"
                }`}>
                  {b.status}
                </span>
              </div>
            </GlassCard>
          </motion.div>
        ))}
      </div>
    </div>
  );
}