import { ApplePwaSplash } from '@/app/apple-pwa-splash'
import { LocaleSwitcher } from '@/components/locale-switcher'
import { ProgressBar } from '@/components/progress-bar'
import { ThemeProvider } from '@/components/theme-provider'
import { ThemeToggle } from '@/components/theme-toggle'
import { Button } from '@/components/ui/button'
import { Toaster } from '@/components/ui/toaster'
import { env } from '@/lib/env'
import { TRPCProvider } from '@/trpc/client'
import type { Metadata, Viewport } from 'next'
import { NextIntlClientProvider, useTranslations } from 'next-intl'
import { getLocale, getMessages } from 'next-intl/server'
import Link from 'next/link'
import { Suspense } from 'react'
import './globals.css'

export const metadata: Metadata = {
  metadataBase: new URL(env.NEXT_PUBLIC_BASE_URL),
  title: {
    default: 'KHE Split · Share Expenses with Friends & Family',
    template: '%s · KHE Split',
  },
  description:
    'KHE Split is a sleek expense sharing app for friends and family. No ads, no account, no hassle.',
  openGraph: {
    title: 'KHE Split · Share Expenses with Friends & Family',
    description:
      'KHE Split is a sleek expense sharing app for friends and family. No ads, no account, no hassle.',
    images: `/banner.png`,
    type: 'website',
    url: '/',
  },
  twitter: {
    card: 'summary_large_image',
    creator: '@khesplit',
    site: '@khesplit',
    images: `/banner.png`,
    title: 'KHE Split · Share Expenses with Friends & Family',
    description:
      'KHE Split is a sleek expense sharing app for friends and family. No ads, no account, no hassle.',
  },
  appleWebApp: {
    capable: true,
    title: 'KHE Split',
  },
  applicationName: 'KHE Split',
  icons: [
    {
      url: '/android-chrome-192x192.png',
      sizes: '192x192',
      type: 'image/png',
    },
    {
      url: '/android-chrome-512x512.png',
      sizes: '512x512',
      type: 'image/png',
    },
  ],
}

export const viewport: Viewport = {
  themeColor: '#6d28d9',
}

function Content({ children }: { children: React.ReactNode }) {
  const t = useTranslations()
  return (
    <TRPCProvider>
      <header className="fixed top-0 left-0 right-0 h-16 flex justify-between bg-white dark:bg-gray-950 bg-opacity-50 dark:bg-opacity-50 p-2 border-b border-purple-100 dark:border-purple-900/30 backdrop-blur-sm z-50">
        <Link
          className="flex items-center gap-2 hover:scale-105 transition-transform"
          href="/"
        >
          <h1>
            <span className="font-extrabold text-xl tracking-tight text-violet-700 dark:text-violet-400">
              KHE Split
            </span>
          </h1>
        </Link>
        <div role="navigation" aria-label="Menu" className="flex">
          <ul className="flex items-center text-sm">
            <li>
              <Button
                variant="ghost"
                size="sm"
                asChild
                className="-my-3 text-primary"
              >
                <Link href="/groups">{t('Header.groups')}</Link>
              </Button>
            </li>
            <li>
              <LocaleSwitcher />
            </li>
            <li>
              <ThemeToggle />
            </li>
          </ul>
        </div>
      </header>

      <div className="pt-16 flex-1 flex flex-col">{children}</div>

      <footer className="sm:p-8 md:p-16 sm:mt-16 sm:text-sm md:text-base md:mt-32 bg-zinc-50 dark:bg-card border-t p-6 mt-8 flex flex-col sm:flex-row sm:justify-between gap-4 text-xs [&_a]:underline">
        <div className="flex flex-col space-y-2">
          <div className="sm:text-lg font-semibold text-base flex space-x-2 items-center">
            <Link className="flex items-center gap-2" href="/">
              <span className="font-extrabold text-xl tracking-tight text-violet-700 dark:text-violet-400">
                KHE Split
              </span>
            </Link>
          </div>
          <div className="flex flex-col space-y a--no-underline-text-white">
            <span>{t('Footer.madeIn')}</span>
            <span>
              {t.rich('Footer.builtBy', {
                author: (txt) => (
                  <a
                    href="https://github.com/khelias"
                    target="_blank"
                    rel="noopener"
                  >
                    {txt}
                  </a>
                ),
                source: (txt) => (
                  <a
                    href="https://github.com/khelias/spliit"
                    target="_blank"
                    rel="noopener"
                  >
                    {txt}
                  </a>
                ),
              })}
            </span>
          </div>
        </div>
      </footer>
      <Toaster />
    </TRPCProvider>
  )
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const locale = await getLocale()
  const messages = await getMessages()
  return (
    <html lang={locale} suppressHydrationWarning>
      <ApplePwaSplash icon="/logo-with-text.png" color="#6d28d9" />
      <body className="min-h-[100dvh] flex flex-col items-stretch bg-zinc-50 bg-opacity-30 dark:bg-background">
        <NextIntlClientProvider messages={messages}>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <Suspense>
              <ProgressBar />
            </Suspense>
            <Content>{children}</Content>
          </ThemeProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
