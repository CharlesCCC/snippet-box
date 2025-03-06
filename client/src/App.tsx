import { BrowserRouter, Switch, Route } from 'react-router-dom';
import { Navbar } from './components/Navigation/Navbar';
import { Editor, Home, Snippet, Snippets, SavedSnippets, UserProfile } from './containers';
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
import { EmailVerificationRoute } from './components/EmailVerificationRoute';
import { VerifyEmail } from './pages/VerifyEmail';

// Import Bootstrap CSS
// import 'bootstrap/dist/css/bootstrap.min.css';

export const App = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <SnippetsContextProvider>
          <Navbar />
          <Switch>
            {/* Public Routes */}
            <Route exact path='/' component={Home} />
            <Route path='/snippet/:id' component={Snippet} />
            <Route path='/login' component={Login} />
            <Route path='/register' component={Register} />
            <Route path='/forgotpassword' component={ForgotPassword} />
            <Route path='/resetpassword/:resettoken' component={ResetPassword} />
            <Route path='/verify-email' component={VerifyEmail} />
            
            {/* Protected Routes - Only require authentication */}
            <ProtectedRoute path='/profile' component={UpdateProfile} />
            <ProtectedRoute path='/update-password' component={UpdatePassword} />
            
            {/* Protected Routes - Require authentication AND email verification */}
            <EmailVerificationRoute path='/snippets' component={Snippets} />
            <EmailVerificationRoute path='/editor/:id?' component={Editor} />
            <EmailVerificationRoute path='/saved' component={SavedSnippets} />
            
            {/* User Profile Route - Keep this last as it's a catch-all */}
            <Route path='/:username' component={UserProfile} />
          </Switch>
        </SnippetsContextProvider>
      </AuthProvider>
    </BrowserRouter>
  );
};
