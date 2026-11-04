import "./globals.css";

export const metadata = {
  title: "Payment chase board",
  description:
    "Every home visit patient whose money is pending, session was missed, or feedback was never asked for.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
