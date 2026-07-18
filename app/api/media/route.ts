import { NextRequest } from "next/server";
import { randomUUID } from "node:crypto";
import { desc } from "drizzle-orm";
import { db } from "@/db";
import { mediaAssets } from "@/db/schema";
import { requireSession } from "@/lib/auth/guards";
import { validateUpload } from "@/lib/media/validate";
import { uploadToBunny } from "@/lib/media/bunny";
import { writeAudit } from "@/lib/audit/log";
import { jsonOk, jsonError, jsonValidationError, handleError } from "@/lib/http";
import { slugify } from "@/lib/content/slug";

export async function GET(req: NextRequest) {
  try {
    await requireSession();
    const sp = new URL(req.url).searchParams;
    const limit = Math.min(100, Number(sp.get("limit") ?? 50));
    const offset = Number(sp.get("offset") ?? 0);
    const items = await db
      .select()
      .from(mediaAssets)
      .orderBy(desc(mediaAssets.createdAt))
      .limit(limit)
      .offset(offset);
    return jsonOk({ items });
  } catch (e) {
    return handleError(e);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireSession();
    const form = await req.formData();
    const file = form.get("file");
    if (!(file instanceof File)) {
      return jsonError(422, "No file provided");
    }

    const check = validateUpload(file.type, file.size);
    if (!check.ok) return jsonValidationError({ file: check.error });

    const altText = (form.get("altText") as string | null) ?? null;
    const ext = file.name.includes(".") ? file.name.split(".").pop() : "bin";
    const base = slugify(file.name.replace(/\.[^.]+$/, "")) || "file";
    const path = `uploads/${randomUUID()}-${base}.${ext}`;

    const bytes = new Uint8Array(await file.arrayBuffer());
    const { deliveryUrl, bunnyPath } = await uploadToBunny(
      path,
      bytes,
      file.type,
    );

    const [asset] = await db
      .insert(mediaAssets)
      .values({
        filename: file.name,
        mimeType: file.type,
        sizeBytes: file.size,
        bunnyPath,
        deliveryUrl,
        altText,
        uploadedBy: session.sub,
      })
      .returning();

    await writeAudit({
      actorId: session.sub,
      action: "media.upload",
      targetType: "media",
      targetId: asset.id,
      metadata: { filename: file.name, mimeType: file.type },
    });

    return jsonOk(
      {
        id: asset.id,
        deliveryUrl: asset.deliveryUrl,
        mimeType: asset.mimeType,
        width: asset.width,
        height: asset.height,
      },
      201,
    );
  } catch (e) {
    return handleError(e);
  }
}
