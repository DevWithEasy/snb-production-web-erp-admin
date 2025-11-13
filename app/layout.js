import { Toaster } from "sonner";
import "./globals.css";

export const metadata = {
  title: "S&B Production ERP",
  description: "Developed By - Robi App Lab",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="text-sm font-sans antialiased bg-white text-black dark:bg-gray-900 dark:text-white transition-colors duration-300">
        {children}
        <Toaster />
      </body>
    </html>
  );
}
