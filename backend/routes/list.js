const router = require("express").Router();
const mongoose = require("mongoose");

const User = require("../models/user");
const List = require("../models/list");
const verifyToken = require("../middleware/auth");
const Notification = require("../models/notification");
const {
    scheduleTaskNotifications,
    cancelAllTaskJobs
} = require("../utils/taskNotificationJobs");

const EmailNotificationLog = require("../models/emailNotificationLog");

// Protect every route in this file
router.use(verifyToken);

// ==================== VALIDATE SUBTASKS ====================
const validateSubtasks = (subtasks) => {
    if (!Array.isArray(subtasks)) {
        return {
            valid: false,
            message: "Subtasks must be an array"
        };
    }

    const normalizedSubtasks = [];

    for (const subtask of subtasks) {
        if (
            !subtask ||
            typeof subtask.title !== "string" ||
            !subtask.title.trim()
        ) {
            return {
                valid: false,
                message: "Every subtask must have a title"
            };
        }

        if (
            subtask.completed !== undefined &&
            typeof subtask.completed !== "boolean"
        ) {
            return {
                valid: false,
                message: "Subtask completion must be true or false"
            };
        }

        normalizedSubtasks.push({
            title: subtask.title.trim(),
            completed: subtask.completed ?? false
        });
    }

    return {
        valid: true,
        subtasks: normalizedSubtasks
    };
};

