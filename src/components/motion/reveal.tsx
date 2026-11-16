"use client";

import { motion, type HTMLMotionProps } from "motion/react";

type RevealProps = HTMLMotionProps<"div"> & {
  delay?: number;
  /** Animate when scrolled into view instead of on mount. */
  inView?: boolean;
};

const hidden = { opacity: 0, y: 14, filter: "blur(6px)" };
const shown = { opacity: 1, y: 0, filter: "blur(0px)" };

export function Reveal({ delay = 0, inView = false, children, ...props }: RevealProps) {
  const target = inView
    ? { whileInView: shown, viewport: { once: true, margin: "-80px" } }
    : { animate: shown };

  return (
    <motion.div
      initial={hidden}
      {...target}
      transition={{ duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] }}
      {...props}
    >
      {children}
    </motion.div>
  );
}
