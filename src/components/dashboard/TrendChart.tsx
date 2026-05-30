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
  Area,
  AreaChart,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import { DashboardData, formatRupiah, formatRupiahFull } from "./types";
import { motion } from "framer-motion";

type TrendChartProps = {
  data: DashboardData;
};

const chartConfig: ChartConfig = {
  pendapatan: {
    label: "Pendapatan",
    color: "#1B5E20",
  },
  belanja: {
    label: "Belanja",
    color: "#B71C1C",
  },
};

export default function TrendChart({ data }: TrendChartProps) {
  const chartData = data.trendApbd.map((item) => ({
    tahun: item.tahun.toString(),
    pendapatan: item.pendapatan,
    belanja: item.belanja,
  }));

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5, duration: 0.5 }}
    >
      <Card className="shadow-md border-0">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-[#F9A825]" />
            Tren APBD (Tahun Anggaran)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-[300px] w-full">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
              <defs>
                <linearGradient id="fillPendapatan" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#1B5E20" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#1B5E20" stopOpacity={0.02} />
                </linearGradient>
                <linearGradient id="fillBelanja" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#B71C1C" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#B71C1C" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
              <XAxis
                dataKey="tahun"
                tickLine={false}
                axisLine={false}
                tickMargin={10}
                fontSize={13}
                tick={{ fontWeight: 600 }}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tickMargin={10}
                fontSize={11}
                width={75}
                tickFormatter={(value) => formatRupiah(value)}
              />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    formatter={(value) => formatRupiahFull(value as number)}
                    labelFormatter={(label) => `Tahun Anggaran ${label}`}
                  />
                }
              />
              <Area
                type="monotone"
                dataKey="pendapatan"
                stroke="#1B5E20"
                strokeWidth={3}
                fill="url(#fillPendapatan)"
                dot={{ r: 5, fill: "#1B5E20", strokeWidth: 2, stroke: "white" }}
                activeDot={{ r: 7, strokeWidth: 2, stroke: "white" }}
              />
              <Area
                type="monotone"
                dataKey="belanja"
                stroke="#B71C1C"
                strokeWidth={3}
                fill="url(#fillBelanja)"
                dot={{ r: 5, fill: "#B71C1C", strokeWidth: 2, stroke: "white" }}
                activeDot={{ r: 7, strokeWidth: 2, stroke: "white" }}
              />
              <ChartLegend content={<ChartLegendContent />} />
            </AreaChart>
          </ChartContainer>
        </CardContent>
      </Card>
    </motion.div>
  );
}
