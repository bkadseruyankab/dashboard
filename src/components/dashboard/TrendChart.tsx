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
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Area,
  AreaChart,
} from "recharts";
import { DashboardData, formatRupiah } from "./types";
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
            <div className="w-2 h-2 rounded-full bg-[#F9A825]" />
            Tren APBD (Tahun Anggaran)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-[280px] w-full">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="fillPendapatan" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#1B5E20" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#1B5E20" stopOpacity={0.05} />
                </linearGradient>
                <linearGradient id="fillBelanja" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#B71C1C" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#B71C1C" stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
              <XAxis
                dataKey="tahun"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                fontSize={12}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                fontSize={11}
                tickFormatter={(value) => formatRupiah(value)}
              />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    formatter={(value) => formatRupiah(value as number)}
                  />
                }
              />
              <Area
                type="monotone"
                dataKey="pendapatan"
                stroke="#1B5E20"
                strokeWidth={2.5}
                fill="url(#fillPendapatan)"
                dot={{ r: 4, fill: "#1B5E20", strokeWidth: 2, stroke: "white" }}
                activeDot={{ r: 6 }}
              />
              <Area
                type="monotone"
                dataKey="belanja"
                stroke="#B71C1C"
                strokeWidth={2.5}
                fill="url(#fillBelanja)"
                dot={{ r: 4, fill: "#B71C1C", strokeWidth: 2, stroke: "white" }}
                activeDot={{ r: 6 }}
              />
              <ChartLegend content={<ChartLegendContent />} />
            </AreaChart>
          </ChartContainer>
        </CardContent>
      </Card>
    </motion.div>
  );
}
