import type { Metadata } from "next";
import { DM_Sans } from "next/font/google"; // Using your preferred font
import "./globals.css";
import { Toaster } from "react-hot-toast";

// Configure Google Font
const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "PDF Chat Companion",
  description: "AI-powered PDF chat using Gemini 2.5 Flash-Lite",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={dmSans.className}>
      <body>
        {children}
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: "#1a1d27",
              color: "#ffffff",
              border: "1px solid #2e3250",
              borderRadius: "12px",
              fontSize: "14px",
            },
            success: {
              iconTheme: {
                primary: "#22c55e",
                secondary: "#1a1d27",
              },
            },
            error: {
              iconTheme: {
                primary: "#ef4444",
                secondary: "#1a1d27",
              },
            },
          }}
        />
      </body>
    </html>
  );
}