import LoadingOverlay from '@/components/ui/LoadingOverlay';
import { ownerQuotes } from '@/lib/loadingQuotes';

export default function OwnerLoading() {
  return <LoadingOverlay quotes={ownerQuotes} />;
}
