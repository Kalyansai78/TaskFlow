import React, { useEffect, useState } from "react";
import api from "../../api/axios";
import { toast } from "react-toastify";

const Update = ({ display, task, onUpdated }) => {
    const [inputs, setInputs] = useState({
        title: "",
        body: "",
        priority: "Medium"
    });

    const [loading, setLoading] = useState(false);

    useEffect(() => {
        setInputs({
            title: task?.title || "",
            body: task?.body || "",
            priority: task?.priority || "Medium"
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

        try {
            setLoading(true);

            const response = await api.put(
                `/updatetask/${task._id}`,
                {
                    title: inputs.title.trim(),
                    body: inputs.body.trim(),
                    priority: inputs.priority
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

            <input
                type="text"
                name="title"
                placeholder="Enter task title"
                className="todo-inputs my-4 w-100 p-3"
                value={inputs.title}
                onChange={change}
                required
            />

            <textarea
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

            <div className="d-flex flex-wrap">
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