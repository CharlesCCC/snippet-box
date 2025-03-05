import React, { useContext } from 'react';
import { NavLink, Link } from 'react-router-dom';
import { Route } from '../../typescript/interfaces';
import { AuthContext } from '../../store';
import routesData from './routes.json';

export const Navbar = (): JSX.Element => {
  const routes = routesData.routes as Route[];
  const { isAuthenticated, user, logout } = useContext(AuthContext);

  return (
    <nav className='navbar navbar-dark bg-dark navbar-expand'>
      <div className='container-fluid'>
        <ul className='navbar-nav me-auto'>
          {routes.map(({ name, dest }, idx) => (
            <li className='nav-item' key={idx}>
              <NavLink exact to={dest} className='nav-link'>
                {name}
              </NavLink>
            </li>
          ))}
        </ul>
        
        <ul className='navbar-nav'>
          {isAuthenticated && user ? (
            <>
              <li className='nav-item'>
                <Link to='#' className='nav-link' onClick={() => logout()}>
                  Logout
                </Link>
              </li>
              <li className='nav-item'>
                <NavLink to='/profile' className='nav-link'>
                  Update Profile
                </NavLink>
              </li>
              <li className='nav-item'>
                <NavLink to={`/${user.user_name}`} className='nav-link'>
                  {user.user_name}
                </NavLink>
              </li>
            </>
          ) : (
            <>
              <li className='nav-item'>
                <NavLink to='/login' className='nav-link'>
                  Login
                </NavLink>
              </li>
              <li className='nav-item'>
                <NavLink to='/register' className='nav-link'>
                  Register
                </NavLink>
              </li>
            </>
          )}
        </ul>
      </div>
    </nav>
  );
};
