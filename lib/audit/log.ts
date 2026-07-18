import { db } from "@/db";
import { auditLog } from "@/db/schema";
import { desc, eq, and, SQL } from "drizzle-orm";

export interface AuditInput {
  actorId?: string | null;
  action: string;
  targetType?: string | null;
  targetId?: string | null;
  metadata?: Record<string, unknown>;
}

/**
 * The single choke-point for audit writes. Every mutation and auth event calls
 * this so audit coverage is 100% (FR-016 / SC-005).
 */
export async function writeAudit(input: AuditInput): Promise<void> {
  await db.insert(auditLog).values({
    actorId: input.actorId ?? null,
    action: input.action,
    targetType: input.targetType ?? null,
    targetId: input.targetId ?? null,
    metadata: input.metadata ?? null,
  });
}

export interface AuditQuery {
  actorId?: string;
  action?: string;
  targetType?: string;
  limit?: number;
}

export async function listAudit(q: AuditQuery = {}) {
  const conds: SQL[] = [];
  if (q.actorId) conds.push(eq(auditLog.actorId, q.actorId));
  if (q.action) conds.push(eq(auditLog.action, q.action));
  if (q.targetType) conds.push(eq(auditLog.targetType, q.targetType));
  return db
    .select()
    .from(auditLog)
    .where(conds.length ? and(...conds) : undefined)
    .orderBy(desc(auditLog.createdAt))
    .limit(Math.min(q.limit ?? 100, 500));
}
