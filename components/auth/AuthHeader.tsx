import Link from 'next/link';
import Image from 'next/image';

export default function AuthHeader() {
  return (
    <header className="bg-white border-b border-gray-200 shadow-sm">
      <div className="container mx-auto px-4 py-6">
        <Link href="/" className="flex items-center gap-2">
          <Image
            src="/images/logo2.png"
            alt="Drively Logo"
            width={160}
            height={50}
            className="h-12 w-auto"
            priority
          />
        </Link>
      </div>
    </header>
  );
}
