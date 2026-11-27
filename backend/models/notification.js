const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        task: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "List",
            default: null
        },

        type: {
            type: String,
            enum: [
                "task_due_soon",
                "task_overdue",
                "task_completed",
                "task_reminder"
            ],
            required: true
        },

        title: {
            type: String,
            required: true
        },

        message: {
            type: String,
            required: true
        },

        isRead: {
            type: Boolean,
            default: false
        },

        triggerAt: {
            type: Date,
            default: null
        }

    },
    {
        timestamps: true
    }
);

// Improve notification fetching and sorting.
notificationSchema.index({
    user: 1,
    createdAt: -1
});

// Improve unread notification queries.
notificationSchema.index({
    user: 1,
    isRead: 1
});

notificationSchema.index(
    { user: 1, task: 1, type: 1, triggerAt: 1 },
    {
        unique: true,
        partialFilterExpression: {
            task: { $type: "objectId" },
            triggerAt: { $type: "date" }
        }
    }
);

module.exports = mongoose.model("Notification", notificationSchema);