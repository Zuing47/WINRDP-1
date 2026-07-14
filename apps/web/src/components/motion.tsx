"use client";

import { motion, type HTMLMotionProps } from "framer-motion";

/** Fade + slide sutil na entrada (150–250ms). */
export function FadeIn({
  delay = 0,
  y = 8,
  ...props
}: HTMLMotionProps<"div"> & { delay?: number; y?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, delay, ease: "easeOut" }}
      {...props}
    />
  );
}

/** Container que anima filhos em cascata. */
export function Stagger({
  children,
  className,
  gap = 0.05,
}: {
  children: React.ReactNode;
  className?: string;
  gap?: number;
}) {
  return (
    <motion.div
      className={className}
      initial="hidden"
      animate="show"
      variants={{ hidden: {}, show: { transition: { staggerChildren: gap } } }}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      className={className}
      variants={{
        hidden: { opacity: 0, y: 10 },
        show: { opacity: 1, y: 0, transition: { duration: 0.25, ease: "easeOut" } },
      }}
    >
      {children}
    </motion.div>
  );
}
