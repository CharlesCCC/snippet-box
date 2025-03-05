import { useEffect, useContext, Fragment, useState, useRef, useCallback } from 'react';
import { SnippetsContext } from '../store';
import { Layout, PageHeader, EmptyState, Card, Button } from '../components/UI';
import { SnippetGrid } from '../components/Snippets/SnippetGrid';
import { SearchBar } from '../components/SearchBar';
import { Snippet } from '../typescript/interfaces';
import { useHistory, useLocation } from 'react-router-dom';

export const Home = (): JSX.Element => {
  const { 
    snippets, 
    publicSnippets, 
    getSnippets, 
    getPublicSnippets, 
    searchResults, 
    publicTagCount, 
    pagination, 
    countPublicTags,
    batchCheckLikes
  } = useContext(SnippetsContext);
  const history = useHistory();
  const location = useLocation();
  const [filter, setFilter] = useState<string | null>(null);
  const [localPublicSnippets, setLocalPublicSnippets] = useState<Snippet[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const prevPublicSnippetsRef = useRef<Snippet[]>([]);

  useEffect(() => {
    getSnippets();
    getPublicSnippets();
    countPublicTags();
  }, []);

  useEffect(() => {
    // Only update if the actual content changed
    if (JSON.stringify(prevPublicSnippetsRef.current) !== JSON.stringify(publicSnippets)) {
      // Check if there's a tag filter in URL
      const queryParams = new URLSearchParams(location.search);
      const tagParam = queryParams.get('tag');
      
      if (tagParam && publicSnippets.length > 0) {
        setFilter(tagParam);
        
        // Apply filter from URL
        const filteredSnippets = publicSnippets.filter(snippet => {
          if (Array.isArray(snippet.tags)) {
            // If tags is an array of strings
            if (typeof snippet.tags[0] === 'string') {
              return snippet.tags.includes(tagParam);
            }
            // If tags is an array of objects with name property
            else if (typeof snippet.tags[0] === 'object') {
              return snippet.tags.some((t: any) => t.name === tagParam);
            }
          }
          return false;
        });
        
        setLocalPublicSnippets(filteredSnippets);
      } else {
        setLocalPublicSnippets([...publicSnippets]);
      }
      
      prevPublicSnippetsRef.current = [...publicSnippets];
      
      if (process.env.NODE_ENV === 'development') {
        console.log('Public snippets updated:', publicSnippets);
      }
      
      if (publicSnippets.length > 0) {
        const firstPageSnippets = publicSnippets.slice(0, pagination.limit);
        const snippetIds = firstPageSnippets.map(snippet => snippet.id);
        batchCheckLikes(snippetIds);
      }
    }
  }, [publicSnippets, pagination.limit, batchCheckLikes, location.search]);

  useEffect(() => {
    console.log('Public tag count updated:', publicTagCount);
  }, [publicTagCount]);

  // Setup IntersectionObserver to automatically load more data
  const loadMoreHandler = useCallback(() => {
    if (pagination.page < pagination.totalPages && !isLoading) {
      setIsLoading(true);
      getPublicSnippets(pagination.page + 1).finally(() => {
        setIsLoading(false);
      });
    }
  }, [pagination.page, pagination.totalPages, isLoading, getPublicSnippets]);

  useEffect(() => {
    // Create IntersectionObserver to detect when user scrolls near the bottom
    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    observerRef.current = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting && pagination.total >= 9) {
          loadMoreHandler();
        }
      },
      { threshold: 0.1 }
    );

    // Observe the load more element
    if (loadMoreRef.current) {
      observerRef.current.observe(loadMoreRef.current);
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [loadMoreHandler, pagination.total]);

  const filterHandler = (tag: string) => {
    // Update URL query parameter
    const queryParams = new URLSearchParams(location.search);
    queryParams.set('tag', tag);
    history.push({
      pathname: location.pathname,
      search: queryParams.toString()
    });
    
    setFilter(tag);
    // Check if tags is an array of strings or an array of objects with name property
    const filteredSnippets = publicSnippets.filter(snippet => {
      if (Array.isArray(snippet.tags)) {
        // If tags is an array of strings
        if (typeof snippet.tags[0] === 'string') {
          return snippet.tags.includes(tag);
        }
        // If tags is an array of objects with name property
        else if (typeof snippet.tags[0] === 'object') {
          return snippet.tags.some((t: any) => t.name === tag);
        }
      }
      return false;
    });
    setLocalPublicSnippets(filteredSnippets);
  };

  const clearFilterHandler = () => {
    // Remove tag from URL query parameter
    const queryParams = new URLSearchParams(location.search);
    queryParams.delete('tag');
    history.push({
      pathname: location.pathname,
      search: queryParams.toString()
    });
    
    setFilter(null);
    setLocalPublicSnippets([...publicSnippets]);
  };

  return (
    <Layout>
      {snippets.length === 0 ? (
        <EmptyState />
      ) : (
        <Fragment>
          <PageHeader title='Search' />
          <SearchBar />
          <div className='col-12 mb-4'>
            <SnippetGrid snippets={searchResults} />
          </div>

          {snippets.some(s => s.isPinned) && (
            <Fragment>
              <PageHeader title='Pinned snippets' />
              <div className='col-12 mt-3'>
                <SnippetGrid snippets={snippets.filter(s => s.isPinned)} />
              </div>
            </Fragment>
          )}

          <Fragment>
            <PageHeader title='Public snippets' />
            <div className='row'>
              <div className='col-12 col-md-4 col-lg-3'>
                <Card>
                  <h5 className='card-title'>All snippets</h5>
                  <div className='mb-3 d-flex justify-content-between'>
                    <span>Total</span>
                    <span>{pagination.total}</span>
                  </div>
                  <hr />

                  <h5 className='card-title'>Filter by tags</h5>
                  <Fragment>
                    {publicTagCount.map((tag, idx) => {
                      const isActiveFilter = filter === tag.name;
                      return (
                        <div
                          key={idx}
                          className={`d-flex justify-content-between cursor-pointer ${
                            isActiveFilter && 'text-success'
                          }`}
                          onClick={() => filterHandler(tag.name)}
                        >
                          <span>{tag.name}</span>
                          <span>{tag.count}</span>
                        </div>
                      );
                    })}
                  </Fragment>
                  <div className='d-grid mt-3'>
                    <Button
                      text='Clear filters'
                      color='secondary'
                      small
                      outline
                      handler={clearFilterHandler}
                    />
                  </div>
                </Card>
              </div>
              <div className='col-12 col-md-8 col-lg-9'>
                <SnippetGrid snippets={localPublicSnippets} />
                {pagination.page < pagination.totalPages && (
                  <div className='d-grid mt-4' ref={loadMoreRef}>
                    {isLoading ? (
                      <div className="text-center">
                        <div className="spinner-border text-primary" role="status">
                          <span className="visually-hidden">Loading...</span>
                        </div>
                      </div>
                    ) : pagination.total < 9 ? (
                      <Button
                        text='Load more'
                        color='primary'
                        handler={loadMoreHandler}
                      />
                    ) : null}
                  </div>
                )}
              </div>
            </div>
          </Fragment>
        </Fragment>
      )}
    </Layout>
  );
};
