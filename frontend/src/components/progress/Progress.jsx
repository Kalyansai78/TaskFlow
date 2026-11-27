import React, { useEffect, useState } from "react";
import api from "../../api/axios";
import {
    FiClipboard,
    FiCheckCircle,
    FiClock,
    FiAlertCircle,
    FiTrendingUp,
    FiTarget,
    FiActivity,
} from "react-icons/fi";

import "./Progress.css";

const Progress = () => {
    const [progress, setProgress] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    // Fetch Productivity Data
    useEffect(() => {
        const fetchProgress = async () => {
            try {
                setLoading(true);
                setError("");

                const timezone =
                    Intl.DateTimeFormat().resolvedOptions().timeZone ||
                    "Asia/Kolkata";

                const response = await api.get("/progress", {
                    params: { timezone },
                });

                setProgress(response.data);

            } catch (error) {
                console.error(
                    "Progress fetch error:",
                    error.response?.data || error.message
                );

                setError(
                    error.response?.data?.message ||
                    "Unable to load your productivity progress."
                );

            } finally {
                setLoading(false);
            }
        };

        fetchProgress();
    }, []);

    // Loading State
    if (loading) {
        return (
            <div className="tf-progress-loading">
                <div className="tf-loading-spinner"></div>
                <h3>Analyzing your productivity</h3>
                <p>Getting your progress ready...</p>
            </div>
        );
    }

    // Error State
    if (error) {
        return (
            <div className="tf-progress-error">
                <FiAlertCircle />
                <h3>Something went wrong</h3>
                <p>{error}</p>
            </div>
        );
    }

    if (!progress) return null;

    const {
        overview,
        categoryStats,
        priorityStats,
        weeklyActivity,
        recentlyCompleted,
    } = progress;

    const overviewCards = [
        {
            label: "Total tasks",
            value: overview.totalTasks,
            icon: <FiClipboard />,
            className: "tf-progress-purple",
        },
        {
            label: "Completed",
            value: overview.completedTasks,
            icon: <FiCheckCircle />,
            className: "tf-progress-green",
        },
        {
            label: "Pending",
            value: overview.pendingTasks,
            icon: <FiClock />,
            className: "tf-progress-orange",
        },
        {
            label: "Overdue",
            value: overview.overdueTasks,
            icon: <FiAlertCircle />,
            className: "tf-progress-red",
        },
    ];

    const maxWeeklyTasks = Math.max(
        ...weeklyActivity.map((day) => day.completed),
        1
    );

    return (
        <div className="tf-progress-page">

            {/* Page Header */}
            <section className="tf-progress-header">
                <div>
                    <span className="tf-progress-eyebrow">
                        <FiTrendingUp /> YOUR PRODUCTIVITY
                    </span>

                    <h1>My Progress</h1>

                    <p>
                        Track your achievements and see how far you've come.
                    </p>
                </div>
            </section>

            {/* Overview Cards */}
            <section className="tf-progress-overview">

                {overviewCards.map((card) => (
                    <article
                        className="tf-progress-card"
                        key={card.label}
                    >
                        <div className="tf-progress-card-top">
                            <span className={`tf-progress-icon ${card.className}`}>
                                {card.icon}
                            </span>
                        </div>

                        <strong>{card.value}</strong>
                        <span>{card.label}</span>
                    </article>
                ))}

            </section>

            {/* Completion Rate */}
            <section className="tf-progress-completion">

                <div className="tf-progress-section-heading">
                    <div>
                        <h2>Overall completion</h2>
                        <p>Your task completion performance.</p>
                    </div>

                    <FiTarget />
                </div>

                <div className="tf-progress-rate">
                    <strong>{overview.completionRate}%</strong>
                    <span>Completion rate</span>
                </div>

                <div className="tf-progress-track">
                    <div
                        className="tf-progress-track-fill"
                        style={{
                            width: `${overview.completionRate}%`,
                        }}
                    ></div>
                </div>

                <p className="tf-progress-completion-note">
                    You've completed {overview.completedTasks} out of{" "}
                    {overview.totalTasks} tasks.
                </p>

            </section>

            {/* Weekly Activity */}
            <section className="tf-progress-weekly">

                <div className="tf-progress-section-heading">
                    <div>
                        <h2>Weekly activity</h2>
                        <p>Your completed tasks over the last 7 days.</p>
                    </div>

                    <FiActivity />
                </div>

                <div className="tf-progress-chart">

                    {weeklyActivity.map((day) => (
                        <div
                            className="tf-progress-chart-column"
                            key={day.date}
                        >
                            <span className="tf-progress-chart-value">
                                {day.completed}
                            </span>

                            <div className="tf-progress-chart-bar-wrap">
                                <div
                                    className="tf-progress-chart-bar"
                                    style={{
                                        height: `${Math.max(
                                            (day.completed / maxWeeklyTasks) * 100,
                                            day.completed > 0 ? 8 : 0
                                        )}%`,
                                    }}
                                ></div>
                            </div>

                            <span className="tf-progress-chart-label">
                                {day.label}
                            </span>
                        </div>
                    ))}

                </div>

            </section>

            {/* Category Statistics */}
            <section className="tf-progress-breakdown">

                <div className="tf-progress-section-heading">
                    <div>
                        <h2>Tasks by category</h2>
                        <p>See how your tasks are distributed.</p>
                    </div>
                </div>

                <div className="tf-progress-breakdown-grid">

                    {categoryStats.map((item) => (
                        <article
                            className="tf-progress-breakdown-card"
                            key={item.category}
                        >
                            <div className="tf-progress-breakdown-top">
                                <strong>{item.category}</strong>
                                <span>
                                    {item.total} {item.total === 1 ? "task" : "tasks"}
                                </span>
                            </div>

                            <div className="tf-progress-mini-track">
                                <div
                                    className="tf-progress-mini-fill"
                                    style={{
                                        width: `${
                                            item.total > 0
                                                ? (item.completed / item.total) * 100
                                                : 0
                                        }%`,
                                    }}
                                ></div>
                            </div>

                            <div className="tf-progress-breakdown-footer">
                                <span>{item.completed} completed</span>
                                <span>{item.pending} pending</span>
                            </div>
                        </article>
                    ))}

                </div>

            </section>

            {/* Priority Statistics */}
            <section className="tf-progress-priority">

                <div className="tf-progress-section-heading">
                    <div>
                        <h2>Tasks by priority</h2>
                        <p>Understand where your attention goes.</p>
                    </div>
                </div>

                <div className="tf-progress-priority-list">

                    {priorityStats.map((item) => (
                        <div
                            className={`tf-progress-priority-item priority-${item.priority.toLowerCase()}`}
                            key={item.priority}
                        >
                            <div>
                                <span className="tf-progress-priority-dot"></span>
                                <strong>{item.priority}</strong>
                            </div>

                            <span>
                                {item.completed} / {item.total} completed
                            </span>
                        </div>
                    ))}

                </div>

            </section>

            {/* Recently Completed */}
            <section className="tf-progress-recent">

                <div className="tf-progress-section-heading">
                    <div>
                        <h2>Recently completed</h2>
                        <p>Your latest achievements.</p>
                    </div>
                </div>

                {recentlyCompleted.length > 0 ? (

                    <div className="tf-progress-recent-list">

                        {recentlyCompleted.map((task) => (
                            <article
                                className="tf-progress-recent-item"
                                key={task._id}
                            >
                                <span className="tf-progress-recent-icon">
                                    <FiCheckCircle />
                                </span>

                                <div className="tf-progress-recent-info">
                                    <strong>{task.title}</strong>

                                    <span>
                                        {task.category || "Personal"} ·{" "}
                                        {task.priority || "Medium"}
                                    </span>
                                </div>

                                <time>
                                    {new Date(task.completedAt).toLocaleDateString(
                                        "en-IN",
                                        {
                                            day: "numeric",
                                            month: "short",
                                        }
                                    )}
                                </time>
                            </article>
                        ))}

                    </div>

                ) : (

                    <div className="tf-progress-empty">
                        <FiCheckCircle />
                        <h3>No completed tasks yet</h3>
                        <p>
                            Complete your first task and your achievements
                            will appear here.
                        </p>
                    </div>

                )}

            </section>

        </div>
    );
};

export default Progress;