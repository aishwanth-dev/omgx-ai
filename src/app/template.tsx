"use client";

import { motion } from "motion/react";

/**
 * Route transition: a short opacity fade (no movement, so it is also used
 * with reduced motion and keeps server and client markup identical).
 * Opacity only: a transform on this wrapper would become the containing
 * block for GSAP-pinned (position: fixed) elements and break pins.
 */
export default function Template({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      className="page-transition"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  );
}
