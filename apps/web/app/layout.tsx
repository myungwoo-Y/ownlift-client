import type { Metadata, Viewport } from "next";
import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import "./globals.css";

const navigationLinks = [
  { href: "/support", label: "Support" },
  { href: "/privacy", label: "Privacy" },
] as const;

export const metadata: Metadata = {
  metadataBase: new URL("https://ownlift.app"),
  title: {
    default: "OwnLift",
    template: "%s | OwnLift",
  },
  description:
    "OwnLift is an offline-first 5/3/1 strength training program runner.",
  applicationName: "OwnLift",
  icons: {
    icon: "/assets/ownlift-icon.png",
    apple: "/assets/ownlift-icon.png",
  },
  openGraph: {
    title: "OwnLift",
    description:
      "An offline-first 5/3/1 strength training program runner.",
    siteName: "OwnLift",
    type: "website",
  },
};

export const viewport: Viewport = {
  colorScheme: "dark",
  themeColor: "#101010",
  width: "device-width",
  initialScale: 1,
};

type RootLayoutProps = Readonly<{
  children: ReactNode;
}>;

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en">
      <body>
        <header className="siteHeader">
          <Link className="brandLink" href="/" aria-label="OwnLift home">
            <Image
              src="/assets/ownlift-icon.png"
              alt=""
              width={36}
              height={36}
              priority
              className="brandMark"
            />
            <span>OwnLift</span>
          </Link>
          <nav className="siteNav" aria-label="Primary navigation">
            {navigationLinks.map((link) => (
              <Link key={link.href} href={link.href}>
                {link.label}
              </Link>
            ))}
          </nav>
        </header>
        {children}
        <footer className="siteFooter">
          <p>OwnLift stores training data on device and requires no account.</p>
          <nav aria-label="Footer navigation">
            <Link href="/support">Support</Link>
            <Link href="/privacy">Privacy</Link>
          </nav>
        </footer>
      </body>
    </html>
  );
}
