import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'OrthoClinic - Doctor Appointment System',
  description: 'Manage appointments and prescriptions efficiently.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
