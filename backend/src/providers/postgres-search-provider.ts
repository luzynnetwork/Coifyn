import { Injectable } from '@nestjs/common';
import type { SearchIndex, SearchResult } from './search-index.js';

/**
 * Phase-0 placeholder. There is no generic "documents" table yet to index into,
 * so index/remove are safe no-ops and search always returns []. Real per-table
 * search (ILIKE / pg_trgm against the actual target tables — customers,
 * services, etc.) will be added once those tables exist in later phases; this
 * is intentionally not backed by an invented schema table.
 */
@Injectable()
export class PostgresSearchProvider implements SearchIndex {
  async index(
    _collection: string,
    _id: string,
    _doc: Record<string, unknown>,
  ): Promise<void> {
    // No-op: no generic search table exists yet (Phase 0).
  }

  async remove(_collection: string, _id: string): Promise<void> {
    // No-op: no generic search table exists yet (Phase 0).
  }

  async search(
    _collection: string,
    _query: string,
    _limit?: number,
  ): Promise<SearchResult[]> {
    // No generic search table exists yet (Phase 0) — always returns no results.
    return [];
  }
}
