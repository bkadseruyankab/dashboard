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
import { Pie, PieChart as RechartsPieChart, Cell } from "recharts";
import { DashboardData, formatRupiah } from "./types";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";

type BelanjaChartProps = {
  data: DashboardData;
};

const COLORS = [
  "#B71C1C",
  "#D32F2F",
  "#E53935",
  "#EF5350",
  "#F44336",
  "#E57373",
];

const chartConfig: ChartConfig = {
  Operasi: { label: "Belanja Operasi", color: "#B71C1C" },
  Modal: { label: "Belanja Modal", color: "#D32F2F" },
  "Tak Terduga": { label: "Belanja Tak Terduga", color: "#E53935" },
  Transfer: { label: "Belanja Transfer", color: "#EF5350" },
};

export default function BelanjaChart({ data }: BelanjaChartProps) {
  // Group belanja by kategori
  const grouped = data.belanja.reduce(
    (acc, item) => {
      if (!acc[item.kategori]) {
        acc[item.kategori] = { anggaran: 0, realisasi: 0 };
      }
      acc[item.kategori].anggaran += item.anggaran;
      acc[item.kategori].realisasi += item.realisasi;
      return acc;
    },
    {} as Record<string, { anggaran: number; realisasi: number }>
  );

  const chartData = Object.entries(grouped).map(([kategori, values], idx) => ({
    name: kategori,
    value: values.anggaran,
    realisasi: values.realisasi,
    fill: COLORS[idx % COLORS.length],
  }));

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4, duration: 0.5 }}
    >
      <Card className="shadow-md border-0 h-full">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-[#B71C1C]" />
            Komposisi Belanja
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-[240px] w-full">
            <RechartsPieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={95}
                paddingAngle={3}
                dataKey="value"
                nameKey="name"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} stroke="white" strokeWidth={2} />
                ))}
              </Pie>
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    formatter={(value) => formatRupiah(value as number)}
                  />
                }
              />
              <ChartLegend content={<ChartLegendContent nameKey="name" />} />
            </RechartsPieChart>
          </ChartContainer>

          {/* Detail breakdown */}
          <div className="mt-4 space-y-2.5">
            {chartData.map((item) => {
              const realisasiPct = ((item.realisasi / item.value) * 100).toFixed(1);
              return (
                <div key={item.name} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-sm shrink-0"
                        style={{ backgroundColor: item.fill }}
                      />
                      <span className="font-medium">{item.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-semibold">
                        {formatRupiah(item.value)}
                      </span>
                      <Badge className="text-[10px] px-1.5 py-0 h-5 bg-red-100 text-red-800">
                        {realisasiPct}%
                      </Badge>
                    </div>
                  </div>
                  <div className="h-1.5 bg-muted rounded-full overflow-hidden ml-5">
                    <div
                      className="h-full rounded-full bg-red-500 transition-all duration-700"
                      style={{ width: `${Math.min(parseFloat(realisasiPct), 100)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
