import { redirect } from "next/navigation";

export default function Home() {
  const publicHomePath =
    process.env.NEXT_PUBLIC_PUBLIC_APP_HOME_PATH ?? "/dashboard";

  redirect(publicHomePath);
}
