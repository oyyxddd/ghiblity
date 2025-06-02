import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import Script from 'next/script';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Ghiblity - AI Transform Photos into Spirited Away Style Art | Studio Ghibli Avatar Generator',
  description: 'Transform your photos into magical Studio Ghibli Spirited Away style avatars with AI. Professional quality, instant generation, secure payment via Stripe. Create your anime avatar in 30-60 seconds!',
  keywords: [
    'Spirited Away avatar',
    'Studio Ghibli art generator',
    'AI anime avatar',
    'Ghibli style photo',
    'anime art generator',
    'AI photo transformation',
    '千与千寻头像',
    '吉卜力风格',
    'AI art generator'
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
    title: 'Ghiblity - Transform Photos into Spirited Away Style Art',
    description: 'AI-powered Studio Ghibli avatar generator. Transform your photos into magical Spirited Away style art in seconds!',
    url: 'https://ghiblity.com',
    siteName: 'Ghiblity',
    images: [
      {
        url: '/images/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Ghiblity - Studio Ghibli Avatar Generator',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Ghiblity - AI Spirited Away Avatar Generator',
    description: 'Transform your photos into magical Studio Ghibli style art with AI. Professional quality in 30-60 seconds!',
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
              "description": "AI-powered Studio Ghibli avatar generator that transforms photos into Spirited Away style art",
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
                "AI-powered photo transformation",
                "Studio Ghibli Spirited Away style",
                "Instant generation (30-60 seconds)",
                "High-resolution output",
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
