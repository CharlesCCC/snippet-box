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
    const parsedQuery = searchParser(inputRef.current.value);
    const searchQuery: SearchQuery = {
      query: parsedQuery.toString(),
      tags: [],
      languages: []
    };

    if (e.key === 'Enter') {
      searchSnippets(searchQuery);
    } else if (e.key === 'Escape') {
      inputRef.current.value = '';
      searchSnippets({ query: '', tags: [], languages: [] });
    }
  };

  return (
    <div className='mb-3'>
      <input
        type='text'
        className='form-control'
        placeholder='card lang:typescript tags:ui,react'
        ref={inputRef}
        onKeyUp={e => inputHandler(e)}
      />
      <div className='form-text text-gray ms-1'>
        Search by pressing `Enter`. Clear with `Esc`. Read more about available
        filters{' '}
        <a
          href='https://github.com/pawelmalak/snippet-box/wiki/Search-filters'
          target='_blank'
          rel='noreferrer'
          className='text-success text-decoration-none'
        >
          here
        </a>
      </div>
    </div>
  );
};
