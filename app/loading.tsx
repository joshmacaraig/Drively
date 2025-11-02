import LoadingOverlay from '@/components/ui/LoadingOverlay';
import { generalQuotes } from '@/lib/loadingQuotes';

export default function RootLoading() {
  return <LoadingOverlay quotes={generalQuotes} />;
}
