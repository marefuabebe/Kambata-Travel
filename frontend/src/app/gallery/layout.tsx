import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Gallery",
  description: "View breathtaking photos of Kambata Zone's landscapes, wildlife, and cultural festivals.",
};

export default function GalleryLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
