// Rankings interfaces
export interface TopUser {
  userId: number;
  user_name: string;
  total_likes?: number;
  total_saves?: number;
}

export interface TopSnippet {
  id: number;
  title: string;
  description: string;
  language: string;
  createdAt: string;
  likes_count?: number;
  save_count?: number;
  user: {
    id: number;
    user_name: string;
  };
}

export type TimeRange = '24h' | '1w' | '1m' | '3m' | '6m' | '1y' | 'all';

export interface RankingResponse<T> {
  success: boolean;
  data: T[];
  cached: boolean;
} 