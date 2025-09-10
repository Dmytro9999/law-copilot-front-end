import type React from 'react'
import type { Metadata } from 'next'
import { Heebo } from 'next/font/google'
import './globals.css'
import { ReduxProvider } from '@/providers/ReduxProvider'
import { Toaster } from '@/components/ui/toaster'
import AuthInit from '@/components/auth/AuthInit'

const heebo = Heebo({
    subsets: ['hebrew', 'latin'],
    weight: ['300','400','500','600','700','800','900'],
})

export const metadata: Metadata = {
    title: 'LAWCOPILOT AI - מערכת ניהול חוזים חכמה',
    description: 'מערכת AI מתקדמת לניהול חוזים והתחייבויות לעורכי דין - מופעלת על ידי Google Gemini',
    generator: 'v0.app',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="he" dir="rtl">
        <body className={heebo.className}>
        <ReduxProvider>
            <AuthInit/>
            {children}
            <Toaster />
        </ReduxProvider>
        </body>
        </html>
    )
}
