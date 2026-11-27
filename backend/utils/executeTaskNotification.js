const List = require("../models/list");
const User = require("../models/user");
const Notification = require("../models/notification");
const EmailNotificationLog = require("../models/emailNotificationLog");

const sendEmail = require("./sendEmail");
const createEmailTemplate = require("./emailTemplate");

const executeTaskNotification = async (taskId, type) => {
    try {
        const task = await List.findById(taskId);

        if (!task || task.completed) {
            return;
        }

        const notificationDetails = {
            task_due_soon: {
                title: "Upcoming Task Deadline",
                message: `Your task "${task.title}" is due within the next 24 hours. Don't forget to complete it!`,
                subject: `TaskFlow: Upcoming Deadline - ${task.title}`
            },
            task_overdue: {
                title: "Task Overdue!",
                message: `Your task "${task.title}" is overdue. Please complete it as soon as possible.`,
                subject: `TaskFlow: Task Overdue - ${task.title}`
            },
            task_reminder: {
                title: "Task Reminder!",
                message: `Reminder: It's time to work on "${task.title}".`,
                subject: `TaskFlow: Reminder - ${task.title}`
            }
        };

        const details = notificationDetails[type];

        if (!details) return;

        const now = new Date();

        if (type === "task_due_soon") {
            if (!task.dueDate) return;

            const upcomingTime = new Date(
                task.dueDate.getTime() - 24 * 60 * 60 * 1000
            );

            if (upcomingTime > now) return;
        }

        if (type === "task_overdue") {
            if (!task.dueDate || new Date(task.dueDate) > now) {
                return;
            }
        }

        if (type === "task_reminder") {
            if (!task.reminderAt || new Date(task.reminderAt) > now) {
                return;
            }
        }

        const triggerAt =
            type === "task_reminder"
                ? task.reminderAt
                : type === "task_due_soon"
                    ? new Date(
                        task.dueDate.getTime() - 24 * 60 * 60 * 1000
                    )
                    : task.dueDate;

        if (!triggerAt) return;

        // Get task owner.
        const userId = task.user;

        const user = await User.findById(userId)
            .select(
                "email notificationPreferences emailNotificationPreferences"
            )
            .lean();

        if (!user) return;

        // In-app notification preferences.
        if (user.notificationPreferences?.[type] !== false) {
            const existingNotification = await Notification.findOne({
                user: user._id,
                task: task._id,
                type,
                triggerAt
            });

            if (!existingNotification) {
                await Notification.create({
                    user: userId,
                    task: task._id,
                    type,
                    triggerAt,
                    title: details.title,
                    message: details.message,
                    isRead: false
                });
            }
        }

        // Email notification preferences.
        const emailPreferences = {
            enabled: true,
            task_due_soon: true,
            task_overdue: true,
            task_reminder: true,
            ...(user.emailNotificationPreferences || {})
        };

        if (
            !emailPreferences.enabled ||
            emailPreferences[type] === false ||
            !user.email
        ) {
            return;
        }

        // Find an existing email log.
        let emailLog = await EmailNotificationLog.findOne({
            user: userId,
            task: task._id,
            type,
            triggerAt
        });

        // Support older upcoming-deadline logs.
        if (!emailLog && type === "task_due_soon") {
            emailLog = await EmailNotificationLog.findOne({
                user: userId,
                task: task._id,
                type,
                triggerAt: task.dueDate
            });
        }

        // Create a log if one does not exist.
        if (!emailLog) {
            try {
                emailLog = await EmailNotificationLog.create({
                    user: userId,
                    task: task._id,
                    type,
                    triggerAt,
                    status: "pending"
                });
            } catch (error) {
                if (error.code !== 11000) {
                    throw error;
                }

                emailLog = await EmailNotificationLog.findOne({
                    user: userId,
                    task: task._id,
                    type,
                    triggerAt
                });
            }
        }

        if (!emailLog || emailLog.status === "sent") {
            return;
        }

        // Recover email logs stuck in sending for more than 10 minutes.
        const recoveryThreshold = new Date(
            Date.now() - 10 * 60 * 1000
        );

        await EmailNotificationLog.updateOne(
            {
                _id: emailLog._id,
                status: "sending",
                $or: [
                    { sendingAt: { $lt: recoveryThreshold } },
                    {
                        sendingAt: null,
                        updatedAt: { $lt: recoveryThreshold }
                    }
                ]
            },
            {
                $set: {
                    status: "pending",
                    sendingAt: null
                }
            }
        );

        // Atomically claim the email log.
        const claimedLog = await EmailNotificationLog.findOneAndUpdate(
            {
                _id: emailLog._id,
                status: { $in: ["pending", "failed"] }
            },
            {
                $set: {
                    status: "sending",
                    sendingAt: new Date()
                }
            },
            { new: true }
        );

        if (!claimedLog) return;

        try {
            await sendEmail(
                user.email,
                details.subject,
                details.message,
                createEmailTemplate({
                    type,
                    task
                })
            );

            await EmailNotificationLog.updateOne(
                { _id: claimedLog._id, status: "sending" },
                {
                    $set: {
                        status: "sent",
                        sentAt: new Date(),
                        sendingAt: null
                    }
                }
            );

            console.log(`Task email sent successfully: ${type}`);

        } catch (emailError) {
            await EmailNotificationLog.updateOne(
                { _id: claimedLog._id, status: "sending" },
                {
                    $set: {
                        status: "failed",
                        sendingAt: null
                    }
                }
            );

            console.error(
                "Task notification email error:",
                emailError.message
            );
        }

    } catch (error) {
        console.error(
            "Execute task notification error:",
            error.message
        );
    }
};

module.exports = executeTaskNotification;