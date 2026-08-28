import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Explore Destinations",
  description: "Discover beautiful and hidden destinations across Kambaata Zone and southern Ethiopia.",
};

export default function ExploreLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
