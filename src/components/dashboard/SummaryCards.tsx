"use client";

import { Card, CardContent } from "@/components/ui/card";
import { DashboardData, formatRupiah, formatPersentase, formatRupiahShort, getRealisasiBarClass } from "./types";
import {
  Landmark,
  TrendingUp,
  TrendingDown,
  DollarSign,
  ArrowUpRight,
  type LucideIcon,
} from "lucide-react";
import { motion, useMotionValue, animate } from "framer-motion";
import { useEffect, useState } from "react";
import { usePengaturan } from "@/context/PengaturanContext";

type SummaryCardsProps = {
  data: DashboardData;
};

type CardData = {
  title: string;
  value: number;
  displayValue: string;
  fullValue: string;
  subtitle: string;
  Icon: LucideIcon;
  gradientFrom: string;
  gradientTo: string;
  iconBg: string;
  iconColor: string;
  persentase: number | undefined;
  realisasiValue: string | undefined;
  accentColor: string;
  sparkle: boolean;
};

// Animated counter hook
function useAnimatedCounter(target: number, duration: number = 2) {
  const motionValue = useMotionValue(0);
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    const controls = animate(motionValue, target, {
      duration,
      ease: [0.22, 1, 0.36, 1],
    });

    const unsubscribe = motionValue.on("change", (v) => {
      setDisplay(v);
    });

    return () => {
      controls.stop();
      unsubscribe();
    };
  }, [target, duration, motionValue]);

  return display;
}

