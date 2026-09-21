import type { Metadata } from "next";
import "./globals.css";
import { AppShell } from "@/components/layout/app-shell";
import { PwaRegister } from "@/components/pwa-register";
import { LocaleProvider } from "@/providers/locale-provider";
import { SessionProvider } from "@/providers/session-provider";

export const metadata: Metadata = {
  title: "Hafi | Trusted services near you",
  description: "Search verified hospitals, pharmacies, restaurants and local services across Rwanda.",
  applicationName: "Hafi",
  manifest: "/manifest.webmanifest",
  icons: { icon: "/icon.svg", apple: "/icon.svg" },
  appleWebApp: { capable: true, statusBarStyle: "default", title: "Hafi" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body className="flex min-h-screen flex-col"><LocaleProvider><SessionProvider><PwaRegister /><AppShell>{children}</AppShell></SessionProvider></LocaleProvider></body></html>;
}
