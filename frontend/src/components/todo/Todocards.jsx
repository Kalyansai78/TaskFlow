import React from "react";
import {
    FiCheckCircle,
    FiCircle,
    FiEdit2,
    FiTrash2,
    FiCalendar
} from "react-icons/fi";

import "./Todocards.css";

const Todocards = ({
    title,
    body,
    id,
    completed = false,
    priority = "Medium",
    createdAt,
    delid,
    display,
    onToggle
}) => {

    const formattedDate = createdAt
        ? new Date(createdAt).toLocaleDateString("en-IN", {
            day: "numeric",
            month: "short",
            year: "numeric"
        })
        : "";

    const priorityClass = {
        High: "priority-high",
        Medium: "priority-medium",
        Low: "priority-low"
    }[priority] || "priority-medium";

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
                </div>

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

                <p>
                    {body?.length > 100
                        ? `${body.slice(0, 100)}...`
                        : body}
                </p>

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