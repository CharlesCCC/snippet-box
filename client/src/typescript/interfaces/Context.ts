import { TagCount, NewSnippet, Snippet, SearchQuery } from '.';

export interface Context {
  snippets: Snippet[];
  searchResults: Snippet[];
  currentSnippet: Snippet | null;
  tagCount: TagCount[];
  savedSnippets: Snippet[];
  getSnippets: () => void;
  getSnippetById: (id: number) => void;
  setSnippet: (id: number) => void;
  createSnippet: (snippet: NewSnippet) => void;
  updateSnippet: (snippet: NewSnippet, id: number, isLocal?: boolean) => void;
  deleteSnippet: (id: number) => void;
  toggleSnippetPin: (id: number) => void;
  toggleSnippetLike: (id: number) => void;
  saveSnippet: (id: number) => void;
  unsaveSnippet: (id: number) => void;
  getSavedSnippets: () => void;
  checkIfSaved: (id: number) => Promise<boolean>;
  countTags: () => void;
  searchSnippets: (query: SearchQuery) => void;
}
