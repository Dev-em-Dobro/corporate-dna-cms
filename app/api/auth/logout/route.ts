import { NextRequest, NextResponse } from "next/server";
import { readSession, destroySession } from "@/lib/auth/session";
import { writeAudit } from "@/lib/audit/log";

export async function POST(req: NextRequest) {
  const session = await readSession();
  await destroySession();
  if (session) await writeAudit({ actorId: session.sub, action: "auth.logout" });
  return NextResponse.redirect(new URL("/login", req.url));
}
