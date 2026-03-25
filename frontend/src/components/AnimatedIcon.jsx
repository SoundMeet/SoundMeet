import { motion } from "framer-motion";
import speaker from "../assets/speaker.png";

const AnimatedIcon = () => {
  return (
    <motion.img
      src={speaker}
      alt="speaker"
      className="w-8 h-8"
      animate={{
        scale: [1, 1.1, 1],
      }}
      transition={{
        duration: 2,
        repeat: Infinity,
        ease: "easeInOut",
      }}
    />
  );
};

export default AnimatedIcon;