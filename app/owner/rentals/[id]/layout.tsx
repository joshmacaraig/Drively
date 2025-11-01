import { ToastProvider } from '@/components/ui/ToastContainer';

export default function RentalDetailsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ToastProvider>{children}</ToastProvider>;
}
