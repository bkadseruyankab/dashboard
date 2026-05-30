"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Landmark, User, Phone, Mail, MapPin } from "lucide-react";
import { DashboardData } from "./types";
import { usePengaturan } from "@/context/PengaturanContext";

interface OpdViewProps {
  data: DashboardData;
}

export default function OpdView({ data }: OpdViewProps) {
  const { pengaturan } = usePengaturan();

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <Card
        className="border-l-4 overflow-hidden"
        style={{ borderLeftColor: pengaturan.warnaAccent }}
      >
        <CardHeader
          className="pb-3"
          style={{ backgroundColor: `${pengaturan.warnaPrimary}08` }}
        >
          <CardTitle className="flex items-center gap-3 text-lg">
            <div
              className="flex items-center justify-center w-10 h-10 rounded-lg"
              style={{ backgroundColor: `${pengaturan.warnaPrimary}15` }}
            >
              <Landmark className="w-5 h-5" style={{ color: pengaturan.warnaPrimary }} />
            </div>
            <div>
              <span>Daftar Organisasi Perangkat Daerah (OPD)</span>
              <p className="text-sm font-normal text-muted-foreground mt-0.5">
                Tahun Anggaran {data.tahun} — {data.opd.length} OPD terdaftar
              </p>
            </div>
          </CardTitle>
        </CardHeader>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-l-4" style={{ borderLeftColor: pengaturan.warnaPrimary }}>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-lg" style={{ backgroundColor: `${pengaturan.warnaPrimary}15` }}>
                <Landmark className="w-5 h-5" style={{ color: pengaturan.warnaPrimary }} />
              </div>
              <div>
                <p className="text-2xl font-bold">{data.opd.length}</p>
                <p className="text-xs text-muted-foreground">Total OPD</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4" style={{ borderLeftColor: pengaturan.warnaSecondary }}>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-lg" style={{ backgroundColor: `${pengaturan.warnaSecondary}15` }}>
                <User className="w-5 h-5" style={{ color: pengaturan.warnaSecondary }} />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {data.opd.filter((o) => o.kepalaOpd).length}
                </p>
                <p className="text-xs text-muted-foreground">Kepala OPD Terisi</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4" style={{ borderLeftColor: pengaturan.warnaAccent }}>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-lg" style={{ backgroundColor: `${pengaturan.warnaAccent}15` }}>
                <Mail className="w-5 h-5" style={{ color: pengaturan.warnaAccent }} />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {data.opd.filter((o) => o.email).length}
                </p>
                <p className="text-xs text-muted-foreground">Email Terisi</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* OPD Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow style={{ backgroundColor: `${pengaturan.warnaPrimary}08` }}>
                  <TableHead className="w-12 text-center">#</TableHead>
                  <TableHead className="w-28">Kode OPD</TableHead>
                  <TableHead>Nama OPD</TableHead>
                  <TableHead className="w-48">Kepala OPD</TableHead>
                  <TableHead className="w-44">Kontak</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.opd.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-12">
                      <div className="flex flex-col items-center gap-2 text-muted-foreground">
                        <Landmark className="w-10 h-10" />
                        <p className="text-sm font-medium">Belum ada data OPD</p>
                        <p className="text-xs">
                          Data OPD untuk tahun anggaran {data.tahun} belum tersedia
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  data.opd.map((opdItem, idx) => (
                    <TableRow key={opdItem.id} className="hover:bg-muted/30">
                      <TableCell className="text-center text-muted-foreground text-xs">
                        {idx + 1}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className="font-mono text-xs"
                          style={{
                            borderColor: pengaturan.warnaPrimary,
                            color: pengaturan.warnaPrimary,
                          }}
                        >
                          {opdItem.kodeOpd}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium text-sm">{opdItem.namaOpd}</p>
                          {opdItem.alamat && (
                            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                              <MapPin className="w-3 h-3" />
                              {opdItem.alamat}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {opdItem.kepalaOpd ? (
                          <span className="text-sm flex items-center gap-1.5">
                            <User className="w-3.5 h-3.5 text-muted-foreground" />
                            {opdItem.kepalaOpd}
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {opdItem.telepon && (
                            <p className="text-xs flex items-center gap-1.5">
                              <Phone className="w-3 h-3 text-muted-foreground" />
                              {opdItem.telepon}
                            </p>
                          )}
                          {opdItem.email && (
                            <p className="text-xs flex items-center gap-1.5">
                              <Mail className="w-3 h-3 text-muted-foreground" />
                              {opdItem.email}
                            </p>
                          )}
                          {!opdItem.telepon && !opdItem.email && (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
