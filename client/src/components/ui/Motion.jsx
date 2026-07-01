import { motion } from 'framer-motion';

const fadeUp = {
  initial: { opacity: 0, y: 30, filter: 'blur(10px)' },
  animate: { opacity: 1, y: 0, filter: 'blur(0px)' },
  exit: { opacity: 0, y: -20, filter: 'blur(10px)' },
};

export function PageTransition({ children, className = '' }) {
  return (
    <motion.div
      className={className}
      initial="initial"
      animate="animate"
      exit="exit"
      variants={fadeUp}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  );
}

export function StaggerList({ children, className = '' }) {
  return (
    <motion.div
      className={className}
      initial="initial"
      animate="animate"
      variants={{
        animate: { transition: { staggerChildren: 0.1 } },
      }}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({ children, className = '' }) {
  return (
    <motion.div
      className={className}
      variants={{
        initial: { opacity: 0, y: 24, scale: 0.95, filter: 'blur(8px)' },
        animate: { opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' },
      }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  );
}

export function GlowCard({ children, className = '', glow = 'blue' }) {
  return (
    <motion.div
      className={`glass-card glow-${glow} ${className}`}
      whileHover={{ scale: 1.02, y: -4 }}
      transition={{ type: 'spring', stiffness: 350, damping: 20 }}
    >
      {children}
    </motion.div>
  );
}

export function PulseRing({ color = 'var(--accent)', size = 12 }) {
  return (
    <span className="pulse-ring" style={{ width: size, height: size }}>
      <motion.span
        className="pulse-dot"
        style={{ background: color }}
        animate={{ scale: [1, 2, 1], opacity: [1, 0, 1] }}
        transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
      />
    </span>
  );
}

export function SlideIn({ children, delay = 0, direction = 'up', className = '' }) {
  const y = direction === 'up' ? 30 : direction === 'down' ? -30 : 0;
  const x = direction === 'left' ? 30 : direction === 'right' ? -30 : 0;
  
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, x, y, filter: 'blur(8px)' }}
      whileInView={{ opacity: 1, x: 0, y: 0, filter: 'blur(0px)' }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.6, delay, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  );
}

export function ScaleIn({ children, delay = 0, className = '' }) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, scale: 0.85, filter: 'blur(12px)' }}
      whileInView={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, delay, type: 'spring', bounce: 0.2 }}
    >
      {children}
    </motion.div>
  );
}
