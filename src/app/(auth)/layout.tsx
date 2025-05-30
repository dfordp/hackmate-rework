import { AuthNavbar } from '@/components/ui/auth-navbar';
import { type Metadata } from 'next'

export const metadata: Metadata = {
  title: "Auth",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
      <html lang="en">
        <body>
            <AuthNavbar/>
          <main className="pt-16"> 
        {children}
      </main>
        </body>
      </html>
  )
}
