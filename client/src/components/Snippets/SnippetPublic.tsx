import { useContext } from 'react';
import { SnippetsContext } from '../../store';
import Icon from '@mdi/react';
import { mdiEyeOutline, mdiEyeOffOutline } from '@mdi/js';

interface Props {
  id: number;
  is_public?: boolean;
}

export const SnippetPublic = (props: Props): JSX.Element => {
  const { toggleSnippetPublic } = useContext(SnippetsContext);
  const { id, is_public } = props;

  return (
    <div 
      onClick={() => toggleSnippetPublic(id)} 
      className='cursor-pointer'
      title={is_public ? 'Public - Click to make private' : 'Private - Click to make public'}
    >
      {is_public ? (
        <Icon path={mdiEyeOutline} size={0.8} color='#20c997' />
      ) : (
        <Icon path={mdiEyeOffOutline} size={0.8} color='#ced4da' />
      )}
    </div>
  );
}; 