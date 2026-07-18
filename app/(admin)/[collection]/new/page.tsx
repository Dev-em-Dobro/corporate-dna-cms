import { notFound } from "next/navigation";
import { SEGMENT_TO_TYPE, defForType } from "@/lib/content/types";
import { FIELDS, emptyData } from "@/lib/content/ui-fields";
import ContentEditor from "@/components/ContentEditor";

export default async function NewEntry({
  params,
}: {
  params: Promise<{ collection: string }>;
}) {
  const { collection } = await params;
  const type = SEGMENT_TO_TYPE[collection];
  if (!type) notFound();

  return (
    <ContentEditor
      apiType={collection}
      collection={collection}
      mode="collection"
      fields={FIELDS[type]}
      initial={{ data: emptyData(type) }}
      label={`New ${defForType(type).label}`}
    />
  );
}
