import { useEffect, useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";

import Sidebar from "./Sidebar";
import { authActions } from "../../store";
import { apiV3 } from "../../api/axios";
import api from "../../api/axios";

const WorkspaceLayout = () => {

    const [tasksCount, setTasksCount] = useState(0);
    const [unreadCount, setUnreadCount] = useState(0);

    useEffect(() => {
        const fetchTasksCount = async () => {
            try {
                const response = await api.get("/gettask");
                setTasksCount(response.data.list?.length || 0);
            } catch (error) {  
                console.error("Failed to fetch task count:", error);
            }
        };

        fetchTasksCount();

        window.addEventListener("tasksUpdated", fetchTasksCount);

        return () => {
            window.removeEventListener("tasksUpdated", fetchTasksCount);
        };
    }, []);

    // Fetch Unread Notification Count

    useEffect(() => {
        const fetchUnreadCount = async () => {
            try {
                const response = await apiV3.get("/notifications");

                setUnreadCount(response.data.unreadCount || 0);

            } catch (error) {
                console.error(
                    "Failed to fetch unread notifications:",
                    error
                );
            }
        };

        fetchUnreadCount();

        // Listen For Notification Read/Delete Changes

        window.addEventListener(
            "notificationsUpdated",
            fetchUnreadCount
        );

        // Refresh Every 30 Seconds
        
        const interval = setInterval(fetchUnreadCount, 30000);

        return () => {
            window.removeEventListener(
                "notificationsUpdated",
                fetchUnreadCount
            );

            clearInterval(interval);
        };
    }, []);

    const location = useLocation();
    const navigate = useNavigate();
    const dispatch = useDispatch();

    const [sidebarOpen, setSidebarOpen] = useState(false);

    const username = sessionStorage.getItem("username") || "User";

    const initials = username
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0].toUpperCase())
        .join("");

    const pageDetails = {
        "/dashboard": {
            section: "Workspace",
            page: "Dashboard"
        },
        "/tasks": {
            section: "Workspace",
            page: "My Tasks"
        },
        "/workspace/notifications": {
            section: "Workspace",
            page: "Notifications"
        },
        "/calendar": {
            section: "Workspace",
            page: "Calendar"
        },
        "/progress": {
            section: "Workspace",
            page: "My Progress"
        },
        "/account/profile": {
            section: "Account",
            page: "Profile"
        },
        "/settings": {
            section: "Account",
            page: "Settings"
        }
    };

    const currentPage = pageDetails[location.pathname] || {
        section: "Workspace",
        page: "Dashboard"
    };

    const handleLogout = () => {
        sessionStorage.removeItem("token");
        sessionStorage.removeItem("id");
        sessionStorage.removeItem("username");
        sessionStorage.removeItem("email");

        dispatch(authActions.logout());

        navigate("/signin");
    };

    return (
        <div className="tf-app">

            <Sidebar
                sidebarOpen={sidebarOpen}
                setSidebarOpen={setSidebarOpen}
                tasksCount={tasksCount}
                unreadCount={unreadCount}
                onLogout={handleLogout}
            />

            <main className="tf-main">

                <header className="tf-topbar">

                    <button
                        type="button"
                        className="tf-menu-toggle"
                        onClick={() =>
                            setSidebarOpen((open) => !open)
                        }
                        aria-label="Toggle navigation"
                    >
                        ☰
                    </button>

                    <div className="tf-breadcrumb">
                        {currentPage.section}
                        <span>/</span>
                        <strong>{currentPage.page}</strong>
                    </div>

                    <div className="tf-profile">

                        <div className="tf-profile-copy">
                            <strong>{username}</strong>
                            <span>Personal workspace</span>
                        </div>

                        <div className="tf-avatar">
                            {initials || "U"}
                        </div>

                    </div>

                </header>

                <div className="tf-content">
                    <Outlet />

                    <footer className="tf-page-footer">
                        <span>Made for your next big thing.</span>

                        <span>
                            TaskFlow <span className="tf-footer-dot">●</span> Stay focused
                        </span>
                    </footer>
                </div>

            </main>

        </div>
    );
};

export default WorkspaceLayout;