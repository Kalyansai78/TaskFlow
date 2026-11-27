import React, { useEffect, useState } from "react";
import {
    FiBell,
    FiInbox,
    FiClock,
    FiTrash2,
    FiCheck,
    FiCheckCircle
} from "react-icons/fi";

import { toast } from 'react-toastify';

import "./Notifications.css";

import { apiV3 } from "../../api/axios";

const Notifications = () => {
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [notificationToDelete, setNotificationToDelete] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [pagination, setPagination] = useState({
        currentPage: 1,
        totalPages: 0,
        totalNotifications: 0,
        limit: 10,
        hasNextPage: false,
        hasPreviousPage: false
    });

    useEffect(() => {
        const fetchNotifications = async (showLoader = false) => {
            try {
                if (showLoader) {
                    setLoading(true);
                }

                const response = await apiV3.get(
                    `/notifications?page=${currentPage}&limit=10`
                );

                const data = response.data;

                setNotifications(data.notifications || []);
                setUnreadCount(data.unreadCount || 0);
                setPagination(data.pagination);

                // Handle Cases Where The Requested Page No Longer Exists
                if (data.pagination.currentPage !== currentPage) {
                    setCurrentPage(data.pagination.currentPage);
                }

                setError("");

            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchNotifications(true);

        // Refresh the Current Page Every 30 Seconds
        const interval = setInterval(() => {
            fetchNotifications(false);
        }, 30000);

        return () => clearInterval(interval);

    }, [currentPage]);

    const formatDate = (date) => {
        return new Date(date).toLocaleString("en-IN", {
            day: "numeric",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit"
        });
    };

    const markAsRead = async (notificationId) => {
        try {
            
            await apiV3.patch(`/notifications/${notificationId}/read`);

            setNotifications((previous) =>
                previous.map((notification) =>
                    notification._id === notificationId
                        ? { ...notification, isRead: true }
                        : notification
                )
            );

            setUnreadCount((previous) => Math.max(0, previous - 1));
            window.dispatchEvent(new Event("notificationsUpdated"));

        } catch (error) {
            console.error("Mark as read error:", error);
        }
    };

    const markAllAsRead = async () => {
        try {

            await apiV3.patch("/notifications/read-all");

            setNotifications((previous) =>
                previous.map((notification) => ({
                    ...notification,
                    isRead: true
                }))
            );

            setUnreadCount(0);
            window.dispatchEvent(new Event("notificationsUpdated"));

        } catch (error) {
            console.error("Mark all as read error:", error);
        }
    };

    const deleteNotification = async (notificationId) => {

        try {
            
            await apiV3.delete(`/notifications/${notificationId}`);

            const deletedNotification = notifications.find(
                (notification) => notification._id === notificationId
            );

            const updatedNotifications = notifications.filter(
                (notification) => notification._id !== notificationId
            );

            setNotifications(updatedNotifications);

            // Update Pagination After Deletion
            setPagination((previous) => {
                const newTotal = Math.max(0, previous.totalNotifications - 1);
                const newTotalPages = Math.ceil(newTotal / previous.limit);

                return {
                    ...previous,
                    totalNotifications: newTotal,
                    totalPages: newTotalPages,
                    hasNextPage: currentPage < newTotalPages,
                    hasPreviousPage: currentPage > 1 && newTotalPages > 0
                };
            });

            // If This Was The Last Notification On The Current Page,
            // Move To The Previous Page When Possible.
            if (updatedNotifications.length === 0 && currentPage > 1) {
                setCurrentPage((previous) => previous - 1);
            }

            if (deletedNotification && !deletedNotification.isRead) {
                setUnreadCount((previous) => Math.max(0, previous - 1));
                window.dispatchEvent(new Event("notificationsUpdated"));
            }

            setNotificationToDelete(null);

            toast.success("Notification deleted successfully!");

        } catch (error) {
            console.error("Delete notification error:", error);
            toast.error("Unable to delete notification. Please try again.");
        }
    };

    return (
        <main className="tf-notifications-page">
            <div className="tf-notifications-container">

                <div className="tf-notifications-header">
                    <div>
                        <span className="tf-notifications-eyebrow">
                            YOUR ACTIVITY
                        </span>

                        <h1>Notifications</h1>

                        <p>
                            Stay updated with your TaskFlow activities.
                        </p>
                    </div>

                    <div className="tf-notifications-header-actions">
                        <div className="tf-notifications-summary">
                            <FiBell />
                            <span>{unreadCount} unread</span>
                        </div>

                        {unreadCount > 0 && (
                            <button
                                type="button"
                                className="tf-mark-all-read"
                                onClick={markAllAsRead}
                            >
                                <>
                                    <FiCheckCircle />
                                    Mark all as read
                                </>
                            </button>
                        )}
                    </div>
                </div>

                <div className="tf-notifications-content">

                    {loading ? (
                        <div className="tf-notifications-state">
                            <div className="tf-notifications-loader"></div>
                            <p>Loading notifications...</p>
                        </div>
                    ) : error ? (
                        <div className="tf-notifications-state">
                            <p>{error}</p>
                        </div>
                    ) : notifications.length === 0 ? (
                        <div className="tf-notifications-empty">
                            <div className="tf-notifications-empty-icon">
                                <FiInbox />
                            </div>

                            <h2>You're all caught up!</h2>

                            <p>
                                You don't have any notifications right now.
                                We'll keep you updated when something happens.
                            </p>
                        </div>
                    ) : (
                        <div className="tf-notifications-list">
                            {notifications.map((notification) => (
                                <article
                                    key={notification._id}
                                    className={`tf-notification-card ${
                                        notification.isRead ? "" : "unread"
                                    }`}
                                >
                                    <div className="tf-notification-icon">
                                        <FiBell />
                                    </div>

                                    <div className="tf-notification-details">
                                        <div className="tf-notification-title-row">
                                            <h3>{notification.title}</h3>

                                            {!notification.isRead && (
                                                <span className="tf-unread-dot"></span>
                                            )}
                                        </div>

                                        <p>{notification.message}</p>

                                        <span className="tf-notification-date">
                                            <FiClock />
                                            {formatDate(notification.createdAt)}
                                        </span>
                                    </div>

                                    {!notification.isRead && (
                                        <button
                                            type="button"
                                            className="tf-mark-read"
                                            onClick={() => markAsRead(notification._id)}
                                        >
                                            <>
                                                <FiCheck />
                                                Mark as read
                                            </>
                                        </button>
                                    )}

                                    <button
                                        type="button"
                                        className="tf-delete-notification"
                                        onClick={() => setNotificationToDelete(notification._id)}
                                        aria-label="Delete notification"
                                        title="Delete notification"
                                    >
                                        <FiTrash2 />
                                        <span>Delete</span>
                                    </button>
                                </article>
                            ))}
                        </div>
                    )}

                    {!loading && !error && pagination.totalPages > 1 && (
                        <div className="tf-pagination">

                            <button
                                type="button"
                                disabled={!pagination.hasPreviousPage}
                                onClick={() => setCurrentPage(1)}
                            >
                                First
                            </button>

                            <button
                                type="button"
                                disabled={!pagination.hasPreviousPage}
                                onClick={() => setCurrentPage((prev) => prev - 1)}
                            >
                                Previous
                            </button>

                            <span className="tf-pagination-info">
                                Page {pagination.currentPage} of {pagination.totalPages}
                            </span>

                            <button
                                type="button"
                                disabled={!pagination.hasNextPage}
                                onClick={() => setCurrentPage((prev) => prev + 1)}
                            >
                                Next
                            </button>

                            <button
                                type="button"
                                disabled={!pagination.hasNextPage}
                                onClick={() => setCurrentPage(pagination.totalPages)}
                            >
                                Last
                            </button>

                        </div>
                    )}

                </div>
            </div>

            {notificationToDelete && (
                <div
                    className="tf-delete-modal-overlay"
                    onClick={() => setNotificationToDelete(null)}
                >
                    <div
                        className="tf-delete-modal"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="tf-delete-modal-icon">
                            <FiTrash2 />
                        </div>

                        <h2>Delete Notification?</h2>

                        <p>
                            Are you sure you want to delete this notification?
                            This action cannot be undone.
                        </p>

                        <div className="tf-delete-modal-actions">
                            <button
                                type="button"
                                className="tf-delete-cancel"
                                onClick={() => setNotificationToDelete(null)}
                            >
                                Cancel
                            </button>

                            <button
                                type="button"
                                className="tf-delete-confirm"
                                onClick={() => deleteNotification(notificationToDelete)}
                            >
                                Delete Notification
                            </button>
                        </div>
                    </div>
                </div>
            )}
            
        </main>
    );
};

export default Notifications;