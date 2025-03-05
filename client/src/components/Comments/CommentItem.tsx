import React, { useState, useContext, useRef, useEffect } from 'react';
import { Comment } from '../../typescript/interfaces';
import { AuthContext, CommentContext } from '../../store';
import { dateParser } from '../../utils';
import { Link } from 'react-router-dom';
import Icon from '@mdi/react';
import { mdiAccount, mdiReply, mdiPencil, mdiDelete, mdiFormatQuoteOpen } from '@mdi/js';
import { CommentForm } from './CommentForm';

interface Props {
  comment: Comment;
  snippetId: string;
}

export const CommentItem: React.FC<Props> = ({ comment, snippetId }) => {
  const { user: currentUser } = useContext(AuthContext);
  const { deleteComment } = useContext(CommentContext);
  
  const [isEditing, setIsEditing] = useState(false);
  const [isReplying, setIsReplying] = useState(false);
  const [isQuoting, setIsQuoting] = useState(false);
  const isMounted = useRef(true);
  
  const { id, content, createdAt, user, replies = [] } = comment;
  const formattedDate = dateParser(createdAt).relative;
  
  // Set up and clean up isMounted ref
  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);
  
  // Check if the current user is the owner of the comment
  const isOwner = currentUser && user && currentUser.id === user.id;
  
  // Handle delete comment
  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this comment?')) {
      deleteComment(id);
    }
  };
  
  // Handle state changes with mount check
  const toggleEditing = (value: boolean) => {
    if (isMounted.current) {
      setIsEditing(value);
    }
  };
  
  const toggleReplying = (value: boolean) => {
    if (isMounted.current) {
      setIsReplying(value);
      if (value) setIsQuoting(false);
    }
  };
  
  const toggleQuoting = (value: boolean) => {
    if (isMounted.current) {
      setIsQuoting(value);
      if (value) setIsReplying(false);
    }
  };
  
  // Format content to highlight mentioned users
  const formatContent = (text: string) => {
    // Replace @username with styled span
    return text.replace(/@(\w+)/g, '<span class="text-primary fw-bold">@$1</span>');
  };
  
  return (
    <div className="comment mb-3">
      <div className="card">
        <div className="card-body">
          {/* Comment Header */}
          <div className="d-flex justify-content-between align-items-center mb-2">
            <div className="d-flex align-items-center">
              <Icon path={mdiAccount} size={0.8} className="me-1" />
              {user && (
                <Link to={`/${user.user_name}`} className="text-decoration-none me-2">
                  <span className="fw-bold">{user.user_name}</span>
                </Link>
              )}
              <small className="text-muted">{formattedDate}</small>
            </div>
            
            {/* Comment Actions */}
            {isOwner && (
              <div>
                <button 
                  className="btn btn-sm btn-link text-secondary" 
                  onClick={() => toggleEditing(!isEditing)}
                  title="Edit comment"
                >
                  <Icon path={mdiPencil} size={0.7} />
                </button>
                <button 
                  className="btn btn-sm btn-link text-danger" 
                  onClick={handleDelete}
                  title="Delete comment"
                >
                  <Icon path={mdiDelete} size={0.7} />
                </button>
              </div>
            )}
          </div>
          
          {/* Quoted Text */}
          {comment.quotedText && (
            <div className="quoted-text bg-light p-2 mb-2 border-start border-4 border-secondary">
              <small className="text-muted">
                <Icon path={mdiFormatQuoteOpen} size={0.7} className="me-1" />
                {comment.quotedText}
              </small>
            </div>
          )}
          
          {/* Comment Content */}
          {isEditing ? (
            <CommentForm 
              snippetId={snippetId} 
              commentId={id} 
              initialContent={content}
              onCancel={() => toggleEditing(false)}
              isEdit={true}
            />
          ) : (
            <div 
              className="comment-content" 
              dangerouslySetInnerHTML={{ __html: formatContent(content) }}
            />
          )}
          
          {/* Comment Actions */}
          {currentUser && !isEditing && (
            <div className="mt-2">
              <button 
                className="btn btn-sm btn-link text-secondary me-2" 
                onClick={() => toggleReplying(!isReplying)}
              >
                <Icon path={mdiReply} size={0.7} className="me-1" />
                Reply
              </button>
              <button 
                className="btn btn-sm btn-link text-secondary" 
                onClick={() => toggleQuoting(!isQuoting)}
              >
                <Icon path={mdiFormatQuoteOpen} size={0.7} className="me-1" />
                Quote
              </button>
            </div>
          )}
          
          {/* Reply Form */}
          {isReplying && (
            <div className="mt-3">
              <CommentForm 
                snippetId={snippetId} 
                parentId={id}
                onCancel={() => toggleReplying(false)}
              />
            </div>
          )}
          
          {/* Quote Reply Form */}
          {isQuoting && (
            <div className="mt-3">
              <CommentForm 
                snippetId={snippetId} 
                parentId={id}
                quotedText={content}
                onCancel={() => toggleQuoting(false)}
              />
            </div>
          )}
          
          {/* Replies */}
          {replies.length > 0 && (
            <div className="replies mt-3 ms-4 border-start ps-3">
              {replies.map(reply => (
                <div key={reply.id} className="reply mb-2">
                  <div className="d-flex justify-content-between align-items-center mb-1">
                    <div className="d-flex align-items-center">
                      <Icon path={mdiAccount} size={0.7} className="me-1" />
                      {reply.user && (
                        <Link to={`/${reply.user.user_name}`} className="text-decoration-none me-2">
                          <span className="fw-bold">{reply.user.user_name}</span>
                        </Link>
                      )}
                      <small className="text-muted">{dateParser(reply.createdAt).relative}</small>
                    </div>
                    
                    {/* Reply Actions */}
                    {currentUser && reply.user && currentUser.id === reply.user.id && (
                      <div>
                        <button 
                          className="btn btn-sm btn-link text-danger" 
                          onClick={() => deleteComment(reply.id)}
                          title="Delete reply"
                        >
                          <Icon path={mdiDelete} size={0.6} />
                        </button>
                      </div>
                    )}
                  </div>
                  
                  {/* Quoted Text in Reply */}
                  {reply.quotedText && (
                    <div className="quoted-text bg-light p-2 mb-2 border-start border-3 border-secondary">
                      <small className="text-muted">
                        <Icon path={mdiFormatQuoteOpen} size={0.6} className="me-1" />
                        {reply.quotedText}
                      </small>
                    </div>
                  )}
                  
                  {/* Reply Content */}
                  <div 
                    className="reply-content" 
                    dangerouslySetInnerHTML={{ __html: formatContent(reply.content) }}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}; 