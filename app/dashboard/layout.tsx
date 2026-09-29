import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { requireUser } from "@/lib/auth/session";

export default async function DashboardLayout({ children }: LayoutProps<"/dashboard">) {
  const user = await requireUser();

  return (
    <div className="flex flex-1 flex-col bg-zinc-50 dark:bg-black">
      <DashboardHeader email={user.email} />
      <main className="flex w-full flex-1 flex-col gap-6 px-4 py-8 sm:px-6 lg:px-10">
        {children}
      </main>
    </div>
  );
}
