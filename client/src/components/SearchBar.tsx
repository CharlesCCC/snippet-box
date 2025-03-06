import { useRef, useEffect, KeyboardEvent, useContext } from 'react';
import { SnippetsContext } from '../store';
import { searchParser } from '../utils';
import { SearchQuery } from '../typescript/interfaces';

export const SearchBar = (): JSX.Element => {
  const { searchSnippets } = useContext(SnippetsContext);
  const inputRef = useRef<HTMLInputElement>(document.createElement('input'));

  useEffect(() => {
    inputRef.current.focus();
  }, [inputRef]);

  const inputHandler = (e: KeyboardEvent<HTMLInputElement>) => {
    const inputValue = inputRef.current.value;
    
    // Check if the input contains any special filter syntax
    const hasFilters = inputValue.match(/(tags|lang):[a-zA-Z]+(,[a-zA-Z]+)*/);
    
    if (hasFilters) {
      // If it has filters, use the structured search format
      const parsedQuery = searchParser(inputValue);
      const searchQuery: SearchQuery = {
        query: parsedQuery.query,
        tags: parsedQuery.tags,
        languages: parsedQuery.languages
      };
      
      if (e.key === 'Enter') {
        searchSnippets(searchQuery);
      }
    } else {
      // If it's a simple search, use the simpler format
      if (e.key === 'Enter' && inputValue.trim()) {
        searchSnippets({ 
          searchText: inputValue.trim(),
          query: '',
          tags: [],
          languages: []
        });
      }
    }
    
    // Handle Escape key to clear search
    if (e.key === 'Escape') {
      inputRef.current.value = '';
      searchSnippets({ query: '', tags: [], languages: [] });
    }
  };

  return (
    <div className='mb-3'>
      <input
        type='text'
        className='form-control'
        placeholder='e.g. midjourney'
        ref={inputRef}
        onKeyUp={e => inputHandler(e)}
      />
      <div className='form-text text-gray ms-1'>
        Search by pressing `Enter`. Clear with `Esc`. 
      </div>
    </div>
  );
};
