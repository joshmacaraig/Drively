import LoadingOverlay from '@/components/ui/LoadingOverlay';
import { adminQuotes } from '@/lib/loadingQuotes';

export default function AdminLoading() {
  return <LoadingOverlay quotes={adminQuotes} />;
}
