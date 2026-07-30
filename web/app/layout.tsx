import type { Metadata, Viewport } from "next";
import Script from "next/script";
import "./globals.css";

export const metadata: Metadata = {
  title: "MAXos",
  description: "Private owner interface for MAXos",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "MAXos",
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: [
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180" }],
  },
  referrer: "no-referrer",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#5B7FA6",
  colorScheme: "light",
};

const directRelayShim = `
(() => {
  const nativeFetch = window.fetch.bind(window);
  const relay = "https://btqdrvvitjzwntudtyqr.supabase.co/functions/v1/app";

  window.fetch = (input, init) => {
    try {
      const raw = typeof input === "string"
        ? input
        : input instanceof URL
          ? input.toString()
          : input.url;
      const url = new URL(raw, window.location.origin);
      if (url.origin === window.location.origin && (url.pathname === "/api/maxos/api" || url.pathname === "/api/maxos/chat")) {
        const target = url.pathname.endsWith("/chat") ? "chat" : "api";
        return nativeFetch(relay + "?target=" + target, init);
      }
    } catch {
      // Fall through to the platform fetch unchanged.
    }
    return nativeFetch(input, init);
  };
})();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <Script
          id="maxos-direct-supabase-relay"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{ __html: directRelayShim }}
        />
        {children}
      </body>
    </html>
  );
}
