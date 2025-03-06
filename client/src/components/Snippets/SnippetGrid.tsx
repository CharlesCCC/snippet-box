import { useState, useEffect, useContext, useRef } from 'react';
import { Snippet } from '../../typescript/interfaces';
import { SnippetCard } from './SnippetCard';
import { Pagination, Button, ButtonGroup } from '../UI';
import { SnippetsContext } from '../../store';

interface Props {
  snippets: Snippet[];
  onSortChange?: (sortOption: string) => void;
  onPageChange?: (page: number) => void;
  currentSort?: string;
  showSortControls?: boolean;
  pagination?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export const SnippetGrid = (props: Props): JSX.Element => {
  const { 
    snippets, 
    onSortChange, 
    onPageChange, 
    currentSort = 'most_recent', 
    showSortControls = false,
    pagination 
  } = props;
  const { batchCheckLikes, likedSnippetsCache } = useContext(SnippetsContext);
  const [currentPage, setCurrentPage] = useState(1);
  const [paginatedSnippets, setPaginatedSnippets] = useState<Snippet[]>([]);
  const checkedSnippetsRef = useRef<Set<string>>(new Set());
  
  // Default to client-side pagination if no server pagination is provided
  const useServerPagination = !!pagination && !!onPageChange;
  
  // If using client-side pagination, set items per page to 9 (3x3 grid)
  // If using server pagination, use all snippets provided
  const itemsPerPage = useServerPagination ? snippets.length : 9;
  
  // Calculate total pages
  const totalPages = useServerPagination 
    ? pagination?.totalPages || 1 
    : Math.ceil(snippets.length / itemsPerPage);
  
  // Update paginated snippets when snippets change
  useEffect(() => {
    if (!useServerPagination) {
      // Client-side pagination
      const startIndex = (currentPage - 1) * itemsPerPage;
      const endIndex = startIndex + itemsPerPage;
      const visibleSnippets = snippets.slice(startIndex, endIndex);
      setPaginatedSnippets(visibleSnippets);
      
      // Reset to page 1 if current page is out of bounds after snippets change
      if (currentPage > Math.ceil(snippets.length / itemsPerPage) && snippets.length > 0) {
        setCurrentPage(1);
      }
    } else {
      // Server-side pagination - use all provided snippets
      setPaginatedSnippets(snippets);
      // Update current page from pagination prop
      if (pagination?.page && pagination.page !== currentPage) {
        setCurrentPage(pagination.page);
      }
    }
  }, [snippets, currentPage, useServerPagination, pagination, itemsPerPage]);

  // Separate effect for batch checking likes
  useEffect(() => {
    // Only batch check if we have snippets and they're not already in cache or checked
    if (snippets.length > 0) {
      const uncachedSnippetIds = snippets
        .map(snippet => snippet.id)
        .filter(id => !likedSnippetsCache.has(id) && !checkedSnippetsRef.current.has(id));

      if (uncachedSnippetIds.length > 0) {
        // Add to checked set before making the request
        uncachedSnippetIds.forEach(id => checkedSnippetsRef.current.add(id));
        batchCheckLikes(uncachedSnippetIds);
      }
    }

    // Reset checked snippets when component unmounts
    return () => {
      checkedSnippetsRef.current.clear();
    };
  }, [snippets]);
  
  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    // Scroll to top of grid when page changes
    // window.scrollTo({ top: 0, behavior: 'smooth' });
    // Call parent's onPageChange if provided
    if (onPageChange) {
      onPageChange(page);
    }
  };

  // Handle sort change
  const handleSortChange = (sortOption: string) => {
    if (onSortChange) {
      onSortChange(sortOption);
      // Reset to page 1 when changing sort
      setCurrentPage(1);
    }
  };

  return (
    <>
      {/* Sort controls */}
      {showSortControls && (
        <div className='d-flex justify-content-end align-items-center mb-3'>
          <div className='d-flex gap-2 align-items-center'>
            <span className='me-2'>Sort by:</span>
            <ButtonGroup>
              <Button
                size='sm'
                variant={currentSort === 'most_liked' ? 'primary' : 'outline-secondary'}
                onClick={() => handleSortChange('most_liked')}
              >
                Most Liked
              </Button>
              <Button
                size='sm'
                variant={currentSort === 'most_recent' ? 'primary' : 'outline-secondary'}
                onClick={() => handleSortChange('most_recent')}
              >
                Most Recent
              </Button>
            </ButtonGroup>
          </div>
        </div>
      )}

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
          currentPage={useServerPagination ? pagination?.page || 1 : currentPage} 
          totalPages={totalPages} 
          onPageChange={handlePageChange} 
        />
      )}
    </>
  );
};
