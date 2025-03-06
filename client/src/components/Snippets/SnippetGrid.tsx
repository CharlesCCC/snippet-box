import { useState, useEffect, useContext } from 'react';
import { Snippet } from '../../typescript/interfaces';
import { SnippetCard } from './SnippetCard';
import { Pagination } from '../UI';
import { SnippetsContext } from '../../store';

interface Props {
  snippets: Snippet[];
}

export const SnippetGrid = (props: Props): JSX.Element => {
  const { snippets } = props;
  const { batchCheckLikes } = useContext(SnippetsContext);
  const [currentPage, setCurrentPage] = useState(1);
  const [paginatedSnippets, setPaginatedSnippets] = useState<Snippet[]>([]);
  
  // TODO: Make this dynamic based on the screen size or user preference
  // Set items per page to 9 (3x3 grid)
  const itemsPerPage = 9;
  
  // Calculate total pages
  const totalPages = Math.ceil(snippets.length / itemsPerPage);
  
  // Update paginated snippets when snippets or current page changes
  useEffect(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const visibleSnippets = snippets.slice(startIndex, endIndex);
    setPaginatedSnippets(visibleSnippets);
    
    // Reset to page 1 if current page is out of bounds after snippets change
    if (currentPage > Math.ceil(snippets.length / itemsPerPage) && snippets.length > 0) {
      setCurrentPage(1);
    }
    
    // Batch fetch likes for visible snippets
    if (visibleSnippets.length > 0) {
      const snippetIds = visibleSnippets.map(snippet => snippet.id);
      batchCheckLikes(snippetIds);
    }
  }, [snippets, currentPage, batchCheckLikes]);
  
  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    // Scroll to top of grid when page changes
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <>
      <div className='row row-cols-1 row-cols-md-2 row-cols-xl-3 g-4'>
        {paginatedSnippets.map(snippet => (
          <div className='col' key={snippet.id}>
            <SnippetCard snippet={snippet} />
          </div>
        ))}
      </div>
      
      {/* Only show pagination if we have more than one page */}
      {totalPages > 1 && (
        <Pagination 
          currentPage={currentPage} 
          totalPages={totalPages} 
          onPageChange={handlePageChange} 
        />
      )}
    </>
  );
};
