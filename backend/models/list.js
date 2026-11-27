const mongoose = require("mongoose");

const listSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: true,
            trim: true,
        },

        body: {
            type: String,
            required: true,
            trim: true,
        },

        completed: {
            type: Boolean,
            default: false,
        },

        completedAt: {
            type: Date,
            default: null,
        },

        priority: {
            type: String,
            enum: ["High", "Medium", "Low"],
            default: "Medium",
        },

        dueDate: {
            type: Date,
            default: null
        },

        reminderAt: {
            type: Date,
            default: null
        },

        category: {
            type: String,
            enum: ["Work", "Personal", "Study", "Projects"],
            default: "Personal",
        },

        subtasks: [
            {
                title: {
                    type: String,
                    required: true,
                    trim: true,
                },
                completed: {
                    type: Boolean,
                    default: false,
                },
            },
        ],

        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model("List", listSchema);