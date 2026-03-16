import { Inter, Cormorant_Garamond, JetBrains_Mono } from 'next/font/google'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
})

const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-serif',
})

const mono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
})

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${inter.variable} ${cormorant.variable} ${mono.variable}`}>
      <head>
        <link rel="icon" href="https://raw.githubusercontent.com/gblinproject/GBLIN/main/LOGO_GBLIN.png?v=3" />
      </head>
      <body className="bg-[#050505] text-white antialiased selection:bg-amber-500/30">
        {children}
      </body>
    </html>
  )
}
