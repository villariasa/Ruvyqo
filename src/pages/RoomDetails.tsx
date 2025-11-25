import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Bed, Users, DollarSign, Calendar } from "lucide-react";
import { GlassCard } from "../components/GlassCard";

export default function RoomDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  // Mock data — replace with real API call later
  const room = {
    id,
    room_number: "303",
    type: "Presidential Suite",
    price_per_night: 799,
    max_occupancy: 6,
    status: "available",
    description: "Luxurious presidential suite with panoramic city view, king bed, separate living area, jacuzzi, and private balcony.",
    facilities: ["King Bed", "Jacuzzi", "Balcony", "Mini Bar", "65\" TV", "WiFi 1Gbps", "Room Service 24h"],
  };

  return (
    <div className="min-h-screen">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="relative"
      >
        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="absolute top-6 left-6 z-10 flex items-center gap-2 bg-white/10 backdrop-blur-xl px-6 py-3 rounded-2xl hover:bg-white/20 transition"
        >
          <ArrowLeft size={20} />
          Back
        </button>

        {/* Hero Image Placeholder */}
        <div className="h-96 bg-gradient-to-br from-violet-600 to-purple-800 rounded-b-3xl relative overflow-hidden">
          <div className="absolute inset-0 bg-black/30" />
          <div className="absolute bottom-8 left-8 text-white">
            <h1 className="text-5xl font-bold">{room.room_number}</h1>
            <p className="text-2xl opacity-90">{room.type}</p>
          </div>
        </div>

        <div className="p-6 -mt-20 relative z-10">
          <GlassCard className="mb-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
              <div>
                <DollarSign className="mx-auto mb-2 text-violet-500" size={32} />
                <p className="text-3xl font-bold">${room.price_per_night}</p>
                <p className="text-sm opacity-70">per night</p>
              </div>
              <div>
                <Users className="mx-auto mb-2 text-blue-500" size={32} />
                <p className="text-3xl font-bold">{room.max_occupancy}</p>
                <p className="text-sm opacity-70">guests</p>
              </div>
              <div>
                <Bed className="mx-auto mb-2 text-green-500" size={32} />
                <p className="text-3xl font-bold">King</p>
                <p className="text-sm opacity-70">bed</p>
              </div>
              <div>
                <Calendar className="mx-auto mb-2 text-orange-500" size={32} />
                <p className="text-3xl font-bold capitalize">{room.status}</p>
                <p className="text-sm opacity-70">status</p>
              </div>
            </div>
          </GlassCard>

          <GlassCard className="mb-6">
            <h2 className="text-2xl font-bold mb-4">Description</h2>
            <p className="text-lg leading-relaxed opacity-80">{room.description}</p>
          </GlassCard>

          <GlassCard>
            <h2 className="text-2xl font-bold mb-6">Facilities</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {room.facilities.map((facility) => (
                <div key={facility} className="flex items-center gap-3 bg-white/10 rounded-2xl p-4">
                  <div className="w-2 h-2 bg-violet-500 rounded-full" />
                  <span>{facility}</span>
                </div>
              ))}
            </div>
          </GlassCard>

          <div className="mt-8 flex gap-4">
            <button className="flex-1 bg-violet-600 text-white py-4 rounded-2xl font-semibold hover:bg-violet-700 transition">
              Book Now
            </button>
            <button className="px-8 py-4 border border-red-500 text-red-500 rounded-2xl hover:bg-red-500/10 transition">
              Mark Unavailable
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}