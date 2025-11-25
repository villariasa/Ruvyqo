import { useEffect, useState } from "react";
import { api } from "../lib/api";
import { GlassCard } from "../components/GlassCard";
import { motion } from "framer-motion";
import { Coffee, HeartHandshake, Shirt, Plus, Sparkles } from "lucide-react"; // ALL EXIST!

interface Service {
  id: number;
  name: string;
  price: number;
  description: string;
  is_active: number;
}

export default function Services() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getServices()
      .then((data) => {
        setServices(data.services || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const getIcon = (name: string) => {
    const lower = name.toLowerCase();
    if (lower.includes("dinner") || lower.includes("room service")) return <Coffee className="text-orange-500" size={48} />;
    if (lower.includes("spa") || lower.includes("massage")) return <HeartHandshake className="text-purple-500" size={48} />; // Real icon!
    if (lower.includes("laundry")) return <Shirt className="text-blue-500" size={48} />;
    return <Sparkles className="text-violet-500" size={48} />;
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {[1, 2, 3].map((i) => (
          <GlassCard key={i} className="animate-pulse p-8">
            <div className="w-16 h-16 bg-gray-300 rounded-full mx-auto mb-4" />
            <div className="h-8 bg-gray-300 rounded w-48 mx-auto mb-4" />
            <div className="h-20 bg-gray-200 rounded mx-auto" />
          </GlassCard>
        ))}
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-10">
        <h1 className="text-5xl font-bold bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent">
          Services
        </h1>
        <button className="bg-violet-600 text-white px-8 py-4 rounded-2xl flex items-center gap-3 hover:bg-violet-700 transition shadow-lg">
          <Plus size={24} />
          Add Service
        </button>
      </div>

      {services.length === 0 ? (
        <GlassCard className="text-center py-20">
          <p className="text-3xl opacity-70 mb-4">No services yet</p>
          <p className="text-lg opacity-50">Add your first service to delight your guests</p>
        </GlassCard>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {services.map((service, i) => (
            <motion.div
              key={service.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.1 }}
              whileHover={{ y: -12, scale: 1.02 }}
            >
              <GlassCard className="p-8 text-center hover:shadow-2xl transition-all duration-300">
                <div className="mb-6 flex justify-center">
                  {getIcon(service.name)}
                </div>
                <h3 className="text-2xl font-bold mb-3">{service.name}</h3>
                <p className="text-lg opacity-80 mb-6 leading-relaxed">{service.description}</p>
                <div className="text-4xl font-bold text-violet-600">
                  ${service.price.toFixed(2)}
                </div>
                <span className={`inline-block mt-4 px-4 py-2 rounded-full text-sm font-medium ${
                  service.is_active ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-600"
                }`}>
                  {service.is_active ? "Active" : "Inactive"}
                </span>
              </GlassCard>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}