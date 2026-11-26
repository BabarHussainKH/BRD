import type { Metadata } from "next";
import { IBM_Plex_Sans } from "next/font/google";
import { ToastProvider } from "@/components/toast";
import "./globals.css";

const sans = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "Security Management System | Branch Banking Operations",
  description: "UBL-aligned Security Information Management System for guards, attendance, deployment, inspections and CCTV/BAS",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${sans.variable} font-sans antialiased`}>
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
