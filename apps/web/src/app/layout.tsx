import type { Metadata } from 'next';
import { Providers } from './providers';
// Import Windows 98 CSS globally
import '98.css';
import './globals.css';

export const metadata: Metadata = {
  title: 'FormBuilder 98',
  description: "Build forms like it's 1998",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
