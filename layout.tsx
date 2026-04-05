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

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.speakerai.org';

export const metadata: Metadata = {
  title: 'SpeakerAI Protocol',
  description: 'Check your SpeakerAI allocation and explore the protocol.',
  metadataBase: new URL(siteUrl),
  openGraph: {
    title: 'SpeakerAI Protocol',
    description: 'Check your SpeakerAI allocation and explore the protocol.',
    url: '/',
    siteName: 'SpeakerAI Protocol',
    images: [
      {
        url: '/banner.png',
        width: 1200,
        height: 630,
        alt: 'SpeakerAI banner',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'SpeakerAI Protocol',
    description: 'Check your SpeakerAI allocation and explore the protocol.',
    images: ['/banner.png'],
  },
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
