import { useState, createContext, useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import axios from 'axios';
import {
  Snippet,
  Response,
  TagCount,
  NewSnippet,
  SearchQuery
} from '../typescript/interfaces';

// Set up axios interceptor for authentication
axios.interceptors.request.use(
  (config) => {
    const token = document.cookie
      .split(';')
      .find(cookie => cookie.trim().startsWith('token='));
    
    // console.log('Interceptor token:', token);
    
    if (token) {
      const tokenValue = token.split('=')[1];
      config.headers.Authorization = `Bearer ${tokenValue}`;
    }
    return config;
  },
  (error) => {
    console.error('Interceptor error:', error);
    return Promise.reject(error);
  }
);

interface SnippetsContextType {
  snippets: Snippet[];
  publicSnippets: Snippet[];
  searchResults: Snippet[];
  currentSnippet: Snippet | null;
  tagCount: TagCount[];
  publicTagCount: TagCount[];
  savedSnippets: Snippet[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  getSnippets: () => Promise<void>;
  getPublicSnippets: (page?: number, limit?: number) => Promise<void>;
  getSnippetById: (id: number) => void;
  setSnippet: (id: number) => void;
  createSnippet: (snippet: NewSnippet) => void;
  updateSnippet: (snippet: NewSnippet, id: number, isLocal?: boolean) => void;
  deleteSnippet: (id: number) => void;
  toggleSnippetPin: (id: number) => void;
  toggleSnippetPublic: (id: number) => void;
  saveSnippet: (id: number) => void;
  unsaveSnippet: (id: number) => void;
  getSavedSnippets: () => Promise<void>;
  checkIfSaved: (id: number) => Promise<boolean>;
  countTags: () => Promise<void>;
  countPublicTags: () => Promise<void>;
  searchSnippets: (query: SearchQuery) => Promise<void>;
  likeSnippet: (id: number) => Promise<void>;
  unlikeSnippet: (id: number) => Promise<void>;
  checkIfLiked: (id: number) => Promise<{ liked: boolean; likes_count: number }>;
  batchCheckLikes: (ids: number[]) => Promise<void>;
  likedSnippetsCache: Map<number, { liked: boolean; likes_count: number }>;
}

export const SnippetsContext = createContext<SnippetsContextType>({} as SnippetsContextType);

interface Props {
  children: JSX.Element | JSX.Element[];
}

export const SnippetsContextProvider = (props: Props): JSX.Element => {
  const [snippets, setSnippets] = useState<Snippet[]>([]);
  const [publicSnippets, setPublicSnippets] = useState<Snippet[]>([]);
  const [searchResults, setSearchResults] = useState<Snippet[]>([]);
  const [currentSnippet, setCurrentSnippet] = useState<Snippet | null>(null);
  const [tagCount, setTagCount] = useState<TagCount[]>([]);
  const [publicTagCount, setPublicTagCount] = useState<TagCount[]>([]);
  const [savedSnippets, setSavedSnippets] = useState<Snippet[]>([]);
  const [likedSnippetsCache, setLikedSnippetsCache] = useState<Map<number, { liked: boolean; likes_count: number }>>(
    new Map()
  );
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 0
  });

  const history = useHistory();

  const redirectOnError = () => {
    history.push('/');
  };

  const getSnippets = async (): Promise<void> => {
    try {
      const { data } = await axios.get('/api/snippets');
      setSnippets(data.data);
    } catch (error) {
      console.error('Error fetching snippets:', error);
    }
  };

  const getPublicSnippets = async (page: number = 1, limit: number = 10): Promise<void> => {
    try {
      const { data } = await axios.get(`/api/snippets/public?page=${page}&limit=${limit}`);
      
      // If it's the first page, replace the snippets
      // If it's a subsequent page, append the new snippets
      if (page === 1) {
        setPublicSnippets(data.data);
      } else {
        setPublicSnippets(prevSnippets => [...prevSnippets, ...data.data]);
      }
      
      setPagination(data.pagination);
      return Promise.resolve();
    } catch (error) {
      console.error('Error fetching public snippets:', error);
      return Promise.reject(error);
    }
  };

  const getSnippetById = (id: number): void => {
    axios
      .get<Response<Snippet>>(`/api/snippets/${id}`)
      .then(res => setCurrentSnippet(res.data.data))
      .catch(err => redirectOnError());
  };

  const setSnippet = (id: number): void => {
    if (id < 0) {
      setCurrentSnippet(null);
      return;
    }

    getSnippetById(id);

    const snippet = snippets.find(s => s.id === id);

    if (snippet) {
      setCurrentSnippet(snippet);
    }
  };

  const createSnippet = (snippet: NewSnippet): void => {
    axios
      .post<Response<Snippet>>('/api/snippets', snippet)
      .then(res => {
        setSnippets([...snippets, res.data.data]);
        setCurrentSnippet(res.data.data);
        history.push({
          pathname: `/snippet/${res.data.data.id}`,
          state: { from: '/snippets' }
        });
      })
      .catch(err => redirectOnError());
  };

  const updateSnippet = (
    snippet: NewSnippet,
    id: number,
    isLocal?: boolean
  ): void => {
    axios
      .put<Response<Snippet>>(`/api/snippets/${id}`, snippet)
      .then(res => {
        const oldSnippetIdx = snippets.findIndex(s => s.id === id);
        setSnippets([
          ...snippets.slice(0, oldSnippetIdx),
          res.data.data,
          ...snippets.slice(oldSnippetIdx + 1)
        ]);
        setCurrentSnippet(res.data.data);

        if (!isLocal) {
          history.push({
            pathname: `/snippet/${res.data.data.id}`,
            state: { from: '/snippets' }
          });
        }
      })
      .catch(err => redirectOnError());
  };

  const deleteSnippet = (id: number): void => {
    if (window.confirm('Are you sure you want to delete this snippet?')) {
      axios
        .delete<Response<{}>>(`/api/snippets/${id}`)
        .then(res => {
          const deletedSnippetIdx = snippets.findIndex(s => s.id === id);
          setSnippets([
            ...snippets.slice(0, deletedSnippetIdx),
            ...snippets.slice(deletedSnippetIdx + 1)
          ]);
          setSnippet(-1);
          history.push('/snippets');
        })
        .catch(err => redirectOnError());
    }
  };

  const toggleSnippetPin = (id: number): void => {
    const snippet = snippets.find(s => s.id === id);

    if (snippet) {
      updateSnippet({ ...snippet, isPinned: !snippet.isPinned }, id, true);
    }
  };

  const toggleSnippetPublic = (id: number): void => {
    const snippet = snippets.find(s => s.id === id);

    if (snippet) {
      updateSnippet({ ...snippet, is_public: !snippet.is_public }, id, true);
    }
  };

  const saveSnippet = (id: number): void => {
    axios
      .post<Response<{}>>('/api/saved', { snippetId: id })
      .then(res => {
        // No need to update state here, just show success
        console.log('Snippet saved successfully');
      })
      .catch(err => console.error('Error saving snippet:', err));
  };

  const unsaveSnippet = (id: number): void => {
    axios
      .delete<Response<{}>>(`/api/saved/${id}`)
      .then(res => {
        // Remove from saved snippets if in that view
        setSavedSnippets(savedSnippets.filter(snippet => snippet.id !== id));
        console.log('Snippet unsaved successfully');
      })
      .catch(err => console.error('Error unsaving snippet:', err));
  };

  const getSavedSnippets = async (): Promise<void> => {
    try {
      const { data } = await axios.get<Response<Snippet[]>>('/api/saved');
      setSavedSnippets(data.data);
    } catch (error) {
      console.error('Error fetching saved snippets:', error);
    }
  };

  const checkIfSaved = async (id: number): Promise<boolean> => {
    try {
      const { data } = await axios.get<Response<{ isSaved: boolean }>>(`/api/saved/check/${id}`);
      return data.data.isSaved;
    } catch (error) {
      console.error('Error checking if snippet is saved:', error);
      return false;
    }
  };

  const countTags = async (): Promise<void> => {
    try {
      const { data } = await axios.get('/api/snippets/statistics/count');
      setTagCount(data.data);
    } catch (error) {
      console.error('Error counting tags:', error);
    }
  };

  const countPublicTags = async (): Promise<void> => {
    try {
      const { data } = await axios.get('/api/snippets/statistics/public-tags');
      setPublicTagCount(data.data);
    } catch (error) {
      console.error('Error counting public tags:', error);
    }
  };

  const searchSnippets = async (query: SearchQuery): Promise<void> => {
    try {
      // If searchText is provided, use it directly for simple text search
      if (query.searchText) {
        const { data } = await axios.post('/api/snippets/search', { searchText: query.searchText });
        setSearchResults(data.data);
      } else {
        // Otherwise use the structured search format
        const { data } = await axios.post('/api/snippets/search', {
          query: query.query,
          tags: query.tags,
          languages: query.languages
        });
        setSearchResults(data.data);
      }
    } catch (error) {
      console.error('Error searching snippets:', error);
    }
  };

  const likeSnippet = async (id: number): Promise<void> => {
    try {
      const { data } = await axios.post<Response<{ id: number; likes_count: number; liked: boolean }>>(`/api/likes/${id}`);
      
      // Update the snippet in the snippets array
      const updatedSnippets = snippets.map(snippet => {
        if (snippet.id === id) {
          return { ...snippet, likes_count: data.data.likes_count };
        }
        return snippet;
      });
      setSnippets(updatedSnippets);

      // Update current snippet if it's the one being liked
      if (currentSnippet && currentSnippet.id === id) {
        setCurrentSnippet({ ...currentSnippet, likes_count: data.data.likes_count });
      }
      
      // Update the cache
      setLikedSnippetsCache(prev => {
        const newCache = new Map(prev);
        newCache.set(id, { liked: true, likes_count: data.data.likes_count });
        return newCache;
      });
    } catch (error) {
      console.error('Error liking snippet:', error);
    }
  };

  const unlikeSnippet = async (id: number): Promise<void> => {
    try {
      const { data } = await axios.delete<Response<{ id: number; likes_count: number; liked: boolean }>>(`/api/likes/${id}`);
      
      // Update the snippet in the snippets array
      const updatedSnippets = snippets.map(snippet => {
        if (snippet.id === id) {
          return { ...snippet, likes_count: data.data.likes_count };
        }
        return snippet;
      });
      setSnippets(updatedSnippets);

      // Update current snippet if it's the one being unliked
      if (currentSnippet && currentSnippet.id === id) {
        setCurrentSnippet({ ...currentSnippet, likes_count: data.data.likes_count });
      }
      
      // Update the cache
      setLikedSnippetsCache(prev => {
        const newCache = new Map(prev);
        newCache.set(id, { liked: false, likes_count: data.data.likes_count });
        return newCache;
      });
    } catch (error) {
      console.error('Error unliking snippet:', error);
    }
  };

  const checkIfLiked = async (id: number): Promise<{ liked: boolean; likes_count: number }> => {
    // Check cache first
    if (likedSnippetsCache.has(id)) {
      return likedSnippetsCache.get(id)!;
    }
    
    try {
      const { data } = await axios.get<Response<{ liked: boolean; likes_count: number }>>(`/api/likes/check/${id}`);
      
      // Update cache
      setLikedSnippetsCache(prev => {
        const newCache = new Map(prev);
        newCache.set(id, data.data);
        return newCache;
      });
      
      return data.data;
    } catch (error) {
      console.error('Error checking if snippet is liked:', error);
      return { liked: false, likes_count: 0 };
    }
  };
  
  // New function to batch check likes for multiple snippets
  const batchCheckLikes = async (ids: number[]): Promise<void> => {
    // Filter out IDs that are already in the cache
    const uncachedIds = ids.filter(id => !likedSnippetsCache.has(id));
    
    if (uncachedIds.length === 0) {
      return;
    }
    
    try {
      // Make parallel requests for all uncached IDs
      const requests = uncachedIds.map(id => 
        axios.get<Response<{ liked: boolean; likes_count: number }>>(`/api/likes/check/${id}`)
      );
      
      const responses = await Promise.all(requests);
      
      // Update cache with all results
      setLikedSnippetsCache(prev => {
        const newCache = new Map(prev);
        responses.forEach((response, index) => {
          newCache.set(uncachedIds[index], response.data.data);
        });
        return newCache;
      });
    } catch (error) {
      console.error('Error batch checking likes:', error);
    }
  };

  const context = {
    snippets,
    publicSnippets,
    searchResults,
    currentSnippet,
    tagCount,
    publicTagCount,
    savedSnippets,
    pagination,
    getSnippets,
    getPublicSnippets,
    getSnippetById,
    setSnippet,
    createSnippet,
    updateSnippet,
    deleteSnippet,
    toggleSnippetPin,
    toggleSnippetPublic,
    saveSnippet,
    unsaveSnippet,
    getSavedSnippets,
    checkIfSaved,
    countTags,
    countPublicTags,
    searchSnippets,
    likeSnippet,
    unlikeSnippet,
    checkIfLiked,
    batchCheckLikes,
    likedSnippetsCache
  };

  return (
    <SnippetsContext.Provider value={context}>
      {props.children}
    </SnippetsContext.Provider>
  );
};