function formatCounterValue(num: number): string {
  if (num >= 1_000_000_000_000) return `${(num / 1_000_000_000_000).toFixed(1)} T`;
  if (num >= 1_000_000_000) return `${(num / 1_000_000_000).toFixed(1)} M`;
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)} Jt`;
  return Math.round(num).toLocaleString("id-ID");
}

const cardVariants = {
  hidden: { opacity: 0, y: 30, scale: 0.95 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      delay: 0.1 + i * 0.08,
      duration: 0.6,
      ease: [0.22, 1, 0.36, 1],
    },
  }),
};

export default function SummaryCards({ data }: SummaryCardsProps) {
  const { ringkasan } = data;
  const { pengaturan } = usePengaturan();

  const cards: CardData[] = [
    {
      title: "Total APBD",
      value: ringkasan.totalAnggaran,
      displayValue: formatRupiah(ringkasan.totalAnggaran),
      fullValue: formatRupiahShort(ringkasan.totalAnggaran),
      subtitle: "Anggaran Pendapatan & Belanja Daerah",
      Icon: Landmark,
      gradientFrom: pengaturan.warnaPrimary,
      gradientTo: pengaturan.warnaSecondary,
      iconBg: "bg-gradient-to-br from-emerald-400 to-green-600",
      iconColor: "text-white",
      persentase: undefined,
      realisasiValue: undefined,
      accentColor: pengaturan.warnaPrimary,
      sparkle: true,
    },
    {
      title: "Pendapatan",
      value: ringkasan.totalPendapatan,
      displayValue: formatRupiah(ringkasan.totalPendapatan),
      fullValue: formatRupiahShort(ringkasan.totalPendapatan),
      subtitle: `Realisasi: ${formatPersentase(ringkasan.persentasePendapatan)}`,
      Icon: TrendingUp,
      gradientFrom: "#0D47A1",
      gradientTo: "#1565C0",
      iconBg: "bg-gradient-to-br from-blue-400 to-blue-700",
      iconColor: "text-white",
      persentase: ringkasan.persentasePendapatan,
      realisasiValue: formatRupiahShort(ringkasan.realisasiPendapatan),
      accentColor: "#0D47A1",
      sparkle: false,
    },
    {
      title: "Belanja",
      value: ringkasan.totalBelanja,
      displayValue: formatRupiah(ringkasan.totalBelanja),
      fullValue: formatRupiahShort(ringkasan.totalBelanja),
      subtitle: `Realisasi: ${formatPersentase(ringkasan.persentaseBelanja)}`,
      Icon: TrendingDown,
      gradientFrom: "#B71C1C",
      gradientTo: "#C62828",
      iconBg: "bg-gradient-to-br from-red-400 to-red-700",
      iconColor: "text-white",
      persentase: ringkasan.persentaseBelanja,
      realisasiValue: formatRupiahShort(ringkasan.realisasiBelanja),
      accentColor: "#B71C1C",
      sparkle: false,
    },
    {
      title: "Pembiayaan",
      value: ringkasan.totalPembiayaan,
      displayValue: formatRupiah(ringkasan.totalPembiayaan),
      fullValue: formatRupiahShort(ringkasan.totalPembiayaan),
      subtitle: "Net Pembiayaan Daerah",
      Icon: DollarSign,
      gradientFrom: "#E65100",
      gradientTo: "#F57C00",
      iconBg: "bg-gradient-to-br from-orange-400 to-orange-600",
      iconColor: "text-white",
      persentase: undefined,
      realisasiValue: undefined,
      accentColor: "#E65100",
      sparkle: false,
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      {cards.map((card, index) => (
        <AnimatedSummaryCard key={card.title} card={card} index={index} />
      ))}
    </div>
  );
}

function AnimatedSummaryCard({ card, index }: { card: CardData; index: number }) {
  const counterValue = useAnimatedCounter(card.value, 2);

  return (
    <motion.div
      custom={index}
      variants={cardVariants}
      initial="hidden"
      animate="visible"
    >
      <Card className="overflow-hidden border-0 shadow-md hover:shadow-xl transition-all duration-500 group relative">
        {/* Animated gradient top bar with shimmer */}
        <div
          className="h-1.5 relative overflow-hidden"
          style={{
            background: `linear-gradient(to right, ${card.gradientFrom}, ${card.gradientTo})`,
          }}
        >
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
            animate={{ x: ["-100%", "100%"] }}
            transition={{ duration: 3, repeat: Infinity, repeatDelay: 2, ease: "linear" }}
          />
        </div>

        <CardContent className="p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                {card.title}
              </p>
              <div className="text-2xl lg:text-3xl font-extrabold mt-1.5 tracking-tight">
                Rp {formatCounterValue(counterValue)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {card.fullValue}
              </p>
            </div>

            {/* Animated icon container */}
            <div className={`${card.iconBg} p-3 rounded-xl shrink-0 shadow-lg group-hover:scale-110 group-hover:rotate-3 transition-all duration-500 relative`}>
              <card.Icon className="w-6 h-6 text-white" />
              {/* Glow effect behind icon */}
              <div className="absolute inset-0 rounded-xl bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            </div>
          </div>

          {/* Subtitle */}
          <div className="mt-3 flex items-center gap-1.5">
            {card.sparkle && (
              <ArrowUpRight className="w-3.5 h-3.5 text-emerald-500" />
            )}
            <p className="text-[11px] text-muted-foreground font-medium">
              {card.subtitle}
            </p>
          </div>

          {/* Progress bar for realisasi */}
          {card.persentase !== undefined && (
            <div className="mt-4 pt-3 border-t border-border/50">
              <div className="flex items-center justify-between text-xs mb-2">
                <span className="text-muted-foreground font-medium">Realisasi</span>
                <span className="font-bold text-foreground text-sm">
                  {formatPersentase(card.persentase)}
                </span>
              </div>
              <div className="h-2.5 bg-muted/80 rounded-full overflow-hidden relative">
                <motion.div
                  className={`h-full rounded-full relative ${getRealisasiBarClass(card.persentase)}`}
                  initial={{ width: 0 }}
                  animate={{
                    width: `${Math.min(card.persentase, 100)}%`,
                  }}
                  transition={{ duration: 1.5, delay: 0.3 + index * 0.1, ease: [0.22, 1, 0.36, 1] }}
                >
                  {/* Shimmer effect on bar */}
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                    animate={{ x: ["-100%", "100%"] }}
                    transition={{ duration: 2, repeat: Infinity, repeatDelay: 3, ease: "linear", delay: 1 }}
                  />
                </motion.div>
              </div>
              {card.realisasiValue && (
                <p className="text-[10px] text-muted-foreground mt-2 flex items-center gap-1">
                  <span className="w-1 h-1 rounded-full bg-emerald-400" />
                  Terealisasi: {card.realisasiValue}
                </p>
              )}
            </div>
          )}
        </CardContent>

        {/* Hover gradient overlay */}
        <div
          className="absolute inset-0 opacity-0 group-hover:opacity-[0.03] transition-opacity duration-500 pointer-events-none rounded-xl"
          style={{
            background: `linear-gradient(135deg, ${card.accentColor}, transparent)`,
          }}
        />
      </Card>
    </motion.div>
  );
}
