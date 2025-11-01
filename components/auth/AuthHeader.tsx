import Link from 'next/link';
import Image from 'next/image';

export default function AuthHeader() {
  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
      <div className="container mx-auto px-4 py-3">
        <Link href="/" className="flex items-center gap-2">
          <Image
            src="/images/logo2.png"
            alt="Drively Logo"
            width={120}
            height={40}
            className="h-8 w-auto"
            priority
          />
        </Link>
      </div>
    </header>
  );
}
