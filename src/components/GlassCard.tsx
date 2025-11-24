import { motion } from "framer-motion";

export const GlassCard = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    whileHover={{ y: -8, boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)" }}
    transition={{ duration: 0.4 }}
    className={`glass p-6 ${className}`}
  >
    {children}
  </motion.div>
);