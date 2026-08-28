import { Metadata } from "next";

type Props = {
  params: { id: string };
};

export async function generateMetadata(
  { params }: Props
): Promise<Metadata> {
  const id = params.id;
  
  // Ideally fetch guide details here to populate metadata dynamically
  // const res = await fetch(`https://kambata-travel.vercel.app/api/guides/${id}`);
  // const guide = await res.json();
  
  return {
    title: `Guide Profile`,
    description: `View the profile, tours, and ratings of this local guide in Kambaata Zone. Book your next authentic experience today.`,
  };
}

export default function GuideLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
