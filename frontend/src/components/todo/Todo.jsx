import React, { useEffect, useMemo, useState } from "react";
import { useDispatch } from "react-redux";
import { useLocation, useNavigate } from "react-router-dom";
import api from "../../api/axios";
import {
    FiCheckSquare,
    FiPlus,
    FiSearch,
    FiClipboard,
    FiClock,
    FiCalendar,
    FiX,
    FiTrendingUp,
} from "react-icons/fi";

import "./Todo.css";
import "./Todocards.css";
import Todocards from "./Todocards";
import SubtaskEditor from "./SubtaskEditor";
import Update from "./Update";
import { authActions } from "../../store";
import { toast } from "react-toastify";

const getLocalDateTime = (date = new Date()) => {
    const offset = date.getTimezoneOffset();

    return new Date(date.getTime() - offset * 60000)
        .toISOString()
        .slice(0, 16);
};

// Dashboard Motivational Messages

const greetingMessages = [
    "Every little step forward is progress. Keep believing in yourself.",
    "A new day brings new opportunities. Make the most of it.",
    "Stay focused, stay consistent, and trust your journey.",
    "Great things take time. Keep moving forward.",
    "Your goals are worth the effort. Keep going!",
    "Make space for progress, not perfection.",
    "Believe in what you're building. Your journey matters."
];

// Get Greeting Based On Local Time

const getGreeting = (date) => {
    const hour = date.getHours();

    if (hour >= 5 && hour < 12) {
        return "Good morning";
    }

    if (hour >= 12 && hour < 17) {
        return "Good afternoon";
    }

    return "Good evening";
};

