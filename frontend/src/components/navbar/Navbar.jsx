import React, { useState } from "react";
import { NavLink, Link, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import {
    FiCheckSquare,
    FiMenu,
    FiX,
    FiLogOut,
    FiUser,
    FiGrid,
    FiInfo
} from "react-icons/fi";

import "./Navbar.css";
import { authActions } from "../../store";

const Navbar = () => {
    const isLoggedIn = useSelector((state) => state.isLoggedIn);
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const [menuOpen, setMenuOpen] = useState(false);

    const username = sessionStorage.getItem("username") || "User";
    const email = sessionStorage.getItem("email") || "";

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

                {/* BRAND */}
                <Link to="/" className="tf-navbar-brand" onClick={closeMenu}>
                    <span className="tf-navbar-logo">
                        <FiCheckSquare />
                    </span>

                    <span>
                        Task<span>Flow</span>
                    </span>
                </Link>

                {/* MOBILE MENU BUTTON */}
                <button
                    type="button"
                    className="tf-navbar-toggle"
                    onClick={() => setMenuOpen((previous) => !previous)}
                    aria-label="Toggle navigation"
                    aria-expanded={menuOpen}
                >
                    {menuOpen ? <FiX /> : <FiMenu />}
                </button>

                {/* NAVIGATION */}
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
                                    to="/todo"
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

                    {/* AUTHENTICATION ACTIONS */}
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