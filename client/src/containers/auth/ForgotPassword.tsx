import React, { useState, useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../../store';
import { Alert } from '../../components/UI/Alert';
import { Spinner } from '../../components/UI/Spinner';

export const ForgotPassword: React.FC = () => {
  const [email, setEmail] = useState('');
  const [success, setSuccess] = useState(false);
  
  const { forgotPassword, loading, error, clearError } = useContext(AuthContext);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    await forgotPassword({ email });
    setSuccess(true);
  };

  return (
    <div className="container mt-5">
      <div className="row justify-content-center">
        <div className="col-md-6">
          <div className="card">
            <div className="card-header bg-info text-white">
              <h4>Forgot Password</h4>
            </div>
            <div className="card-body">
              {error && <Alert type="danger" message={error} onDismiss={clearError} />}
              {success && (
                <Alert 
                  type="success" 
                  message="Password reset link has been sent to your email" 
                />
              )}
              {loading ? (
                <Spinner />
              ) : (
                <form onSubmit={handleSubmit}>
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
                  <button 
                    type="submit" 
                    className="btn btn-info text-white"
                    disabled={success}
                  >
                    Send Reset Link
                  </button>
                </form>
              )}
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