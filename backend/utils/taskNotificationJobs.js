const schedule = require("node-schedule");
const executeTaskNotification = require("./executeTaskNotification");

// Store active jobs using task ID and notification type
const scheduledJobs = new Map();

const getJobKey = (taskId, type) => {
    return `${taskId}_${type}`;
};

// Cancel one scheduled notification
const cancelTaskJob = (taskId, type) => {
    const key = getJobKey(taskId, type);
    const existingJob = scheduledJobs.get(key);

    if (existingJob) {
        existingJob.cancel();
        scheduledJobs.delete(key);

        console.log(`Cancelled scheduled job: ${key}`);
    }
};

// Cancel all notification jobs for a task
const cancelAllTaskJobs = (taskId) => {
    const types = [
        "task_due_soon",
        "task_overdue",
        "task_reminder"
    ];

    types.forEach((type) => {
        cancelTaskJob(taskId, type);
    });
};

// Schedule an individual notification
const scheduleTaskJob = (taskId, type, date) => {
    const key = getJobKey(taskId, type);

    cancelTaskJob(taskId, type);

    const scheduledDate = new Date(date);

    // Ignore invalid or past dates
    if (
        Number.isNaN(scheduledDate.getTime()) ||
        scheduledDate <= new Date()
    ) {
        return;
    }

    const job = schedule.scheduleJob(scheduledDate, async () => {
        scheduledJobs.delete(key);

        await executeTaskNotification(taskId, type);
    });

    if (job) {
        scheduledJobs.set(key, job);

        console.log(
            `Scheduled ${type} for task ${taskId} at ${scheduledDate}`
        );
    }
};

// Schedule all applicable notifications for a task
const scheduleTaskNotifications = (task) => {
    const taskId = task._id.toString();

    // Cancel old jobs before scheduling updated dates
    cancelAllTaskJobs(taskId);

    // Completed tasks should not have pending notifications
    if (task.completed) {
        return;
    }

    const now = new Date();

    // Upcoming deadline and overdue notifications
    if (task.dueDate) {
        const dueDate = new Date(task.dueDate);

        const upcomingDate = new Date(
            dueDate.getTime() - 24 * 60 * 60 * 1000
        );

        // Case 1: Task is already overdue
        if (dueDate <= now) {
            void executeTaskNotification(
                taskId,
                "task_overdue"
            );
        }

        // Case 2: Deadline is within the next 24 hours
        else if (upcomingDate <= now) {
            void executeTaskNotification(
                taskId,
                "task_due_soon"
            );

            // Schedule overdue notification for the actual deadline
            scheduleTaskJob(
                taskId,
                "task_overdue",
                dueDate
            );
        }

        // Case 3: Both notification times are in the future
        else {
            scheduleTaskJob(
                taskId,
                "task_due_soon",
                upcomingDate
            );

            scheduleTaskJob(
                taskId,
                "task_overdue",
                dueDate
            );
        }
    }

    // Custom reminder
    if (task.reminderAt) {
        const reminderDate = new Date(task.reminderAt);

        if (reminderDate <= now) {
            void executeTaskNotification(
                taskId,
                "task_reminder"
            );
        } else {
            scheduleTaskJob(
                taskId,
                "task_reminder",
                reminderDate
            );
        }
    }
};

module.exports = {
    scheduleTaskJob,
    scheduleTaskNotifications,
    cancelTaskJob,
    cancelAllTaskJobs
};