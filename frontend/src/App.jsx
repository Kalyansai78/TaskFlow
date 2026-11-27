import './App.css';
import { useEffect, useState } from 'react';

import { ToastContainer} from 'react-toastify';

import {
    BrowserRouter as Router,
    Routes,
    Route,
    useLocation,
    Navigate
} from 'react-router-dom';

import { apiV1 } from './api/axios';
import { useDispatch } from 'react-redux';

import Navbar from './components/navbar/Navbar';
import Home from './components/home/Home';
import Footer from './components/footer/Footer';
import About from './components/about/About';
import Signup from './components/signupin/Signup';
import Signin from './components/signupin/Signin';
import VerifyEmail from './components/signupin/VerifyEmail';
import ForgotPassword from './components/signupin/ForgotPassword';
import ResetPassword from './components/signupin/ResetPassword';
import Todo from './components/todo/Todo';
import Profile from './components/profile/Profile';
import SetNewPassword from './components/signupin/SetNewPassword';
import Notifications from './components/notifications/Notifications';
import WorkspaceLayout from './components/layout/WorkspaceLayout';
import Calendar from "./components/calendar/Calendar";
import Progress from "./components/progress/Progress";
import Settings from './components/settings/Settings';

import { authActions } from './store';

// Protected Route
const ProtectedRoute = ({ children }) => {
  const token = sessionStorage.getItem('token');

  if (!token) {
    return <Navigate to="/signin" replace />;
  }

  return children;
};

// Main App Layout
const AppLayout = () => {
  const dispatch = useDispatch();
  const location = useLocation();

  const [theme, setTheme] = useState("light");

  const isWorkspacePage = [
    '/dashboard',
    '/tasks',
    '/calendar',
    '/progress',
    '/workspace/notifications',
    '/account/profile',
    '/settings'
  ].includes(location.pathname);

  // Restore Autentication State
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

  // Load Saved User Theme 
    useEffect(() => {
        const token = sessionStorage.getItem("token");

        if (!token) {
            setTheme("light");
            return;
        }

        const fetchTheme = async () => {
            try {
                const response = await apiV1.get("/appearance");

                setTheme(response.data.appearance?.theme || "light");

            } catch (error) {
                console.error(
                    "Failed to load theme:",
                    error.response?.data?.message || error.message
                );
            }
        };

        fetchTheme();
    }, [location.pathname]);

  // Listen For Theme Changes
  useEffect(() => {
      const handleThemeChange = (event) => {
          setTheme(event.detail);
      };

      window.addEventListener("themeChanged", handleThemeChange);

      return () => {
          window.removeEventListener("themeChanged", handleThemeChange);
      };
  }, []);

  // Apply Theme Globally
  useEffect(() => {
      document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  return (
    <>
      {!isWorkspacePage && <Navbar />}

      <Routes>
        <Route path="/" element={<Home />} />

        <Route path="/about" element={<About />} />

        {/* Standalone Profile */}
        <Route
            path="/profile"
            element={
                <ProtectedRoute>
                    <Profile />
                </ProtectedRoute>
            }
        />

        {/* Standalone Notifications */}
        <Route
            path="/notifications"
            element={
                <ProtectedRoute>
                    <Notifications />
                </ProtectedRoute>
            }
        />

        <Route
            element={
                <ProtectedRoute>
                    <WorkspaceLayout />
                </ProtectedRoute>
            }
          >
            {/* Dashboard */}
            <Route path="/dashboard" element={<Todo view="dashboard" />} />

            {/* My Tasks */}
            <Route path="/tasks" element={<Todo view="tasks" />} />

            {/* Calendar */}
            <Route path="/calendar" element={<Calendar />} />

            {/* My Progress */}
            <Route path="/progress" element={<Progress />} />

            {/* Dashboard Notifications */}
            <Route path="/workspace/notifications" element={<Notifications />} />

            {/* Dashboard Profile */}
            <Route path="/account/profile" element={<Profile />} />

            {/* Settings */}
            <Route path="/settings" element={<Settings />} /> 

        </Route>

        <Route path="/signup" element={<Signup />} />

        <Route path="/signin" element={<Signin />} />

        <Route path="/verify-email" element={<VerifyEmail />} />

        <Route path="/forgot-password" element={<ForgotPassword />} />

        <Route path="/reset-password" element={<ResetPassword />} />

        <Route path="*" element={<Navigate to="/" replace />} />

        <Route path="/set-new-password" element={<SetNewPassword />} />
        
      </Routes>

        {!isWorkspacePage && <Footer />}

        <ToastContainer
            position="top-right"
            autoClose={3000}
            newestOnTop
            closeOnClick
            pauseOnHover
            theme="light"
        />
    </>
  );
};

// App
const App = () => {
  return (
    <Router>
      <AppLayout />
    </Router>
  );
};

export default App;