import type { Variants } from "framer-motion";

export const easeOut = [0.22, 1, 0.36, 1] as const;
export const easeHover = [0.4, 0, 0.2, 1] as const;
export const springSoft = { stiffness: 220, damping: 26, mass: 0.9 } as const;
export const springStrong = { stiffness: 220, damping: 26 } as const;

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: easeOut }
  }
};

export const wordStagger: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.06
    }
  }
};

export const wordReveal: Variants = {
  hidden: { opacity: 0, y: 32, filter: "blur(4px)" },
  visible: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.6, ease: easeOut }
  }
};

export const cardStagger: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.08
    }
  }
};

export const cardReveal: Variants = {
  hidden: { opacity: 0, y: 36, scale: 0.98 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.6, ease: easeOut }
  }
};

export const wipeReveal: Variants = {
  hidden: { clipPath: "inset(0 100% 0 0)" },
  visible: {
    clipPath: "inset(0 0% 0 0)",
    transition: { duration: 0.8, ease: easeOut }
  }
};

export const squashTap = { scale: 0.96 } as const;

export const lineReveal: Variants = {
  hidden: { opacity: 0, clipPath: "inset(0 0 100% 0)" },
  visible: {
    opacity: 1,
    clipPath: "inset(0 0 0 0)",
    transition: { duration: 0.6, ease: easeOut }
  }
};
