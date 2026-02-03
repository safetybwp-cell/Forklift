import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'ระบบขอใช้รถ Forklift',
    description: 'ระบบอนุมัติการใช้รถ Forklift แบบ 2 ขั้นตอน',
}

export default function RootLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <html lang="th">
            <body>{children}</body>
        </html>
    )
}
