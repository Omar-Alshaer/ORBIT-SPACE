import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import { AuthProvider } from "@/components/auth/AuthProvider";
import { SpaceBackdrop } from "@/components/effects/SpaceBackdrop";
import { ThemeController } from "@/components/theme/ThemeController";

export const metadata: Metadata = {
  title: "ORBIT",
  description: "Stay in your orbit. Keep progressing.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeController />
        <SpaceBackdrop />
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
