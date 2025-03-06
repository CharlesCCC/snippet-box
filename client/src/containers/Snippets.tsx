import { useEffect, useContext, useState, Fragment } from 'react';
import { SnippetsContext } from '../store';
import { SnippetGrid } from '../components/Snippets/SnippetGrid';
import { Button, Card, EmptyState, Layout, PageHeader } from '../components/UI';
import { Snippet } from '../typescript/interfaces';
import { useHistory, useLocation } from 'react-router-dom';

export const Snippets = (): JSX.Element => {
  const { 
    snippets, 
    tagCount, 
    getSnippets, 
    countTags, 
    pagination, 
    currentSort,
    batchCheckLikes 
  } = useContext(SnippetsContext);
  const history = useHistory();
  const location = useLocation();

  const [filter, setFilter] = useState<string | null>(null);
  const [localSnippets, setLocalSnippets] = useState<Snippet[]>([]);

  useEffect(() => {
    getSnippets();
    countTags();
  }, []);

  // Read filter from URL query parameter on initial load
  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const tagParam = queryParams.get('tag');
    
    if (tagParam && snippets.length > 0) {
      setFilter(tagParam);
      const filteredSnippets = snippets.filter(s => s.tags.includes(tagParam));
      setLocalSnippets(filteredSnippets);
    } else {
      setLocalSnippets([...snippets]);
    }
  }, [snippets, location.search]);

  const filterHandler = (tag: string) => {
    // Update URL query parameter
    const queryParams = new URLSearchParams(location.search);
    queryParams.set('tag', tag);
    history.push({
      pathname: location.pathname,
      search: queryParams.toString()
    });

    setFilter(tag);
    const filteredSnippets = snippets.filter(s => s.tags.includes(tag));
    setLocalSnippets(filteredSnippets);
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
    setLocalSnippets([...snippets]);
  };
  
  // Add handler for pagination
  const handleSnippetPageChange = (page: number) => {
    getSnippets(page, pagination.limit);
  };

  // Add handler for sorting
  const handleSnippetSortChange = (sort: string) => {
    getSnippets(1, pagination.limit, sort);
  };

  return (
    <Layout>
      {snippets.length === 0 ? (
        <EmptyState />
      ) : (
        <Fragment>
          <PageHeader title='My Snippets' />
          <div className='row'>
            <div className='col-12 col-md-4 col-lg-3'>
              <Card>
                <h5 className='card-title'>All snippets</h5>
                <div className='mb-3 d-flex justify-content-between'>
                  <span>Total</span>
                  <span>{pagination.total || snippets.length}</span>
                </div>
                <hr />

                <h5 className='card-title'>Filter by tags</h5>
                <Fragment>
                  {tagCount.map((tag, idx) => {
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
              <SnippetGrid 
                snippets={localSnippets}
                onSortChange={handleSnippetSortChange}
                onPageChange={handleSnippetPageChange}
                currentSort={currentSort}
                showSortControls={true}
                pagination={pagination}
              />
            </div>
          </div>
        </Fragment>
      )}
    </Layout>
  );
};
