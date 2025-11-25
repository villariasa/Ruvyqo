import { useEffect, useState } from "react";
import { api } from "../lib/api";
import { GlassCard } from "../components/GlassCard";
import { motion } from "framer-motion";
import { Plus } from "lucide-react";

// Define the exact shape of your Room from D1
interface Room {
  id: number;
  room_number: string;
  type: string;
  price_per_night: number;
  max_occupancy: number;
  status: "available" | "occupied" | "maintenance" | "cleaning";
  image_url?: string;
  description?: string;
}

export default function Rooms() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getRooms()
      .then((data) => {
        setRooms(data.rooms || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load rooms:", err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <GlassCard key={i} className="animate-pulse">
            <div className="bg-gray-300 h-48 rounded-xl mb-4" />
            <div className="h-6 bg-gray-200 rounded w-32 mb-2" />
            <div className="h-8 bg-gray-200 rounded w-24" />
          </GlassCard>
        ))}
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold">Rooms</h1>
        <button className="bg-violet-600 text-white px-6 py-3 rounded-2xl flex items-center gap-2 hover:bg-violet-700 transition">
          <Plus size={20} /> Add Room
        </button>
      </div>

      {rooms.length === 0 ? (
        <GlassCard className="text-center py-16">
          <p className="text-2xl opacity-70">No rooms found</p>
          <p className="text-lg opacity-50 mt-2">Add your first room to get started</p>
        </GlassCard>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {rooms.map((room, i) => (
            <motion.div
              key={room.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              whileHover={{ y: -8 }}
            >
              <GlassCard className="cursor-pointer transition-all duration-300 hover:shadow-2xl">
                {room.image_url ? (
                  <img
                    src={room.image_url}
                    alt={room.room_number}
                    className="w-full h-48 object-cover rounded-xl mb-4"
                  />
                ) : (
                  <div className="bg-gray-200 border-2 border-dashed rounded-xl w-full h-48 mb-4 flex items-center justify-center">
                    <span className="text-gray-500">No image</span>
                  </div>
                )}

                <h3 className="text-xl font-bold">
                  {room.room_number} - {room.type}
                </h3>
                <p className="text-2xl font-bold text-violet-600 mt-2">
                  ${room.price_per_night}/night
                </p>
                <span
                  className={`inline-block px-3 py-1 rounded-full text-xs mt-3 font-medium ${
                    room.status === "available"
                      ? "bg-green-100 text-green-800"
                      : room.status === "occupied"
                      ? "bg-red-100 text-red-800"
                      : "bg-yellow-100 text-yellow-800"
                  }`}
                >
                  {room.status}
                </span>
              </GlassCard>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}