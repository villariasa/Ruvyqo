import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Sidebar } from "./components/Sidebar";
import { MobileBottomNav } from "./components/MobileBottomNav";
import Dashboard from "./pages/Dashboard";
import Rooms from "./pages/Rooms";
import RoomDetails from "./pages/RoomDetails";
import Bookings from "./pages/Bookings";
import BookingCreate from "./pages/BookingCreate";
import Guests from "./pages/Guest";
import Services from "./pages/Services";
import Settings from "./pages/Settings";

function AnimatedRoutes() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        initial={{ opacity: 0, x: 100 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -100 }}
        transition={{ duration: 0.4, ease: "easeInOut" }}
        className="min-h-screen"
      >
        <Routes location={location}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/rooms" element={<Rooms />} />
          <Route path="/rooms/:id" element={<RoomDetails />} />
          <Route path="/bookings" element={<Bookings />} />
          <Route path="/bookings/create" element={<BookingCreate />} />
          <Route path="/guests" element={<Guests />} />
          <Route path="/services" element={<Services />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </motion.div>
    </AnimatePresence>
  );
}

export default function App() {
  return (
    <Router>
      <div className="min-h-screen bg-[rgb(var(--bg))]">
        {/* Background blobs */}
        <div className="bg-blob" />
        <div className="bg-blob" style={{ animationDelay: "10s" }} />

        {/* Desktop Sidebar */}
        <Sidebar />

        {/* Main Content */}
        <main className="md:ml-72">
          <div className="p-6 pt-20 md:pt-6">
            <AnimatedRoutes />
          </div>
        </main>

        {/* Mobile Bottom Nav */}
        <MobileBottomNav />
      </div>
    </Router>
  );
}