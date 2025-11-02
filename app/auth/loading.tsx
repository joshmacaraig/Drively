import LoadingOverlay from '@/components/ui/LoadingOverlay';
import { generalQuotes } from '@/lib/loadingQuotes';

export default function AuthLoading() {
  return <LoadingOverlay quotes={generalQuotes} />;
}
