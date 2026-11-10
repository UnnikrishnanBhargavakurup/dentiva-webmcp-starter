import { ClinicWebsite } from "@/components/clinic-website";
import { clinicToday } from "@/lib/clinic";

export const dynamic = "force-dynamic";

export default function Home() {
  return <ClinicWebsite today={clinicToday()} />;
}
