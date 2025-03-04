import { useContext, useEffect, useState } from 'react';
import { SnippetsContext } from '../../store';
import Icon from '@mdi/react';
import { mdiBookmark, mdiBookmarkOutline } from '@mdi/js';

interface Props {
  id: number;
}

export const SnippetSave = (props: Props): JSX.Element => {
  const { saveSnippet, unsaveSnippet, checkIfSaved } = useContext(SnippetsContext);
  const { id } = props;
  const [isSaved, setIsSaved] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const checkSavedStatus = async () => {
      setIsLoading(true);
      const saved = await checkIfSaved(id);
      setIsSaved(saved);
      setIsLoading(false);
    };

    checkSavedStatus();
  }, [id, checkIfSaved]);

  const handleToggleSave = () => {
    if (isSaved) {
      unsaveSnippet(id);
      setIsSaved(false);
    } else {
      saveSnippet(id);
      setIsSaved(true);
    }
  };

  if (isLoading) {
    return <div className="cursor-pointer">
      <Icon path={mdiBookmarkOutline} size={0.8} color="#6c757d" />
    </div>;
  }

  return (
    <div onClick={handleToggleSave} className='cursor-pointer'>
      {isSaved ? (
        <Icon path={mdiBookmark} size={0.8} color='#20c997' />
      ) : (
        <Icon path={mdiBookmarkOutline} size={0.8} color='#ced4da' />
      )}
    </div>
  );
}; 