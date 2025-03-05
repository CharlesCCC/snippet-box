import React, { createContext, useState, useCallback, ReactNode, useRef, useEffect } from 'react';
import axios, { CancelTokenSource } from 'axios';
import { CommentCreationAttributes, Comment } from '../typescript/interfaces';

interface CommentContextProps {
  comments: Comment[];
  loading: boolean;
  error: string | null;
  getComments: (snippetId: string) => Promise<void>;
  addComment: (snippetId: string, commentData: CommentCreationAttributes) => Promise<Comment | null>;
  updateComment: (commentId: string, content: string) => Promise<Comment | null>;
  deleteComment: (commentId: string) => Promise<void>;
  clearError: () => void;
}

export const CommentContext = createContext<CommentContextProps>({
  comments: [],
  loading: false,
  error: null,
  getComments: async () => {},
  addComment: async () => null,
  updateComment: async () => null,
  deleteComment: async () => {},
  clearError: () => {}
});

interface CommentProviderProps {
  children: ReactNode;
}

export const CommentProvider: React.FC<CommentProviderProps> = ({ children }) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  // Maintain a ref to track if component is mounted
  const isMounted = useRef(true);
  // Ref for cancel tokens
  const cancelTokenRef = useRef<CancelTokenSource | null>(null);
  
  // Set up component mount/unmount tracking
  useEffect(() => {
    isMounted.current = true;
    
    return () => {
      isMounted.current = false;
      // Cancel any pending requests on unmount
      if (cancelTokenRef.current) {
        cancelTokenRef.current.cancel('Component unmounted');
        cancelTokenRef.current = null;
      }
    };
  }, []);

  // Cancel previous request if a new one is made
  const cancelPreviousRequest = () => {
    if (cancelTokenRef.current) {
      cancelTokenRef.current.cancel('New request made');
      cancelTokenRef.current = null;
    }
  };

  // Clear error
  const clearError = useCallback(() => {
    if (isMounted.current) {
      setError(null);
    }
  }, []);

  // Get comments for a snippet
  const getComments = useCallback(async (snippetId: string) => {
    // Cancel any pending requests
    cancelPreviousRequest();
    
    // Create a new cancel token
    cancelTokenRef.current = axios.CancelToken.source();
    
    if (isMounted.current) {
      setLoading(true);
    }
    
    try {
      const res = await axios.get(`/api/snippets/${snippetId}/comments`, {
        cancelToken: cancelTokenRef.current.token
      });
      
      if (isMounted.current) {
        setComments(res.data.data);
        setLoading(false);
      }
    } catch (err: any) {
      // Don't update state if the request was cancelled or component unmounted
      if (axios.isCancel(err)) {
        return;
      }
      
      if (isMounted.current) {
        setError(err.response?.data?.error || 'Failed to fetch comments');
        setLoading(false);
      }
    }
  }, []);

  // Add a new comment
  const addComment = useCallback(async (snippetId: string, commentData: CommentCreationAttributes) => {
    // Cancel any pending requests
    cancelPreviousRequest();
    
    // Create a new cancel token
    cancelTokenRef.current = axios.CancelToken.source();
    
    if (isMounted.current) {
      setLoading(true);
    }
    
    try {
      const res = await axios.post(`/api/snippets/${snippetId}/comments`, commentData, {
        cancelToken: cancelTokenRef.current.token
      });
      
      if (isMounted.current) {
        // If it's a reply to an existing comment
        if (commentData.parentId) {
          // Find the parent comment and add the reply to it
          setComments(prevComments => {
            return prevComments.map(comment => {
              if (comment.id === commentData.parentId) {
                return {
                  ...comment,
                  replies: [...(comment.replies || []), res.data.data]
                };
              }
              return comment;
            });
          });
        } else {
          // It's a top-level comment, add it to the beginning of the list
          setComments(prevComments => [res.data.data, ...prevComments]);
        }
        
        setLoading(false);
      }
      
      return res.data.data;
    } catch (err: any) {
      // Don't update state if the request was cancelled or component unmounted
      if (axios.isCancel(err)) {
        return null;
      }
      
      if (isMounted.current) {
        setError(err.response?.data?.error || 'Failed to add comment');
        setLoading(false);
      }
      return null;
    }
  }, []);

  // Update a comment
  const updateComment = useCallback(async (commentId: string, content: string) => {
    // Cancel any pending requests
    cancelPreviousRequest();
    
    // Create a new cancel token
    cancelTokenRef.current = axios.CancelToken.source();
    
    if (isMounted.current) {
      setLoading(true);
    }
    
    try {
      const res = await axios.put(`/api/comments/${commentId}`, { content }, {
        cancelToken: cancelTokenRef.current.token
      });
      
      if (isMounted.current) {
        // Update the comment in the state
        setComments(prevComments => {
          // Check if it's a top-level comment
          const topLevelIndex = prevComments.findIndex(c => c.id === commentId);
          
          if (topLevelIndex !== -1) {
            // It's a top-level comment
            const updatedComments = [...prevComments];
            updatedComments[topLevelIndex] = res.data.data;
            return updatedComments;
          } else {
            // It's a reply, search through all comments' replies
            return prevComments.map(comment => {
              if (comment.replies) {
                const replyIndex = comment.replies.findIndex((r: { id: string }) => r.id === commentId);
                if (replyIndex !== -1) {
                  // Found the reply, update it
                  const updatedReplies = [...comment.replies];
                  updatedReplies[replyIndex] = res.data.data;
                  return { ...comment, replies: updatedReplies };
                }
              }
              return comment;
            });
          }
        });
        
        setLoading(false);
      }
      
      return res.data.data;
    } catch (err: any) {
      // Don't update state if the request was cancelled or component unmounted
      if (axios.isCancel(err)) {
        return null;
      }
      
      if (isMounted.current) {
        setError(err.response?.data?.error || 'Failed to update comment');
        setLoading(false);
      }
      return null;
    }
  }, []);

  // Delete a comment
  const deleteComment = useCallback(async (commentId: string) => {
    // Cancel any pending requests
    cancelPreviousRequest();
    
    // Create a new cancel token
    cancelTokenRef.current = axios.CancelToken.source();
    
    if (isMounted.current) {
      setLoading(true);
    }
    
    try {
      await axios.delete(`/api/comments/${commentId}`, {
        cancelToken: cancelTokenRef.current.token
      });
      
      if (isMounted.current) {
        // Remove the comment from the state
        setComments(prevComments => {
          // Check if it's a top-level comment
          const topLevelIndex = prevComments.findIndex(c => c.id === commentId);
          
          if (topLevelIndex !== -1) {
            // It's a top-level comment, remove it
            const updatedComments = [...prevComments];
            updatedComments.splice(topLevelIndex, 1);
            return updatedComments;
          } else {
            // It's a reply, search through all comments' replies
            return prevComments.map(comment => {
              if (comment.replies) {
                const replyIndex = comment.replies.findIndex((r: { id: string; }) => r.id === commentId);
                if (replyIndex !== -1) {
                  // Found the reply, remove it
                  const updatedReplies = [...comment.replies];
                  updatedReplies.splice(replyIndex, 1);
                  return { ...comment, replies: updatedReplies };
                }
              }
              return comment;
            });
          }
        });
        
        setLoading(false);
      }
    } catch (err: any) {
      // Don't update state if the request was cancelled or component unmounted
      if (axios.isCancel(err)) {
        return;
      }
      
      if (isMounted.current) {
        setError(err.response?.data?.error || 'Failed to delete comment');
        setLoading(false);
      }
    }
  }, []);

  return (
    <CommentContext.Provider
      value={{
        comments,
        loading,
        error,
        getComments,
        addComment,
        updateComment,
        deleteComment,
        clearError
      }}
    >
      {children}
    </CommentContext.Provider>
  );
}; 