"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  TrendingUp,
  TrendingDown,
  DollarSign,
  PieChart,
  FileText,
  Building2,
  Eye,
  ChevronDown,
  ChevronRight,
  Menu,
  X,
} from "lucide-react";
import { ActiveView } from "./types";

type SidebarProps = {
  activeView: ActiveView;
  onViewChange: (view: ActiveView) => void;
  isOpen: boolean;
  onToggle: () => void;
};

const menuItems = [
  {
    id: "dashboard" as ActiveView,
    label: "Dashboard",
    icon: LayoutDashboard,
  },
  {
    id: "anggaran" as string,
    label: "Anggaran",
    icon: TrendingUp,
    children: [
      { id: "apbd" as ActiveView, label: "APBD" },
      { id: "pendapatan" as ActiveView, label: "Pendapatan" },
      { id: "belanja" as ActiveView, label: "Belanja" },
      { id: "pembiayaan" as ActiveView, label: "Pembiayaan" },
    ],
  },
  {
    id: "realisasi" as string,
    label: "Realisasi",
    icon: FileText,
    children: [
      { id: "realisasi-akun" as ActiveView, label: "Realisasi Per-Akun" },
      { id: "realisasi-skpd" as ActiveView, label: "Realisasi Per-SKPD" },
    ],
  },
  {
    id: "transparansi" as ActiveView,
    label: "Transparansi",
    icon: Eye,
  },
];

export default function Sidebar({
  activeView,
  onViewChange,
  isOpen,
  onToggle,
}: SidebarProps) {
  const [expandedMenus, setExpandedMenus] = useState<string[]>([
    "anggaran",
    "realisasi",
  ]);

  const toggleMenu = (menuId: string) => {
    setExpandedMenus((prev) =>
      prev.includes(menuId)
        ? prev.filter((id) => id !== menuId)
        : [...prev, menuId]
    );
  };

  const handleViewChange = (view: ActiveView) => {
    onViewChange(view);
    // Close sidebar on mobile after selection
    if (window.innerWidth < 1024) {
      onToggle();
    }
  };

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onToggle}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed top-0 left-0 z-50 h-full w-64 bg-[#1B5E20] text-white transition-transform duration-300 ease-in-out flex flex-col shadow-xl",
          isOpen ? "translate-x-0" : "-translate-x-full",
          "lg:translate-x-0 lg:static lg:z-auto"
        )}
      >
        {/* Brand */}
        <div className="flex items-center gap-3 px-4 py-4 border-b border-white/10">
          <img
            src="/logo-seruyan.png"
            alt="Logo Kabupaten Seruyan"
            className="w-10 h-10 rounded-full object-cover bg-white p-0.5"
          />
          <div className="flex-1 min-w-0">
            <h1 className="text-sm font-bold tracking-wider uppercase truncate">
              Dashboard
            </h1>
            <p className="text-[10px] text-emerald-200 truncate">
              Kab. Seruyan
            </p>
          </div>
          <button
            onClick={onToggle}
            className="lg:hidden text-white/70 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto custom-scrollbar py-3">
          <ul className="space-y-0.5 px-2">
            {menuItems.map((item) => {
              if ("children" in item && item.children) {
                const isExpanded = expandedMenus.includes(item.id);
                const isChildActive = item.children.some(
                  (child) => child.id === activeView
                );

                return (
                  <li key={item.id}>
                    <button
                      onClick={() => toggleMenu(item.id)}
                      className={cn(
                        "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-200",
                        isChildActive
                          ? "bg-white/15 text-[#F9A825]"
                          : "text-emerald-100 hover:bg-white/10 hover:text-white"
                      )}
                    >
                      <item.icon className="w-4.5 h-4.5 shrink-0" />
                      <span className="flex-1 text-left font-medium">
                        {item.label}
                      </span>
                      {isExpanded ? (
                        <ChevronDown className="w-4 h-4" />
                      ) : (
                        <ChevronRight className="w-4 h-4" />
                      )}
                    </button>

                    <div
                      className={cn(
                        "overflow-hidden transition-all duration-300",
                        isExpanded ? "max-h-60 opacity-100" : "max-h-0 opacity-0"
                      )}
                    >
                      <ul className="pl-5 py-1 space-y-0.5">
                        {item.children.map((child) => (
                          <li key={child.id}>
                            <button
                              onClick={() =>
                                handleViewChange(child.id as ActiveView)
                              }
                              className={cn(
                                "w-full flex items-center gap-2 px-3 py-2 rounded-md text-xs transition-all duration-200",
                                activeView === child.id
                                  ? "bg-[#F9A825]/20 text-[#F9A825] font-semibold"
                                  : "text-emerald-200 hover:bg-white/8 hover:text-white"
                              )}
                            >
                              <span className="w-1.5 h-1.5 rounded-full bg-current shrink-0" />
                              {child.label}
                            </button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </li>
                );
              }

              return (
                <li key={item.id}>
                  <button
                    onClick={() => handleViewChange(item.id as ActiveView)}
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-200",
                      activeView === item.id
                        ? "bg-[#F9A825]/20 text-[#F9A825] font-semibold"
                        : "text-emerald-100 hover:bg-white/10 hover:text-white"
                    )}
                  >
                    <item.icon className="w-4.5 h-4.5 shrink-0" />
                    <span className="font-medium">{item.label}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-white/10">
          <p className="text-[10px] text-emerald-300/60 text-center">
            BPKPD Kab. Seruyan
          </p>
          <p className="text-[9px] text-emerald-300/40 text-center">
            © 2024 All Rights Reserved
          </p>
        </div>
      </aside>
    </>
  );
}
