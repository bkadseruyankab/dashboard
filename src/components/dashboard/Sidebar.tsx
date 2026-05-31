"use client";

import { useState, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  TrendingUp,
  FileText,
  Eye,
  Shield,
  Landmark,
  ChevronDown,
  ChevronRight,
  X,
} from "lucide-react";
import { ActiveView } from "./types";
import { usePengaturan } from "@/context/PengaturanContext";

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
    id: "opd" as ActiveView,
    label: "OPD",
    icon: Landmark,
  },
  {
    id: "transparansi" as ActiveView,
    label: "Transparansi",
    icon: Eye,
  },
  {
    id: "admin" as ActiveView,
    label: "Admin",
    icon: Shield,
  },
];

export default function Sidebar({
  activeView,
  onViewChange,
  isOpen,
  onToggle,
}: SidebarProps) {
  const { pengaturan, logoSrc } = usePengaturan();
  const [expandedMenus, setExpandedMenus] = useState<string[]>([
    "anggaran",
    "realisasi",
  ]);

  // Desktop hover state
  const [isHovered, setIsHovered] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const checkDesktop = () => setIsDesktop(window.innerWidth >= 1024);
    checkDesktop();
    window.addEventListener("resize", checkDesktop);
    return () => window.removeEventListener("resize", checkDesktop);
  }, []);

  // Desktop: collapsed = icons only, expanded = full sidebar
  // Mobile: toggle-based
  const isExpanded = isDesktop ? isHovered : isOpen;

  const handleMouseEnter = useCallback(() => {
    if (isDesktop) setIsHovered(true);
  }, [isDesktop]);

  const handleMouseLeave = useCallback(() => {
    if (isDesktop) setIsHovered(false);
  }, [isDesktop]);

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
    if (!isDesktop) {
      onToggle();
    }
  };

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && !isDesktop && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onToggle}
        />
      )}

      {/* Desktop backdrop overlay when sidebar is expanded */}
      {isDesktop && isHovered && (
        <div
          className="fixed inset-0 bg-black/15 z-40 transition-opacity duration-300"
          onMouseEnter={handleMouseLeave}
        />
      )}

      {/* Sidebar */}
      <aside
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        style={{ backgroundColor: pengaturan.warnaPrimary }}
        className={cn(
          "fixed top-0 left-0 z-50 h-full text-white flex flex-col shadow-2xl",
          "transition-all duration-300 ease-in-out",
          // Desktop: collapsed (w-[60px]) or expanded (w-64)
          isDesktop
            ? isHovered
              ? "w-64"
              : "w-[60px]"
            : // Mobile: toggle-based
              isOpen
              ? "w-64 translate-x-0"
              : "w-64 -translate-x-full"
        )}
      >
        {/* Brand */}
        <div
          className={cn(
            "flex items-center border-b border-white/10 shrink-0 transition-all duration-300",
            isDesktop
              ? isHovered
                ? "gap-3 px-4 py-4"
                : "justify-center px-0 py-4"
              : "gap-3 px-4 py-4"
          )}
        >
          <img
            src={logoSrc}
            alt="Logo Kabupaten Seruyan"
            className="w-10 h-10 object-contain bg-white p-0.5 shrink-0"
          />
          {/* Text - visible when expanded */}
          <div
            className={cn(
              "flex-1 min-w-0 overflow-hidden transition-all duration-300",
              isDesktop && !isHovered ? "w-0 opacity-0" : "w-auto opacity-100"
            )}
          >
            <h1 className="text-sm font-bold tracking-wider uppercase truncate">
              Dashboard
            </h1>
            <p className="text-[10px] text-emerald-200 truncate">
              Kab. Seruyan
            </p>
          </div>
          {/* Mobile close button */}
          {!isDesktop && (
            <button
              onClick={onToggle}
              className="text-white/70 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto custom-scrollbar py-3">
          <ul className="space-y-0.5 px-2">
            {menuItems.map((item) => {
              if ("children" in item && item.children) {
                const isExpandedMenu = expandedMenus.includes(item.id);
                const isChildActive = item.children.some(
                  (child) => child.id === activeView
                );

                return (
                  <li key={item.id}>
                    <button
                      onClick={() => {
                        if (isDesktop && !isHovered) {
                          setIsHovered(true);
                        }
                        toggleMenu(item.id);
                      }}
                      className={cn(
                        "w-full flex items-center rounded-lg text-sm transition-all duration-200",
                        isDesktop
                          ? isHovered
                            ? "gap-3 px-3 py-2.5"
                            : "justify-center px-0 py-2.5"
                          : "gap-3 px-3 py-2.5",
                        isChildActive
                          ? "bg-white/15"
                          : "text-emerald-100 hover:bg-white/10 hover:text-white"
                      )}
                      style={isChildActive ? { color: pengaturan.warnaAccent } : undefined}
                      title={!isDesktop || isHovered ? undefined : item.label}
                    >
                      <item.icon className="w-5 h-5 shrink-0" />
                      {/* Label - visible when expanded */}
                      <span
                        className={cn(
                          "flex-1 text-left font-medium overflow-hidden transition-all duration-300",
                          isDesktop && !isHovered
                            ? "w-0 opacity-0"
                            : "w-auto opacity-100"
                        )}
                      >
                        {item.label}
                      </span>
                      {/* Chevron - visible when expanded */}
                      <span
                        className={cn(
                          "shrink-0 overflow-hidden transition-all duration-300",
                          isDesktop && !isHovered
                            ? "w-0 opacity-0"
                            : "w-auto opacity-100"
                        )}
                      >
                        {isExpandedMenu ? (
                          <ChevronDown className="w-4 h-4" />
                        ) : (
                          <ChevronRight className="w-4 h-4" />
                        )}
                      </span>
                    </button>

                    {/* Children - only visible when expanded */}
                    <div
                      className={cn(
                        "overflow-hidden transition-all duration-300",
                        isDesktop && !isHovered
                          ? "max-h-0 opacity-0"
                          : isExpandedMenu
                            ? "max-h-60 opacity-100"
                            : "max-h-0 opacity-0"
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
                                  ? "font-semibold"
                                  : "text-emerald-200 hover:bg-white/10 hover:text-white"
                              )}
                              style={activeView === child.id ? { backgroundColor: `${pengaturan.warnaAccent}33`, color: pengaturan.warnaAccent } : undefined}
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

              // Simple menu item (no children)
              const isActive = activeView === item.id;
              return (
                <li key={item.id}>
                  <button
                    onClick={() => handleViewChange(item.id as ActiveView)}
                    className={cn(
                      "w-full flex items-center rounded-lg text-sm transition-all duration-200",
                      isDesktop
                        ? isHovered
                          ? "gap-3 px-3 py-2.5"
                          : "justify-center px-0 py-2.5"
                        : "gap-3 px-3 py-2.5",
                      isActive
                        ? "font-semibold"
                        : "text-emerald-100 hover:bg-white/10 hover:text-white"
                    )}
                    style={isActive ? { backgroundColor: `${pengaturan.warnaAccent}33`, color: pengaturan.warnaAccent } : undefined}
                    title={!isDesktop || isHovered ? undefined : item.label}
                  >
                    <item.icon className="w-5 h-5 shrink-0" />
                    {/* Label - visible when expanded */}
                    <span
                      className={cn(
                        "font-medium overflow-hidden transition-all duration-300",
                        isDesktop && !isHovered
                          ? "w-0 opacity-0"
                          : "w-auto opacity-100"
                      )}
                    >
                      {item.label}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Footer */}
        <div
          className={cn(
            "border-t border-white/10 shrink-0 transition-all duration-300 overflow-hidden",
            isDesktop
              ? isHovered
                ? "px-4 py-3"
                : "px-0 py-3"
              : "px-4 py-3"
          )}
        >
          <p
            className={cn(
              "text-[10px] text-emerald-300/60 text-center transition-all duration-300",
              isDesktop && !isHovered ? "opacity-0 h-0" : "opacity-100 h-auto"
            )}
          >
            {pengaturan.namaInstansi}
          </p>
          <p
            className={cn(
              "text-[9px] text-emerald-300/40 text-center transition-all duration-300",
              isDesktop && !isHovered ? "opacity-0 h-0" : "opacity-100 h-auto"
            )}
          >
            © 2024 All Rights Reserved
          </p>
        </div>
      </aside>
    </>
  );
}