const Todo = ({ view = "dashboard" }) => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const location = useLocation();

    const [inputs, setInputs] = useState({
        title: "",
        body: "",
        priority: "Medium",
        dueDate: "",
        reminderAt: "",
        category: "Personal"
    });

    const [tasks, setTasks] = useState([]);
    const [subtasks, setSubtasks] = useState([]);
    const [selectedTask, setSelectedTask] = useState(null);
    const [search, setSearch] = useState("");
    const [activeFilter, setActiveFilter] = useState("All tasks");
    const [priorityFilter, setPriorityFilter] = useState("All priorities");
    const [categoryFilter, setCategoryFilter] = useState("All categories");
    const [sortBy, setSortBy] = useState("newest");
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [showUpdate, setShowUpdate] = useState(false);
    const [showDetails, setShowDetails] = useState(false);

    const [currentTime, setCurrentTime] = useState(new Date());
    const [messageIndex, setMessageIndex] = useState(0);

    const token = sessionStorage.getItem("token");
    const username = sessionStorage.getItem("username") || "there";

    // Apply Filter From Dashboard Navigation

    useEffect(() => {
        if (view !== "tasks") return;

        const params = new URLSearchParams(location.search);

        // Apply Status Filter

        setActiveFilter(
            params.get("filter") === "overdue"
                ? "Overdue"
                : "All tasks"
        );

        // Apply Priority Filter

        const requestedPriority = params.get("priority");

        setPriorityFilter(
            ["High", "Medium", "Low"].includes(requestedPriority)
                ? requestedPriority
                : "All priorities"
        );

    }, [location.search, view]);

    // Fetch Tasks

    useEffect(() => {
        const fetchTasks = async () => {
            if (!token) {
                setTasks([]);
                setLoading(false);
                navigate("/signin");
                return;
            }

            try {
                const response = await api.get("/gettask");

                setTasks(response.data.list || []);

            } catch (error) {
                console.error(
                    "Fetch tasks error:",
                    error.response?.data || error.message
                );

                if (error.response?.status === 401) {
                    sessionStorage.clear();
                    dispatch(authActions.logout());
                    navigate("/signin");
                    return;
                }

                toast.error("Unable to load your tasks.");

            } finally {
                setLoading(false);
            }
        };

        fetchTasks();
    }, [token]);

    // Update Greeting Time Every Minute

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date());
        }, 60000);

        return () => clearInterval(timer);
    }, []);

    // Rotate Motivational Messages Every 1 hour

    useEffect(() => {
        const messageTimer = setInterval(() => {
            setMessageIndex((previous) =>
                (previous + 1) % greetingMessages.length
            );
        }, 60 * 60 * 1000);

        return () => clearInterval(messageTimer);
    }, []);

    // Handle Input Changes

    const change = (event) => {
        const { name, value } = event.target;

        setInputs((previous) => ({
            ...previous,
            [name]: value
        }));
    };

    // Create Task

    const submit = async (event) => {
        event.preventDefault();

        if (!inputs.title.trim() || !inputs.body.trim()) {
            toast.error("Please enter a title and description.");
            return;
        }

        if (
            inputs.reminderAt &&
            new Date(inputs.reminderAt).getTime() <= Date.now()
        ) {
            toast.error("Reminder must be set for a future date and time.");
            return;
        }

        if (!token) {
            toast.error("Please sign in to create a task.");
            navigate("/signin");
            return;
        }

        try {
            setSaving(true);

            const response = await api.post("/addtask", {
                title: inputs.title.trim(),
                body: inputs.body.trim(),
                priority: inputs.priority,
                dueDate: inputs.dueDate || null,
                reminderAt: inputs.reminderAt
                    ? new Date(inputs.reminderAt).toISOString()
                    : null,
                category: inputs.category,
                subtasks
            });

            if (response.data.list) {
                setTasks((previous) => [
                    response.data.list,
                    ...previous
                ]);
            }

            setInputs({
                title: "",
                body: "",
                priority: "Medium",
                dueDate: "",
                reminderAt: "",
                category: "Personal"
            });
            setSubtasks([]);
            setShowCreateForm(false);

            toast.success("Your task has been created.");

            window.dispatchEvent(new Event("tasksUpdated"));

            navigate("/tasks");
            
        } catch (error) {
            console.error(
                "Add task error:",
                error.response?.data || error.message
            );

            toast.error(
                error.response?.data?.message || "Could not create the task."
            );
        } finally {
            setSaving(false);
        }
    };

    // Delete Task

    const del = async (taskId) => {
        if (!token) {
            toast.error("Please sign in again.");
            navigate("/signin");
            return;
        }

        try {
            await api.delete(`/deletetask/${taskId}`);

            setTasks((previous) =>
                previous.filter((task) => task._id !== taskId)
            );

            toast.success("Task deleted successfully.");

            window.dispatchEvent(new Event("tasksUpdated"));
        } catch (error) {
            console.error(
                "Delete task error:",
                error.response?.data || error.message
            );

            toast.error(
                error.response?.data?.message || "Could not delete the task."
            );
        }
    };

    const toggleTask = async (taskId, completed) => {

        if (!token) {
            toast.error("Please sign in again.");
            navigate("/signin");
            return;
        }

        try {
            const response = await api.patch(
                `/completetask/${taskId}`,
                {
                    completed
                }
            );

            const updatedTask = response.data.list;

            setTasks((previous) =>
                previous.map((task) =>
                    task._id === taskId ? updatedTask : task
                )
            );

            toast.success(
                completed
                    ? "Great work! Task completed."
                    : "Task moved back to pending."
            );

        } catch (error) {
            console.error(
                "Completion API error:",
                error.response?.data || error.message
            );

            toast.error(
                error.response?.data?.message ||
                "Could not update task status."
            );
        }
    };

    // Open Update Modal

    const openUpdate = (task) => {
        setSelectedTask(task);
        setShowUpdate(true);
    };

    // Open Task Details

    const openDetails = (task) => {
        setSelectedTask(task);
        setShowDetails(true);
    };

    // Update Task Details

    const handleSubtasksChange = async (updatedSubtasks) => {
        if (!selectedTask?._id) return;

        const previousTask = selectedTask;

        const updatedTask = {
            ...previousTask,
            subtasks: updatedSubtasks
        };

        // Update UI Immediately

        setSelectedTask(updatedTask);

        setTasks((previous) =>
            previous.map((task) =>
                task._id === updatedTask._id
                    ? updatedTask
                    : task
            )
        );

        try {
            const response = await api.put(
                `/updatetask/${updatedTask._id}`,
                {
                    title: updatedTask.title,
                    body: updatedTask.body,
                    priority: updatedTask.priority || "Medium",
                    category: updatedTask.category || "Personal",
                    dueDate: updatedTask.dueDate || null,
                    subtasks: updatedSubtasks
                }
            );

            // Store The Updated Task Returned By MongoDB

            const savedTask = response.data.list;

            setSelectedTask(savedTask);

            setTasks((previous) =>
                previous.map((task) =>
                    task._id === savedTask._id
                        ? savedTask
                        : task
                )
            );

        } catch (error) {
            console.error(
                "Update subtasks error:",
                error.response?.data || error.message
            );

            // Restore Previous Data If Saving Fails
            setSelectedTask(previousTask);

            setTasks((previous) =>
                previous.map((task) =>
                    task._id === previousTask._id
                        ? previousTask
                        : task
                )
            );

            toast.error(
                error.response?.data?.message ||
                "Failed to save checklist changes."
            );
        }
    };

    // Task Statistics

    const totalTasks = tasks.length;

    const completedTasks = tasks.filter(
        (task) => task.completed === true
    ).length;

    // Priority Wise Task Statistics

    const highPriorityTasks = tasks.filter(
        (task) => (task.priority || "Medium") === "High"
    ).length;

    const mediumPriorityTasks = tasks.filter(
        (task) => (task.priority || "Medium") === "Medium"
    ).length;

    const lowPriorityTasks = tasks.filter(
        (task) => (task.priority || "Medium") === "Low"
    ).length;

    // Upcoming Deadlines

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const nextSevenDays = new Date(today);
    nextSevenDays.setDate(today.getDate() + 7);

    const upcomingTasks = tasks
        .filter((task) => {
            if (!task.dueDate || task.completed) return false;

            // Parse Date Using Local Calendar Values

            const dateString = String(task.dueDate).slice(0, 10);
            const [year, month, day] = dateString.split("-").map(Number);

            const dueDate = new Date(year, month - 1, day);

            return dueDate >= today && dueDate <= nextSevenDays;
        })
        .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));

    // Overdue Tasks

    const overdueTasks = tasks.filter((task) => {
        if (!task.dueDate || task.completed) return false;

        const dateString = String(task.dueDate).slice(0, 10);
        const [year, month, day] = dateString.split("-").map(Number);

        const dueDate = new Date(year, month - 1, day);

        return dueDate < today;
    });

    const overdueTaskCount = overdueTasks.length;

    // Productivity Insights

    const pendingHighPriorityTasks = tasks.filter(
        (task) => !task.completed && task.priority === "High"
    ).length;

    const completionRate = totalTasks > 0
        ? Math.round((completedTasks / totalTasks) * 100)
        : 0;

    const productivityMessage =
        totalTasks === 0
            ? "Start adding tasks to track your productivity."
            : completionRate === 100
            ? "Amazing! You have completed all your tasks."
            : completionRate >= 75
            ? "Great progress! You're getting things done."
            : completionRate >= 40
            ? "Good work! Keep building your momentum."
            : "Every completed task brings you closer to your goals.";

    const pendingTasks = totalTasks - completedTasks;

    const productivity = totalTasks > 0
        ? Math.round((completedTasks / totalTasks) * 100)
        : 0;

    // Search, Sort And Filter

    const filteredTasks = useMemo(() => {
        const query = search.trim().toLowerCase();

        // Step 1 : Filter Tasks

        const filtered = tasks.filter((task) => {
            const dueDate = task.dueDate
                ? String(task.dueDate).slice(0, 10)
                : "";

            const formattedDueDate = dueDate
                ? dueDate.split("-").reverse().join("-")
                : "";

            const searchableText = [
                task.title,
                task.body,
                task.category,
                task.priority,
                dueDate,
                formattedDueDate
            ]
                .filter(Boolean)
                .join(" ")
                .toLowerCase();

            const matchesSearch = searchableText.includes(query);

            if (!matchesSearch) return false;

            // Priority Filter

            if (
                priorityFilter !== "All priorities" &&
                task.priority !== priorityFilter
            ) {
                return false;
            }

            // Category Filter
            if (
                categoryFilter !== "All categories" &&
                (task.category || "Personal") !== categoryFilter
            ) {
                return false;
            }

            // Status Filter

            if (activeFilter === "Recent") {
                if (!task.createdAt) return false;

                const age =
                    Date.now() - new Date(task.createdAt).getTime();

                if (!(age >= 0 && age <= 7 * 24 * 60 * 60 * 1000)) {
                    return false;
                }
            }

            if (activeFilter === "Completed" && !task.completed) {
                return false;
            }

            if (activeFilter === "Pending" && task.completed) {
                return false;
            }

            // Overdue Filter

            if (activeFilter === "Overdue") {
                if (!task.dueDate || task.completed) {
                    return false;
                }

                const dateString = String(task.dueDate).slice(0, 10);
                const [year, month, day] = dateString.split("-").map(Number);

                const dueDate = new Date(year, month - 1, day);

                const currentDate = new Date();
                currentDate.setHours(0, 0, 0, 0);

                if (dueDate >= currentDate) {
                    return false;
                }
            }

            return true;
        });

        // Step 2 : Sort Filtered Tasks

        const priorityOrder = {
            High: 1,
            Medium: 2,
            Low: 3
        };

        return [...filtered].sort((a, b) => {
            switch (sortBy) {
                case "newest":
                    return new Date(b.createdAt || 0) -
                        new Date(a.createdAt || 0);

                case "oldest":
                    return new Date(a.createdAt || 0) -
                        new Date(b.createdAt || 0);

                case "priorityHigh":
                    return (priorityOrder[a.priority] || 2) -
                        (priorityOrder[b.priority] || 2);

                case "priorityLow":
                    return (priorityOrder[b.priority] || 2) -
                        (priorityOrder[a.priority] || 2);

                case "dueEarliest": {
                    if (!a.dueDate && !b.dueDate) return 0;
                    if (!a.dueDate) return 1;
                    if (!b.dueDate) return -1;

                    return new Date(a.dueDate) - new Date(b.dueDate);
                }

                case "dueLatest": {
                    if (!a.dueDate && !b.dueDate) return 0;
                    if (!a.dueDate) return 1;
                    if (!b.dueDate) return -1;

                    return new Date(b.dueDate) - new Date(a.dueDate);
                }

                default:
                    return 0;
            }
        });

    }, [tasks, search, activeFilter, priorityFilter, categoryFilter, sortBy]);


    // Current Date

    const formatDate = () =>
        new Date().toLocaleDateString("en-US", {
            weekday: "long",
            month: "long",
            day: "numeric"
        });

   return (
        <>
            {view === "dashboard" && (
                        <>
                    {/* Welcome Section */}
                    <section className="tf-welcome">

                        <div>
                            <div className="tf-eyebrow">
                                <FiCalendar /> {formatDate()}
                            </div>

                            <h1>
                                {getGreeting(currentTime)}, {username.split(" ")[0]}{" "}
                                <span>✦</span>
                            </h1>

                            <p key={messageIndex} className="animate-fade-in">
                                {greetingMessages[messageIndex]}
                            </p>
                        </div>

                        <button
                            type="button"
                            className="tf-primary-btn"
                            onClick={() => setShowCreateForm(true)}
                        >
                            <FiPlus /> Create new task
                        </button>

                    </section>

                    {/* Statistics */}
                    <section className="tf-stats">

                        <article className="tf-stat-card">
                            <div className="tf-stat-top">
                                <span className="tf-stat-icon tf-stat-purple">
                                    <FiClipboard />
                                </span>

                                <span className="tf-stat-caption">
                                    IN YOUR WORKSPACE
                                </span>
                            </div>

                            <div className="tf-stat-value">
                                {totalTasks}
                            </div>

                            <div className="tf-stat-description">
                                Total tasks
                            </div>
                        </article>

                        <article className="tf-stat-card">
                            <div className="tf-stat-top">
                                <span className="tf-stat-icon tf-stat-blue">
                                    <FiCheckSquare />
                                </span>

                                <span className="tf-stat-caption">
                                    WELL DONE
                                </span>
                            </div>

                            <div className="tf-stat-value">
                                {completedTasks}
                            </div>

                            <div className="tf-stat-description">
                                Completed tasks
                            </div>
                        </article>

                        <article className="tf-stat-card">
                            <div className="tf-stat-top">
                                <span className="tf-stat-icon tf-stat-orange">
                                    <FiClock />
                                </span>

                                <span className="tf-stat-caption">
                                    STILL IN PROGRESS
                                </span>
                            </div>

                            <div className="tf-stat-value">
                                {pendingTasks}
                            </div>

                            <div className="tf-stat-description">
                                Pending tasks
                            </div>
                        </article>

                        <article className="tf-stat-card">
                            <div className="tf-stat-top">
                                <span className="tf-stat-icon tf-stat-green">
                                    <FiTrendingUp />
                                </span>

                                <span className="tf-stat-caption">
                                    YOUR PROGRESS
                                </span>
                            </div>

                            <div className="tf-stat-value">
                                {productivity}%
                            </div>

                            <div className="tf-stat-description">
                                Productivity
                            </div>
                        </article>

                    </section>

                    {/* Priority Statistics */}
                    <section className="tf-priority-overview">

                        <div className="tf-priority-heading">
                            <h3>Tasks by priority</h3>
                            <p>Understand what needs your attention.</p>
                        </div>

                        <div className="tf-priority-grid">

                            <article
                                className="tf-priority-stat priority-stat-high"
                                role="button"
                                tabIndex={0}
                                aria-label={`View ${highPriorityTasks} high priority tasks`}
                                onClick={() => navigate("/tasks?priority=High")}
                                onKeyDown={(event) => {
                                    if (event.key === "Enter" || event.key === " ") {
                                        event.preventDefault();
                                        navigate("/tasks?priority=High");
                                    }
                                }}
                            >
                                <span className="tf-priority-dot"></span>

                                <div>
                                    <strong>{highPriorityTasks}</strong>
                                    <span>High priority</span>
                                </div>
                            </article>

                            <article
                                className="tf-priority-stat priority-stat-medium"
                                role="button"
                                tabIndex={0}
                                aria-label={`View ${mediumPriorityTasks} medium priority tasks`}
                                onClick={() => navigate("/tasks?priority=Medium")}
                                onKeyDown={(event) => {
                                    if (event.key === "Enter" || event.key === " ") {
                                        event.preventDefault();
                                        navigate("/tasks?priority=Medium");
                                    }
                                }}
                            >
                                <span className="tf-priority-dot"></span>

                                <div>
                                    <strong>{mediumPriorityTasks}</strong>
                                    <span>Medium priority</span>
                                </div>
                            </article>

                            <article
                                className="tf-priority-stat priority-stat-low"
                                role="button"
                                tabIndex={0}
                                aria-label={`View ${lowPriorityTasks} low priority tasks`}
                                onClick={() => navigate("/tasks?priority=Low")}
                                onKeyDown={(event) => {
                                    if (event.key === "Enter" || event.key === " ") {
                                        event.preventDefault();
                                        navigate("/tasks?priority=Low");
                                    }
                                }}
                            >
                                <span className="tf-priority-dot"></span>

                                <div>
                                    <strong>{lowPriorityTasks}</strong>
                                    <span>Low priority</span>
                                </div>
                            </article>

                        </div>

                    </section>

                    {/* Upcoming Deadlines */}
                    <section className="tf-upcoming-section">

                        <div className="tf-upcoming-heading">
                            <div>
                                <h3>Upcoming deadlines</h3>
                                <p>Stay ahead of your upcoming tasks.</p>
                            </div>

                            <span className="tf-upcoming-count">
                                {upcomingTasks.length} upcoming
                            </span>
                        </div>

                        {upcomingTasks.length === 0 ? (
                            <div className="tf-upcoming-empty">

                                <span className="tf-upcoming-empty-icon">
                                    <FiCheckSquare />
                                </span>

                                <h4>You're all caught up!</h4>

                                <p>
                                    You have no upcoming deadlines.
                                    Enjoy your free time or plan your next task.
                                </p>

                            </div>
                        ) : (
                            <div className="tf-upcoming-list">
                                {upcomingTasks.map((task) => {
                                    const dateString = String(task.dueDate).slice(0, 10);
                                    const [year, month, day] = dateString.split("-").map(Number);

                                    const dueDate = new Date(year, month - 1, day);

                                    const formattedDate = dueDate.toLocaleDateString(
                                        "en-IN",
                                        {
                                            day: "numeric",
                                            month: "short",
                                            year: "numeric"
                                        }
                                    );

                                    const isToday = dueDate.getTime() === today.getTime();

                                    return (
                                        <div
                                            className="tf-upcoming-item"
                                            key={task._id}
                                            onClick={() => openDetails(task)}
                                            role="button"
                                            tabIndex={0}
                                            onKeyDown={(event) => {
                                                if (event.key === "Enter" || event.key === " ") {
                                                    event.preventDefault();
                                                    openDetails(task);
                                                }
                                            }}
                                        >
                                            <div className="tf-upcoming-task-info">
                                                <strong>{task.title}</strong>
                                                <span>{task.category || "Personal"}</span>
                                            </div>

                                            <div className="tf-upcoming-task-date">
                                                <span>{isToday ? "Due today" : formattedDate}</span>
                                                <span className={`tf-upcoming-priority priority-${(task.priority || "Medium").toLowerCase()}`}>
                                                    {task.priority || "Medium"}
                                                </span>
                                            </div>

                                        </div>
                                    );
                                })}
                            </div>
                        )}

                    </section>

                    {/* Overdue Tasks */}
                    <button
                        type="button"
                        className="tf-overdue-section"
                        onClick={() => navigate("/tasks?filter=overdue")}
                        aria-label={`View ${overdueTaskCount} overdue tasks`}
                    >
                        <div className="tf-overdue-info">
                            <div className="tf-overdue-icon">
                                !
                            </div>

                            <div>
                                <h3>Overdue tasks</h3>
                                <p>Tasks that need your attention. Click to view.</p>
                            </div>
                        </div>

                        <strong className="tf-overdue-count">
                            {overdueTaskCount}
                        </strong>
                    </button>

                    {/* Productivity Insights */}
                    <section className="tf-insights-section">

                        <div className="tf-insights-heading">
                            <h3>Productivity insights</h3>
                            <p>A quick overview of your progress.</p>
                        </div>

                        <div className="tf-insights-grid">

                            <div className="tf-insight-card">
                                <span className="tf-insight-label">Completion rate</span>
                                <strong>{completionRate}%</strong>
                                <div className="tf-insight-progress">
                                    <div
                                        className="tf-insight-progress-fill"
                                        style={{ width: `${completionRate}%` }}
                                    ></div>
                                </div>
                                <span className="tf-insight-description">
                                    {completedTasks} of {totalTasks} tasks completed
                                </span>
                            </div>

                            <div className="tf-insight-card">
                                <span className="tf-insight-label">High priority pending</span>
                                <strong>{pendingHighPriorityTasks}</strong>
                                <span className="tf-insight-description">
                                    Tasks that need your focus
                                </span>
                            </div>

                        </div>

                        <div className="tf-insight-message">
                            <span className="tf-insight-message-icon">✦</span>
                            <p>{productivityMessage}</p>
                        </div>

                    </section>

                        </>
                    )}

                    {/* Task List */}

                    {view === "tasks" && (
                    <section className="tf-task-section" id="tf-task-list">

                        <div className="tf-section-heading">

                            <div className="tf-section-heading-copy">
                                <div className="tf-section-heading-title">
                                    <h2>My tasks</h2>

                                    <span className="tf-task-total">
                                        {filteredTasks.length}{" "}
                                        {filteredTasks.length === 1 ? "task" : "tasks"}
                                    </span>
                                </div>

                                <p>
                                    Everything you want to get done, in one place.
                                </p>
                            </div>

                            <button
                                type="button"
                                className="tf-primary-btn"
                                onClick={() => setShowCreateForm(true)}
                            >
                                <FiPlus /> Create new task
                            </button>

                        </div>

                        {/* Search And Filter */}
                        <div className="tf-task-toolbar">

                            <label className="tf-search">
                                <FiSearch />

                                <input
                                    type="search"
                                    placeholder="Search your tasks..."
                                    value={search}
                                    onChange={(event) => setSearch(event.target.value)}
                                />

                                {search && (
                                    <button
                                        type="button"
                                        onClick={() => setSearch("")}
                                        aria-label="Clear search"
                                    >
                                        <FiX />
                                    </button>
                                )}
                            </label>

                            <div className="tf-filters">

                                {["All tasks", "Pending", "Completed", "Recent", "Overdue"].map((filter) => (
                                    <button
                                        key={filter}
                                        type="button"
                                        className={
                                            activeFilter === filter
                                                ? "tf-filter-active"
                                                : ""
                                        }
                                        onClick={() => setActiveFilter(filter)}
                                    >
                                        {filter}
                                    </button>
                                ))}

                            </div>

                            <div className="tf-filters tf-priority-filters">

                                {["All priorities", "High", "Medium", "Low"].map((priority) => (
                                    <button
                                        key={priority}
                                        type="button"
                                        className={
                                            priorityFilter === priority
                                                ? "tf-filter-active"
                                                : ""
                                        }
                                        onClick={() => setPriorityFilter(priority)}
                                    >
                                        {priority}
                                    </button>
                                ))}

                            </div>

                        </div>

                        {/* Category Filter */}
                        <div className="tf-category-filter-wrap">
                            <label htmlFor="tf-category-filter">
                                Filter by category
                            </label>

                            <select
                                id="tf-category-filter"
                                className="tf-category-filter"
                                value={categoryFilter}
                                onChange={(event) => setCategoryFilter(event.target.value)}
                            >
                                <option value="All categories">All categories</option>
                                <option value="Work">Work</option>
                                <option value="Personal">Personal</option>
                                <option value="Study">Study</option>
                                <option value="Projects">Projects</option>
                            </select>
                        </div>

                        {/* Sort Tasks */}
                        <div className="tf-sort-wrap">

                            <label htmlFor="tf-sort">
                                Sort by
                            </label>

                            <select
                                id="tf-sort"
                                className="tf-sort-select"
                                value={sortBy}
                                onChange={(event) => setSortBy(event.target.value)}
                            >
                                <option value="newest">Newest first</option>
                                <option value="oldest">Oldest first</option>
                                <option value="priorityHigh">Priority: High to Low</option>
                                <option value="priorityLow">Priority: Low to High</option>
                                <option value="dueEarliest">Due date: Earliest first</option>
                                <option value="dueLatest">Due date: Latest first</option>
                            </select>

                        </div>

                        {/* Task Cards */}
                        {loading ? (

                            <div className="tf-empty-state">
                                <div className="tf-loading-spinner" />
                                <h3>Getting things ready</h3>
                                <p>Your tasks will appear here in a moment.</p>
                            </div>

                        ) : filteredTasks.length > 0 ? (

                            <div className="tf-task-grid">

                                {filteredTasks.map((task) => (
                                    <Todocards
                                        key={task._id}
                                        title={task.title}
                                        body={task.body}
                                        subtasks={task.subtasks || []}
                                        id={task._id}
                                        completed={task.completed}
                                        priority={task.priority || "Medium"}
                                        category={task.category || "Personal"}
                                        dueDate={task.dueDate}
                                        reminderAt={task.reminderAt}
                                        createdAt={task.createdAt}
                                        delid={del}
                                        onToggle={toggleTask}
                                        display={() => openUpdate(task)}
                                        onView={() => openDetails(task)}
                                    />
                                ))}

                            </div>

                        ) : (

                            <div className="tf-empty-state">

                                <div className="tf-empty-icon">
                                    <FiClipboard />
                                </div>

                                <h3>
                                    {search
                                        ? "No matching tasks"
                                        : activeFilter === "Recent"
                                            ? "No recent tasks"
                                            : activeFilter === "Completed"
                                                ? "No completed tasks yet"
                                                : activeFilter === "Pending"
                                                    ? "No pending tasks"
                                                    : activeFilter === "Overdue"
                                                        ? "No overdue tasks"
                                                        : "A fresh start"
                                    }
                                </h3>

                                <p>
                                    {search
                                        ? "Try another search term to find what you need."
                                        : activeFilter === "Recent"
                                            ? "Tasks created in the last seven days will appear here."
                                            : activeFilter === "Completed"
                                                ? "Complete a task and it will appear here."
                                                : activeFilter === "Pending"
                                                    ? "You have no tasks waiting to be completed."
                                                    : activeFilter === "Overdue"
                                                        ? "You're all caught up! No overdue tasks need your attention."
                                                        : "You haven't added any tasks yet. Create your first one and start organizing your day."
                                    }
                                </p>

                                {!search && activeFilter === "All tasks" && (
                                    <button
                                        type="button"
                                        className="tf-primary-btn"
                                        onClick={() => setShowCreateForm(true)}
                                    >
                                        <FiPlus /> Create your first task
                                    </button>
                                )}

                            </div>

                        )}

                    </section>

                    )}

            {/* Task Details Modal */}
            {showDetails && selectedTask && (

                <div
                    className="tf-modal-backdrop"
                    onMouseDown={(event) => {
                        if (event.target === event.currentTarget) {
                            setShowDetails(false);
                        }
                    }}
                >

                    <div className="tf-modal tf-details-modal">

                        <div className="tf-modal-header">

                            <div>
                                <span className="tf-modal-kicker">
                                    TASK OVERVIEW
                                </span>

                                <h2>Task details</h2>

                                <p>Review all the information about this task.</p>
                            </div>

                            <button
                                type="button"
                                className="tf-modal-close"
                                onClick={() => setShowDetails(false)}
                                aria-label="Close details"
                            >
                                <FiX />
                            </button>

                        </div>

                        <div className="tf-details-content">

                            <h3>{selectedTask.title}</h3>

                            <p className="tf-details-description">
                                {selectedTask.body}
                            </p>

                            <div className="tf-details-badges">

                                <span className={`task-status ${
                                    selectedTask.completed
                                        ? "status-completed"
                                        : "status-pending"
                                }`}>
                                    {selectedTask.completed ? "Completed" : "Pending"}
                                </span>

                                <span className={`task-priority priority-${(
                                    selectedTask.priority || "Medium"
                                ).toLowerCase()}`}>
                                    {selectedTask.priority || "Medium"}
                                </span>

                                <span className={`task-category category-${(
                                    selectedTask.category || "Personal"
                                ).toLowerCase()}`}>
                                    {selectedTask.category || "Personal"}
                                </span>

                            </div>

                            <div className="tf-details-information">

                                <div className="tf-details-row">
                                    <span>
                                        <FiCalendar /> Due date
                                    </span>

                                    <strong>
                                        {selectedTask.dueDate
                                            ? (() => {
                                                const [year, month, day] =
                                                    String(selectedTask.dueDate)
                                                        .slice(0, 10)
                                                        .split("-");

                                                return new Date(
                                                    Number(year),
                                                    Number(month) - 1,
                                                    Number(day)
                                                ).toLocaleDateString("en-IN", {
                                                    day: "numeric",
                                                    month: "long",
                                                    year: "numeric"
                                                });
                                            })()
                                            : "No due date"}
                                    </strong>
                                </div>

                                <div className="tf-details-row">
                                    <span>
                                        <FiClock /> Reminder
                                    </span>

                                    <strong>
                                        {selectedTask.reminderAt
                                            ? new Date(selectedTask.reminderAt).toLocaleString("en-IN", {
                                                day: "numeric",
                                                month: "short",
                                                year: "numeric",
                                                hour: "2-digit",
                                                minute: "2-digit",
                                                hour12: true
                                            })
                                            : "No reminder set"}
                                    </strong>
                                </div>

                                <div className="tf-details-row">
                                    <span>
                                        <FiCalendar /> Created on
                                    </span>

                                    <strong>
                                        {selectedTask.createdAt
                                            ? new Date(
                                                selectedTask.createdAt
                                            ).toLocaleDateString("en-IN", {
                                                day: "numeric",
                                                month: "long",
                                                year: "numeric"
                                            })
                                            : "Not available"}
                                    </strong>
                                </div>

                            </div>

                            {/* Subtasks & Checklist */}

                            {Array.isArray(selectedTask.subtasks) &&
                                selectedTask.subtasks.length > 0 && (
                                    <div className="tf-details-checklist">

                                        <div className="tf-details-checklist-heading">
                                            <div>
                                                <h4>Subtasks & Checklist</h4>
                                                <p>Track your progress on individual steps.</p>
                                            </div>

                                            <span>
                                                {selectedTask.subtasks.filter(
                                                    (item) => item.completed
                                                ).length}/{selectedTask.subtasks.length} done
                                            </span>
                                        </div>

                                        <div className="tf-details-checklist-progress">
                                            <div
                                                style={{
                                                    width: `${
                                                        (selectedTask.subtasks.filter(
                                                            (item) => item.completed
                                                        ).length /
                                                            selectedTask.subtasks.length) * 100
                                                    }%`
                                                }}
                                            />
                                        </div>

                                        <div className="tf-details-checklist-items">
                                            {selectedTask.subtasks.map((subtask, index) => (
                                                <div
                                                    className={`tf-details-checklist-item ${
                                                        subtask.completed ? "is-completed" : ""
                                                    }`}
                                                    key={subtask._id || index}
                                                >
                                                    <span className="tf-details-check-icon">
                                                        {subtask.completed ? "✓" : "○"}
                                                    </span>

                                                    <span className="tf-details-check-title">
                                                        {subtask.title}
                                                    </span>

                                                    <span className="tf-details-check-status">
                                                        {subtask.completed ? "Completed" : "Pending"}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>

                                    </div>
                                )}

                        </div>

                        <div className="tf-modal-actions">

                            <button
                                type="button"
                                className="tf-secondary-btn"
                                onClick={() => {
                                    setShowDetails(false);
                                    openUpdate(selectedTask);
                                }}
                            >
                                Edit task
                            </button>

                            <button
                                type="button"
                                className="tf-primary-btn"
                                onClick={() => {
                                    del(selectedTask._id);
                                    setShowDetails(false);
                                }}
                            >
                                Delete task
                            </button>

                        </div>

                    </div>

                </div>
            )}

            {/* Create Task Modal */}
            {showCreateForm && (

                <div
                    className="tf-modal-backdrop"
                    onMouseDown={(event) => {
                        if (event.target === event.currentTarget) {
                            setShowCreateForm(false);
                        }
                    }}
                >

                    <form className="tf-modal" onSubmit={submit}>

                        <div className="tf-modal-header">

                            <div>
                                <span className="tf-modal-kicker">NEW TASK</span>
                                <h2>Create a task</h2>
                                <p>Capture what you need to get done.</p>
                            </div>

                            <button
                                type="button"
                                className="tf-modal-close"
                                onClick={() => setShowCreateForm(false)}
                                aria-label="Close"
                            >
                                <FiX />
                            </button>

                        </div>

                        <label className="tf-form-label" htmlFor="tf-title">
                            Task title
                        </label>

                        <input
                            id="tf-title"
                            className="tf-form-input"
                            type="text"
                            name="title"
                            placeholder="e.g. Finish my project"
                            value={inputs.title}
                            onChange={change}
                            maxLength={120}
                            autoFocus
                            required
                        />

                        <label className="tf-form-label" htmlFor="tf-body">
                            Description
                        </label>

                        <textarea
                            id="tf-body"
                            className="tf-form-input tf-form-textarea"
                            name="body"
                            placeholder="Add some details about this task..."
                            value={inputs.body}
                            onChange={change}
                            rows={5}
                            required
                        />

                        <label className="tf-form-label" htmlFor="tf-priority">
                            Task priority
                        </label>

                        <select
                            id="tf-priority"
                            className="tf-form-input"
                            name="priority"
                            value={inputs.priority}
                            onChange={change}
                        >
                            <option value="High">High</option>
                            <option value="Medium">Medium</option>
                            <option value="Low">Low</option>
                        </select>

                        <label className="tf-form-label" htmlFor="tf-category">
                            Task category
                        </label>

                        <select
                            id="tf-category"
                            className="tf-form-input"
                            name="category"
                            value={inputs.category}
                            onChange={change}
                        >
                            <option value="Work">Work</option>
                            <option value="Personal">Personal</option>
                            <option value="Study">Study</option>
                            <option value="Projects">Projects</option>
                        </select>

                        <label className="tf-form-label" htmlFor="tf-due-date">
                            Due date (Optional)
                        </label>

                        <input
                            id="tf-due-date"
                            className="tf-form-input"
                            type="date"
                            name="dueDate"
                            value={inputs.dueDate}
                            onChange={change}
                        />

                        <label className="tf-form-label" htmlFor="tf-reminder">
                            Reminder (Optional)
                        </label>

                        <input
                            id="tf-reminder"
                            className="tf-form-input"
                            type="datetime-local"
                            name="reminderAt"
                            value={inputs.reminderAt}
                            onChange={change}
                            min={getLocalDateTime()}
                        />

                        <p className="tf-form-hint">
                            Choose when you want to be reminded about this task.
                        </p>

                        <SubtaskEditor
                            subtasks={subtasks}
                            onChange={setSubtasks}
                        />

                        <div className="tf-modal-actions">

                            <button
                                type="button"
                                className="tf-secondary-btn"
                                onClick={() => setShowCreateForm(false)}
                                disabled={saving}
                            >
                                Cancel
                            </button>

                            <button
                                type="submit"
                                className="tf-primary-btn"
                                disabled={saving}
                            >
                                <FiPlus />
                                {saving ? "Creating..." : "Create task"}
                            </button>

                        </div>

                    </form>
                </div>
            )}

            {/* Update Task Modal */}
            {showUpdate && (

                <div
                    className="tf-modal-backdrop"
                    onMouseDown={(event) => {
                        if (event.target === event.currentTarget) {
                            setShowUpdate(false);
                        }
                    }}
                >

                    <div className="tf-modal tf-update-modal">

                        <div className="tf-modal-header">

                            <div>
                                <span className="tf-modal-kicker">EDIT TASK</span>
                                <h2>Update your task</h2>
                                <p>Make changes to your task details.</p>
                            </div>

                            <button
                                type="button"
                                className="tf-modal-close"
                                onClick={() => setShowUpdate(false)}
                                aria-label="Close"
                            >
                                <FiX />
                            </button>

                        </div>

                        <Update
                            display={() => setShowUpdate(false)}
                            task={selectedTask}
                            onUpdated={(updatedTask) => {
                                setTasks((previous) =>
                                    previous.map((task) =>
                                        task._id === updatedTask._id
                                            ? updatedTask
                                            : task
                                    )
                                );

                                setShowUpdate(false);

                                toast.success("Task updated successfully!");
                            }}
                        />

                    </div>
                </div>
            )}
        </>
    );
};

export default Todo;