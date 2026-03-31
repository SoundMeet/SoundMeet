import { motion } from "framer-motion";
import { useAuth } from "../injectables/Auth";
import { useGeoPermission } from "../hooks/useGeoPermission";
import LocationRequired from "../pages/LocationRequired";

/**
 * GuestLocationGuard
 *
 * Wraps the homepage/discovery experience. Logic:
 *   - Authenticated users → render children unconditionally (normal app flow)
 *   - Auth still loading   → render minimal dark screen (avoid flash)
 *   - Guest + checking     → render minimal dark screen while geo resolves
 *   - Guest + granted      → render children
 *   - Guest + denied/promptable/unavailable → render <LocationRequired>
 */
const GuestLocationGuard = ({ children }) => {
  const { isLoggedIn, isLoading: authLoading } = useAuth();
  const { status, retry } = useGeoPermission();

  // Auth profile fetch still in flight — hold
  if (authLoading) {
    return <DarkScreen />;
  }

  // Authenticated — bypass location gate entirely
  if (isLoggedIn) {
    return children;
  }

  // Guest: geo permission check still in flight
  if (status === "checking") {
    return <DarkScreen />;
  }

  // Guest: permission granted — allow discovery
  if (status === "granted") {
    return children;
  }

  // Guest: denied, promptable, or browser unavailable — show gate
  return <LocationRequired status={status} onRetry={retry} />;
};

// Minimal full-screen dark hold screen — avoids any content flash
const DarkScreen = () => (
  <motion.div
    className="fixed inset-0 bg-[#141414] flex items-center justify-center"
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    transition={{ duration: 0.2 }}
  >
    <motion.div
      className="w-2 h-2 rounded-full bg-[#DC2E73]"
      animate={{ opacity: [0.3, 1, 0.3] }}
      transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
    />
  </motion.div>
);

export default GuestLocationGuard;
