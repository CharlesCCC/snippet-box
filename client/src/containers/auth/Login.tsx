import React, { useState, useContext, useEffect } from 'react';
import { Link, useHistory } from 'react-router-dom';
import { AuthContext } from '../../store';
import { Alert } from '../../components/UI/Alert';
import { Spinner } from '../../components/UI/Spinner';

export const Login: React.FC = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const { email, password } = formData;
  
  const { login, isAuthenticated, loading, error, clearError } = useContext(AuthContext);
  const history = useHistory();

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      history.push('/');
    }
  }, [isAuthenticated, history]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    await login({ email, password });
  };

  return (
    <div className="container mt-5">
      <div className="row justify-content-center">
        <div className="col-md-6">
          <div className="card">
            <div className="card-header bg-primary text-white">
              <h4>Login</h4>
            </div>
            <div className="card-body">
              {error && <Alert type="danger" message={error} onDismiss={clearError} />}
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
                  <div className="mb-3">
                    <label htmlFor="password" className="form-label">Password</label>
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
                  <button type="submit" className="btn btn-primary">Login</button>
                </form>
              )}
              <p className="mt-3">
                Don't have an account? <Link to="/register">Register</Link>
              </p>
              <p>
                <Link to="/forgotpassword">Forgot Password?</Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}; 