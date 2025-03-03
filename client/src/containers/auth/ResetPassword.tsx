import React, { useState, useContext, useEffect } from 'react';
import { Link, useParams, useHistory } from 'react-router-dom';
import { AuthContext } from '../../store';
import { Alert } from '../../components/UI/Alert';
import { Spinner } from '../../components/UI/Spinner';

interface ResetParams {
  resettoken: string;
}

export const ResetPassword: React.FC = () => {
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: ''
  });
  const [success, setSuccess] = useState(false);
  const { password, confirmPassword } = formData;
  
  const { resetPassword, loading, error, clearError } = useContext(AuthContext);
  const { resettoken } = useParams<ResetParams>();
  const history = useHistory();

  // Redirect after successful reset
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => {
        history.push('/login');
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [success, history]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    await resetPassword(resettoken, { password, confirmPassword });
    setSuccess(true);
  };

  return (
    <div className="container mt-5">
      <div className="row justify-content-center">
        <div className="col-md-6">
          <div className="card">
            <div className="card-header bg-warning text-dark">
              <h4>Reset Password</h4>
            </div>
            <div className="card-body">
              {error && <Alert type="danger" message={error} onDismiss={clearError} />}
              {success && (
                <Alert 
                  type="success" 
                  message="Password has been reset successfully. Redirecting to login..." 
                />
              )}
              {loading ? (
                <Spinner />
              ) : !success ? (
                <form onSubmit={handleSubmit}>
                  <div className="mb-3">
                    <label htmlFor="password" className="form-label">New Password</label>
                    <input
                      type="password"
                      className="form-control"
                      id="password"
                      name="password"
                      value={password}
                      onChange={handleChange}
                      required
                      minLength={6}
                    />
                  </div>
                  <div className="mb-3">
                    <label htmlFor="confirmPassword" className="form-label">Confirm New Password</label>
                    <input
                      type="password"
                      className="form-control"
                      id="confirmPassword"
                      name="confirmPassword"
                      value={confirmPassword}
                      onChange={handleChange}
                      required
                      minLength={6}
                    />
                  </div>
                  <button type="submit" className="btn btn-warning">Reset Password</button>
                </form>
              ) : null}
              <p className="mt-3">
                <Link to="/login">Back to Login</Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}; 