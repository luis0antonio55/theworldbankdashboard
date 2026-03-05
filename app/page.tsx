import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { DashboardClient } from "@/components/dashboard/DashboardClient";

/**
 * Root page — renders the World Bank Data Dashboard.
 * The DashboardHeader is a server component; DashboardClient handles all
 * interactive state and API calls on the client.
 */
export default function HomePage() {
  return (
    <>
      <DashboardHeader />
      <DashboardClient />
    </>
  );
}
