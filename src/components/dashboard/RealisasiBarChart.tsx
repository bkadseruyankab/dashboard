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
import { DashboardData, formatRupiah, formatRupiahFull, getRealisasiBarClass, safePercentage } from "./types";
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
  // Use .slice() to avoid mutating the original array
  const chartData = [...data.realisasiSkpd]
    .sort((a, b) => b.anggaran - a.anggaran)
    .slice(0, 8)
    .map((item) => ({
      nama: item.namaSkpd.length > 25
        ? item.namaSkpd.substring(0, 25) + "…"
        : item.namaSkpd,
      fullName: item.namaSkpd,
      anggaran: item.anggaran,
      realisasi: item.realisasi,
      persentase: item.persentase,
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
            <div className="w-2.5 h-2.5 rounded-full bg-[#2E7D32]" />
            Realisasi Per-SKPD (Top 8)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-[340px] w-full">
            <BarChart data={chartData} layout="vertical" margin={{ left: 10, right: 20, top: 5, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.2} horizontal={false} />
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
                tickMargin={6}
                fontSize={10}
                width={150}
              />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    formatter={(value, name, item) => formatRupiahFull(value as number)}
                    labelFormatter={(_label, payload) => {
                      if (payload?.[0]?.payload?.fullName) {
                        return payload[0].payload.fullName;
                      }
                      return _label;
                    }}
                  />
                }
              />
              <ChartLegend content={<ChartLegendContent />} />
              <Bar
                dataKey="anggaran"
                fill="var(--color-anggaran)"
                radius={[0, 4, 4, 0]}
                barSize={12}
              />
              <Bar
                dataKey="realisasi"
                fill="var(--color-realisasi)"
                radius={[0, 4, 4, 0]}
                barSize={12}
              />
            </BarChart>
          </ChartContainer>

          {/* Quick summary below chart */}
          <div className="mt-3 pt-3 border-t border-border/50 grid grid-cols-2 md:grid-cols-4 gap-2">
            {chartData.slice(0, 4).map((item) => (
              <div key={item.fullName} className="text-center p-2 rounded-lg bg-muted/30">
                <p className="text-[10px] text-muted-foreground truncate" title={item.fullName}>
                  {item.nama}
                </p>
                <p className="text-xs font-bold mt-0.5">{safePercentage(item.realisasi, item.anggaran).toFixed(1)}%</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
