import Navbar from '@/components/layout/Navbar';

export default function RepositoriesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  console.log('RepositoriesLayout - Rendering layout with children:', children);
  return (
    <>
      <Navbar />
      <main>{children}</main>
    </>
  );
}
