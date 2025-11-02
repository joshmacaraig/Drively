import LoadingOverlay from '@/components/ui/LoadingOverlay';
import { renterQuotes } from '@/lib/loadingQuotes';

export default function RenterLoading() {
  return <LoadingOverlay quotes={renterQuotes} />;
}
