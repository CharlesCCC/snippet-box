import React, { useState, useEffect } from 'react';
import { Layout, Card, Button, PageHeader } from '../components/UI';
import {
  TopUser,
  TopSnippet,
  TimeRange,
  RankingResponse
} from '../typescript/interfaces/Rank';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { badgeColor } from '../utils';

export const Rank = (): JSX.Element => {
  const [timeRange, setTimeRange] = useState<TimeRange>('all');
  const [activeTab, setActiveTab] = useState<string>('topUsersByLikes');
  
  const [topUsersByLikes, setTopUsersByLikes] = useState<TopUser[]>([]);
  const [topUsersBySaves, setTopUsersBySaves] = useState<TopUser[]>([]);
  const [topLikedSnippets, setTopLikedSnippets] = useState<TopSnippet[]>([]);
  const [topSavedSnippets, setTopSavedSnippets] = useState<TopSnippet[]>([]);
  
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const timeRangeLabels: Record<TimeRange, string> = {
    '24h': 'Last 24 Hours',
    '1w': 'Last Week',
    '1m': 'Last Month',
    '3m': 'Last 3 Months',
    '6m': 'Last 6 Months',
    '1y': 'Last Year',
    'all': 'All Time'
  };

  // Fetch data based on active tab and time range
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Fetch appropriate data based on active tab
        if (activeTab === 'topUsersByLikes' || activeTab === 'all') {
          const response = await axios.get<RankingResponse<TopUser>>(`/api/rankings/users/likes?timeRange=${timeRange}`);
          setTopUsersByLikes(response.data.data);
        }
        
        if (activeTab === 'topUsersBySaves' || activeTab === 'all') {
          const response = await axios.get<RankingResponse<TopUser>>(`/api/rankings/users/saves?timeRange=${timeRange}`);
          setTopUsersBySaves(response.data.data);
        }
        
        if (activeTab === 'topLikedSnippets' || activeTab === 'all') {
          const response = await axios.get<RankingResponse<TopSnippet>>(`/api/rankings/snippets/likes?timeRange=${timeRange}`);
          setTopLikedSnippets(response.data.data);
        }
        
        if (activeTab === 'topSavedSnippets' || activeTab === 'all') {
          const response = await axios.get<RankingResponse<TopSnippet>>(`/api/rankings/snippets/saves?timeRange=${timeRange}`);
          setTopSavedSnippets(response.data.data);
        }
      } catch (err) {
        console.error('Error fetching ranking data:', err);
        setError('Error fetching ranking data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [activeTab, timeRange]);

  // Function to render the active tab content
  const renderTabContent = () => {
    if (loading) {
      return (
        <div className="text-center p-5">
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      );
    }
    
    if (error) {
      return (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      );
    }
    
    switch (activeTab) {
      case 'topUsersByLikes':
        return renderTopUsers(topUsersByLikes, 'likes');
      case 'topUsersBySaves':
        return renderTopUsers(topUsersBySaves, 'saves');
      case 'topLikedSnippets':
        return renderTopSnippets(topLikedSnippets, 'likes');
      case 'topSavedSnippets':
        return renderTopSnippets(topSavedSnippets, 'saves');
      case 'all':
      default:
        return (
          <>
            <div className="row mb-4">
              <div className="col-md-6">
                <Card title="Top Users by Likes">
                  {renderTopUsers(topUsersByLikes, 'likes', 5)}
                </Card>
              </div>
              <div className="col-md-6">
                <Card title="Top Users by Saves">
                  {renderTopUsers(topUsersBySaves, 'saves', 5)}
                </Card>
              </div>
            </div>
            <div className="row">
              <div className="col-md-6">
                <Card title="Top Liked Snippets">
                  {renderTopSnippets(topLikedSnippets, 'likes', 5)}
                </Card>
              </div>
              <div className="col-md-6">
                <Card title="Top Saved Snippets">
                  {renderTopSnippets(topSavedSnippets, 'saves', 5)}
                </Card>
              </div>
            </div>
          </>
        );
    }
  };
  
  // Render top users list
  const renderTopUsers = (users: TopUser[], type: 'likes' | 'saves', limit?: number) => {
    const displayUsers = limit ? users.slice(0, limit) : users;
    
    if (displayUsers.length === 0) {
      return <p className="text-center">No data available for this time period.</p>;
    }
    
    return (
      <div className="list-group">
        {displayUsers.map((user, index) => (
          <Link 
            to={`/${user.user_name}`}
            className="list-group-item list-group-item-action d-flex justify-content-between align-items-center" 
            key={user.userId}
          >
            <div>
              <span className="badge bg-secondary me-2">{index + 1}</span>
              {user.user_name}
            </div>
            <span className="badge bg-primary rounded-pill">
              {type === 'likes' ? user.total_likes : user.total_saves} {type}
            </span>
          </Link>
        ))}
      </div>
    );
  };
  
  // Render top snippets list
  const renderTopSnippets = (snippets: TopSnippet[], type: 'likes' | 'saves', limit?: number) => {
    const displaySnippets = limit ? snippets.slice(0, limit) : snippets;
    
    if (displaySnippets.length === 0) {
      return <p className="text-center">No data available for this time period.</p>;
    }
    
    return (
      <div className="list-group">
        {displaySnippets.map((snippet, index) => (
          <Link
            to={`/snippet/${snippet.id}`}
            className="list-group-item list-group-item-action" 
            key={snippet.id}
          >
            <div className="d-flex w-100 justify-content-between">
              <h5 className="mb-1">
                <span className="badge bg-secondary me-2">{index + 1}</span>
                {snippet.title}
              </h5>
              <small>
                <span className="badge bg-primary rounded-pill">
                  {type === 'likes' ? snippet.likes_count : snippet.save_count} {type}
                </span>
              </small>
            </div>
            <p className="mb-1">{snippet.description || 'No description'}</p>
            <div className="d-flex justify-content-between align-items-center">
              <small className="text-muted">by {snippet.user.user_name}</small>
              <span className={`badge bg-${badgeColor(snippet.language)}`}>{snippet.language}</span>
            </div>
          </Link>
        ))}
      </div>
    );
  };

  return (
    <Layout>
      <div className="col-12 mb-4">
        <PageHeader title="Rankings" />
        
        {/* Time range selector */}
        <Card classes="mb-4">
          <h5 className="mb-3">Time Range</h5>
          <div className="d-flex flex-wrap">
            {(Object.keys(timeRangeLabels) as TimeRange[]).map(range => (
              <Button
                key={range}
                text={timeRangeLabels[range]}
                color={timeRange === range ? 'primary' : 'secondary'}
                outline={timeRange !== range}
                small
                handler={() => setTimeRange(range)}
                classes="me-2 mb-2"
              />
            ))}
          </div>
        </Card>
        
        {/* Tab navigation */}
        <ul className="nav nav-tabs mb-4">
          <li className="nav-item">
            <button
              className={`nav-link ${activeTab === 'all' ? 'active' : ''}`}
              onClick={() => setActiveTab('all')}
            >
              All Rankings
            </button>
          </li>
          <li className="nav-item">
            <button
              className={`nav-link ${activeTab === 'topUsersByLikes' ? 'active' : ''}`}
              onClick={() => setActiveTab('topUsersByLikes')}
            >
              Top Users by Likes
            </button>
          </li>
          <li className="nav-item">
            <button
              className={`nav-link ${activeTab === 'topUsersBySaves' ? 'active' : ''}`}
              onClick={() => setActiveTab('topUsersBySaves')}
            >
              Top Users by Saves
            </button>
          </li>
          <li className="nav-item">
            <button
              className={`nav-link ${activeTab === 'topLikedSnippets' ? 'active' : ''}`}
              onClick={() => setActiveTab('topLikedSnippets')}
            >
              Top Liked Snippets
            </button>
          </li>
          <li className="nav-item">
            <button
              className={`nav-link ${activeTab === 'topSavedSnippets' ? 'active' : ''}`}
              onClick={() => setActiveTab('topSavedSnippets')}
            >
              Top Saved Snippets
            </button>
          </li>
        </ul>
        
        {/* Content area */}
        {renderTabContent()}
      </div>
    </Layout>
  );
}; 