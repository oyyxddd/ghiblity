import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import Script from 'next/script';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Ghiblity - Free Ghibli Filter & Avatar Generator | No Sign Up Required',
  description: 'Free Studio Ghibli filter and Spirited Away style avatar generator. No sign up required! Transform photos with AI-powered Ghibli filter. Try our free Ghibli photo filter - professional quality, instant generation, secure payment via Stripe.',
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
    'Spirited Away avatar',
    'Studio Ghibli art generator',
    'AI anime avatar',
    'Ghibli style photo',
    'anime art generator',
    'AI photo transformation',
    '千与千寻头像',
    '吉卜力风格',
    'AI art generator',
    'free ghibli style',
    'instant ghibli filter'
  ],
  authors: [{ name: 'Ghiblity Team' }],
  creator: 'Ghiblity',
  publisher: 'Ghiblity',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL('https://ghiblity.com'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'Ghiblity - Free Ghibli Filter & Avatar Generator | No Sign Up Required',
    description: 'Free Studio Ghibli filter and Spirited Away style avatar generator. No sign up required! Try our free Ghibli photo filter - professional quality, instant generation.',
    url: 'https://ghiblity.com',
    siteName: 'Ghiblity',
    images: [
      {
        url: '/images/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Ghiblity - Free Studio Ghibli Avatar Generator',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Ghiblity - Free Ghibli Filter | No Sign Up Required',
    description: 'Free Studio Ghibli filter and Spirited Away style avatar generator. No registration needed! Transform photos with AI-powered Ghibli filter in seconds.',
    images: ['/images/twitter-image.png'],
    creator: '@ghiblity',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: 'Jcho6T_mXiC4D3IWZvBCMujADdxftiHBMHz66SBDooc', // Google Search Console验证码
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>

        
        {/* Google Analytics */}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-4WZRL9DSPQ"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-4WZRL9DSPQ', {
              page_title: document.title,
              page_location: window.location.href,
            });
          `}
        </Script>

        {/* 结构化数据 */}
        <Script
          id="structured-data"
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebApplication",
              "name": "Ghiblity",
              "description": "Free Studio Ghibli filter and avatar generator. No sign up required! AI-powered photo transformation into Spirited Away style art",
              "url": "https://ghiblity.com",
              "applicationCategory": "MultimediaApplication",
              "operatingSystem": "Web",
              "offers": {
                "@type": "Offer",
                "price": "0.99",
                "priceCurrency": "USD",
                "description": "Transform one photo into Studio Ghibli style art"
              },
              "creator": {
                "@type": "Organization",
                "name": "Ghiblity",
                "email": "oyyxdd@gmail.com"
              },
              "featureList": [
                "Free Ghibli filter with no sign up required",
                "AI-powered photo transformation",
                "Studio Ghibli Spirited Away style",
                "Instant generation (80-120 seconds)",
                "High-resolution output",
                "No registration needed",
                "Secure payment processing"
              ]
            })
          }}
        />

        {/* Additional SEO tags */}
        <meta name="theme-color" content="#C4A484" />
        <meta name="msapplication-TileColor" content="#C4A484" />
        <link rel="canonical" href="https://ghiblity.com" />
      </head>
      <body className={inter.className}>
        {children}
        
        {/* Google Analytics Events */}
        <Script id="ga-events" strategy="afterInteractive">
          {`
            // 页面加载事件
            gtag('event', 'page_view', {
              page_title: document.title,
              page_location: window.location.href
            });

            // 添加自定义事件监听
            window.gtagEvent = function(action, category, label, value) {
              gtag('event', action, {
                event_category: category,
                event_label: label,
                value: value
              });
            };
          `}
        </Script>
      </body>
    </html>
  );
}
