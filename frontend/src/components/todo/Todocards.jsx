import React, { useState } from "react";
import {
    FiCheckCircle,
    FiCircle,
    FiEdit2,
    FiTrash2,
    FiCalendar,
    FiEye,
    FiClock
} from "react-icons/fi";

import "./Todocards.css";

const Todocards = ({
    
    title,
    body,
    subtasks = [],
    id,
    completed = false,
    priority = "Medium",
    category = "Personal",
    createdAt,
    dueDate,
    reminderAt,
    delid,
    display,
    onToggle,
    onView
}) => {

    const [expanded, setExpanded] = useState(false);

    const formattedDate = createdAt
        ? new Date(createdAt).toLocaleDateString("en-IN", {
            day: "numeric",
            month: "short",
            year: "numeric"
        })
        : "";

    const formattedDueDate = dueDate
    ? (() => {
        const [year, month, day] = String(dueDate).slice(0, 10).split("-");
        return new Date(Number(year), Number(month) - 1, Number(day))
            .toLocaleDateString("en-IN", {
                day: "numeric",
                month: "short",
                year: "numeric"
            });
    })()
    : "";

    const formattedReminder = reminderAt
    ? new Date(reminderAt).toLocaleString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true
    })
    : "";

    const today = new Date();
    const todayString = [
        today.getFullYear(),
        String(today.getMonth() + 1).padStart(2, "0"),
        String(today.getDate()).padStart(2, "0")
    ].join("-");

    const isOverdue =
        dueDate &&
        String(dueDate).slice(0, 10) < todayString &&
        !completed;

    const priorityClass = {
        High: "priority-high",
        Medium: "priority-medium",
        Low: "priority-low"
    }[priority] || "priority-medium";

    const categoryClass = {
        Work: "category-work",
        Personal: "category-personal",
        Study: "category-study",
        Projects: "category-projects"
    }[category] || "category-personal";

    const completedSubtasks = subtasks.filter(
        (subtask) => subtask.completed
    ).length;

    const subtaskProgress = subtasks.length > 0
        ? Math.round((completedSubtasks / subtasks.length) * 100)
        : 0;

    return (
        <article className={`todo-card ${completed ? "task-completed" : ""}`}>

            <div className="task-card-top">

                <div className="task-card-badges">
                    <span className={`task-status ${completed ? "status-completed" : "status-pending"}`}>
                        {completed ? "Completed" : "Pending"}
                    </span>

                    <span className={`task-priority ${priorityClass}`}>
                        {priority || "Medium"}
                    </span>
                    
                    <span className={`task-category ${categoryClass}`}>
                        {category}
                    </span>
                </div>

                {formattedDueDate && (
                    <span className={`task-due-date ${isOverdue ? "due-date-overdue" : ""}`}>
                        <FiCalendar />
                        {isOverdue ? "Overdue: " : "Due: "}
                        {formattedDueDate}
                    </span>
                )}

                {formattedReminder && (
                    <span className="task-reminder-date">
                        <FiClock />
                        Reminder: {formattedReminder}
                    </span>
                )}

                {formattedDate && (
                    <span className="task-date">
                        <FiCalendar />
                        {formattedDate}
                    </span>
                )}

            </div>

            <div className="task-card-content">

                <h3 className={completed ? "task-title-done" : ""}>
                    {title}
                </h3>

            <p className={`task-description ${expanded ? "task-description-expanded" : ""}`}>
                {!body || expanded || body.length <= 100
                    ? body
                    : `${body.slice(0, 100)}...`}
            </p>

            {body?.length > 100 && (
                <button
                    type="button"
                    className="task-read-more"
                    onClick={() => setExpanded((previous) => !previous)}
                >
                    {expanded ? "Show less" : "Read more"}
                </button>
            )}

            {subtasks.length > 0 && (
                <div className="task-checklist-preview">

                    <div className="task-checklist-heading">
                        <span>Checklist</span>
                        <strong>
                            {completedSubtasks}/{subtasks.length} completed
                        </strong>
                    </div>

                    <div className="task-checklist-progress">
                        <div
                            className="task-checklist-progress-fill"
                            style={{ width: `${subtaskProgress}%` }}
                        />
                    </div>

                    <div className="task-checklist-items">
                        {subtasks.slice(0, 3).map((subtask, index) => (
                            <div
                                className="task-checklist-item"
                                key={subtask._id || index}
                            >
                                <span className={
                                    subtask.completed
                                        ? "task-checklist-done"
                                        : ""
                                }>
                                    {subtask.completed ? "✓" : "○"}
                                </span>

                                <p>{subtask.title}</p>
                            </div>
                        ))}

                        {subtasks.length > 3 && (
                            <span className="task-checklist-more">
                                +{subtasks.length - 3} more items
                            </span>
                        )}
                    </div>

                </div>
            )}

            </div>

            <div className="task-card-actions">

                <button
                    type="button"
                    className={`task-complete-btn ${completed ? "task-undo-btn" : ""}`}
                    onClick={() => onToggle(id, !completed)}
                    title={completed ? "Mark as pending" : "Mark as completed"}
                >
                    {completed ? <FiCircle /> : <FiCheckCircle />}
                    {completed ? "Mark pending" : "Complete"}
                </button>

                <div className="task-secondary-actions">

                    <button
                        type="button"
                        className="task-view-btn"
                        onClick={onView}
                        aria-label="View task details"
                        title="View details"
                    >
                        <FiEye />
                    </button>

                    <button
                        type="button"
                        className="task-edit-btn"
                        onClick={display}
                        aria-label="Edit task"
                        title="Edit task"
                    >
                        <FiEdit2 />
                    </button>

                    <button
                        type="button"
                        className="task-delete-btn"
                        onClick={() => delid(id)}
                        aria-label="Delete task"
                        title="Delete task"
                    >
                        <FiTrash2 />
                    </button>

                </div>

            </div>

        </article>
    );
};

export default Todocards;