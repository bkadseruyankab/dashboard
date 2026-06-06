'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/* ───────────────────────────────────────────────
   Props
   ─────────────────────────────────────────────── */
export interface SplashLoaderProps {
  logoSrc: string;
  namaPemerintah: string;
  namaInstansi: string;
  warnaPrimary: string;
  warnaSecondary: string;
  warnaAccent: string;
  warnaDark: string;
  waktuTampil: number;
  isLoading: boolean;
}

/* ───────────────────────────────────────────────
   Helper: hex → rgba
   ─────────────────────────────────────────────── */
function hexToRgba(hex: string, alpha: number): string {
  const h = hex.replace('#', '');
  const r = parseInt(h.substring(0, 2), 16);
  const g = parseInt(h.substring(2, 4), 16);
  const b = parseInt(h.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/* ───────────────────────────────────────────────
   Floating Orb (subtle blurred background orbs)
   ─────────────────────────────────────────────── */
function FloatingOrb({
  size,
  color,
  className,
  style,
}: {
  size: number;
  color: string;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <div
      className={`absolute rounded-full pointer-events-none ${className ?? ''}`}
      style={{
        width: size,
        height: size,
        background: color,
        filter: 'blur(60px)',
        ...style,
      }}
    />
  );
}

/* ───────────────────────────────────────────────
   Drift Particle
   ─────────────────────────────────────────────── */
function DriftParticle({
  color,
  size = 2,
  startX,
  startY,
  duration,
  delay,
}: {
  color: string;
  size?: number;
  startX: number;
  startY: number;
  duration: number;
  delay: number;
}) {
  return (
    <motion.div
      className="absolute rounded-full pointer-events-none"
      style={{
        width: size,
        height: size,
        background: color,
        left: `${startX}%`,
        top: `${startY}%`,
      }}
      animate={{
        y: [0, -30, 10, -20, 0],
        x: [0, 15, -10, 5, 0],
        opacity: [0.2, 0.6, 0.3, 0.5, 0.2],
      }}
      transition={{
        duration,
        delay,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
    />
  );
}

/* ───────────────────────────────────────────────
   Loading Dots Component
   ─────────────────────────────────────────────── */
function LoadingDots({ color, labelColor }: { color: string; labelColor: string }) {
  return (
    <div className="flex items-center justify-center gap-1.5">
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="inline-block rounded-full"
          style={{
            width: 5,
            height: 5,
            background: color,
          }}
          animate={{
            y: [0, -8, 0],
            opacity: [0.4, 1, 0.4],
          }}
          transition={{
            duration: 0.9,
            delay: i * 0.15,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      ))}
      <span
        className="text-xs font-medium tracking-widest uppercase ml-2"
        style={{ color: labelColor }}
      >
        Memuat
      </span>
    </div>
  );
}

/* ───────────────────────────────────────────────
   Main SplashLoader Component
   ─────────────────────────────────────────────── */
export default function SplashLoader({
  logoSrc,
  namaPemerintah,
  namaInstansi,
  warnaPrimary,
  warnaSecondary,
  warnaAccent,
  warnaDark,
  waktuTampil,
  isLoading,
}: SplashLoaderProps) {
  // ── Progress bar state ──
  const [progress, setProgress] = useState(0);
  const [show, setShow] = useState(true);
  const [fadeComplete, setFadeComplete] = useState(false);

  // ── Particle config (memoized) ──
  const particles = useMemo(
    () =>
      Array.from({ length: 12 }, (_, i) => ({
        id: i,
        startX: 5 + Math.random() * 90,
        startY: 5 + Math.random() * 90,
        size: 1.5 + Math.random() * 2,
        duration: 5 + Math.random() * 6,
        delay: Math.random() * 3,
      })),
    [],
  );

  // ── Progress animation ──
  useEffect(() => {
    if (!show) return;

    let frame: number;
    const startTime = performance.now();

    const animate = (now: number) => {
      const elapsed = now - startTime;
      const rawProgress = Math.min(elapsed / waktuTampil, 1);

      if (isLoading) {
        // Ease-out curve that stalls around 90%
        // Using a cubic that naturally decelerates
        const eased = 1 - Math.pow(1 - rawProgress, 2.5);
        const capped = Math.min(eased, 0.9);
        setProgress(capped);
      } else {
        // Jump to 100%
        setProgress(1);
      }

      frame = requestAnimationFrame(animate);
    };

    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [isLoading, waktuTampil, show]);

  // ── Fade out when loading completes ──
  useEffect(() => {
    if (!isLoading && progress >= 1) {
      const timer = setTimeout(() => {
        setShow(false);
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [isLoading, progress]);

  // ── Clean up after fade-out animation ──
  const handleExitComplete = useCallback(() => {
    setFadeComplete(true);
  }, []);

  if (fadeComplete) return null;

  // ── Gradient colors ──
  const gradientBg = `linear-gradient(160deg, ${warnaDark} 0%, ${warnaDark}ee 30%, ${warnaPrimary}cc 70%, ${warnaPrimary} 100%)`;

  // ── Radial grid pattern (inline SVG data URI) ──
  const gridPattern = `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.03'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`;

  return (
    <AnimatePresence onExitComplete={handleExitComplete}>
      {show && (
        <motion.div
          className="fixed inset-0 z-[9999] flex flex-col items-center justify-center overflow-hidden select-none"
          style={{ background: gradientBg }}
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        >
          {/* ═══════ Background Decorative Layer ═══════ */}

          {/* Subtle radial grid pattern */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{ backgroundImage: gridPattern }}
          />

          {/* Radial glow from center */}
          <div
            className="absolute pointer-events-none"
            style={{
              width: '120%',
              height: '120%',
              left: '-10%',
              top: '-10%',
              background: `radial-gradient(ellipse at center, ${hexToRgba(warnaAccent, 0.06)} 0%, transparent 60%)`,
            }}
          />

          {/* Floating orbs */}
          <FloatingOrb
            size={320}
            color={hexToRgba(warnaAccent, 0.07)}
            className="animate-float-orb-slow"
            style={{ top: '-80px', right: '-60px' }}
          />
          <FloatingOrb
            size={240}
            color={hexToRgba(warnaPrimary, 0.12)}
            className="animate-float-orb"
            style={{ bottom: '-50px', left: '5%' }}
          />
          <FloatingOrb
            size={180}
            color={hexToRgba(warnaAccent, 0.05)}
            className="animate-float-orb-fast"
            style={{ top: '25%', right: '20%' }}
          />
          <FloatingOrb
            size={140}
            color={hexToRgba(warnaSecondary, 0.08)}
            className="animate-float-orb-slow"
            style={{ bottom: '15%', left: '60%' }}
          />
          <FloatingOrb
            size={100}
            color={hexToRgba(warnaAccent, 0.06)}
            className="animate-float-orb"
            style={{ top: '60%', left: '-30px' }}
          />

          {/* Drift particles */}
          {particles.map((p) => (
            <DriftParticle
              key={p.id}
              color={hexToRgba(warnaAccent, 0.5)}
              size={p.size}
              startX={p.startX}
              startY={p.startY}
              duration={p.duration}
              delay={p.delay}
            />
          ))}

          {/* ═══════ Central Content ═══════ */}
          <div className="relative flex flex-col items-center z-10">
            {/* ── Logo Container ── */}
            <div className="relative flex items-center justify-center mb-8">
              {/* Pulsing glow ring (behind logo) */}
              <motion.div
                className="absolute rounded-full"
                style={{
                  width: 160,
                  height: 160,
                  background: `radial-gradient(circle, ${hexToRgba(warnaAccent, 0.2)} 0%, ${hexToRgba(warnaAccent, 0.05)} 50%, transparent 70%)`,
                }}
                initial={{ scale: 0, opacity: 0 }}
                animate={{
                  scale: [0.9, 1.15, 0.9],
                  opacity: [0.5, 0.8, 0.5],
                }}
                transition={{
                  scale: { delay: 0.6, duration: 3, repeat: Infinity, ease: 'easeInOut' },
                  opacity: { delay: 0.6, duration: 3, repeat: Infinity, ease: 'easeInOut' },
                }}
              />

              {/* Outer pulsing ring */}
              <motion.div
                className="absolute rounded-full border"
                style={{
                  width: 140,
                  height: 140,
                  borderColor: hexToRgba(warnaAccent, 0.15),
                }}
                initial={{ scale: 0, opacity: 0 }}
                animate={{
                  scale: [0.85, 1.1, 0.85],
                  opacity: [0.3, 0.7, 0.3],
                }}
                transition={{
                  delay: 0.6,
                  duration: 2.8,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
              />

              {/* Rotating orbit ring */}
              <motion.div
                className="absolute"
                style={{ width: 170, height: 170 }}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1, rotate: 360 }}
                transition={{
                  scale: { delay: 0.6, duration: 0.8, ease: [0.22, 1, 0.36, 1] },
                  opacity: { delay: 0.6, duration: 0.8 },
                  rotate: { delay: 0.8, duration: 18, repeat: Infinity, ease: 'linear' },
                }}
              >
                <svg
                  viewBox="0 0 170 170"
                  className="w-full h-full"
                  style={{ overflow: 'visible' }}
                >
                  {/* Dashed orbit circle */}
                  <circle
                    cx="85"
                    cy="85"
                    r="82"
                    fill="none"
                    stroke={hexToRgba(warnaAccent, 0.2)}
                    strokeWidth="1"
                    strokeDasharray="6 8"
                  />
                  {/* Orbit dot at the top */}
                  <circle
                    cx="85"
                    cy="3"
                    r="3.5"
                    fill={warnaAccent}
                    opacity={0.8}
                  />
                  {/* Second orbit dot (opposite side) */}
                  <circle
                    cx="85"
                    cy="167"
                    r="2"
                    fill={warnaAccent}
                    opacity={0.4}
                  />
                </svg>
              </motion.div>

              {/* Second orbit ring (counter-rotating) */}
              <motion.div
                className="absolute"
                style={{ width: 195, height: 195 }}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1, rotate: -360 }}
                transition={{
                  scale: { delay: 0.8, duration: 0.8, ease: [0.22, 1, 0.36, 1] },
                  opacity: { delay: 0.8, duration: 0.8 },
                  rotate: { delay: 1, duration: 25, repeat: Infinity, ease: 'linear' },
                }}
              >
                <svg
                  viewBox="0 0 195 195"
                  className="w-full h-full"
                  style={{ overflow: 'visible' }}
                >
                  <circle
                    cx="97.5"
                    cy="97.5"
                    r="95"
                    fill="none"
                    stroke={hexToRgba(warnaAccent, 0.08)}
                    strokeWidth="0.75"
                    strokeDasharray="3 12"
                  />
                  <circle
                    cx="97.5"
                    cy="2.5"
                    r="2"
                    fill={warnaAccent}
                    opacity={0.35}
                  />
                </svg>
              </motion.div>

              {/* Logo image */}
              <motion.img
                src={logoSrc}
                alt="Logo"
                width={90}
                height={90}
                className="relative z-10 object-contain drop-shadow-2xl"
                style={{
                  filter: `drop-shadow(0 0 20px ${hexToRgba(warnaAccent, 0.3)})`,
                }}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{
                  type: 'spring',
                  stiffness: 180,
                  damping: 14,
                  delay: 0.2,
                }}
              />
            </div>

            {/* ── Government Name ── */}
            <motion.h1
              className="text-xl sm:text-2xl font-extrabold tracking-wide text-center text-white leading-tight"
              style={{
                textShadow: `0 2px 12px ${hexToRgba(warnaDark, 0.5)}`,
              }}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            >
              {namaPemerintah}
            </motion.h1>

            {/* ── Institution Name ── */}
            <motion.p
              className="text-sm sm:text-base font-medium text-center mt-2 tracking-wide"
              style={{ color: hexToRgba(warnaAccent, 0.9) }}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.0, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            >
              {namaInstansi}
            </motion.p>

            {/* ── Decorative Divider ── */}
            <motion.div
              className="flex items-center gap-3 mt-6 mb-8"
              initial={{ opacity: 0, scaleX: 0 }}
              animate={{ opacity: 1, scaleX: 1 }}
              transition={{ delay: 1.1, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            >
              <div
                className="h-px w-12 sm:w-16"
                style={{
                  background: `linear-gradient(to right, transparent, ${hexToRgba(warnaAccent, 0.5)})`,
                }}
              />
              <div
                className="w-2 h-2 rotate-45"
                style={{ background: warnaAccent, opacity: 0.6 }}
              />
              <div
                className="h-px w-12 sm:w-16"
                style={{
                  background: `linear-gradient(to left, transparent, ${hexToRgba(warnaAccent, 0.5)})`,
                }}
              />
            </motion.div>

            {/* ── Progress Bar ── */}
            <motion.div
              className="w-64 sm:w-80"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.0, duration: 0.6 }}
            >
              {/* Track */}
              <div
                className="relative h-1.5 rounded-full overflow-hidden"
                style={{ background: hexToRgba(warnaAccent, 0.12) }}
              >
                {/* Filled bar */}
                <motion.div
                  className="absolute inset-y-0 left-0 rounded-full"
                  style={{
                    width: `${progress * 100}%`,
                    backgroundImage: `linear-gradient(90deg, ${warnaPrimary}, ${warnaAccent}, ${warnaAccent}, ${warnaPrimary})`,
                    backgroundSize: '200% 100%',
                  }}
                  animate={{
                    backgroundPosition: ['0% 0%', '200% 0%'],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: 'linear',
                  }}
                />

                {/* Shimmer sweep overlay */}
                <div
                  className="absolute inset-0 overflow-hidden rounded-full"
                  style={{ width: `${progress * 100}%` }}
                >
                  <div
                    className="absolute inset-0 animate-loader-shimmer"
                    style={{
                      backgroundImage: `linear-gradient(90deg, transparent 0%, ${hexToRgba('#ffffff', 0.25)} 50%, transparent 100%)`,
                      backgroundSize: '200% 100%',
                    }}
                  />
                </div>
              </div>

              {/* Progress percentage */}
              <motion.p
                className="text-[10px] text-center mt-2 font-mono tabular-nums"
                style={{ color: hexToRgba(warnaAccent, 0.5) }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.2 }}
              >
                {Math.round(progress * 100)}%
              </motion.p>
            </motion.div>

            {/* ── Loading Dots ── */}
            <motion.div
              className="mt-5"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.3, duration: 0.5 }}
            >
              <LoadingDots color={hexToRgba(warnaAccent, 0.7)} labelColor={hexToRgba(warnaAccent, 0.5)} />
            </motion.div>
          </div>

          {/* ═══════ Bottom Accent Line ═══════ */}
          <div className="absolute bottom-0 left-0 right-0 h-1">
            <div
              className="h-full"
              style={{
                background: `linear-gradient(90deg, ${warnaDark}, ${warnaAccent}, ${warnaPrimary}, ${warnaAccent}, ${warnaDark})`,
                opacity: 0.6,
              }}
            />
          </div>

          {/* ═══════ Top Corner Decorations ═══════ */}
          <svg
            className="absolute top-0 left-0 w-32 h-32 pointer-events-none"
            viewBox="0 0 128 128"
            style={{ opacity: 0.06 }}
          >
            <path
              d="M0 0 L128 0 L128 8 L8 8 L8 128 L0 128 Z"
              fill="white"
            />
          </svg>
          <svg
            className="absolute top-0 right-0 w-32 h-32 pointer-events-none"
            viewBox="0 0 128 128"
            style={{ opacity: 0.06, transform: 'scaleX(-1)' }}
          >
            <path
              d="M0 0 L128 0 L128 8 L8 8 L8 128 L0 128 Z"
              fill="white"
            />
          </svg>
          <svg
            className="absolute bottom-0 left-0 w-32 h-32 pointer-events-none"
            viewBox="0 0 128 128"
            style={{ opacity: 0.06, transform: 'scaleY(-1)' }}
          >
            <path
              d="M0 0 L128 0 L128 8 L8 8 L8 128 L0 128 Z"
              fill="white"
            />
          </svg>
          <svg
            className="absolute bottom-0 right-0 w-32 h-32 pointer-events-none"
            viewBox="0 0 128 128"
            style={{ opacity: 0.06, transform: 'scale(-1)' }}
          >
            <path
              d="M0 0 L128 0 L128 8 L8 8 L8 128 L0 128 Z"
              fill="white"
            />
          </svg>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
