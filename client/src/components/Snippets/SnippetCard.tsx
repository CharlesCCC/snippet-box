import { Link } from 'react-router-dom';
import { useContext } from 'react';
import { Snippet } from '../../typescript/interfaces';
import { dateParser, badgeColor } from '../../utils';
import { Badge, Button, Card } from '../UI';
import { SnippetsContext } from '../../store';
import copy from 'clipboard-copy';
import { SnippetPin } from './SnippetPin';
import { SnippetPublic } from './SnippetPublic';
import { SnippetLike } from './SnippetLike';

interface Props {
  snippet: Snippet;
}

export const SnippetCard = (props: Props): JSX.Element => {
  const { title, description, language, code, id, createdAt, isPinned, is_public, likes_count = 0 } =
    props.snippet;
  const { setSnippet } = useContext(SnippetsContext);

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
        {/* UPDATE DATE */}
        <div className="d-flex align-items-center justify-content-between">
          <p className="mb-0 small">Created {dateParser(createdAt).relative}</p>
          <SnippetLike id={id} likes_count={likes_count} />
        </div>
        <hr />

        {/* ACTIONS */}
        <div className='d-flex justify-content-end'>
          <Link
            to={{
              pathname: `/snippet/${id}`,
              state: { from: window.location.pathname }
            }}
          >
            <Button
              text='View'
              color='secondary'
              small
              outline
              classes='me-2'
              handler={() => {
                setSnippet(id);
              }}
            />
          </Link>
          <Button
            text='Copy code'
            color='secondary'
            small
            handler={copyHandler}
          />
        </div>
      </div>
    </Card>
  );
};
