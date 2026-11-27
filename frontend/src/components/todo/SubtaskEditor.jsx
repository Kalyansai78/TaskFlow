import React, { useState } from "react";
import {
    FiPlus,
    FiTrash2,
    FiCheckCircle,
    FiCircle
} from "react-icons/fi";

import "./SubtaskEditor.css";

const SubtaskEditor = ({ subtasks = [], onChange }) => {
    const [newSubtask, setNewSubtask] = useState("");

    const addSubtask = (e) => {
        e.preventDefault();

        const title = newSubtask.trim();

        if (!title) return;

        onChange([
            ...subtasks,
            {
                title,
                completed: false
            }
        ]);

        setNewSubtask("");
    };

    const toggleSubtask = (index) => {
        const updated = subtasks.map((subtask, i) =>
            i === index
                ? { ...subtask, completed: !subtask.completed }
                : subtask
        );

        onChange(updated);
    };

    const deleteSubtask = (index) => {
        onChange(subtasks.filter((_, i) => i !== index));
    };

    const completedCount = subtasks.filter(
        (subtask) => subtask.completed
    ).length;

    return (
        <div className="tf-subtask-editor">

            <div className="tf-subtask-heading">
                <div>
                    <label className="tf-form-label">
                        Subtasks & Checklist
                    </label>
                    <p>Break your task into smaller steps.</p>
                </div>

                <span className="tf-subtask-count">
                    {completedCount}/{subtasks.length} done
                </span>
            </div>

            {subtasks.length > 0 && (
                <div className="tf-subtask-list">
                    {subtasks.map((subtask, index) => (
                        <div
                            className={`tf-subtask-item ${
                                subtask.completed
                                    ? "tf-subtask-completed"
                                    : ""
                            }`}
                            key={subtask._id || index}
                        >
                            <button
                                type="button"
                                className="tf-subtask-check"
                                onClick={() => toggleSubtask(index)}
                                aria-label={
                                    subtask.completed
                                        ? "Mark subtask pending"
                                        : "Complete subtask"
                                }
                            >
                                {subtask.completed
                                    ? <FiCheckCircle />
                                    : <FiCircle />}
                            </button>

                            <span>{subtask.title}</span>

                            <button
                                type="button"
                                className="tf-subtask-delete"
                                onClick={() => deleteSubtask(index)}
                                aria-label="Delete subtask"
                            >
                                <FiTrash2 />
                            </button>
                        </div>
                    ))}
                </div>
            )}

            <div className="tf-subtask-add">
                <input
                    type="text"
                    placeholder="Add a checklist item..."
                    value={newSubtask}
                    onChange={(e) => setNewSubtask(e.target.value)}
                    maxLength={150}
                />

                <button
                    type="button"
                    onClick={addSubtask}
                    disabled={!newSubtask.trim()}
                >
                    <FiPlus />
                    Add
                </button>
            </div>

        </div>
    );
};

export default SubtaskEditor;