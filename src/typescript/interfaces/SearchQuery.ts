export interface SearchQuery {
  query: string;
  tags: string[];
  languages: string[];
  searchText?: string; // Optional simple text search parameter
}
