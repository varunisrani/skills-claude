import { ReactNode } from 'react';

export default function RepositoryLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <>
      {children}
    </>
  );
}