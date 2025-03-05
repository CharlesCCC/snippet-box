import React, { useState, useContext, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../../store';
import { Alert } from '../../components/UI/Alert';
import { Spinner } from '../../components/UI/Spinner';

export const UpdateProfile: React.FC = () => {
  const { user, updateDetails, loading, error, clearError } = useContext(AuthContext);
  const [email, setEmail] = useState('');
  const [userName, setUserName] = useState('');
  const [success, setSuccess] = useState(false);

  // Set initial form data from user context
  useEffect(() => {
    if (user) {
      setEmail(user.email);
      setUserName(user.user_name || '');
    }
  }, [user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (name === 'email') {
      setEmail(value);
    } else if (name === 'user_name') {
      setUserName(value);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    await updateDetails(email, userName);
    setSuccess(true);
    
    // Reset success message after 3 seconds
    setTimeout(() => {
      setSuccess(false);
    }, 3000);
  };

  if (!user) {
    return <Spinner />;
  }

  return (
    <div className="container mt-5">
      <div className="row justify-content-center">
        <div className="col-md-6">
          <div className="card">
            <div className="card-header bg-primary text-white">
              <h4>Update Profile</h4>
            </div>
            <div className="card-body">
              {error && <Alert type="danger" message={error} onDismiss={clearError} />}
              {success && (
                <Alert type="success" message="Profile updated successfully!" />
              )}
              {loading ? (
                <Spinner />
              ) : (
                <form onSubmit={handleSubmit}>
                  <div className="mb-3">
                    <label htmlFor="user_name" className="form-label">Username</label>
                    <input
                      type="text"
                      className="form-control"
                      id="user_name"
                      name="user_name"
                      value={userName}
                      onChange={handleChange}
                      required
                    />
                    <small className="text-muted">Your unique username for the platform</small>
                  </div>
                  <div className="mb-3">
                    <label htmlFor="email" className="form-label">Email Address</label>
                    <input
                      type="email"
                      className="form-control"
                      id="email"
                      name="email"
                      value={email}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <button type="submit" className="btn btn-primary">Update</button>
                </form>
              )}
              <div className="mt-3">
                <Link to="/update-password" className="btn btn-outline-secondary">
                  Update Password
                </Link>
                <Link to="/" className="btn btn-link">
                  Back to Home
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}; 