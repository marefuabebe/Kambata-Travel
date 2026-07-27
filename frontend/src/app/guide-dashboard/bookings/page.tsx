"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/** Legacy route — operational bookings live under Assigned Tours */
export default function BookingsRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/guide-dashboard/assigned-tours");
  }, [router]);
  return null;
}
