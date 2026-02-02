import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Bloc",
  description:
    "Bloc es una plataforma de entrenamiento personalizado para atletas de fuerza y resistencia.",
};

type RootLayoutProps = {
  children: React.ReactNode;
};

const RootLayout = ({ children }: RootLayoutProps) => {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
};

export default RootLayout;
