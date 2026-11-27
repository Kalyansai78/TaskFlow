const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
    email: {
        type: String,
        unique: true,
        required: true,
        trim: true,
        lowercase: true
    },

    username: {
        type: String,
        unique: true,
        required: true,
        trim: true
    },

    password: {
        type: String,
        required: true
    },

    // Email verification
    isEmailVerified: {
        type: Boolean,
        default: false
    },

    emailVerificationOTPHash: {
        type: String,
        default: null
    },

    emailVerificationOTPExpires: {
        type: Date,
        default: null
    },

    emailVerificationLastSentAt: {
        type: Date,
        default: null
    },

    emailVerificationAttempts: {
        type: Number,
        default: 0
    },

    emailVerificationResendCount: {
        type: Number,
        default: 0
    },

    emailVerificationResendWindowStartedAt: {
        type: Date,
        default: null
    },

    // Password reset fields
    passwordResetOTPHash: {
        type: String,
        default: null
    },

    passwordResetOTPExpires: {
        type: Date,
        default: null
    },

    passwordResetLastSentAt: {
        type: Date,
        default: null
    },

    passwordResetAttempts: {
        type: Number,
        default: 0
    },

    passwordResetResendCount: {
        type: Number,
        default: 0
    },
    
    passwordResetResendWindowStartedAt: {
        type: Date,
        default: null
    },

    // Notification preferences
    notificationPreferences: {
        task_due_soon: {
            type: Boolean,
            default: true
        },
        task_overdue: {
            type: Boolean,
            default: true
        },
        task_completed: {
            type: Boolean,
            default: true
        },
        task_reminder: {
            type: Boolean,
            default: true
        }
    },

    // Email notification preferences
    emailNotificationPreferences: {
        enabled: {
            type: Boolean,
            default: true
        },

        task_due_soon: {
            type: Boolean,
            default: true
        },

        task_overdue: {
            type: Boolean,
            default: true
        },

        task_reminder: {
            type: Boolean,
            default: true
        }
    },
    
    // Appearance preferences
    appearance: {
        theme: {
            type: String,
            enum: ["light", "dark"],
            default: "light"
        }
    },

    list: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "List"
    }]
}, {
    timestamps: true
});

module.exports = mongoose.model("User", userSchema);