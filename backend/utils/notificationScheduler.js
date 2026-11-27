const List = require("../models/list");

const {
    scheduleTaskNotifications
} = require("./taskNotificationJobs");

// Restore all task notifications after backend restart.
const restoreScheduledJobs = async () => {
    const tasks = await List.find({
        completed: false
    });

    for (const task of tasks) {
        scheduleTaskNotifications(task);
    }

    console.log(
        `Restored notifications for ${tasks.length} tasks.`
    );
};

// Start notification scheduler.
const startNotificationScheduler = async () => {
    await restoreScheduledJobs();

    console.log("Notification scheduler started successfully.");
};

module.exports = startNotificationScheduler;