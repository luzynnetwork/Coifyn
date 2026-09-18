/** DI token for the active SearchIndex implementation. */
export const SEARCH_INDEX = Symbol('SEARCH_INDEX');

export interface SearchResult {
  id: string;
  score: number;
}

/** Search seam. */
export interface SearchIndex {
  index(collection: string, id: string, doc: Record<string, unknown>): Promise<void>;
  remove(collection: string, id: string): Promise<void>;
  search(collection: string, query: string, limit?: number): Promise<SearchResult[]>;
}
