import React, { useEffect, useState } from "react";
import api from "../../api/axios";
import { toast } from "react-toastify";
import SubtaskEditor from "./SubtaskEditor";

const getLocalDateTime = (date = new Date()) => {
    const offset = date.getTimezoneOffset();

    return new Date(date.getTime() - offset * 60000)
        .toISOString()
        .slice(0, 16);
};

const toLocalDateTimeInput = (value) => {
    if (!value) return "";

    const date = new Date(value);
    const offset = date.getTimezoneOffset();

    return new Date(date.getTime() - offset * 60000)
        .toISOString()
        .slice(0, 16);
};

const Update = ({ display, task, onUpdated }) => {
    const [inputs, setInputs] = useState({
        title: "",
        body: "",
        priority: "Medium",
        dueDate: "",
        reminderAt: "",
        subtasks: [],
        category: "Personal"
    });

    const [loading, setLoading] = useState(false);

    useEffect(() => {
        setInputs({
            title: task?.title || "",
            body: task?.body || "",
            priority: task?.priority || "Medium",
            dueDate: task?.dueDate
                ? String(task.dueDate).slice(0, 10)
                : "",
            reminderAt: toLocalDateTimeInput(task?.reminderAt),
            subtasks: task?.subtasks || [],
            category: task?.category || "Personal"
        });
    }, [task]);

    const change = (e) => {
        const { name, value } = e.target;

        setInputs((prev) => ({
            ...prev,
            [name]: value
        }));
    };

    const handleUpdate = async (e) => {
        e.preventDefault();

        const token = sessionStorage.getItem("token");

        if (!task?._id) {
            toast.error("Please select a task to update.");
            return;
        }

        if (!token) {
            toast.error("Please sign in again.");
            return;
        }

        if (!inputs.title.trim() || !inputs.body.trim()) {
            toast.error("Title and description are required.");
            return;
        }

        if (
            inputs.reminderAt &&
            new Date(inputs.reminderAt).getTime() <= Date.now()
        ) {
            toast.error("Reminder must be set for a future date and time.");
            return;
        }

        try {
            setLoading(true);
            const response = await api.put(
                `/updatetask/${task._id}`,
                {
                    title: inputs.title.trim(),
                    body: inputs.body.trim(),
                    priority: inputs.priority,
                    dueDate: inputs.dueDate || null,
                    reminderAt: inputs.reminderAt
                        ? new Date(inputs.reminderAt).toISOString()
                        : null,
                    subtasks: inputs.subtasks,
                    category: inputs.category
                }
            );

            toast.success(
                response.data.message || "Task updated successfully!"
            );

            if (onUpdated) {
                onUpdated(response.data.list);
            }

            display("none");

        } catch (error) {
            console.error(
                "Update task error:",
                error.response?.data || error.message
            );

            toast.error(
                error.response?.data?.message || "Failed to update task."
            );

        } finally {
            setLoading(false);
        }
    };

    return (
        <form
            className="p-5 d-flex justify-content-center align-items-start flex-column update"
            onSubmit={handleUpdate}
        >
            <h3>Update Your Task</h3>

            <label className="mt-3 mb-2" htmlFor="update-title">
                Task Title
            </label>

            <input
                id="update-title"
                type="text"
                name="title"
                placeholder="Enter task title"
                className="todo-inputs my-2 w-100 p-3"
                value={inputs.title}
                onChange={change}
                required
            />

            <label className="mt-3 mb-2" htmlFor="update-description">
                Task Description
            </label>

            <textarea
                id="update-description"
                name="body"
                placeholder="Enter task description"
                className="todo-inputs w-100 p-3"
                value={inputs.body}
                onChange={change}
                rows={5}
                required
            />

            <label className="mt-3 mb-2" htmlFor="update-priority">
                Task Priority
            </label>

            <select
                id="update-priority"
                name="priority"
                className="todo-inputs w-100 p-3"
                value={inputs.priority}
                onChange={change}
            >
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
            </select>

            <label className="mt-3 mb-2" htmlFor="update-category">
                Task Category
            </label>

            <select
                id="update-category"
                name="category"
                className="todo-inputs w-100 p-3"
                value={inputs.category}
                onChange={change}
            >
                <option value="Work">Work</option>
                <option value="Personal">Personal</option>
                <option value="Study">Study</option>
                <option value="Projects">Projects</option>
            </select>

            <label className="mt-3 mb-2" htmlFor="update-due-date">
                Due Date (Optional)
            </label>

            <input
                id="update-due-date"
                type="date"
                name="dueDate"
                className="todo-inputs w-100 p-3"
                value={inputs.dueDate}
                onChange={change}
            />

            <label className="mt-3 mb-2" htmlFor="update-reminder">
                Reminder (Optional)
            </label>

            <input
                id="update-reminder"
                type="datetime-local"
                name="reminderAt"
                className="todo-inputs w-100 p-3"
                value={inputs.reminderAt}
                onChange={change}
                min={getLocalDateTime()}
            />

            <div className="mt-3">
                <SubtaskEditor
                    subtasks={inputs.subtasks}
                    onChange={(updatedSubtasks) =>
                        setInputs((prev) => ({
                            ...prev,
                            subtasks: updatedSubtasks
                        }))
                    }
                />
            </div>

            <div className="d-flex flex-wrap mt-4">
                <button
                    type="submit"
                    className="btn btn-dark my-4"
                    disabled={loading}
                >
                    {loading ? "UPDATING..." : "UPDATE"}
                </button>

                <button
                    type="button"
                    className="btn btn-danger my-4 mx-3"
                    onClick={() => display("none")}
                    disabled={loading}
                >
                    CLOSE
                </button>
            </div>
        </form>
    );
};

export default Update;