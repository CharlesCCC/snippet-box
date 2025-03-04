import { useState, createContext, useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import axios from 'axios';
import {
  Context,
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
    
    console.log('Interceptor token:', token);
    
    if (token) {
      const tokenValue = token.split('=')[1];
      config.headers.Authorization = `Bearer ${tokenValue}`;
    } else {
      console.warn('No token found in cookies');
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
  countTags: () => Promise<void>;
  countPublicTags: () => Promise<void>;
  searchSnippets: (query: SearchQuery) => Promise<void>;
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
    } catch (error) {
      console.error('Error fetching public snippets:', error);
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
      const { data } = await axios.post('/api/snippets/search', query);
      setSearchResults(data.data);
    } catch (error) {
      console.error('Error searching snippets:', error);
    }
  };

  const context = {
    snippets,
    publicSnippets,
    searchResults,
    currentSnippet,
    tagCount,
    publicTagCount,
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
    countTags,
    countPublicTags,
    searchSnippets
  };

  return (
    <SnippetsContext.Provider value={context}>
      {props.children}
    </SnippetsContext.Provider>
  );
};
