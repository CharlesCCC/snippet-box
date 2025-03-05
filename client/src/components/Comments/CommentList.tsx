import React, { useContext, useEffect, useRef } from 'react';
import { CommentContext, AuthContext } from '../../store';
import { CommentItem } from './CommentItem';
import { CommentForm } from './CommentForm';
import { Spinner, EmptyState } from '../UI';

interface Props {
  snippetId: string;
}

export const CommentList: React.FC<Props> = ({ snippetId }) => {
  const { comments, loading, getComments } = useContext(CommentContext);
  const { user, isAuthenticated } = useContext(AuthContext);
  const isMounted = useRef(true);

  // Fetch comments when component mounts with proper cleanup
  useEffect(() => {
    isMounted.current = true;
    
    // Create an async function to handle the comment fetching
    const fetchComments = async () => {
      try {
        await getComments(snippetId);
      } catch (error) {
        // Only log errors if component is still mounted
        if (isMounted.current) {
          console.error('Error fetching comments:', error);
        }
      }
    };
    
    fetchComments();
    
    // Cleanup function to prevent memory leaks
    return () => {
      isMounted.current = false;
    };
  }, [getComments, snippetId]);

  return (
    <div className="comments-section mt-4">
      {/* <h5 className="mb-3">Comments</h5> */}
      
      {/* Comment Form for authenticated users */}
      {isAuthenticated && user ? (
        <div className="mb-4">
          <CommentForm snippetId={snippetId} />
        </div>
      ) : (
        <div className="alert alert-info mb-4">
          <small>Please <a href="/login">log in</a> to leave a comment.</small>
        </div>
      )}
      
      {/* Comments List */}
      {loading ? (
        <div className="text-center py-4">
          <Spinner />
        </div>
      ) : comments.length === 0 ? (
        <EmptyState title="No comments yet. Be the first to comment!" />
      ) : (
        <div className="comments-list">
          {comments.map(comment => (
            <CommentItem 
              key={comment.id} 
              comment={comment} 
              snippetId={snippetId} 
            />
          ))}
        </div>
      )}
    </div>
  );
}; 