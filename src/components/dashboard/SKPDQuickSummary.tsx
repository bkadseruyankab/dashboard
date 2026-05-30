"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DashboardData, formatRupiah, formatPersentase, getRealisasiBadgeClass, getRealisasiBarClass } from "./types";

type SKPDQuickSummaryProps = {
  data: DashboardData;
};

export default function SKPDQuickSummary({ data }: SKPDQuickSummaryProps) {
  // Use .slice() to avoid mutating the original array
  const sortedSkpd = [...data.realisasiSkpd].sort((a, b) => b.anggaran - a.anggaran);

  return (
    <Card className="shadow-md border-0">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-[#F9A825]" />
          Ringkasan Realisasi Per-SKPD/OPD
          <Badge variant="secondary" className="ml-auto text-[10px]">
            TA {data.tahun}
          </Badge>
        </CardTitle>
        {/* Color legend */}
        <div className="flex items-center gap-4 mt-2 pt-2 border-t border-border/50 text-[10px] text-muted-foreground">
          <span className="flex items-center gap-1">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            ≥ 90%
          </span>
          <span className="flex items-center gap-1">
            <div className="w-2.5 h-2.5 rounded-full bg-amber-500" />
            75-90%
          </span>
          <span className="flex items-center gap-1">
            <div className="w-2.5 h-2.5 rounded-full bg-orange-500" />
            50-75%
          </span>
          <span className="flex items-center gap-1">
            <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
            &lt; 50%
          </span>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {sortedSkpd.map((skpd) => (
            <div
              key={skpd.id}
              className="flex items-start gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors border border-transparent hover:border-border/50"
            >
              <div
                className={`w-1 h-full min-h-[40px] rounded-full shrink-0 ${getRealisasiBarClass(skpd.persentase)}`}
              />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold truncate">
                  {skpd.namaSkpd}
                </p>
                <div className="flex items-center gap-2 mt-1.5">
                  <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ${getRealisasiBarClass(skpd.persentase)}`}
                      style={{
                        width: `${Math.min(skpd.persentase, 100)}%`,
                      }}
                    />
                  </div>
                  <Badge className={`text-[10px] px-1.5 py-0 h-5 border ${getRealisasiBadgeClass(skpd.persentase)}`}>
                    {formatPersentase(skpd.persentase)}
                  </Badge>
                </div>
                <div className="flex items-center justify-between mt-1.5 text-[10px] text-muted-foreground">
                  <span>Anggaran: {formatRupiah(skpd.anggaran)}</span>
                  <span>Realisasi: {formatRupiah(skpd.realisasi)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
