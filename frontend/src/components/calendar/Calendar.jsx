import { useEffect, useState } from "react";
import api from "../../api/axios";
import {
    FiChevronLeft,
    FiChevronRight,
    FiX
} from "react-icons/fi";
import "./Calendar.css";
import Update from "../todo/Update";

const Calendar = () => {

    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [selectedTask, setSelectedTask] = useState(null);
    const [currentDate, setCurrentDate] = useState(new Date());
    const [showUpdate, setShowUpdate] = useState(false);

    useEffect(() => {
        const fetchTasks = async () => {
            try {
                const response = await api.get("/gettask");

                setTasks(response.data.list || []);
            } catch (error) {
                console.error("Failed to fetch calendar tasks:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchTasks();
    }, []);

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const monthName = currentDate.toLocaleString("default", {
        month: "long"
    });

    const today = new Date();

    const changeMonth = (direction) => {
        setCurrentDate(
            new Date(year, month + direction, 1)
        );
    };

    const getTasksForDate = (day) => {
        return tasks.filter((task) => {
            if (!task.dueDate) return false;

            const taskDate = new Date(task.dueDate);

            return (
                taskDate.getDate() === day &&
                taskDate.getMonth() === month &&
                taskDate.getFullYear() === year
            );
        });
    };

    return (
        <div className="tf-calendar-page">

            <div className="tf-calendar-header">
                <div>
                    <h2>Calendar</h2>
                    <p>Manage your schedule and deadlines.</p>
                </div>

                <div className="tf-calendar-navigation">
                    <button onClick={() => changeMonth(-1)}>
                        <FiChevronLeft />
                    </button>

                    <h3>{monthName} {year}</h3>

                    <button onClick={() => changeMonth(1)}>
                        <FiChevronRight />
                    </button>
                </div>
            </div>

            <div className="tf-calendar-card">

                <div className="tf-calendar-weekdays">
                    {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(day => (
                        <div key={day}>{day}</div>
                    ))}
                </div>

                <div className="tf-calendar-grid">

                    {Array.from({ length: firstDay }).map((_, index) => (
                        <div
                            key={`empty-${index}`}
                            className="tf-calendar-day empty"
                        />
                    ))}

                    {Array.from({ length: daysInMonth }).map((_, index) => {
                        const day = index + 1;

                        const isToday =
                            day === today.getDate() &&
                            month === today.getMonth() &&
                            year === today.getFullYear();

                        const dayTasks = getTasksForDate(day);

                        const isSelected =
                            selectedDate &&
                            selectedDate.getDate() === day &&
                            selectedDate.getMonth() === month &&
                            selectedDate.getFullYear() === year;

                        return (
                            <div
                                key={day}
                                className={`tf-calendar-day ${isToday ? "today" : ""} ${
                                    isSelected ? "selected" : ""
                                }`}
                                onClick={() => setSelectedDate(new Date(year, month, day))}
                                role="button"
                                tabIndex={0}
                                onKeyDown={(event) => {
                                    if (event.key === "Enter" || event.key === " ") {
                                        event.preventDefault();
                                        setSelectedDate(new Date(year, month, day));
                                    }
                                }}
                            >
                                <span>{day}</span>

                                <div className="tf-calendar-tasks">
                                    {dayTasks.map((task) => (
                                        <div
                                            key={task._id}
                                            className={`tf-calendar-task priority-${task.priority?.toLowerCase()} ${
                                                task.completed ? "completed" : ""
                                            }`}
                                            title={`View ${task.title}`}
                                            role="button"
                                            tabIndex={0}
                                            onClick={(event) => {
                                                event.stopPropagation();
                                                setSelectedDate(new Date(year, month, day));
                                                setSelectedTask(task);
                                            }}
                                            onKeyDown={(event) => {
                                                if (event.key === "Enter" || event.key === " ") {
                                                    event.preventDefault();
                                                    event.stopPropagation();
                                                    setSelectedDate(new Date(year, month, day));
                                                    setSelectedTask(task);
                                                }
                                            }}
                                        >
                                            {task.title}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        );
                    })}

                </div>
            </div>

            {selectedTask && (
                <div
                    className="tf-modal-backdrop"
                    onClick={() => setSelectedTask(null)}
                >
                    <div
                        className="tf-modal tf-calendar-details-modal"
                        onClick={(event) => event.stopPropagation()}
                    >
                        <div className="tf-modal-header">
                            <div>
                                <span className="tf-modal-kicker">
                                    TASK DETAILS
                                </span>

                                <h2>{selectedTask.title}</h2>

                                <p>View your task information.</p>
                            </div>

                            <button
                                type="button"
                                className="tf-modal-close"
                                onClick={() => setSelectedTask(null)}
                            >
                                <FiX />
                            </button>
                        </div>

                        <div className="tf-calendar-details-content">

                            <div className="tf-calendar-detail-item">
                                <span>Description</span>
                                <p>
                                    {selectedTask.body || "No description available"}
                                </p>
                            </div>

                            <div className="tf-calendar-detail-grid">

                                <div className="tf-calendar-detail-item">
                                    <span>Priority</span>
                                    <strong
                                        className={`tf-calendar-popup-badge priority-${selectedTask.priority?.toLowerCase()}`}
                                    >
                                        {selectedTask.priority || "Not specified"}
                                    </strong>
                                </div>

                                <div className="tf-calendar-detail-item">
                                    <span>Status</span>
                                    <strong
                                        className={`tf-calendar-popup-badge ${
                                            selectedTask.completed ? "status-completed" : "status-pending"
                                        }`}
                                    >
                                        {selectedTask.completed ? "Completed" : "Pending"}
                                    </strong>
                                </div>

                                <div className="tf-calendar-detail-item">
                                    <span>Due Date</span>
                                    <strong>
                                        {selectedTask.dueDate
                                            ? new Date(selectedTask.dueDate).toLocaleDateString("en-IN", {
                                                day: "numeric",
                                                month: "long",
                                                year: "numeric"
                                            })
                                            : "No due date"}
                                    </strong>
                                </div>

                                <div className="tf-calendar-detail-item">
                                    <span>Reminder</span>
                                    <strong>
                                        {selectedTask.reminderAt
                                            ? new Date(selectedTask.reminderAt).toLocaleString("en-IN")
                                            : "No reminder"}
                                    </strong>
                                </div>

                            </div>

                            {Array.isArray(selectedTask.subtasks) && (
                                <div className="tf-calendar-detail-item">
                                    <span>Subtasks</span>

                                    {selectedTask.subtasks.length > 0 ? (
                                        <ul className="tf-calendar-subtasks">
                                            {selectedTask.subtasks.map((subtask, index) => (
                                                <li key={subtask._id || index}>
                                                    {typeof subtask === "string"
                                                        ? subtask
                                                        : subtask.title}
                                                </li>
                                            ))}
                                        </ul>
                                    ) : (
                                        <p>No subtasks available.</p>
                                    )}
                                </div>
                            )}

                        </div>

                        <div className="tf-modal-actions">
                            <button
                                type="button"
                                className="tf-primary-btn"
                                onClick={() => {
                                    setShowUpdate(true);
                                }}
                            >
                                Edit Task
                            </button>

                            <button
                                type="button"
                                className="tf-secondary-btn"
                                onClick={() => setSelectedTask(null)}
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* UPDATE TASK MODAL */}
            {showUpdate && selectedTask && (
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
                                <span className="tf-modal-kicker">
                                    EDIT TASK
                                </span>

                                <h2>Update your task</h2>

                                <p>
                                    Make changes to your task details.
                                </p>
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

                                setSelectedTask(updatedTask);

                                window.dispatchEvent(
                                    new Event("tasksUpdated")
                                );

                                setShowUpdate(false);
                            }}
                        />

                    </div>
                </div>
            )}

            {selectedDate && (
                <div className="tf-selected-date-section">

                    <div className="tf-selected-date-heading">
                        <div>
                            <h3>
                                Tasks for {selectedDate.toLocaleDateString("en-IN", {
                                    day: "numeric",
                                    month: "long",
                                    year: "numeric"
                                })}
                            </h3>

                            <p>Tasks scheduled for this date</p>
                        </div>

                        <span>
                            {getTasksForDate(selectedDate.getDate()).length}{" "}
                            {getTasksForDate(selectedDate.getDate()).length === 1
                                ? "Task"
                                : "Tasks"}
                        </span>
                    </div>

                    <div className="tf-selected-date-list">

                        {getTasksForDate(selectedDate.getDate()).length > 0 ? (
                            getTasksForDate(selectedDate.getDate()).map((task) => (
                                <div
                                    className="tf-selected-task"
                                    key={task._id}
                                    onClick={() => setSelectedTask(task)}
                                    role="button"
                                    tabIndex={0}
                                    onKeyDown={(event) => {
                                        if (event.key === "Enter" || event.key === " ") {
                                            event.preventDefault();
                                            setSelectedTask(task);
                                        }
                                    }}
                                >
                                    <div>
                                        <h4>{task.title}</h4>
                                        <p>{task.body || "No description available"}</p>
                                    </div>

                                    <div className="tf-selected-task-meta">
                                        <span className={`priority-${task.priority?.toLowerCase()}`}>
                                            {task.priority}
                                        </span>

                                        <span className={task.completed ? "status-completed" : "status-pending"}>
                                            {task.completed ? "Completed" : "Pending"}
                                        </span>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="tf-selected-empty">
                                <p>No tasks scheduled for this date.</p>
                            </div>
                        )}

                    </div>

                </div>
            )}

        </div>
    );
};

export default Calendar;