import { useContext, useEffect, useState, memo } from 'react';
import { SnippetsContext } from '../../store';
import Icon from '@mdi/react';
import { mdiHeart, mdiHeartOutline } from '@mdi/js';

interface Props {
  id: string;
  likes_count: number;
}

export const SnippetLike = memo((props: Props): JSX.Element => {
  const { likeSnippet, unlikeSnippet, likedSnippetsCache } = useContext(SnippetsContext);
  const { id, likes_count } = props;
  const [isLiked, setIsLiked] = useState<boolean>(false);
  const [likesCount, setLikesCount] = useState<number>(likes_count || 0);

  useEffect(() => {
    // Only update state if the cache value is different from current state
    if (likedSnippetsCache.has(id)) {
      const cachedData = likedSnippetsCache.get(id)!;
      if (cachedData.liked !== isLiked) {
        setIsLiked(cachedData.liked);
      }
      if (cachedData.likes_count !== likesCount) {
        setLikesCount(cachedData.likes_count);
      }
    }
  }, [id, likedSnippetsCache, isLiked, likesCount]);

  const handleToggleLike = async () => {
    try {
      if (isLiked) {
        await unlikeSnippet(id);
        setIsLiked(false);
        setLikesCount(prev => Math.max(0, prev - 1));
      } else {
        await likeSnippet(id);
        setIsLiked(true);
        setLikesCount(prev => prev + 1);
      }
    } catch (error) {
      console.error('Error toggling like:', error);
    }
  };

  return (
    <div className="d-flex align-items-center">
      <div onClick={handleToggleLike} className='cursor-pointer me-1'>
        {isLiked ? (
          <Icon path={mdiHeart} size={0.8} color='#dc3545' />
        ) : (
          <Icon path={mdiHeartOutline} size={0.8} color='#ced4da' />
        )}
      </div>
      <small className="text-muted">{likesCount}</small>
    </div>
  );
}); 