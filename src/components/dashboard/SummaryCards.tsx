"use client";

import { Card, CardContent } from "@/components/ui/card";
import { DashboardData, formatRupiah, formatPersentase } from "./types";
import {
  Landmark,
  TrendingUp,
  TrendingDown,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
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
      subtitle: "Anggaran Pendapatan & Belanja Daerah",
      icon: Landmark,
      color: "from-[#1B5E20] to-[#2E7D32]",
      iconBg: "bg-emerald-100",
      iconColor: "text-emerald-700",
    },
    {
      title: "Pendapatan",
      value: formatRupiah(ringkasan.totalPendapatan),
      subtitle: `Realisasi: ${formatPersentase(ringkasan.persentasePendapatan)}`,
      icon: TrendingUp,
      color: "from-[#0D47A1] to-[#1565C0]",
      iconBg: "bg-blue-100",
      iconColor: "text-blue-700",
      realisasi: ringkasan.realisasiPendapatan,
      persentase: ringkasan.persentasePendapatan,
    },
    {
      title: "Belanja",
      value: formatRupiah(ringkasan.totalBelanja),
      subtitle: `Realisasi: ${formatPersentase(ringkasan.persentaseBelanja)}`,
      icon: TrendingDown,
      color: "from-[#B71C1C] to-[#C62828]",
      iconBg: "bg-red-100",
      iconColor: "text-red-700",
      realisasi: ringkasan.realisasiBelanja,
      persentase: ringkasan.persentaseBelanja,
    },
    {
      title: "Pembiayaan",
      value: formatRupiah(ringkasan.totalPembiayaan),
      subtitle: "Net Pembiayaan",
      icon: DollarSign,
      color: "from-[#E65100] to-[#F57C00]",
      iconBg: "bg-orange-100",
      iconColor: "text-orange-700",
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
        >
          <Card className="overflow-hidden border-0 shadow-md hover:shadow-lg transition-shadow duration-300">
            <CardContent className="p-0">
              {/* Gradient top bar */}
              <div className={`h-1.5 bg-gradient-to-r ${card.color}`} />
              <div className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      {card.title}
                    </p>
                    <p className="text-xl lg:text-2xl font-bold mt-1 truncate">
                      {card.value}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {card.subtitle}
                    </p>
                  </div>
                  <div
                    className={`${card.iconBg} ${card.iconColor} p-2.5 rounded-lg shrink-0`}
                  >
                    <card.icon className="w-5 h-5" />
                  </div>
                </div>

                {/* Progress bar for realisasi */}
                {card.persentase !== undefined && (
                  <div className="mt-3">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-muted-foreground">Realisasi</span>
                      <span className="font-semibold">
                        {formatPersentase(card.persentase)}
                      </span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <motion.div
                        className={`h-full rounded-full bg-gradient-to-r ${card.color}`}
                        initial={{ width: 0 }}
                        animate={{
                          width: `${Math.min(card.persentase, 100)}%`,
                        }}
                        transition={{ duration: 1, delay: 0.5 + index * 0.1 }}
                      />
                    </div>
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
