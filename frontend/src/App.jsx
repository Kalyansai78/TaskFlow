import './App.css';
import { useEffect } from 'react';

import {
  BrowserRouter as Router,
  Routes,
  Route,
  useLocation,
  Navigate
} from 'react-router-dom';

import { useDispatch } from 'react-redux';

import Navbar from './components/navbar/Navbar';
import Home from './components/home/Home';
import Footer from './components/footer/Footer';
import About from './components/about/About';
import Signup from './components/signupin/Signup';
import Signin from './components/signupin/Signin';
import Todo from './components/todo/Todo';
import Profile from './components/profile/Profile';

import { authActions } from './store';

// PROTECTED ROUTE
const ProtectedRoute = ({ children }) => {
  const token = sessionStorage.getItem('token');

  if (!token) {
    return <Navigate to="/signin" replace />;
  }

  return children;
};

// MAIN APP LAYOUT
const AppLayout = () => {
  const dispatch = useDispatch();
  const location = useLocation();

  const isTodoPage = location.pathname === '/todo';

  // RESTORE AUTHENTICATION STATE
  useEffect(() => {
      const token = sessionStorage.getItem('token');
      const id = sessionStorage.getItem('id');
      const username = sessionStorage.getItem('username');
      const email = sessionStorage.getItem('email');

      if (token && id) {
          dispatch(
              authActions.login({
                  _id: id,
                  username: username || "User",
                  email: email || ""
              })
          );
      } else {
          dispatch(authActions.logout());
      }
  }, [dispatch]);

  return (
    <>
      {!isTodoPage && <Navbar />}

      <Routes>
        <Route path="/" element={<Home />} />

        <Route path="/about" element={<About />} />

        <Route
          path="/todo"
          element={
            <ProtectedRoute>
              <Todo />
            </ProtectedRoute>
          }
        />

        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />

        <Route path="/signup" element={<Signup />} />

        <Route path="/signin" element={<Signin />} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      {!isTodoPage && <Footer />}
    </>
  );
};

// APP
const App = () => {
  return (
    <Router>
      <AppLayout />
    </Router>
  );
};

export default App;