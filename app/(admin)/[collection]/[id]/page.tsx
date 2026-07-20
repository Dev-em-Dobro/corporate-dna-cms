import { notFound } from "next/navigation";
import { SEGMENT_TO_TYPE, defForType } from "@/lib/content/types";
import { FIELDS } from "@/lib/content/ui-fields";
import { getEntry } from "@/lib/content/entries";
import ContentEditor from "@/components/ContentEditor";

export default async function EditEntry({
  params,
}: {
  params: Promise<{ collection: string; id: string }>;
}) {
  const { collection, id } = await params;
  const type = SEGMENT_TO_TYPE[collection];
  if (!type) notFound();
  const entry = await getEntry(type, id);
  if (!entry) notFound();

  return (
    <ContentEditor
      apiType={collection}
      collection={collection}
      mode="collection"
      fields={FIELDS[type]}
      initial={{
        id: entry.id,
        data: entry.data,
        currentVersionId: entry.currentVersionId,
        status: entry.status,
      }}
      label={defForType(type).label}
    />
  );
}
