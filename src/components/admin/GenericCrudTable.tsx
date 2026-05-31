"use client";

import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Pencil,
  Trash2,
  Search,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Inbox,
  Plus,
} from "lucide-react";
import { formatRupiahFull, formatPersentase, getRealisasiBadgeClass } from "@/components/dashboard/types";
import { usePengaturan } from "@/context/PengaturanContext";

export type ColumnDef = {
  key: string;
  label: string;
  type?: "text" | "currency" | "percentage" | "badge-percentage" | "switch";
  width?: string;
};

interface GenericCrudTableProps {
  columns: ColumnDef[];
  data: Record<string, unknown>[];
  onEdit: (row: Record<string, unknown>) => void;
  onDelete: (row: Record<string, unknown>) => void;
  onRefresh: () => void;
  onCreate?: () => void;
  loading: boolean;
  searchPlaceholder?: string;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  onPageChange?: (page: number) => void;
  itemName?: string;
  customActions?: React.ReactNode;
}

export default function GenericCrudTable({
  columns,
  data,
  onEdit,
  onDelete,
  onRefresh,
  onCreate,
  loading,
  searchPlaceholder = "Cari data...",
  searchValue = "",
  onSearchChange,
  pagination,
  onPageChange,
  itemName = "data",
  customActions,
}: GenericCrudTableProps) {
  const { pengaturan } = usePengaturan();
  const [localSearch, setLocalSearch] = useState(searchValue);

  const handleSearch = (val: string) => {
    setLocalSearch(val);
    onSearchChange?.(val);
  };

  const renderCell = (col: ColumnDef, row: Record<string, unknown>) => {
    const value = row[col.key];

    switch (col.type) {
      case "currency":
        return (
          <span className="font-mono text-sm">
            {formatRupiahFull(Number(value ?? 0))}
          </span>
        );
      case "percentage":
        return (
          <span className="font-mono text-sm">
            {formatPersentase(Number(value ?? 0))}
          </span>
        );
      case "badge-percentage": {
        const pct = Number(value ?? 0);
        return (
          <Badge
            variant="outline"
            className={`text-xs font-mono ${getRealisasiBadgeClass(pct)}`}
          >
            {formatPersentase(pct)}
          </Badge>
        );
      }
      case "switch":
        return (
          <Badge
            variant={value ? "default" : "secondary"}
            className={
              value
                ? "bg-emerald-100 text-emerald-800 border-emerald-200"
                : "bg-gray-100 text-gray-600 border-gray-200"
            }
          >
            {value ? "Aktif" : "Tidak Aktif"}
          </Badge>
        );
      default:
        // Special rendering for autoSync column
        if (col.key === "autoSync") {
          const isAuto = value === "Auto" || value === true;
          return (
            <Badge
              variant="outline"
              className={
                isAuto
                  ? "bg-blue-100 text-blue-800 border-blue-200 text-[10px]"
                  : "bg-gray-100 text-gray-600 border-gray-200 text-[10px]"
              }
            >
              {isAuto ? "Auto" : "Manual"}
            </Badge>
          );
        }
        return <span>{String(value ?? "-")}</span>;
    }
  };

  if (loading && data.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <Skeleton className="h-9 flex-1 max-w-sm" />
          <Skeleton className="h-9 w-24" />
        </div>
        <div className="rounded-lg border">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 p-4 border-b last:border-0">
              <Skeleton className="h-4 flex-1" />
              <Skeleton className="h-4 w-20" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        {onSearchChange && (
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder={searchPlaceholder}
              value={localSearch}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        )}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onRefresh}
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            <span className="hidden sm:inline">Refresh</span>
          </Button>
          {customActions}
          {onCreate && (
            <Button
              size="sm"
              onClick={onCreate}
              className="text-white hover:opacity-90"
              style={{ backgroundColor: pengaturan.warnaPrimary }}
            >
              <Plus className="w-4 h-4" />
              Tambah {itemName}
            </Button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="rounded-lg border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="w-10 text-center">#</TableHead>
              {columns.map((col) => (
                <TableHead key={col.key} style={col.width ? { width: col.width } : undefined}>
                  {col.label}
                </TableHead>
              ))}
              <TableHead className="text-center w-28">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length + 2}
                  className="text-center py-12"
                >
                  <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <Inbox className="w-10 h-10" />
                    <p className="text-sm font-medium">Tidak ada data</p>
                    <p className="text-xs">
                      Belum ada {itemName} yang tersedia
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              data.map((row, idx) => (
                <TableRow key={String(row.id ?? idx)}>
                  <TableCell className="text-center text-muted-foreground text-xs">
                    {pagination
                      ? (pagination.page - 1) * pagination.limit + idx + 1
                      : idx + 1}
                  </TableCell>
                  {columns.map((col) => (
                    <TableCell key={col.key}>{renderCell(col, row)}</TableCell>
                  ))}
                  <TableCell className="text-center">
                    <div className="flex items-center justify-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                        onClick={() => onEdit(row)}
                        title="Edit"
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-red-600 hover:text-red-800 hover:bg-red-50"
                        onClick={() => onDelete(row)}
                        title="Hapus"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Menampilkan {(pagination.page - 1) * pagination.limit + 1}–
            {Math.min(pagination.page * pagination.limit, pagination.total)} dari{" "}
            {pagination.total} data
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={pagination.page <= 1 || loading}
              onClick={() => onPageChange?.(pagination.page - 1)}
            >
              <ChevronLeft className="w-4 h-4" />
              Sebelumnya
            </Button>
            <span className="text-sm text-muted-foreground px-2">
              {pagination.page} / {pagination.totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={pagination.page >= pagination.totalPages || loading}
              onClick={() => onPageChange?.(pagination.page + 1)}
            >
              Selanjutnya
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
