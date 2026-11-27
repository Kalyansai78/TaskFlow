const mongoose = require("mongoose");

const emailNotificationLogSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        task: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "List",
            required: true
        },

        type: {
            type: String,
            enum: [
                "task_due_soon",
                "task_overdue",
                "task_reminder"
            ],
            required: true
        },

        triggerAt: {
            type: Date,
            required: true
        },

        status: {
            type: String,
            enum: ["pending", "sending", "sent", "failed"],
            default: "pending"
        },
        sendingAt: {
            type: Date,
            default: null
        },
        sentAt: {
            type: Date,
            default: null
        }
    },
    { timestamps: true }
);

// Prevent duplicate email records for the same event
emailNotificationLogSchema.index(
    { user: 1, task: 1, type: 1, triggerAt: 1 },
    { unique: true }
);

module.exports = mongoose.model(
    "EmailNotificationLog",
    emailNotificationLogSchema
);