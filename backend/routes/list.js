const router = require("express").Router();
const mongoose = require("mongoose");

const User = require("../models/user");
const List = require("../models/list");
const verifyToken = require("../middleware/auth");

// Protect every route in this file
router.use(verifyToken);

// ==================== CREATE TASK ====================
router.post("/addtask", async (req, res) => {
    try {
        const { title, body, priority = "Medium" } = req.body;
        const userId = req.user.userId;

        if (
            typeof title !== "string" ||
            typeof body !== "string" ||
            !title.trim() ||
            !body.trim()
        ) {
            return res.status(400).json({
                message: "Title and description are required"
            });
        }

        if (!["High", "Medium", "Low"].includes(priority)) {
            return res.status(400).json({
                message: "Priority must be High, Medium, or Low"
            });
        }

        const task = new List({
            title: title.trim(),
            body: body.trim(),
            completed: false,
            priority,
            user: [userId]
        });

        await task.save();

        await User.findByIdAndUpdate(userId, {
            $push: { list: task._id }
        });

        return res.status(201).json({
            message: "Task added successfully",
            list: task
        });

    } catch (error) {
        console.error("Add task error:", error.message);

        return res.status(500).json({
            message: "Failed to add task"
        });
    }
});

// ==================== UPDATE TASK ====================
router.put("/updatetask/:id", async (req, res) => {
    try {
        const { title, body, priority = "Medium" } = req.body;
        const { id: taskId } = req.params;
        const userId = req.user.userId;

        if (!mongoose.Types.ObjectId.isValid(taskId)) {
            return res.status(400).json({
                message: "Invalid task ID"
            });
        }

        if (
            typeof title !== "string" ||
            typeof body !== "string" ||
            !title.trim() ||
            !body.trim()
        ) {
            return res.status(400).json({
                message: "Title and description are required"
            });
        }

        if (!["High", "Medium", "Low"].includes(priority)) {
            return res.status(400).json({
                message: "Priority must be High, Medium, or Low"
            });
        }

        const task = await List.findOneAndUpdate(
            {
                _id: taskId,
                user: userId
            },
            {
                $set: {
                    title: title.trim(),
                    body: body.trim(),
                    priority
                }
            },
            {
                new: true,
                runValidators: true
            }
        );

        if (!task) {
            return res.status(404).json({
                message: "Task not found"
            });
        }

        return res.status(200).json({
            message: "Task updated successfully",
            list: task
        });

    } catch (error) {
        console.error("Update task error:", error.message);

        return res.status(500).json({
            message: "Failed to update task"
        });
    }
});

// ==================== TOGGLE TASK COMPLETION ====================
router.patch("/completetask/:id", async (req, res) => {
    try {
        const { id: taskId } = req.params;
        const { completed } = req.body;
        const userId = req.user.userId;

        if (!mongoose.Types.ObjectId.isValid(taskId)) {
            return res.status(400).json({
                message: "Invalid task ID"
            });
        }

        if (typeof completed !== "boolean") {
            return res.status(400).json({
                message: "Completed must be true or false"
            });
        }

        const task = await List.findOneAndUpdate(
            {
                _id: taskId,
                user: userId
            },
            {
                $set: { completed }
            },
            {
                new: true,
                runValidators: true
            }
        );

        if (!task) {
            return res.status(404).json({
                message: "Task not found"
            });
        }

        return res.status(200).json({
            message: completed
                ? "Task marked as completed"
                : "Task marked as pending",
            list: task
        });

    } catch (error) {
        console.error("Complete task error:", error.message);

        return res.status(500).json({
            message: "Failed to update task status"
        });
    }
});

// ==================== DELETE TASK ====================
router.delete("/deletetask/:id", async (req, res) => {
    try {
        const { id: taskId } = req.params;
        const userId = req.user.userId;

        if (!mongoose.Types.ObjectId.isValid(taskId)) {
            return res.status(400).json({
                message: "Invalid task ID"
            });
        }

        const task = await List.findOneAndDelete({
            _id: taskId,
            user: userId
        });

        if (!task) {
            return res.status(404).json({
                message: "Task not found"
            });
        }

        await User.findByIdAndUpdate(userId, {
            $pull: { list: task._id }
        });

        return res.status(200).json({
            message: "Task deleted successfully"
        });

    } catch (error) {
        console.error("Delete task error:", error.message);

        return res.status(500).json({
            message: "Failed to delete task"
        });
    }
});

// ==================== GET USER TASKS ====================
router.get("/gettask", async (req, res) => {
    try {
        const userId = req.user.userId;

        const tasks = await List.find({
            user: userId
        }).sort({ createdAt: -1 });

        return res.status(200).json({
            list: tasks
        });

    } catch (error) {
        console.error("Fetch tasks error:", error.message);

        return res.status(500).json({
            message: "Failed to fetch tasks"
        });
    }
});

module.exports = router;