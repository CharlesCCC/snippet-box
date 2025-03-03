import React, { useState, useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../../store';
import { Alert } from '../../components/UI/Alert';
import { Spinner } from '../../components/UI/Spinner';

export const UpdatePassword: React.FC = () => {
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmNewPassword: ''
  });
  const [success, setSuccess] = useState(false);
  const { currentPassword, newPassword, confirmNewPassword } = formData;
  
  const { updatePassword, loading, error, clearError } = useContext(AuthContext);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    await updatePassword({
      currentPassword,
      newPassword,
      confirmNewPassword
    });
    
    setSuccess(true);
    
    // Reset form on success
    if (!error) {
      setFormData({
        currentPassword: '',
        newPassword: '',
        confirmNewPassword: ''
      });
      
      // Reset success message after 3 seconds
      setTimeout(() => {
        setSuccess(false);
      }, 3000);
    }
  };

  return (
    <div className="container mt-5">
      <div className="row justify-content-center">
        <div className="col-md-6">
          <div className="card">
            <div className="card-header bg-secondary text-white">
              <h4>Update Password</h4>
            </div>
            <div className="card-body">
              {error && <Alert type="danger" message={error} onDismiss={clearError} />}
              {success && (
                <Alert type="success" message="Password updated successfully!" />
              )}
              {loading ? (
                <Spinner />
              ) : (
                <form onSubmit={handleSubmit}>
                  <div className="mb-3">
                    <label htmlFor="currentPassword" className="form-label">Current Password</label>
                    <input
                      type="password"
                      className="form-control"
                      id="currentPassword"
                      name="currentPassword"
                      value={currentPassword}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label htmlFor="newPassword" className="form-label">New Password</label>
                    <input
                      type="password"
                      className="form-control"
                      id="newPassword"
                      name="newPassword"
                      value={newPassword}
                      onChange={handleChange}
                      required
                      minLength={6}
                    />
                  </div>
                  <div className="mb-3">
                    <label htmlFor="confirmNewPassword" className="form-label">Confirm New Password</label>
                    <input
                      type="password"
                      className="form-control"
                      id="confirmNewPassword"
                      name="confirmNewPassword"
                      value={confirmNewPassword}
                      onChange={handleChange}
                      required
                      minLength={6}
                    />
                  </div>
                  <button type="submit" className="btn btn-secondary">Update Password</button>
                </form>
              )}
              <div className="mt-3">
                <Link to="/profile" className="btn btn-link">
                  Back to Profile
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}; 