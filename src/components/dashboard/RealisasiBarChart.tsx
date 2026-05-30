"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from "@/components/ui/chart";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Cell,
} from "recharts";
import { DashboardData, formatRupiah } from "./types";
import { motion } from "framer-motion";

type RealisasiBarChartProps = {
  data: DashboardData;
};

const chartConfig: ChartConfig = {
  anggaran: {
    label: "Anggaran",
    color: "#2E7D32",
  },
  realisasi: {
    label: "Realisasi",
    color: "#F9A825",
  },
};

export default function RealisasiBarChart({ data }: RealisasiBarChartProps) {
  // Top 8 SKPD by budget
  const chartData = data.realisasiSkpd
    .sort((a, b) => b.anggaran - a.anggaran)
    .slice(0, 8)
    .map((item) => ({
      nama: item.namaSkpd.length > 18 
        ? item.namaSkpd.substring(0, 18) + "..." 
        : item.namaSkpd,
      anggaran: item.anggaran,
      realisasi: item.realisasi,
    }));

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.6, duration: 0.5 }}
    >
      <Card className="shadow-md border-0">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-[#2E7D32]" />
            Realisasi Per-SKPD (Top 8)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-[300px] w-full">
            <BarChart data={chartData} layout="vertical" margin={{ left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} horizontal={false} />
              <XAxis
                type="number"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                fontSize={11}
                tickFormatter={(value) => formatRupiah(value)}
              />
              <YAxis
                type="category"
                dataKey="nama"
                tickLine={false}
                axisLine={false}
                tickMargin={4}
                fontSize={10}
                width={120}
              />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    formatter={(value) => formatRupiah(value as number)}
                  />
                }
              />
              <ChartLegend content={<ChartLegendContent />} />
              <Bar
                dataKey="anggaran"
                fill="var(--color-anggaran)"
                radius={[0, 4, 4, 0]}
                barSize={14}
              />
              <Bar
                dataKey="realisasi"
                fill="var(--color-realisasi)"
                radius={[0, 4, 4, 0]}
                barSize={14}
              />
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>
    </motion.div>
  );
}
