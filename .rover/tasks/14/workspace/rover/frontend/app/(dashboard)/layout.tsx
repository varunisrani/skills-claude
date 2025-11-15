/**
 * Dashboard layout with sidebar navigation
 */

import { Sidebar } from '@/components/layout/Sidebar';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <main
        id="main-content"
        className="flex-1 overflow-y-auto bg-white dark:bg-black"
        tabIndex={-1}
      >
        {children}
      </main>
    </div>
  );
}
