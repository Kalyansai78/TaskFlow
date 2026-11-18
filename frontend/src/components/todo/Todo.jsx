import React, { useEffect, useMemo, useState } from "react";
import { useDispatch } from "react-redux";
import { useNavigate, Link } from "react-router-dom";
import api from "../../api/axios";
import {
    FiGrid,
    FiCheckSquare,
    FiLogOut,
    FiPlus,
    FiSearch,
    FiClipboard,
    FiClock,
    FiCalendar,
    FiX,
    FiArrowUpRight,
    FiTrendingUp
} from "react-icons/fi";

import "./Todo.css";
import "./Todocards.css";
import Todocards from "./Todocards";
import Update from "./Update";
import { authActions } from "../../store";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const Todo = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const [inputs, setInputs] = useState({
        title: "",
        body: "",
        priority: "Medium"
    });
    const [tasks, setTasks] = useState([]);
    const [selectedTask, setSelectedTask] = useState(null);
    const [search, setSearch] = useState("");
    const [activeFilter, setActiveFilter] = useState("All tasks");
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [showUpdate, setShowUpdate] = useState(false);

    const token = sessionStorage.getItem("token");
    const username = sessionStorage.getItem("username") || "there";

    // FETCH TASKS
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

    // HANDLE INPUT CHANGES
    const change = (event) => {
        const { name, value } = event.target;

        setInputs((previous) => ({
            ...previous,
            [name]: value
        }));
    };

    // CREATE TASK
    const submit = async (event) => {
        event.preventDefault();

        if (!inputs.title.trim() || !inputs.body.trim()) {
            toast.error("Please enter a title and description.");
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
                priority: inputs.priority
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
                priority: "Medium"
            });
            setShowCreateForm(false);

            toast.success("Your task has been created.");
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

    // DELETE TASK
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
        const token = sessionStorage.getItem("token");

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



    // OPEN UPDATE MODAL
    const openUpdate = (task) => {
        setSelectedTask(task);
        setShowUpdate(true);
    };

    // LOGOUT
    const handleLogout = () => {
        sessionStorage.removeItem("token");
        sessionStorage.removeItem("id");
        sessionStorage.removeItem("username");
        sessionStorage.removeItem("email");

        dispatch(authActions.logout());

        toast.success("You have been signed out.");
        navigate("/signin");
    };

    // TASK STATISTICS
    const totalTasks = tasks.length;

    const completedTasks = tasks.filter(
        (task) => task.completed === true
    ).length;

    const pendingTasks = totalTasks - completedTasks;

    const productivity = totalTasks > 0
        ? Math.round((completedTasks / totalTasks) * 100)
        : 0;

    const recentTasks = tasks.filter((task) => {
        if (!task.createdAt) return false;

        const age = Date.now() - new Date(task.createdAt).getTime();

        return age >= 0 && age <= 7 * 24 * 60 * 60 * 1000;
    }).length;

    // SEARCH AND FILTER
    const filteredTasks = useMemo(() => {
        const query = search.trim().toLowerCase();

        return tasks.filter((task) => {
            const matchesSearch =
                task.title?.toLowerCase().includes(query) ||
                task.body?.toLowerCase().includes(query);

            if (!matchesSearch) return false;

            if (activeFilter === "Recent") {
                if (!task.createdAt) return false;

                const age =
                    Date.now() - new Date(task.createdAt).getTime();

                return age >= 0 && age <= 7 * 24 * 60 * 60 * 1000;
            }

            if (activeFilter === "Completed") {
                return task.completed === true;
            }

            if (activeFilter === "Pending") {
                return task.completed !== true;
            }

            return true;
        });
    }, [tasks, search, activeFilter]);

    // CURRENT DATE
    const formatDate = () =>
        new Date().toLocaleDateString("en-US", {
            weekday: "long",
            month: "long",
            day: "numeric"
        });

    // USER INITIALS
    const initials = username
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0].toUpperCase())
        .join("");

    return (
        <div className="tf-app">

            <ToastContainer position="top-right" autoClose={2500} />

            {sidebarOpen && (
                <button
                    className="tf-mobile-overlay"
                    aria-label="Close navigation"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* SIDEBAR */}
            <aside className={`tf-sidebar ${sidebarOpen ? "tf-sidebar-open" : ""}`}>

                <Link to="/" className="tf-brand">
                    <span className="tf-brand-icon">
                        <FiCheckSquare />
                    </span>

                    <span>
                        Task<span className="tf-brand-accent">Flow</span>
                    </span>
                </Link>

                <div className="tf-workspace-label">WORKSPACE</div>

                <nav className="tf-navigation">

                    <Link
                        to="/todo"
                        className="tf-nav-item tf-nav-active"
                        onClick={() => setSidebarOpen(false)}
                    >
                        <FiGrid />
                        <span>Dashboard</span>
                    </Link>

                    <button
                        type="button"
                        className="tf-nav-item"
                        onClick={() => {
                            setActiveFilter("All tasks");
                            setSidebarOpen(false);

                            document.getElementById("tf-task-list")?.scrollIntoView({
                                behavior: "smooth"
                            });
                        }}
                    >
                        <FiClipboard />
                        <span>My Tasks</span>
                        <span className="tf-nav-count">{tasks.length}</span>
                    </button>

                </nav>

                <div className="tf-sidebar-bottom">

                    <div className="tf-sidebar-tip">
                        <div className="tf-tip-icon">
                            <FiArrowUpRight />
                        </div>

                        <h4>Small steps, big results.</h4>

                        <p>
                            Keep your tasks organized and make progress every day.
                        </p>
                    </div>

                    <button
                        type="button"
                        className="tf-logout"
                        onClick={handleLogout}
                    >
                        <FiLogOut />
                        <span>Log out</span>
                    </button>

                    <div className="tf-sidebar-footer">
                        TASKFLOW · YOUR SPACE
                    </div>

                </div>
            </aside>

            {/* MAIN CONTENT */}
            <main className="tf-main">

                {/* TOP NAVIGATION */}
                <header className="tf-topbar">

                    <button
                        type="button"
                        className="tf-menu-toggle"
                        onClick={() => setSidebarOpen((open) => !open)}
                        aria-label="Toggle navigation"
                    >
                        ☰
                    </button>

                    <div className="tf-breadcrumb">
                        Workspace <span>/</span> <strong>Dashboard</strong>
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

                    {/* WELCOME SECTION */}
                    <section className="tf-welcome">

                        <div>
                            <div className="tf-eyebrow">
                                <FiCalendar /> {formatDate()}
                            </div>

                            <h1>
                                Good to see you, {username.split(" ")[0]} <span>✦</span>
                            </h1>

                            <p>
                                Make today count. One task at a time.
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

                    {/* STATISTICS */}
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

                    {/* PRODUCTIVITY PROGRESS */}
                    <section className="tf-progress-section">

                        <div className="tf-progress-heading">
                            <span>Your daily progress</span>
                            <strong>{completedTasks} of {totalTasks} completed</strong>
                        </div>

                        <div
                            className="tf-progress-track"
                            role="progressbar"
                            aria-valuenow={productivity}
                            aria-valuemin="0"
                            aria-valuemax="100"
                        >
                            <div
                                className="tf-progress-fill"
                                style={{ width: `${productivity}%` }}
                            />
                        </div>

                    </section>

                    {/* TASK LIST */}
                    <section className="tf-task-section" id="tf-task-list">

                        <div className="tf-section-heading">

                            <div>
                                <h2>Your tasks</h2>

                                <p>
                                    Everything you want to get done, in one place.
                                </p>
                            </div>

                            <span className="tf-task-total">
                                {filteredTasks.length}{" "}
                                {filteredTasks.length === 1 ? "task" : "tasks"}
                            </span>

                        </div>

                        {/* SEARCH AND FILTER */}
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

                                {["All tasks", "Pending", "Completed", "Recent"].map((filter) => (
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

                        </div>

                        {/* TASK CARDS */}
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
                                        id={task._id}
                                        completed={task.completed}
                                        priority={task.priority || "Medium"}
                                        createdAt={task.createdAt}
                                        delid={del}
                                        onToggle={toggleTask}
                                        display={() => openUpdate(task)}
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
                                                    : "A fresh start"}
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
                                                    : "You haven't added any tasks yet. Create your first one and start organizing your day."}
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

                    <footer className="tf-page-footer">
                        <span>Made for your next big thing.</span>

                        <span>
                            TaskFlow <span className="tf-footer-dot">●</span> Stay focused
                        </span>
                    </footer>

                </div>
            </main>

            {/* CREATE TASK MODAL */}
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

            {/* UPDATE TASK MODAL */}
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
                            }}
                        />

                    </div>
                </div>
            )}

        </div>
    );
};

export default Todo;