// ==================== CREATE TASK ====================
router.post("/addtask", async (req, res) => {
    try {
        const {
            title,
            body,
            priority = "Medium",
            dueDate = null,
            category = "Personal",
            subtasks = [],
            reminderAt = null
        } = req.body;
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

        if (!["Work", "Personal", "Study", "Projects"].includes(category)) {
            return res.status(400).json({
                message: "Category must be Work, Personal, Study, or Projects"
            });
        }

        const subtaskValidation = validateSubtasks(subtasks);

        if (!subtaskValidation.valid) {
            return res.status(400).json({
                message: subtaskValidation.message
            });
        }

        let parsedDueDate = null;

        const taskCreatedAt = new Date();

        if (dueDate !== null && dueDate !== "") {
            const datePattern = /^\d{4}-\d{2}-\d{2}$/;

            if (!datePattern.test(dueDate)) {
                return res.status(400).json({
                    message: "Please provide a valid due date"
                });
            }

            const [year, month, day] = dueDate.split("-").map(Number);

            // Use the task creation time for the selected due date
            parsedDueDate = new Date(
                year,
                month - 1,
                day,
                taskCreatedAt.getHours(),
                taskCreatedAt.getMinutes(),
                taskCreatedAt.getSeconds(),
                taskCreatedAt.getMilliseconds()
            );

            if (
                parsedDueDate.getFullYear() !== year ||
                parsedDueDate.getMonth() !== month - 1 ||
                parsedDueDate.getDate() !== day
            ) {
                return res.status(400).json({
                    message: "Please provide a valid due date"
                });
            }
        }

        let parsedReminderAt = null;

        if (reminderAt !== null && reminderAt !== "") {
            parsedReminderAt = new Date(reminderAt);

            if (Number.isNaN(parsedReminderAt.getTime())) {
                return res.status(400).json({
                    message: "Please provide a valid reminder date and time"
                });
            }
        }

        const task = new List({
            title: title.trim(),
            body: body.trim(),
            completed: false,
            priority,
            createdAt: taskCreatedAt,
            dueDate: parsedDueDate,
            reminderAt: parsedReminderAt,
            category,
            subtasks: subtaskValidation.subtasks,
            user: userId
        });

        await task.save();

        await User.findByIdAndUpdate(userId, {
            $push: { list: task._id }
        });

        // Schedule task notifications
        scheduleTaskNotifications(task);

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
        const {
            title,
            body,
            priority = "Medium",
            dueDate,
            category = "Personal",
            subtasks,
            reminderAt
        } = req.body;
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

        if (!["Work", "Personal", "Study", "Projects"].includes(category)) {
            return res.status(400).json({
                message: "Category must be Work, Personal, Study, or Projects"
            });
        }

        let validatedSubtasks;

        if (subtasks !== undefined) {
            const subtaskValidation = validateSubtasks(subtasks);

            if (!subtaskValidation.valid) {
                return res.status(400).json({
                    message: subtaskValidation.message
                });
            }

            validatedSubtasks = subtaskValidation.subtasks;
        }

        const existingTask = await List.findOne({
            _id: taskId,
            user: userId
        });

        if (!existingTask) {
            return res.status(404).json({
                message: "Task not found"
            });
        }

        let parsedDueDate = dueDate === null ? null : undefined;

        if (dueDate !== undefined && dueDate !== null && dueDate !== "") {
            const datePattern = /^\d{4}-\d{2}-\d{2}$/;

            if (
                typeof dueDate !== "string" ||
                !datePattern.test(dueDate)
            ) {
                return res.status(400).json({
                    message: "Invalid due date"
                });
            }

            const [year, month, day] = dueDate.split("-").map(Number);

            const taskCreatedAt = existingTask.createdAt || new Date();

            parsedDueDate = new Date(
                year,
                month - 1,
                day,
                taskCreatedAt.getHours(),
                taskCreatedAt.getMinutes(),
                taskCreatedAt.getSeconds(),
                taskCreatedAt.getMilliseconds()
            );

            if (
                parsedDueDate.getFullYear() !== year ||
                parsedDueDate.getMonth() !== month - 1 ||
                parsedDueDate.getDate() !== day
            ) {
                return res.status(400).json({ message: "Invalid due date" });
            }
        }

        let parsedReminderAt;

        if (Object.prototype.hasOwnProperty.call(req.body, "reminderAt")) {
            parsedReminderAt = null;

            if (reminderAt !== null && reminderAt !== "") {
                parsedReminderAt = new Date(reminderAt);

                if (Number.isNaN(parsedReminderAt.getTime())) {
                    return res.status(400).json({
                        message: "Please provide a valid reminder date and time"
                    });
                }
            }
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
                    priority,
                    category,
                    ...(parsedDueDate !== undefined && { dueDate: parsedDueDate }),
                    ...(validatedSubtasks !== undefined && { subtasks: validatedSubtasks }),
                    ...(parsedReminderAt !== undefined && { reminderAt: parsedReminderAt })
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

        // Reschedule notifications using the updated task dates
        scheduleTaskNotifications(task);

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

        // Find the task belonging to the logged-in user
        const task = await List.findOne({
            _id: taskId,
            user: userId
        });

        if (!task) {
            return res.status(404).json({
                message: "Task not found"
            });
        }

        // Check the previous completion status
        const wasCompleted = task.completed;

        // Update completion status and timestamp
        task.completed = completed;

        if (completed === true) {
            // Record completion time when newly completed
            if (!wasCompleted || !task.completedAt) {
                task.completedAt = new Date();
            }
        } else {
            // Clear completion time when moved back to pending
            task.completedAt = null;
        }

        await task.save();

        // Cancel scheduled notifications when task is completed
        if (completed) {
            cancelAllTaskJobs(task._id);
        } else {
            // Restore scheduled notifications when task is marked pending
            scheduleTaskNotifications(task);
        }

        // Create notification only when task changes from pending to completed
        if (completed === true && wasCompleted === false) {
            try {
                const user = await User.findById(userId)
                    .select("notificationPreferences");

                // Check whether task-completed notifications are enabled
                if (user?.notificationPreferences?.task_completed !== false) {
                    await Notification.create({
                        user: userId,
                        task: task._id,
                        type: "task_completed",
                        title: "Task Completed Successfully!",
                        message: `Great job! You have successfully completed "${task.title}". Keep up the good work!`,
                        triggerAt: task.completedAt,
                        isRead: false
                    });
                }

            } catch (notificationError) {
                console.error(
                    "Task completion notification error:",
                    notificationError.message
                );
            }
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

        // Cancel all scheduled notifications for the deleted task
        cancelAllTaskJobs(task._id);

        // Delete related in-app notifications
        await Notification.deleteMany({
            user: userId,
            task: task._id
        });

        // Delete related email notification logs
        await EmailNotificationLog.deleteMany({
            user: userId,
            task: task._id
        });

        // Remove task reference from user
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

// ==================== GET PRODUCTIVITY PROGRESS ====================
router.get("/progress", async (req, res) => {
    try {
        const userId = req.user.userId;

        // Get the user's timezone from the frontend
        const timezone = req.query.timezone || "Asia/Kolkata";

        let dateFormatter;

        try {
            dateFormatter = new Intl.DateTimeFormat("en-CA", {
                timeZone: timezone,
                year: "numeric",
                month: "2-digit",
                day: "2-digit",
            });
        } catch (error) {
            return res.status(400).json({
                message: "Invalid timezone",
            });
        }

        // Convert a date into YYYY-MM-DD in the user's timezone
        const getDateKey = (date) => {
            const parts = dateFormatter.formatToParts(date);

            const values = {};

            parts.forEach((part) => {
                if (part.type !== "literal") {
                    values[part.type] = part.value;
                }
            });

            return `${values.year}-${values.month}-${values.day}`;
        };

        // Fetch all tasks belonging to the logged-in user
        const tasks = await List.find({
            user: userId,
        }).sort({ createdAt: -1 }).lean();

        // Today's date in the user's timezone
        const todayKey = getDateKey(new Date());

        // Generate the last 7 calendar days, including today
        const weeklyActivity = [];

        for (let i = 6; i >= 0; i--) {
            const date = new Date(`${todayKey}T00:00:00.000Z`);

            date.setUTCDate(date.getUTCDate() - i);

            const dateKey = date.toISOString().slice(0, 10);

            weeklyActivity.push({
                date: dateKey,
                label: new Intl.DateTimeFormat("en-IN", {
                    weekday: "short",
                    day: "numeric",
                    timeZone: "UTC",
                }).format(date),
                completed: 0,
            });
        }

        // Overall task statistics
        const totalTasks = tasks.length;

        const completedTasks = tasks.filter(
            (task) => task.completed
        ).length;

        const pendingTasks = totalTasks - completedTasks;

        // Overdue tasks
        const overdueTasks = tasks.filter((task) => {
            if (!task.dueDate || task.completed) {
                return false;
            }

            return getDateKey(new Date(task.dueDate)) < todayKey;
        }).length;

        // Completion percentage
        const completionRate = totalTasks > 0
            ? Math.round((completedTasks / totalTasks) * 100)
            : 0;

        // Category-wise statistics
        const categories = ["Work", "Personal", "Study", "Projects"];

        const categoryStats = categories.map((category) => {
            const categoryTasks = tasks.filter(
                (task) => (task.category || "Personal") === category
            );

            return {
                category,
                total: categoryTasks.length,
                completed: categoryTasks.filter(
                    (task) => task.completed
                ).length,
                pending: categoryTasks.filter(
                    (task) => !task.completed
                ).length,
            };
        });

        // Priority-wise statistics
        const priorities = ["High", "Medium", "Low"];

        const priorityStats = priorities.map((priority) => {
            const priorityTasks = tasks.filter(
                (task) => (task.priority || "Medium") === priority
            );

            return {
                priority,
                total: priorityTasks.length,
                completed: priorityTasks.filter(
                    (task) => task.completed
                ).length,
                pending: priorityTasks.filter(
                    (task) => !task.completed
                ).length,
            };
        });

        // Last 7 days completion activity
        const weeklyCounts = {};

        weeklyActivity.forEach((day) => {
            weeklyCounts[day.date] = day;
        });

        tasks.forEach((task) => {
            if (!task.completed || !task.completedAt) {
                return;
            }

            const completionDate = getDateKey(
                new Date(task.completedAt)
            );

            if (weeklyCounts[completionDate]) {
                weeklyCounts[completionDate].completed++;
            }
        });

        // Recently completed tasks
        const recentlyCompleted = tasks
            .filter((task) => task.completed && task.completedAt)
            .sort(
                (a, b) =>
                    new Date(b.completedAt) - new Date(a.completedAt)
            )
            .slice(0, 5)
            .map((task) => ({
                _id: task._id,
                title: task.title,
                category: task.category,
                priority: task.priority,
                completedAt: task.completedAt,
            }));

        return res.status(200).json({
            message: "Progress fetched successfully",

            overview: {
                totalTasks,
                completedTasks,
                pendingTasks,
                overdueTasks,
                completionRate,
            },

            categoryStats,
            priorityStats,
            weeklyActivity,
            recentlyCompleted,
        });

    } catch (error) {
        console.error("Progress API error:", error.message);

        return res.status(500).json({
            message: "Failed to fetch productivity progress",
        });
    }
});

module.exports = router;