import { Link, NavLink } from "react-router-dom";

import {
    FiCheckSquare,
    FiGrid,
    FiClipboard,
    FiCalendar,
    FiBell,
    FiUser,
    FiSettings,
    FiLogOut,
    FiArrowUpRight,
    FiTrendingUp
} from "react-icons/fi";

const Sidebar = ({
    sidebarOpen,
    setSidebarOpen,
    tasksCount,
    unreadCount,
    onLogout
}) => {
    const closeSidebar = () => {
        setSidebarOpen(false);
    };

    return (
        <>
            {sidebarOpen && (
                <button
                    className="tf-mobile-overlay"
                    aria-label="Close navigation"
                    onClick={closeSidebar}
                />
            )}

            <aside
                className={`tf-sidebar ${
                    sidebarOpen ? "tf-sidebar-open" : ""
                }`}
            >
                <Link
                    to="/"
                    className="tf-brand"
                    onClick={closeSidebar}
                >
                    <span className="tf-brand-icon">
                        <FiCheckSquare />
                    </span>

                    <span>
                        Task<span className="tf-brand-accent">Flow</span>
                    </span>
                </Link>

                <div className="tf-workspace-label">
                    WORKSPACE
                </div>

                <nav className="tf-navigation">

                    <NavLink
                        to="/dashboard"
                        end
                        className={({ isActive }) =>
                            `tf-nav-item ${
                                isActive ? "tf-nav-active" : ""
                            }`
                        }
                        onClick={closeSidebar}
                    >
                        <FiGrid />
                        <span>Dashboard</span>
                    </NavLink>
  
                    <NavLink
                        to="/tasks"
                        className={({ isActive }) =>
                            `tf-nav-item ${
                                isActive ? "tf-nav-active" : ""
                            }`
                        }
                        onClick={closeSidebar}
                    >
                        <FiClipboard />
                        <span>My Tasks</span>

                        <span className="tf-nav-count">
                            {tasksCount}
                        </span>
                    </NavLink>

                    <NavLink
                        to="/calendar"
                        className={({ isActive }) =>
                            `tf-nav-item ${
                                isActive ? "tf-nav-active" : ""
                            }`
                        }
                        onClick={closeSidebar}
                    >
                        <FiCalendar />
                        <span>Calendar</span>
                    </NavLink>

                    <NavLink
                        to="/progress"
                        className={({ isActive }) =>
                            `tf-nav-item ${
                                isActive ? "tf-nav-active" : ""
                            }`
                        }
                        onClick={closeSidebar}
                    >
                        <FiTrendingUp />
                        <span>My Progress</span>
                    </NavLink>

                    <NavLink
                        to="/workspace/notifications"
                        className={({ isActive }) =>
                            `tf-nav-item ${
                                isActive ? "tf-nav-active" : ""
                            }`
                        }
                        onClick={closeSidebar}
                    >
                        <FiBell />
                        <span>Notifications</span>

                        {unreadCount > 0 && (
                            <span className="tf-nav-count">
                                {unreadCount}
                            </span>
                        )}
                    </NavLink>

                </nav>

                <div className="tf-workspace-label">
                    ACCOUNT
                </div>

                <nav className="tf-navigation">

                    <NavLink
                        to="/account/profile"
                        className={({ isActive }) =>
                            `tf-nav-item ${
                                isActive ? "tf-nav-active" : ""
                            }`
                        }
                        onClick={closeSidebar}
                    >
                        <FiUser />
                        <span>My Profile</span>
                    </NavLink>

                    <NavLink
                        to="/settings"
                        className={({ isActive }) =>
                            `tf-nav-item ${
                                isActive ? "tf-nav-active" : ""
                            }`
                        }
                        onClick={closeSidebar}
                    >
                        <FiSettings />
                        <span>Settings</span>
                    </NavLink>

                </nav>

                <div className="tf-sidebar-bottom">

                    <div className="tf-sidebar-tip">
                        <div className="tf-tip-icon">
                            <FiArrowUpRight />
                        </div>

                        <h4>Small steps, big results.</h4>

                        <p>
                            Keep your tasks organized and make
                            progress every day.
                        </p>
                    </div>

                    <button
                        type="button"
                        className="tf-logout"
                        onClick={onLogout}
                    >
                        <FiLogOut />
                        <span>Log out</span>
                    </button>

                    <div className="tf-sidebar-footer">
                        TASKFLOW · YOUR SPACE
                    </div>

                </div>
            </aside>
        </>
    );
};

export default Sidebar;