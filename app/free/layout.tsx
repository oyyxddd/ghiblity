import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Free Ghibli Filter - No Sign Up Required | Spirited Away Photo Filter',
  description: 'Use our free Ghibli filter with no sign up required! Transform photos into Studio Ghibli Spirited Away style art instantly. Free anime filter, no registration needed.',
  keywords: [
    'free ghibli filter',
    'ghibli filter no sign up',
    'free spirited away filter',
    'studio ghibli filter free',
    'no registration ghibli generator',
    'free anime filter',
    'ghibli photo filter',
    'spirited away filter free',
    'free ai ghibli transform',
    'no sign up avatar generator',
    'instant ghibli filter',
    'free ghibli style photo'
  ],
  openGraph: {
    title: 'Free Ghibli Filter - No Sign Up Required',
    description: 'Use our free Ghibli filter with no sign up required! Transform photos into Studio Ghibli Spirited Away style art instantly.',
    url: 'https://ghiblity.com/free',
    siteName: 'Ghiblity',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Free Ghibli Filter - No Sign Up Required',
    description: 'Use our free Ghibli filter with no sign up required! Transform photos into Studio Ghibli style art instantly.',
  },
  alternates: {
    canonical: 'https://ghiblity.com/free',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function FreeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
} 