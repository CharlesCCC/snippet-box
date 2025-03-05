import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { formatDate } from '../utils/formatDate';
import { SnippetCard } from '../components/Snippets/SnippetCard';
import { Alert } from '../components/UI/Alert';
import { Spinner } from '../components/UI/Spinner';

interface UserProfileParams {
  username: string;
}

interface UserProfileData {
  user: {
    id: number;
    user_name: string;
    createdAt: string;
    updatedAt: string;
  };
  stats: {
    publicSnippetsCount: number;
    likesCount: number;
  };
  snippets: any[];
}

export const UserProfile: React.FC = () => {
  const { username } = useParams<UserProfileParams>();
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [profileData, setProfileData] = useState<UserProfileData | null>(null);

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        setLoading(true);
        const res = await axios.get(`/api/auth/profile/${username}`);
        setProfileData(res.data.data);
        setLoading(false);
      } catch (err: any) {
        setError(err.response?.data?.error || 'Failed to load user profile');
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, [username]);

  if (loading) {
    return (
      <div className="container mt-5">
        <div className="text-center">
          <Spinner />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mt-5">
        <Alert type="danger" message={error} />
      </div>
    );
  }

  if (!profileData) {
    return (
      <div className="container mt-5">
        <Alert type="warning" message="User not found" />
      </div>
    );
  }

  const { user, stats, snippets } = profileData;

  return (
    <div className="container mt-4">
      <div className="row">
        <div className="col-lg-4 mb-4">
          <div className="card shadow-sm">
            <div className="card-body">
              <h2 className="card-title mb-3">{user.user_name}</h2>
              <div className="mb-2">
                <small className="text-muted">Member since: {formatDate(user.createdAt)}</small>
              </div>
              <hr />
              <div className="stats-container d-flex justify-content-around py-3">
                <div className="text-center">
                  <h3>{stats.publicSnippetsCount}</h3>
                  <p className="text-muted mb-0">Snippets</p>
                </div>
                <div className="text-center">
                  <h3>{stats.likesCount}</h3>
                  <p className="text-muted mb-0">Likes</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-lg-8">
          <h3 className="mb-4">Public Snippets</h3>
          {snippets.length === 0 ? (
            <Alert type="info" message={`${user.user_name} hasn't shared any public snippets yet.`} />
          ) : (
            <div className="row row-cols-1 row-cols-md-2 g-4">
              {snippets.map(snippet => (
                <div className="col" key={snippet.id}>
                  <SnippetCard snippet={snippet} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}; 