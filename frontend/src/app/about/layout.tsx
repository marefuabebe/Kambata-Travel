import { Metadata } from "next";

export const metadata: Metadata = {
  title: "About Us",
  description: "Learn about Kambata Travel, our mission to promote sustainable tourism in Ethiopia, and the team behind the experience.",
};

export default function AboutLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
