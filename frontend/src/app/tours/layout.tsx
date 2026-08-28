import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Tours & Experiences",
  description: "Browse and book immersive tours in Kambaata Zone. Find local guides, curated packages, and authentic Ethiopian adventures.",
};

export default function ToursLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
