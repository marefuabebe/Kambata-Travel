import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Cultural Heritage",
  description: "Dive deep into the rich cultural heritage, traditions, and history of the Kambata people.",
};

export default function HeritageLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
