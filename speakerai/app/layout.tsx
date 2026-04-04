import type {Metadata} from 'next';
import { Inter, Space_Grotesk } from 'next/font/google';
import { Web3Providers } from '@/components/Web3Providers';
import './globals.css'; // Global styles

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
});

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-display',
});

export const metadata: Metadata = {
  title: 'SpeakerAI Protocol',
  description: 'Speaker AI Official Website',
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en" className={`${inter.variable} ${spaceGrotesk.variable}`}>
      <body suppressHydrationWarning className="bg-[#0a0a0a] text-white antialiased">
        <Web3Providers>{children}</Web3Providers>
      </body>
    </html>
  );
}
