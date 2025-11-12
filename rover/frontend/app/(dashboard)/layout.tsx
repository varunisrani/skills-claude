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
      <main className="flex-1 overflow-y-auto bg-white dark:bg-black">
        {children}
      </main>
    </div>
  );
}
