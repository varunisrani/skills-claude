import type { Metadata } from "next";
import "./globals.css";
import { QueryProvider } from "@/lib/providers/query-provider";
import { ThemeProvider } from "@/lib/theme/theme-provider";
import { Toaster } from "@/components/ui/toaster";
import { SkipToContent } from "@/lib/a11y/SkipToContent";
import { AppShortcutsProvider } from "@/lib/shortcuts/AppShortcutsProvider";

export const metadata: Metadata = {
  title: "Rover - AI-Powered Development Tasks",
  description: "Manage and execute AI-powered development tasks with Rover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased">
        <ThemeProvider defaultTheme="system" storageKey="rover-ui-theme">
          <SkipToContent targetId="main-content" />
          <QueryProvider>
            <AppShortcutsProvider>
              {children}
            </AppShortcutsProvider>
          </QueryProvider>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
