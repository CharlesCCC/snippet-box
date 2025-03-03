import { BrowserRouter, Switch, Route } from 'react-router-dom';
import { Navbar } from './components/Navigation/Navbar';
import { Editor, Home, Snippet, Snippets } from './containers';
import { 
  Login, 
  Register, 
  ForgotPassword, 
  ResetPassword, 
  UpdateProfile, 
  UpdatePassword 
} from './containers/auth';
import { SnippetsContextProvider, AuthProvider } from './store';
import { ProtectedRoute } from './components/ProtectedRoute';

export const App = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <SnippetsContextProvider>
          <Navbar />
          <Switch>
            {/* Public Routes */}
            <Route exact path='/' component={Home} />
            <Route path='/snippets' component={Snippets} />
            <Route path='/snippet/:id' component={Snippet} />
            <Route path='/login' component={Login} />
            <Route path='/register' component={Register} />
            <Route path='/forgotpassword' component={ForgotPassword} />
            <Route path='/resetpassword/:resettoken' component={ResetPassword} />
            
            {/* Protected Routes */}
            <ProtectedRoute path='/editor/:id?' component={Editor} />
            <ProtectedRoute path='/profile' component={UpdateProfile} />
            <ProtectedRoute path='/update-password' component={UpdatePassword} />
          </Switch>
        </SnippetsContextProvider>
      </AuthProvider>
    </BrowserRouter>
  );
};
