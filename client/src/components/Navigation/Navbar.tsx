import { NavLink } from 'react-router-dom';
import { Route } from '../../typescript/interfaces';
import routesData from './routes.json';

export const Navbar = (): JSX.Element => {
  const routes = routesData.routes as Route[];

  return (
    <nav className='navbar navbar-dark bg-dark navbar-expand'>
      <div className='container-fluid'>
        <ul className='navbar-nav'>
          {routes.map(({ name, dest }, idx) => (
            <li className='nav-item' key={idx}>
              <NavLink exact to={dest} className='nav-link'>
                {name}
              </NavLink>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
};
