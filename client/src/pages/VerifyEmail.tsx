import React, { useState, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../store';

export const VerifyEmail: React.FC = () => {
  const { user } = useContext(AuthContext);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const resendVerificationEmail = async () => {
    setLoading(true);
    setMessage(null);
    setError(null);

    try {
      await axios.post('/api/auth/resend-verification', { email: user?.email });
      setMessage('Verification email has been resent. Please check your inbox.');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to resend verification email. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container my-5">
      <div className="row justify-content-center">
        <div className="col-md-8 col-lg-6">
          <div className="card shadow">
            <div className="card-header bg-primary text-white">
              <h4 className="mb-0">Email Verification Required</h4>
            </div>
            <div className="card-body p-4">
              {message && (
                <div className="alert alert-success" role="alert">
                  {message}
                </div>
              )}
              {error && (
                <div className="alert alert-danger" role="alert">
                  {error}
                </div>
              )}
              
              <div className="text-center mb-4">
                <i className="fas fa-envelope-open-text fa-4x text-primary mb-3"></i>
                <h5>Please Verify Your Email</h5>
                <p>
                  We've sent a verification email to <strong>{user?.email}</strong>.
                  Please check your inbox and click the verification link to continue.
                </p>
              </div>

              <p className="text-muted mb-4">
                If you don't see the email, please check your spam folder. If you still don't see it,
                you can request a new verification email by clicking the button below.
              </p>

              <div className="d-grid">
                <button 
                  className="btn btn-primary" 
                  onClick={resendVerificationEmail} 
                  disabled={loading}
                >
                  {loading ? 'Sending...' : 'Resend Verification Email'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}; 