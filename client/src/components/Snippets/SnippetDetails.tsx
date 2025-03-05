import { useContext, useState } from 'react';
import { useHistory } from 'react-router-dom';
import { SnippetsContext } from '../../store';
import { Snippet } from '../../typescript/interfaces';
import { dateParser } from '../../utils';
import { Badge, Button, Card } from '../UI';
import copy from 'clipboard-copy';
import { SnippetPin } from './SnippetPin';
import { SnippetLike } from './SnippetLike';
import { SnippetSave } from './SnippetSave';
import { AuthContext } from '../../store';
import Icon from '@mdi/react';
import { 
  mdiAccount, 
  mdiTwitter, 
  mdiFacebook, 
  mdiLinkedin, 
  mdiEmail,
} from '@mdi/js';
import { Link } from 'react-router-dom';

interface Props {
  snippet: Snippet;
}

export const SnippetDetails = (props: Props): JSX.Element => {
  const {
    title,
    language,
    tags,
    createdAt,
    updatedAt,
    description,
    id,
    isPinned,
    userId,
    likes_count = 0,
    user
  } = props.snippet;

  const history = useHistory();
  const [copySuccess, setCopySuccess] = useState(false);

  const { deleteSnippet, setSnippet } = useContext(SnippetsContext);
  const { user: currentUser } = useContext(AuthContext);

  const creationDate = dateParser(createdAt);
  const updateDate = dateParser(updatedAt);

  // Check if the current user is the owner of the snippet
  const isOwner = currentUser && userId && currentUser.id === userId;

  // Handle copying the URL to clipboard
  const copyUrlHandler = () => {
    const { protocol, host, pathname } = window.location;
    const url = `${protocol}//${host}${pathname}`;
    copy(url);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  // Get current page URL for sharing
  const getPageUrl = () => {
    const { protocol, host, pathname } = window.location;
    return encodeURIComponent(`${protocol}//${host}${pathname}`);
  };

  // Social share handlers
  const shareToTwitter = () => {
    const url = getPageUrl();
    const text = encodeURIComponent(`Check out this code snippet: ${title}`);
    window.open(`https://twitter.com/intent/tweet?text=${text}&url=${url}`, '_blank');
  };

  const shareToFacebook = () => {
    const url = getPageUrl();
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`, '_blank');
  };

  const shareToLinkedin = () => {
    const url = getPageUrl();
    const shareTitle = encodeURIComponent(`Code Snippet: ${title}`);
    const summary = encodeURIComponent(description || 'Check out this code snippet');
    window.open(`https://www.linkedin.com/shareArticle?mini=true&url=${url}&title=${shareTitle}&summary=${summary}`, '_blank');
  };

  const shareByEmail = () => {
    const url = getPageUrl();
    const subject = encodeURIComponent(`Code Snippet: ${title}`);
    const body = `Check out this code snippet: ${url}`;
    window.open(`mailto:?subject=${subject}&body=${body}`, '_blank');
  };

  return (
    <>
      <Card>
        <h5 className='card-title d-flex align-items-center justify-content-between'>
          <div className="d-flex align-items-center">
            {title}
            <div className="ms-2">
              <SnippetLike id={id} likes_count={likes_count} />
            </div>
          </div>
          <div className="d-flex align-items-center">
            <div className="me-2">
              <SnippetSave id={id} />
            </div>
            <SnippetPin id={id} isPinned={isPinned} />
          </div>
        </h5>
        <p>{description}</p>

        {/* LANGUAGE */}
        <div className={`d-flex justify-content-between`}>
          <span>Language</span>
          <span className='fw-bold'>{language}</span>
        </div>

        {/* CREATED AT */}
        <div className={`d-flex justify-content-between`}>
          <span>Created</span>
          <span>{creationDate.relative}</span>
        </div>

        {/* UPDATED AT */}
        <div className={`d-flex justify-content-between`}>
          <span>Last updated</span>
          <span>{updateDate.relative}</span>
        </div>
        
        {/* CREATOR */}
        {user && (
          <div className={`d-flex justify-content-between align-items-center`}>
            <span>Creator</span>
            <div className="d-flex align-items-center">
              <Icon path={mdiAccount} size={0.8} className="me-1" />
              <Link to={`/${user.user_name}`} className="text-decoration-none">
                <span>{user.user_name}</span>
              </Link>
            </div>
          </div>
        )}

        <hr />

        {/* TAGS */}
        <div>
          {tags.map((tag, idx) => (
            <span className='me-2' key={idx}>
              <a href={currentUser ? `/snippets?tag=${tag}` : `/?tag=${tag}`} className="text-decoration-none">
                <Badge text={tag} color='light' />
              </a>
            </span>
          ))}
        </div>
        <hr />

        {/* ACTIONS */}
        <div className='d-grid g-2' style={{ rowGap: '10px' }}>
          {/* Only show Delete and Edit buttons if user is the owner */}
          {isOwner && (
            <>
              <Button
                text='Delete'
                color='danger'
                small
                outline
                handler={() => deleteSnippet(id)}
              />

              <Button
                text='Edit'
                color='secondary'
                small
                outline
                handler={() => {
                  setSnippet(id);
                  history.push({
                    pathname: `/editor/${id}`,
                    state: { from: window.location.pathname }
                  });
                }}
              />
            </>
          )}

          {/* SHARE SECTION */}
          <div className='d-flex justify-content-between mb-2'>
            <div className='me-2 flex-grow-1'>
              <Button
                text={copySuccess ? 'Copied!' : 'Copy URL'}
                color='secondary'
                outline
                handler={copyUrlHandler}
              />
              {copySuccess && <span className="ms-2 text-success small">✓</span>}
            </div>
            <div className='d-flex'>
              <button 
                className='btn btn-sm btn-outline-secondary me-2' 
                onClick={shareToTwitter}
                title="Share on Twitter/X"
              >
                <Icon path={mdiTwitter} size={0.8} />
              </button>
              <button 
                className='btn btn-sm btn-outline-secondary me-2' 
                onClick={shareToFacebook}
                title="Share on Facebook"
              >
                <Icon path={mdiFacebook} size={0.8} />
              </button>
              <button 
                className='btn btn-sm btn-outline-secondary me-2' 
                onClick={shareToLinkedin}
                title="Share on LinkedIn"
              >
                <Icon path={mdiLinkedin} size={0.8} />
              </button>
              <button 
                className='btn btn-sm btn-outline-secondary' 
                onClick={shareByEmail}
                title="Share via Email"
              >
                <Icon path={mdiEmail} size={0.8} />
              </button>
            </div>
          </div>
        </div>
      </Card>
    </>
  );
};
