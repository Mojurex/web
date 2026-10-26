import type { Metadata } from "next";
import { Golos_Text, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const golos = Golos_Text({ variable: "--font-golos", subsets: ["latin", "cyrillic"] });
const mono = JetBrains_Mono({ variable: "--font-mono-src", subsets: ["latin", "cyrillic"] });

export const metadata: Metadata = {
  title: "Программчлалын шалгалт",
  description: "Программчлалын хичээлийн хөндлөнгийн шалгалт",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="mn" className={`${golos.variable} ${mono.variable}`}>
      <body>{children}</body>
    </html>
  );
}
