import { motion } from "motion/react";

export function SplashScreen() {
  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{
        background:
          "linear-gradient(145deg, oklch(0.18 0.08 258) 0%, oklch(0.22 0.10 260) 40%, oklch(0.28 0.12 255) 100%)",
      }}
    >
      <motion.div
        className="flex flex-col items-center gap-6"
        initial={{ opacity: 0, scale: 0.92 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
      >
        <motion.div
          className="relative"
          animate={{ opacity: [1, 0.6, 1] }}
          transition={{
            duration: 2,
            repeat: Number.POSITIVE_INFINITY,
            ease: "easeInOut",
          }}
        >
          <div className="w-48 h-20 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center shadow-2xl px-4">
            <img
              src="/assets/generated/fleetguard-logo-new-transparent.dim_200x60.png"
              alt="FleetGuard"
              className="h-12 w-auto object-contain"
            />
          </div>
          <div className="absolute inset-0 rounded-2xl bg-blue-400/20 blur-xl -z-10" />
        </motion.div>
        <div className="text-center">
          <p className="text-white/50 text-sm mt-1 tracking-wide">
            Fleet Maintenance Platform
          </p>
        </div>
        <div className="flex gap-1.5 mt-2">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="w-1.5 h-1.5 rounded-full bg-white/60"
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{
                duration: 1.2,
                repeat: Number.POSITIVE_INFINITY,
                delay: i * 0.2,
                ease: "easeInOut",
              }}
            />
          ))}
        </div>
      </motion.div>
    </div>
  );
}
