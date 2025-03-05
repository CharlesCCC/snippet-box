import { Link, useLocation } from 'react-router-dom';
import { useContext } from 'react';
import { Snippet } from '../../typescript/interfaces';
import { dateParser, badgeColor } from '../../utils';
import { Badge, Button, Card } from '../UI';
import { SnippetsContext } from '../../store';
import copy from 'clipboard-copy';
import { SnippetPin } from './SnippetPin';
import { SnippetPublic } from './SnippetPublic';
import { SnippetLike } from './SnippetLike';
import Icon from '@mdi/react';
import { mdiAccount } from '@mdi/js';

interface Props {
  snippet: Snippet;
}

export const SnippetCard = (props: Props): JSX.Element => {
  const { title, description, language, code, id, createdAt, isPinned, is_public, likes_count = 0, user } =
    props.snippet;
  const { setSnippet } = useContext(SnippetsContext);
  const location = useLocation();

  const copyHandler = () => {
    copy(code);
  };

  return (
    <Card classes='h-100' bodyClasses='d-flex flex-column'>
      {/* TITLE */}
      <h5 className='card-title d-flex align-items-center justify-content-between'>
        {title}
        <div className='d-flex align-items-center'>
          <div className='me-2'>
            <SnippetPublic id={id} is_public={is_public} />
          </div>
          <SnippetPin id={id} isPinned={isPinned} />
        </div>
      </h5>

      <h6 className='card-subtitle mb-2 text-muted'>
        {/* LANGUAGE */}
        <Badge text={language} color={badgeColor(language)} />
      </h6>

      {/* DESCRIPTION */}
      <p>{description ? description : 'No description'}</p>

      <div className='mt-auto'>
        {/* CREATOR AND DATE */}
        <div className="d-flex align-items-center justify-content-between mb-2">
          {user && (
            <div className="d-flex align-items-center">
              <Icon path={mdiAccount} size={0.8} className="me-1" />
              <Link to={`/${user.user_name}`} className="text-decoration-none">
                <small className="text-muted">{user.user_name}</small>
              </Link>
            </div>
          )}
          <p className="mb-0 small">{dateParser(createdAt).relative}</p>
        </div>
        
        {/* LIKES */}
        <div className="d-flex justify-content-end">
          <SnippetLike id={id} likes_count={likes_count} />
        </div>
        <hr />

        {/* ACTIONS */}
        <div className='d-flex justify-content-end'>
          <Link
            to={{
              pathname: `/snippet/${id}`,
              search: location.search,
              state: { from: window.location.pathname + location.search }
            }}
          >
            <Button
              text='View'
              color='secondary'
              outline
              classes='me-2'
              handler={() => {
                setSnippet(id);
              }}
            />
          </Link>
          <Button
            text='Copy'
            color='secondary'
            handler={copyHandler}
          />
        </div>
      </div>
    </Card>
  );
};
