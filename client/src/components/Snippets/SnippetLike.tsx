import { useContext, useEffect, useState } from 'react';
import { SnippetsContext } from '../../store';
import Icon from '@mdi/react';
import { mdiHeart, mdiHeartOutline } from '@mdi/js';

interface Props {
  id: number;
  likes_count: number;
}

export const SnippetLike = (props: Props): JSX.Element => {
  const { likeSnippet, unlikeSnippet, checkIfLiked, likedSnippetsCache } = useContext(SnippetsContext);
  const { id, likes_count } = props;
  const [isLiked, setIsLiked] = useState<boolean>(false);
  const [likesCount, setLikesCount] = useState<number>(likes_count || 0);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const checkLikedStatus = async () => {
      setIsLoading(true);
      
      // Check if we already have the like status in the cache
      if (likedSnippetsCache.has(id)) {
        const cachedData = likedSnippetsCache.get(id)!;
        setIsLiked(cachedData.liked);
        setLikesCount(cachedData.likes_count);
        setIsLoading(false);
        return;
      }
      
      // If not in cache, fetch it
      const result = await checkIfLiked(id);
      setIsLiked(result.liked);
      setLikesCount(result.likes_count);
      setIsLoading(false);
    };

    checkLikedStatus();
  }, [id, checkIfLiked, likedSnippetsCache]);

  // Update when the cache changes
  useEffect(() => {
    if (likedSnippetsCache.has(id)) {
      const cachedData = likedSnippetsCache.get(id)!;
      setIsLiked(cachedData.liked);
      setLikesCount(cachedData.likes_count);
    }
  }, [likedSnippetsCache, id]);

  const handleToggleLike = async () => {
    if (isLiked) {
      await unlikeSnippet(id);
      setIsLiked(false);
      setLikesCount(prev => Math.max(0, prev - 1));
    } else {
      await likeSnippet(id);
      setIsLiked(true);
      setLikesCount(prev => prev + 1);
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
}; 