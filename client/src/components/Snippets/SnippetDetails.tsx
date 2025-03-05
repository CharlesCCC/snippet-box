import { useContext } from 'react';
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
import { mdiAccount } from '@mdi/js';

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
    code,
    id,
    isPinned,
    userId,
    likes_count = 0,
    user
  } = props.snippet;

  const history = useHistory();

  const { deleteSnippet, setSnippet } = useContext(SnippetsContext);
  const { user: currentUser } = useContext(AuthContext);

  const creationDate = dateParser(createdAt);
  const updateDate = dateParser(updatedAt);

  // Check if the current user is the owner of the snippet
  const isOwner = currentUser && userId && currentUser.id === userId;

  // const copyHandler = () => {
  //   copy(code);
  // };

  return (
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

      {/* CREATOR */}
      {user && (
        <div className={`d-flex justify-content-between align-items-center`}>
          <span>Creator</span>
          <div className="d-flex align-items-center">
            <Icon path={mdiAccount} size={0.8} className="me-1" />
            <span>{user.user_name}</span>
          </div>
        </div>
      )}

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
      <hr />

      {/* TAGS */}
      <div>
        {tags.map((tag, idx) => (
          <span className='me-2' key={idx}>
            <Badge text={tag} color='light' />
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

        {/* TODO: to be fixed */}
        {/* <Button
          text='Copy raw url'
          color='secondary'
          small
          outline
          handler={() => {
            const { protocol, host } = window.location;
            const rawUrl = `${protocol}//${host}/api/snippets/raw/${id}`;
            copy(rawUrl);
          }}
        /> */}

        <Button
          text='Copy code'
          color='secondary'
          small
          handler={() => copy(code)}
        />
      </div>
    </Card>
  );
};
