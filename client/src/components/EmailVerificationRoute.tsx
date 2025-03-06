import React, { useContext } from 'react';
import { Route, Redirect, RouteProps } from 'react-router-dom';
import { AuthContext } from '../store';
import { Spinner } from './UI/Spinner';

interface EmailVerificationRouteProps extends RouteProps {
  component: React.ComponentType<any>;
}

export const EmailVerificationRoute: React.FC<EmailVerificationRouteProps> = ({
  component: Component,
  ...rest
}) => {
  const { isAuthenticated, user, loading } = useContext(AuthContext);

  return (
    <Route
      {...rest}
      render={props =>
        loading ? (
          <Spinner />
        ) : isAuthenticated ? (
          user?.isEmailVerified ? (
            <Component {...props} />
          ) : (
            <Redirect 
              to={{
                pathname: "/verify-email",
                state: { from: props.location }
              }} 
            />
          )
        ) : (
          <Redirect 
            to={{
              pathname: "/login",
              state: { from: props.location }
            }} 
          />
        )
      }
    />
  );
}; 