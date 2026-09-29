import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";

import { Editor } from "@/components/editor/Editor";
import { Alert } from "@/components/ui/Alert";
import { AUTH_ROUTES } from "@/lib/auth/routes";
import { requireUser } from "@/lib/auth/session";
import { getProjectContent } from "@/lib/projects/content";

export const metadata: Metadata = { title: "Editor | WebBuilder SaaS" };

export default async function EditorPage({ params }: PageProps<"/editor/[id]">) {
  const user = await requireUser();
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) notFound();

  const result = await getProjectContent(id);

  if (result.error !== null) {
    return (
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-4 p-8">
        <Alert variant="error">{result.error}</Alert>
        <Link href={AUTH_ROUTES.afterLogin} className="text-sm underline underline-offset-4">
          ← Volver a mis proyectos
        </Link>
      </main>
    );
  }

  return (
    <Editor
      projectId={result.data.id}
      userId={user.id}
      projectName={result.data.name}
      initialDocument={result.data.document}
    />
  );
}
