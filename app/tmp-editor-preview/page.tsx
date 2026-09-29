import { Editor } from "@/components/editor/Editor";
import { createBlankPage } from "@/lib/page-model/defaults";

export default function Page() {
  return (
    <Editor
      projectId="00000000-0000-4000-8000-000000000001"
      userId="00000000-0000-4000-8000-000000000002"
      projectName="Mi tienda de café"
      initialDocument={createBlankPage("Mi tienda de café")}
    />
  );
}
