"use client";

import { Card, CardContent } from "@/components/ui/card";
import { DashboardData, formatRupiah, formatPersentase, formatRupiahShort, getRealisasiBarClass } from "./types";
import {
  Landmark,
  TrendingUp,
  TrendingDown,
  DollarSign,
} from "lucide-react";
import { motion } from "framer-motion";

type SummaryCardsProps = {
  data: DashboardData;
};

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.1,
      duration: 0.5,
      ease: "easeOut",
    },
  }),
};

export default function SummaryCards({ data }: SummaryCardsProps) {
  const { ringkasan } = data;

  const cards = [
    {
      title: "Total APBD",
      value: formatRupiah(ringkasan.totalAnggaran),
      fullValue: formatRupiahShort(ringkasan.totalAnggaran),
      subtitle: "Anggaran Pendapatan & Belanja Daerah",
      Icon: Landmark,
      color: "from-[#1B5E20] to-[#2E7D32]",
      iconBg: "bg-emerald-100",
      iconColor: "text-emerald-700",
      persentase: undefined as number | undefined,
      realisasiValue: undefined as string | undefined,
    },
    {
      title: "Pendapatan",
      value: formatRupiah(ringkasan.totalPendapatan),
      fullValue: formatRupiahShort(ringkasan.totalPendapatan),
      subtitle: `Realisasi: ${formatPersentase(ringkasan.persentasePendapatan)}`,
      Icon: TrendingUp,
      color: "from-[#0D47A1] to-[#1565C0]",
      iconBg: "bg-blue-100",
      iconColor: "text-blue-700",
      persentase: ringkasan.persentasePendapatan,
      realisasiValue: formatRupiahShort(ringkasan.realisasiPendapatan),
    },
    {
      title: "Belanja",
      value: formatRupiah(ringkasan.totalBelanja),
      fullValue: formatRupiahShort(ringkasan.totalBelanja),
      subtitle: `Realisasi: ${formatPersentase(ringkasan.persentaseBelanja)}`,
      Icon: TrendingDown,
      color: "from-[#B71C1C] to-[#C62828]",
      iconBg: "bg-red-100",
      iconColor: "text-red-700",
      persentase: ringkasan.persentaseBelanja,
      realisasiValue: formatRupiahShort(ringkasan.realisasiBelanja),
    },
    {
      title: "Pembiayaan",
      value: formatRupiah(ringkasan.totalPembiayaan),
      fullValue: formatRupiahShort(ringkasan.totalPembiayaan),
      subtitle: "Net Pembiayaan Daerah",
      Icon: DollarSign,
      color: "from-[#E65100] to-[#F57C00]",
      iconBg: "bg-orange-100",
      iconColor: "text-orange-700",
      persentase: undefined as number | undefined,
      realisasiValue: undefined as string | undefined,
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      {cards.map((card, index) => (
        <motion.div
          key={card.title}
          custom={index}
          variants={cardVariants}
          initial="hidden"
          animate="visible"
          // Only animate on mount — prevent re-animation on data change
          onAnimationComplete={() => {}}
        >
          <Card className="overflow-hidden border-0 shadow-md hover:shadow-lg transition-shadow duration-300 group">
            <CardContent className="p-0">
              {/* Gradient top bar */}
              <div className={`h-1.5 bg-gradient-to-r ${card.color}`} />
              <div className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      {card.title}
                    </p>
                    <p className="text-2xl lg:text-3xl font-bold mt-1.5 tracking-tight">
                      {card.value}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {card.fullValue}
                    </p>
                  </div>
                  <div
                    className={`${card.iconBg} ${card.iconColor} p-3 rounded-xl shrink-0 group-hover:scale-110 transition-transform duration-300`}
                  >
                    <card.Icon className="w-6 h-6" />
                  </div>
                </div>

                {/* Progress bar for realisasi */}
                {card.persentase !== undefined && (
                  <div className="mt-4 pt-3 border-t border-border/50">
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="text-muted-foreground font-medium">Realisasi</span>
                      <span className="font-bold text-foreground">
                        {formatPersentase(card.persentase)}
                      </span>
                    </div>
                    <div className="h-2.5 bg-muted rounded-full overflow-hidden">
                      <motion.div
                        className={`h-full rounded-full ${getRealisasiBarClass(card.persentase)}`}
                        initial={{ width: 0 }}
                        animate={{
                          width: `${Math.min(card.persentase, 100)}%`,
                        }}
                        transition={{ duration: 1.2, delay: 0.5 + index * 0.1 }}
                      />
                    </div>
                    {card.realisasiValue && (
                      <p className="text-[10px] text-muted-foreground mt-1.5">
                        Terealisasi: {card.realisasiValue}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );
}
