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
import { DashboardData, formatRupiah, formatRupiahFull } from "./types";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";

type PendapatanChartProps = {
  data: DashboardData;
};

const COLORS = ["#1B5E20", "#2E7D32", "#43A047"];

const chartConfig: ChartConfig = {
  PAD: { label: "PAD", color: "#1B5E20" },
  Transfer: { label: "Transfer", color: "#2E7D32" },
  Lainnya: { label: "Lainnya", color: "#43A047" },
};

export default function PendapatanChart({ data }: PendapatanChartProps) {
  const grouped = data.pendapatan.reduce(
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

  const totalAnggaran = chartData.reduce((s, d) => s + d.value, 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3, duration: 0.5 }}
    >
      <Card className="shadow-md border-0 h-full">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-[#1B5E20]" />
            Komposisi Pendapatan
            <span className="text-[10px] font-normal text-muted-foreground ml-auto">
              Total: {formatRupiah(totalAnggaran)}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-[220px] w-full">
            <RechartsPieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={90}
                paddingAngle={4}
                dataKey="value"
                nameKey="name"
                strokeWidth={0}
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} stroke="white" strokeWidth={2} />
                ))}
              </Pie>
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    formatter={(value) => formatRupiahFull(value as number)}
                  />
                }
              />
              <ChartLegend content={<ChartLegendContent nameKey="name" />} />
            </RechartsPieChart>
          </ChartContainer>

          {/* Detail breakdown */}
          <div className="mt-3 space-y-3 pt-3 border-t border-border/50">
            {chartData.map((item) => {
              const realisasiPct = item.value > 0 ? ((item.realisasi / item.value) * 100).toFixed(1) : "0.0";
              const proportion = totalAnggaran > 0 ? ((item.value / totalAnggaran) * 100).toFixed(1) : "0.0";
              return (
                <div key={item.name} className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3.5 h-3.5 rounded shrink-0"
                        style={{ backgroundColor: item.fill }}
                      />
                      <span className="text-sm font-medium">{item.name}</span>
                      <span className="text-[10px] text-muted-foreground">
                        ({proportion}%)
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-mono font-semibold">
                        {formatRupiah(item.value)}
                      </span>
                      <Badge className="text-[10px] px-2 py-0.5 h-5 bg-emerald-100 text-emerald-800 border border-emerald-200">
                        {realisasiPct}%
                      </Badge>
                    </div>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden ml-5.5">
                    <div
                      className="h-full rounded-full bg-emerald-500 transition-all duration-700"
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
