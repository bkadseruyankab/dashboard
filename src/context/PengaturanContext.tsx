"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";

export type SidebarVisibility = {
  hiddenItems: Record<string, string[]>; // role -> list of hidden sidebar item ids
};

export type CopilotConfig = {
  enabled: boolean;
  provider: string;       // "z-ai" | "openai" | "custom"
  model: string;          // model name
  systemPrompt: string;   // custom system prompt
  welcomeMessage: string; // welcome message in chat
  temperature: number;    // 0.0 - 2.0
  maxTokens: number;      // max response tokens
};

export const DEFAULT_COPILOT_CONFIG: CopilotConfig = {
  enabled: true,
  provider: "z-ai",
  model: "default",
  systemPrompt: "",
  welcomeMessage: "Saya siap membantu menganalisis data keuangan daerah. Coba tanyakan salah satu di bawah ini atau tulis pertanyaan Anda sendiri.",
  temperature: 0.7,
  maxTokens: 4096,
};

export type PengaturanData = {
  id: string;
  namaAplikasi: string;
  namaPemerintah: string;
  namaInstansi: string;
  warnaPrimary: string;
  warnaSecondary: string;
  warnaAccent: string;
  warnaDark: string;
  logoBase64: string | null;
  logoUrl: string | null;
  alamatInstansi: string | null;
  teleponInstansi: string | null;
  emailInstansi: string | null;
  websiteInstansi: string | null;
  sidebarConfig: SidebarVisibility | null;
  loaderDisplayTime: number;
  copilotConfig: CopilotConfig | null;
};

const DEFAULT_PENGATURAN: PengaturanData = {
  id: "",
  namaAplikasi: "Dashboard Keuangan",
  namaPemerintah: "Pemerintah Kabupaten Seruyan",
  namaInstansi: "BKAD Kab. Seruyan",
  warnaPrimary: "#1B5E20",
  warnaSecondary: "#2E7D32",
  warnaAccent: "#F9A825",
  warnaDark: "#0D3B12",
  logoBase64: null,
  logoUrl: null,
  alamatInstansi: null,
  teleponInstansi: null,
  emailInstansi: null,
  websiteInstansi: null,
  sidebarConfig: {
    hiddenItems: {
      public: ["ringkasan-eksekutif", "copilot"],
    },
  },
  loaderDisplayTime: 5000,
  copilotConfig: null,
};

type PengaturanContextType = {
  pengaturan: PengaturanData;
  loading: boolean;
  refetch: () => void;
  /** Returns the logo src: base64 if available, else /logo-seruyan.png */
  logoSrc: string;
};

const PengaturanContext = createContext<PengaturanContextType>({
  pengaturan: DEFAULT_PENGATURAN,
  loading: true,
  refetch: () => {},
  logoSrc: "/logo-seruyan.png",
});

export function usePengaturan() {
  return useContext(PengaturanContext);
}

export function PengaturanProvider({ children }: { children: ReactNode }) {
  const [pengaturan, setPengaturan] = useState<PengaturanData>(DEFAULT_PENGATURAN);
  const [loading, setLoading] = useState(true);

  const fetchSettings = useCallback(async () => {
    try {
      const res = await fetch("/api/pengaturan");
      if (!res.ok) throw new Error("Failed to fetch settings");
      const json = await res.json();
      if (json.data) {
        // Parse sidebarConfig from JSON string if present
        const raw = json.data;
        let parsedSidebarConfig: SidebarVisibility | null = null;
        if (raw.sidebarConfig && typeof raw.sidebarConfig === "string") {
          try {
            parsedSidebarConfig = JSON.parse(raw.sidebarConfig);
          } catch {
            parsedSidebarConfig = null;
          }
        } else if (raw.sidebarConfig && typeof raw.sidebarConfig === "object") {
          parsedSidebarConfig = raw.sidebarConfig;
        }
        // If no sidebarConfig from DB, use default (hides ringkasan-eksekutif & copilot for public)
        if (!parsedSidebarConfig) {
          parsedSidebarConfig = DEFAULT_PENGATURAN.sidebarConfig;
        }
        // Parse copilotConfig from JSON string if present
        let parsedCopilotConfig: CopilotConfig | null = null;
        if (raw.copilotConfig && typeof raw.copilotConfig === "string") {
          try {
            parsedCopilotConfig = { ...DEFAULT_COPILOT_CONFIG, ...JSON.parse(raw.copilotConfig) };
          } catch {
            parsedCopilotConfig = null;
          }
        } else if (raw.copilotConfig && typeof raw.copilotConfig === "object") {
          parsedCopilotConfig = { ...DEFAULT_COPILOT_CONFIG, ...raw.copilotConfig };
        }

        setPengaturan({
          ...raw,
          sidebarConfig: parsedSidebarConfig,
          loaderDisplayTime: raw.loaderDisplayTime ?? 5000,
          copilotConfig: parsedCopilotConfig,
        });
      }
    } catch {
      // Use defaults silently
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  // Apply CSS custom properties when settings change
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty("--gov-primary", pengaturan.warnaPrimary);
    root.style.setProperty("--gov-secondary", pengaturan.warnaSecondary);
    root.style.setProperty("--gov-accent", pengaturan.warnaAccent);
    root.style.setProperty("--gov-dark", pengaturan.warnaDark);

    // Also update the theme colors that are used by sidebar/header
    root.style.setProperty("--color-gov-green", pengaturan.warnaPrimary);
    root.style.setProperty("--color-gov-green-light", pengaturan.warnaSecondary);
    root.style.setProperty("--color-gov-green-dark", pengaturan.warnaDark);
    root.style.setProperty("--color-gov-gold", pengaturan.warnaAccent);
  }, [pengaturan]);

  const logoSrc = pengaturan.logoBase64 || "/logo-seruyan.png";

  return (
    <PengaturanContext.Provider
      value={{ pengaturan, loading, refetch: fetchSettings, logoSrc }}
    >
      {children}
    </PengaturanContext.Provider>
  );
}
