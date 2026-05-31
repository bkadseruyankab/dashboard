"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { DashboardData, formatPersentase, getRealisasiBadgeClass, getRealisasiBarClass, safePercentage } from "./types";
import RupiahCell from "./RupiahCell";
import { motion } from "framer-motion";
import { Eye, FileText, CheckCircle } from "lucide-react";
import APBDTable from "./APBDTable";

type TransparansiViewProps = {
  data: DashboardData;
};

export default function TransparansiView({ data }: TransparansiViewProps) {
  const totalPendapatan = data.pendapatan.reduce((s, p) => s + p.anggaran, 0);
  const totalRealisasiPendapatan = data.pendapatan.reduce((s, p) => s + p.realisasi, 0);
  const totalBelanja = data.belanja.reduce((s, b) => s + b.anggaran, 0);
  const totalRealisasiBelanja = data.belanja.reduce((s, b) => s + b.realisasi, 0);

  const pctPendapatan = safePercentage(totalRealisasiPendapatan, totalPendapatan);
  const pctBelanja = safePercentage(totalRealisasiBelanja, totalBelanja);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2, duration: 0.5 }}
      className="space-y-4"
    >
      <Card className="shadow-md border-0 bg-gradient-to-br from-emerald-50 to-white">
        <CardContent className="p-5">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-xl bg-emerald-100">
              <Eye className="w-6 h-6 text-emerald-700" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-foreground">
                Transparansi Keuangan Daerah
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                Pemerintah Kabupaten Seruyan berkomitmen untuk memberikan
                transparansi dalam pengelolaan keuangan daerah. Data APBD dan
                Realisasi tersedia untuk diakses publik sesuai amanat UU No. 14
                Tahun 2008 tentang Keterbukaan Informasi Publik.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="apbd" className="w-full">
        <TabsList className="grid w-full grid-cols-2 bg-muted/50">
          <TabsTrigger value="apbd" className="text-xs gap-1.5">
            <FileText className="w-3.5 h-3.5" />
            APBD
          </TabsTrigger>
          <TabsTrigger value="realisasi" className="text-xs gap-1.5">
            <CheckCircle className="w-3.5 h-3.5" />
            Realisasi
          </TabsTrigger>
        </TabsList>

        <TabsContent value="apbd" className="mt-4">
          <APBDTable data={data} />
        </TabsContent>

        <TabsContent value="realisasi" className="mt-4">
          <Card className="shadow-md border-0">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
                <div className="p-1.5 rounded-md bg-amber-100">
                  <CheckCircle className="w-4 h-4 text-amber-700" />
                </div>
                Laporan Realisasi Anggaran
                <Badge variant="secondary" className="ml-auto text-[10px]">
                  TA {data.tahun}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Ringkasan Realisasi */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-lg border bg-emerald-50/50">
                  <h3 className="text-xs font-bold text-emerald-800 uppercase tracking-wide mb-3">
                    Realisasi Pendapatan
                  </h3>
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Anggaran</span>
                      <span className="font-semibold">
                        <RupiahCell value={totalPendapatan} />
                      </span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Realisasi</span>
                      <span className="font-semibold">
                        <RupiahCell value={totalRealisasiPendapatan} />
                      </span>
                    </div>
                    <div className="h-2 bg-emerald-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${getRealisasiBarClass(pctPendapatan)}`}
                        style={{
                          width: `${Math.min(pctPendapatan, 100)}%`,
                        }}
                      />
                    </div>
                    <div className="text-right">
                      <Badge className={`text-[10px] border ${getRealisasiBadgeClass(pctPendapatan)}`}>
                        {formatPersentase(pctPendapatan)}
                      </Badge>
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-lg border bg-red-50/50">
                  <h3 className="text-xs font-bold text-red-800 uppercase tracking-wide mb-3">
                    Realisasi Belanja
                  </h3>
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Anggaran</span>
                      <span className="font-semibold">
                        <RupiahCell value={totalBelanja} />
                      </span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Realisasi</span>
                      <span className="font-semibold">
                        <RupiahCell value={totalRealisasiBelanja} />
                      </span>
                    </div>
                    <div className="h-2 bg-red-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${getRealisasiBarClass(pctBelanja)}`}
                        style={{
                          width: `${Math.min(pctBelanja, 100)}%`,
                        }}
                      />
                    </div>
                    <div className="text-right">
                      <Badge className={`text-[10px] border ${getRealisasiBadgeClass(pctBelanja)}`}>
                        {formatPersentase(pctBelanja)}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>

              {/* Per-SKPD Realisasi */}
              <div>
                <h3 className="text-xs font-bold text-foreground uppercase tracking-wide mb-3">
                  Realisasi Per SKPD/OPD
                </h3>
                <div className="space-y-2">
                  {[...data.realisasiSkpd]
                    .sort((a, b) => b.anggaran - a.anggaran)
                    .map((skpd) => (
                      <div
                        key={skpd.id}
                        className="flex items-center gap-3 p-2.5 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className="text-xs font-medium truncate mr-2">
                              {skpd.namaSkpd}
                            </p>
                            <Badge className={`text-[9px] px-1 py-0 h-4 border ${getRealisasiBadgeClass(skpd.persentase)}`}>
                              {formatPersentase(skpd.persentase)}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full ${getRealisasiBarClass(skpd.persentase)}`}
                                style={{
                                  width: `${Math.min(skpd.persentase, 100)}%`,
                                }}
                              />
                            </div>
                          </div>
                          <div className="flex items-center justify-between mt-1 text-[10px] text-muted-foreground">
                            <span>Anggaran: <RupiahCell value={skpd.anggaran} /></span>
                            <span>Realisasi: <RupiahCell value={skpd.realisasi} /></span>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </motion.div>
  );
}
