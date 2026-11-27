import React, { useState, useEffect } from "react";
import { NavLink, Link, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import {
    FiCheckSquare,
    FiMenu,
    FiX,
    FiLogOut,
    FiUser,
    FiGrid,
    FiInfo,
    FiBell
} from "react-icons/fi";

import "./Navbar.css";
import { authActions } from "../../store";

import { apiV3 } from "../../api/axios";

const Navbar = () => {
    const isLoggedIn = useSelector((state) => state.isLoggedIn);
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const [menuOpen, setMenuOpen] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);

    const username = sessionStorage.getItem("username") || "User";
    const email = sessionStorage.getItem("email") || "";

    useEffect(() => {
        const fetchNotifications = async () => {
            if (!isLoggedIn) {
                setUnreadCount(0);
                return;
            }

            try {
                const response = await apiV3.get("/notifications");

                setUnreadCount(response.data.unreadCount || 0);

            } catch (error) {
                console.error("Notification error:", error.message);
            }
        };

        fetchNotifications();

        // Listen for read/delete changes
        window.addEventListener("notificationsUpdated", fetchNotifications);

        // Refresh unread count every 30 seconds
        const interval = setInterval(fetchNotifications, 30000);

        return () => {
            window.removeEventListener("notificationsUpdated", fetchNotifications);
            clearInterval(interval);
        };

    }, [isLoggedIn]);

    const initials = username
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0].toUpperCase())
        .join("");

    const closeMenu = () => {
        setMenuOpen(false);
    };

    const logout = () => {
        sessionStorage.removeItem("token");
        sessionStorage.removeItem("id");
        sessionStorage.removeItem("username");
        sessionStorage.removeItem("email");

        dispatch(authActions.logout());

        closeMenu();
        navigate("/signin");
    };

    return (
        <header className="tf-navbar">
            <div className="tf-navbar-container">

                {/* Brand */}
                <Link to="/" className="tf-navbar-brand" onClick={closeMenu}>
                    <span className="tf-navbar-logo">
                        <FiCheckSquare />
                    </span>

                    <span>
                        Task<span>Flow</span>
                    </span>
                </Link>

                {/* Mobile Menu Button */}
                <button
                    type="button"
                    className="tf-navbar-toggle"
                    onClick={() => setMenuOpen((previous) => !previous)}
                    aria-label="Toggle navigation"
                    aria-expanded={menuOpen}
                >
                    {menuOpen ? <FiX /> : <FiMenu />}
                </button>

                {/* Navigation */}
                <nav className={`tf-navbar-menu ${menuOpen ? "tf-navbar-menu-open" : ""}`}>

                    <div className="tf-navbar-links">

                        {isLoggedIn ? (
                            <>
                                <NavLink
                                    to="/about"
                                    className={({ isActive }) =>
                                        `tf-navbar-link ${isActive ? "tf-navbar-link-active" : ""}`
                                    }
                                    onClick={closeMenu}
                                >
                                    <FiInfo />
                                    About
                                </NavLink>
                                 
                                <NavLink
                                    to="/dashboard"
                                    className={({ isActive }) =>
                                        `tf-navbar-link ${isActive ? "tf-navbar-link-active" : ""}`
                                    }
                                    onClick={closeMenu}
                                >
                                    <FiGrid />
                                    Dashboard
                                </NavLink>

                                <NavLink
                                    to="/profile"
                                    className={({ isActive }) =>
                                        `tf-navbar-link ${isActive ? "tf-navbar-link-active" : ""}`
                                    }
                                    onClick={closeMenu}
                                >
                                    <FiUser />
                                    Profile
                                </NavLink>
                            </>
                        ) : (
                            <>
                                <NavLink
                                    to="/"
                                    end
                                    className={({ isActive }) =>
                                        `tf-navbar-link ${isActive ? "tf-navbar-link-active" : ""}`
                                    }
                                    onClick={closeMenu}
                                >
                                    Home
                                </NavLink>

                                <NavLink
                                    to="/about"
                                    className={({ isActive }) =>
                                        `tf-navbar-link ${isActive ? "tf-navbar-link-active" : ""}`
                                    }
                                    onClick={closeMenu}
                                >
                                    About
                                </NavLink>
                            </>
                        )}

                    </div>

                    {/* Authentication Actions */}
                    <div className="tf-navbar-actions">

                        {!isLoggedIn ? (
                            <>
                                <Link
                                    to="/signin"
                                    className="tf-navbar-signin"
                                    onClick={closeMenu}
                                >
                                    Sign in
                                </Link>

                                <Link
                                    to="/signup"
                                    className="tf-navbar-signup"
                                    onClick={closeMenu}
                                >
                                    Get started
                                </Link>

                            </>
                            
                        ) : (
                            <>
                                {/* Notification Bell */}
                                <button
                                    type="button"
                                    className="tf-navbar-notification"
                                    onClick={() => {
                                        closeMenu();
                                        navigate("/notifications");
                                    }}
                                    aria-label={`Notifications, ${unreadCount} unread`}
                                >
                                    <FiBell />

                                    {unreadCount > 0 && (
                                        <span className="tf-notification-count">
                                            {unreadCount > 99 ? "99+" : unreadCount}
                                        </span>
                                    )}
                                </button>

                                <div className="tf-navbar-profile">
                                    <div className="tf-navbar-avatar">
                                        {initials || "U"}
                                    </div>

                                    <div className="tf-navbar-user-info">
                                        <strong>{username}</strong>
                                        {email && <span>{email}</span>}
                                    </div>
                                </div>

                                <button
                                    type="button"
                                    className="tf-navbar-logout"
                                    onClick={logout}
                                >
                                    <FiLogOut />
                                    <span>Logout</span>
                                </button>
                            </>
                        )}

                    </div>

                </nav>
            </div>
        </header>
    );
};

export default Navbar;