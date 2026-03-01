import { redirect } from "next/navigation";
import getUser from "@/lib/auth/getUser";
import TrainerNav from "@/components/trainer/TrainerNav";

export default async function TrainerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getUser();
  if (!user) redirect("/login");
  if (user.role !== "trainer") redirect("/");

  return (
    <>
      <TrainerNav userName={user.name} userEmail={user.email} />
      {children}
    </>
  );
}
