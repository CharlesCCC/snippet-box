import { useContext } from 'react';
import { SnippetsContext } from '../../store';
import Icon from '@mdi/react';
import { mdiEyeOutline, mdiEyeOffOutline } from '@mdi/js';

interface Props {
  id: string;
  isPublic: boolean;
}

export const SnippetPublic = (props: Props): JSX.Element => {
  const { toggleSnippetPublic } = useContext(SnippetsContext);
  const { id, isPublic } = props;

  return (
    <div 
      onClick={() => toggleSnippetPublic(id)} 
      className='cursor-pointer'
      title={isPublic ? 'Public - Click to make private' : 'Private - Click to make public'}
    >
      {isPublic ? (
        <Icon path={mdiEyeOutline} size={0.8} color='#20c997' />
      ) : (
        <Icon path={mdiEyeOffOutline} size={0.8} color='#ced4da' />
      )}
    </div>
  );
}; 