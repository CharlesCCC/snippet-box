import React, { useState, useContext, useEffect, useRef } from 'react';
import { CommentContext } from '../../store';

interface Props {
  snippetId: string;
  parentId?: string;
  commentId?: string;
  initialContent?: string;
  quotedText?: string;
  onCancel?: () => void;
  isEdit?: boolean;
}

export const CommentForm: React.FC<Props> = ({
  snippetId,
  parentId,
  commentId,
  initialContent = '',
  quotedText,
  onCancel,
  isEdit = false
}) => {
  const [content, setContent] = useState(initialContent);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { addComment, updateComment } = useContext(CommentContext);
  const isMounted = useRef(true);

  // Set up and clean up isMounted ref
  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  // Reset form when initialContent changes
  useEffect(() => {
    setContent(initialContent);
  }, [initialContent]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!content.trim()) return;
    
    setIsSubmitting(true);
    
    try {
      if (isEdit && commentId) {
        // Update existing comment
        await updateComment(commentId, content);
      } else {
        // Add new comment
        await addComment(snippetId, {
          content,
          snippetId,
          parentId,
          quotedText
        });
      }
      
      // Only update state if component is still mounted
      if (isMounted.current) {
        // Reset form if not editing
        if (!isEdit) {
          setContent('');
        }
        
        // Call onCancel to close form if provided
        if (onCancel) {
          onCancel();
        }
      }
    } catch (error) {
      console.error('Error submitting comment:', error);
    } finally {
      // Only update state if component is still mounted
      if (isMounted.current) {
        setIsSubmitting(false);
      }
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Show quoted text if provided */}
      {quotedText && !isEdit && (
        <div className="quoted-text bg-light p-2 mb-2 border-start border-4 border-secondary">
          <small className="text-muted">{quotedText}</small>
        </div>
      )}
      
      <div className="form-group mb-2">
        <textarea
          className="form-control"
          rows={3}
          placeholder={parentId ? "Write a reply..." : "Write a comment..."}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          required
        />
        <small className="form-text text-muted">
          Use @username to mention users
        </small>
      </div>
      
      <div className="d-flex justify-content-end">
        {onCancel && (
          <button
            type="button"
            className="btn btn-sm btn-outline-secondary me-2"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Cancel
          </button>
        )}
        
        <button
          type="submit"
          className="btn btn-sm btn-primary"
          disabled={isSubmitting || !content.trim()}
        >
          {isSubmitting ? 'Submitting...' : isEdit ? 'Update' : parentId ? 'Reply' : 'Comment'}
        </button>
      </div>
    </form>
  );
}; 