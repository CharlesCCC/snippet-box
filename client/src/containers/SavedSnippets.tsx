import { useEffect, useContext } from 'react';
import { SnippetsContext } from '../store';
import { SnippetGrid } from '../components/Snippets/SnippetGrid';
import { EmptyState, Layout } from '../components/UI';

export const SavedSnippets = (): JSX.Element => {
  const { savedSnippets, getSavedSnippets } = useContext(SnippetsContext);

  useEffect(() => {
    getSavedSnippets();
  }, []);

  return (
    <Layout>
      <h1 className='mb-4'>Saved Snippets</h1>
      
      {savedSnippets.length === 0 ? (
        <EmptyState
          title='No snippets saved yet'
          description='Browse snippets and click the bookmark icon to save them for later.'
        />
      ) : (
        <SnippetGrid snippets={savedSnippets} />
      )}
    </Layout>
  );
}; 