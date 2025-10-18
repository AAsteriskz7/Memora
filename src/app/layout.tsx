import type { Metadata } from "next";
import { Instrument_Sans, Instrument_Serif } from "next/font/google";
import "./globals.css";

const instrumentSans = Instrument_Sans({
  subsets: ["latin"],
  weight: "400",
});

const instrumentSerif = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
});

export const metadata: Metadata = {
  title: "Memora - Your Digital Memory Palace",
  description: "Capture your thoughts, reflect on your journey, and have conversations with your past self. AI-powered journaling for personal growth.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body 
        className={`${instrumentSans.className} ${instrumentSerif.className}`}
        suppressHydrationWarning={true}
      >
        {children}
      </body>
    </html>
  );
}
