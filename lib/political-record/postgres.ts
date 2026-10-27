import { Pool } from "pg";
import { validateBatch } from "./records";
import type {
  PoliticalRecordRepository,
  RecordBatch,
  PoliticalRecord,
  RecordKind,
  SourceRecord,
  PrivateCaptureRef,
} from "./types";
export type SqlSession = {
  query(
    text: string,
    values?: unknown[],
  ): Promise<{ rows: Record<string, unknown>[]; rowCount: number | null }>;
  release(): void;
};
export interface SqlPool {
  connect(): Promise<SqlSession>;
  end(): Promise<void>;
}
/** DDL is never invoked here. Append-only conflict checks reject mutated historical IDs. */
export class PostgresPoliticalRecords implements PoliticalRecordRepository {
  constructor(private pool: SqlPool) {}
  async producerJobs(
    limit = 25,
    includeBlocked = false,
    now = new Date().toISOString(),
  ) {
    const client = await this.pool.connect();
    try {
      const result = await client.query(
        "SELECT * FROM (SELECT DISTINCT ON(record_id) * FROM political_record.record_revisions WHERE kind='source_health' AND provenance->>'parserVersion'='private-publication-job-v1' ORDER BY record_id,insertion_cursor DESC) jobs WHERE payload->>'stage'=ANY($1::text[]) ORDER BY ((payload->>'nextAt')::timestamptz<=$3::timestamptz) DESC,(payload->>'stage'='review') DESC,(payload->>'nextAt')::timestamptz,insertion_cursor LIMIT $2",
        [
          includeBlocked
            ? ["queued", "review", "blocked"]
            : ["queued", "review"],
          Math.max(1, Math.min(100, limit)),
          now,
        ],
      );
      return result.rows.map((row) => this.decode(row));
    } finally {
      client.release();
    }
  }
  async getCapture(captureId: string): Promise<PrivateCaptureRef | null> {
    if (!/^[a-f0-9]{64}$/.test(captureId))
      throw new Error("capture_id_invalid");
    const client = await this.pool.connect();
    try {
      const row = (
        await client.query(
          "SELECT * FROM political_record.private_captures WHERE capture_id=$1",
          [captureId],
        )
      ).rows[0];
      return row
        ? {
            captureId: String(row.capture_id),
            contentSha256: String(row.content_sha256),
            sourceRevisionId: String(row.source_revision_id),
            storageKey: String(row.storage_key),
            mediaType: String(row.media_type),
            byteLength: Number(row.byte_length),
            observedAt: new Date(row.observed_at as string).toISOString(),
          }
        : null;
    } finally {
      client.release();
    }
  }
  async getSources(revisionIds: string[]): Promise<SourceRecord[]> {
    if (
      revisionIds.length > 5000 ||
      revisionIds.some((id) => !/^[a-f0-9]{64}$/.test(id))
    )
      throw new Error("source_revision_ids_invalid");
    const client = await this.pool.connect();
    try {
      const result = await client.query(
        "SELECT * FROM political_record.source_revisions WHERE revision_id=ANY($1::text[])",
        [revisionIds],
      );
      return result.rows.map((row) => ({
        revisionId: String(row.revision_id),
        sourceId: String(row.source_id),
        publisher: String(row.publisher),
        title: String(row.title),
        captureHash: String(row.capture_hash),
        url: String(row.url),
        authority: String(row.authority),
        observedAt: new Date(row.observed_at as string).toISOString(),
        publishedAt: row.published_at
          ? new Date(row.published_at as string).toISOString()
          : null,
      }));
    } finally {
      client.release();
    }
  }
  async append(batch: RecordBatch) {
    const { records, captures, outbox } = await this.commit(batch);
    return { records, captures, outbox };
  }
  async compareAndAppend(
    batch: RecordBatch,
    guard: { recordId: string; revisionId: string | null },
  ) {
    return this.commit(batch, guard);
  }
  private async commit(
    batch: RecordBatch,
    guard?: { recordId: string; revisionId: string | null },
  ) {
    validateBatch(batch);
    const client = await this.pool.connect();
    let records = 0,
      captures = 0,
      outbox = 0;
    try {
      await client.query("BEGIN");
      // Serialize append transactions so committed cursors cannot arrive behind a published high-water mark.
      await client.query("SELECT pg_advisory_xact_lock(711026, 1)");
      if (guard) {
        const existing = (
          await client.query(
            "SELECT revision_id FROM political_record.record_revisions WHERE record_id=$1 ORDER BY insertion_cursor DESC LIMIT 1",
            [guard.recordId],
          )
        ).rows[0];
        if ((existing?.revision_id ?? null) !== guard.revisionId) {
          await client.query("ROLLBACK");
          return { records: 0, captures: 0, outbox: 0, conflict: true };
        }
      }
      for (const source of batch.sources)
        await client.query(
          "INSERT INTO political_record.source_revisions(revision_id,source_id,publisher,url,authority,observed_at,published_at,title,capture_hash) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9) ON CONFLICT DO NOTHING",
          [
            source.revisionId,
            source.sourceId,
            source.publisher,
            source.url,
            source.authority,
            source.observedAt,
            source.publishedAt,
            source.title,
            source.captureHash,
          ],
        );
      for (const capture of batch.captures) {
        const inserted = await client.query(
          "INSERT INTO political_record.private_captures(capture_id,content_sha256,source_revision_id,storage_key,media_type,byte_length,observed_at) VALUES($1,$2,$3,$4,$5,$6,$7) ON CONFLICT DO NOTHING RETURNING capture_id",
          [
            capture.captureId,
            capture.contentSha256,
            capture.sourceRevisionId,
            capture.storageKey,
            capture.mediaType,
            capture.byteLength,
            capture.observedAt,
          ],
        );
        if (!inserted.rowCount) {
          const old = await client.query(
            "SELECT content_sha256 FROM political_record.private_captures WHERE capture_id=$1",
            [capture.captureId],
          );
          if (old.rows[0]?.content_sha256 !== capture.contentSha256)
            throw new Error("capture_identity_conflict");
        }
        captures += inserted.rowCount ?? 0;
      }
      for (const record of batch.records) {
        const result = await client.query(
          "INSERT INTO political_record.record_revisions(revision_id,record_id,kind,schema_version,election_id,effective_at,observed_at,assertion_status,evidence_class,previous_revision_id,payload,provenance) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) ON CONFLICT DO NOTHING RETURNING revision_id",
          [
            record.revisionId,
            record.recordId,
            record.kind,
            record.schemaVersion,
            record.electionId,
            record.effectiveAt,
            record.observedAt,
            record.status,
            record.evidenceClass,
            record.previousRevisionId,
            record.payload,
            record.provenance,
          ],
        );
        records += result.rowCount ?? 0;
      }
      for (const intent of batch.outbox) {
        const result = await client.query(
          "INSERT INTO political_record.outbox_intents(id,topic,aggregate_revision_id,created_at,payload) VALUES($1,$2,$3,$4,$5) ON CONFLICT DO NOTHING RETURNING id",
          [
            intent.id,
            intent.topic,
            intent.aggregateRevisionId,
            intent.createdAt,
            intent.payload,
          ],
        );
        outbox += result.rowCount ?? 0;
      }
      await client.query("COMMIT");
      return { records, captures, outbox, conflict: false };
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }
  private decode(row: Record<string, unknown>): PoliticalRecord {
    return {
      schemaVersion: 1,
      revisionId: String(row.revision_id),
      recordId: String(row.record_id),
      kind: row.kind as RecordKind,
      electionId: row.election_id as string | null,
      effectiveAt: row.effective_at
        ? new Date(row.effective_at as string).toISOString()
        : null,
      observedAt: new Date(row.observed_at as string).toISOString(),
      status: row.assertion_status as PoliticalRecord["status"],
      evidenceClass: row.evidence_class as PoliticalRecord["evidenceClass"],
      previousRevisionId: row.previous_revision_id as string | null,
      payload: row.payload as Record<string, unknown>,
      provenance: row.provenance as PoliticalRecord["provenance"],
    };
  }
  async getRevision(id: string) {
    const client = await this.pool.connect();
    try {
      const result = await client.query(
        "SELECT * FROM political_record.record_revisions WHERE revision_id=$1",
        [id],
      );
      return result.rows[0] ? this.decode(result.rows[0]) : null;
    } finally {
      client.release();
    }
  }
  async getLatest(recordId: string) {
    const client = await this.pool.connect();
    try {
      const result = await client.query(
        "SELECT * FROM political_record.record_revisions WHERE record_id=$1 ORDER BY insertion_cursor DESC LIMIT 1",
        [recordId],
      );
      return result.rows[0] ? this.decode(result.rows[0]) : null;
    } finally {
      client.release();
    }
  }
  async listRevisions(query: {
    electionId?: string;
    kind?: RecordKind;
    after?: string;
    limit?: number;
  }) {
    const client = await this.pool.connect();
    try {
      const result = await client.query(
        "SELECT * FROM political_record.record_revisions WHERE ($1::text IS NULL OR election_id=$1) AND ($2::text IS NULL OR kind=$2) AND revision_id>$3 ORDER BY revision_id LIMIT $4",
        [
          query.electionId ?? null,
          query.kind ?? null,
          query.after ?? "",
          Math.max(1, Math.min(200, query.limit ?? 50)),
        ],
      );
      return result.rows.map((row) => this.decode(row));
    } finally {
      client.release();
    }
  }
  async latest(query: {
    globalOnly?: boolean;
    asOfCursor?: string;
    electionId?: string;
    kind?: RecordKind;
    limit?: number;
  }) {
    const client = await this.pool.connect();
    const limit = Math.max(1, Math.min(200, query.limit ?? 50));
    try {
      const watermark = await client.query(
        "SELECT COALESCE(MAX(insertion_cursor),0)::text AS cursor FROM political_record.record_revisions",
      );
      const asOfCursor = query.asOfCursor ?? String(watermark.rows[0].cursor);
      if (!/^\d+$/.test(asOfCursor)) throw new Error("invalid_cursor");
      const result = await client.query(
        "SELECT * FROM (SELECT DISTINCT ON (record_id) * FROM political_record.record_revisions WHERE insertion_cursor<=$1::bigint AND ($2::text IS NULL OR election_id=$2) AND ($3::text IS NULL OR kind=$3) AND ($5::boolean=false OR election_id IS NULL) ORDER BY record_id,insertion_cursor DESC) current_records ORDER BY insertion_cursor DESC LIMIT $4",
        [
          asOfCursor,
          query.electionId ?? null,
          query.kind ?? null,
          limit + 1,
          query.globalOnly ?? false,
        ],
      );
      return {
        asOfCursor,
        truncated: result.rows.length > limit,
        records: result.rows.slice(0, limit).map((row) => this.decode(row)),
      };
    } finally {
      client.release();
    }
  }
  async page(query: {
    kind: RecordKind;
    electionId?: string;
    includeGlobal?: boolean;
    after: string;
    asOf?: string;
    limit: number;
    view: "history" | "latest";
  }) {
    if (!/^\d+$/.test(query.after) || (query.asOf && !/^\d+$/.test(query.asOf)))
      throw new Error("invalid_cursor");
    const client = await this.pool.connect();
    try {
      const asOf =
        query.asOf ??
        String(
          (
            await client.query(
              "SELECT COALESCE(MAX(insertion_cursor),0)::text AS cursor FROM political_record.record_revisions",
            )
          ).rows[0].cursor,
        );
      const base =
        "SELECT * FROM political_record.record_revisions WHERE insertion_cursor<=$1::bigint AND kind=$2 AND ($3::text IS NULL OR election_id=$3 OR ($6::boolean AND election_id IS NULL))";
      const selected =
        query.view === "latest"
          ? `SELECT DISTINCT ON (record_id) * FROM (${base}) base ORDER BY record_id,insertion_cursor DESC`
          : base;
      const result = await client.query(
        `SELECT * FROM (${selected}) selected WHERE insertion_cursor>$4::bigint ORDER BY insertion_cursor LIMIT $5`,
        [
          asOf,
          query.kind,
          query.electionId ?? null,
          query.after,
          query.limit + 1,
          query.includeGlobal ?? false,
        ],
      );
      const rows = result.rows.slice(0, query.limit);
      return {
        asOf,
        more: result.rows.length > query.limit,
        after: rows.at(-1)
          ? String(rows.at(-1)!.insertion_cursor)
          : query.after,
        records: rows.map((row) => this.decode(row)),
      };
    } finally {
      client.release();
    }
  }
  async close() {
    await this.pool.end();
  }
  async changes(after = "0", limit = 50) {
    if (!/^\d+$/.test(after)) throw new Error("invalid_cursor");
    const client = await this.pool.connect();
    try {
      const result = await client.query(
        "SELECT * FROM political_record.record_revisions WHERE insertion_cursor>$1::bigint ORDER BY insertion_cursor LIMIT $2",
        [after, Math.max(1, Math.min(200, limit))],
      );
      return result.rows.map((row) => ({
        cursor: String(row.insertion_cursor),
        record: this.decode(row),
      }));
    } finally {
      client.release();
    }
  }
}
export function configuredPoliticalRecords() {
  const connectionString = process.env.POLITICAL_RECORD_DATABASE_URL;
  if (!connectionString) return null;
  const url = new URL(connectionString);
  if (!["postgres:", "postgresql:"].includes(url.protocol))
    throw new Error("database_scheme_invalid");
  // No relaxed TLS certificate setting; provider-reviewed connection settings remain explicit.
  return new PostgresPoliticalRecords(
    new Pool({
      connectionString,
      max: 2,
      connectionTimeoutMillis: 1500,
      idleTimeoutMillis: 10000,
      statement_timeout: 5000,
      query_timeout: 6500,
    }),
  );
}
