import { motion } from 'framer-motion';

export default function AnimatedBackground() {
  return (
    <div className="ambient-bg" aria-hidden="true">
      <div className="ambient-mesh" />
      <motion.div
        className="ambient-orb ambient-orb-a"
        animate={{ x: [0, 80, 0], y: [0, -50, 0], scale: [1, 1.1, 1] }}
        transition={{ duration: 22, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="ambient-orb ambient-orb-b"
        animate={{ x: [0, -70, 0], y: [0, 60, 0], scale: [1, 1.2, 1] }}
        transition={{ duration: 28, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="ambient-orb ambient-orb-c"
        animate={{ x: [0, 40, -40, 0], y: [0, 30, -30, 0], scale: [1, 1.3, 1] }}
        transition={{ duration: 32, repeat: Infinity, ease: 'easeInOut' }}
      />
      <div className="ambient-noise" />
    </div>
  );
}
