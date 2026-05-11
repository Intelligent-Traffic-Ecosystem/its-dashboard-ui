import { redirect } from "next/navigation";

export default function Home() {
  const dashboardHomePath = process.env.NEXT_PUBLIC_TRAFFIC_DASHBOARD_HOME_PATH ?? "/dashboard";
  redirect(dashboardHomePath);
}
