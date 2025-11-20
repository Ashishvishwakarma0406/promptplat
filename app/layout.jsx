import Navbar from '@/components/shared/Navbar'
import '../styles/globals.css'
import Footer from '@/components/shared/Footer'
import Providers from '@/components/shared/Provider'

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
      </head>
      <body>
        <main>
            <Navbar />
            {children}
            <Footer />
        </main>
      </body>
    </html>
  )
}



