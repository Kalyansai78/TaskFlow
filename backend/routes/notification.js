const router = require("express").Router();
const mongoose = require("mongoose");

const Notification = require("../models/notification");
const verifyToken = require("../middleware/auth");

// Protect every notification route
router.use(verifyToken);

// ==================== GET NOTIFICATIONS ====================
router.get("/", async (req, res) => {
    try {
        const userId = req.user.userId;

        // Pagination parameters
        const requestedPage = Math.max(
            parseInt(req.query.page, 10) || 1,
            1
        );

        const limit = Math.min(
            Math.max(parseInt(req.query.limit, 10) || 10, 1),
            50
        );

        // Get total notification count
        const totalNotifications = await Notification.countDocuments({
            user: userId
        });

        const totalPages = Math.ceil(totalNotifications / limit);

        // Keep requested page within valid range
        const currentPage = totalPages === 0
            ? 1
            : Math.min(requestedPage, totalPages);

        const skip = (currentPage - 1) * limit;

        // Fetch notifications for the current page
        const [notifications, unreadCount] = await Promise.all([
            Notification.find({
                user: userId
            })
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit),

            Notification.countDocuments({
                user: userId,
                isRead: false
            })
        ]);

        return res.status(200).json({
            notifications,
            unreadCount,
            pagination: {
                currentPage,
                totalPages,
                totalNotifications,
                limit,
                hasNextPage: currentPage < totalPages,
                hasPreviousPage: currentPage > 1
            }
        });

    } catch (error) {
        console.error("Fetch notifications error:", error.message);

        return res.status(500).json({
            message: "Failed to fetch notifications"
        });
    }
});

// ==================== MARK ONE AS READ ====================
router.patch("/:id/read", async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.userId;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                message: "Invalid notification ID"
            });
        }

        const notification = await Notification.findOneAndUpdate(
            {
                _id: id,
                user: userId
            },
            {
                $set: { isRead: true }
            },
            {
                new: true
            }
        );

        if (!notification) {
            return res.status(404).json({
                message: "Notification not found"
            });
        }

        return res.status(200).json({
            message: "Notification marked as read",
            notification
        });

    } catch (error) {
        console.error("Mark notification read error:", error.message);

        return res.status(500).json({
            message: "Failed to update notification"
        });
    }
});


// ==================== MARK ALL AS READ ====================
router.patch("/read-all", async (req, res) => {
    try {
        const userId = req.user.userId;

        await Notification.updateMany(
            {
                user: userId,
                isRead: false
            },
            {
                $set: { isRead: true }
            }
        );

        return res.status(200).json({
            message: "All notifications marked as read"
        });

    } catch (error) {
        console.error("Mark all notifications read error:", error.message);

        return res.status(500).json({
            message: "Failed to update notifications"
        });
    }
});


// ==================== DELETE ONE NOTIFICATION ====================
router.delete("/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.userId;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                message: "Invalid notification ID"
            });
        }

        const notification = await Notification.findOneAndDelete({
            _id: id,
            user: userId
        });

        if (!notification) {
            return res.status(404).json({
                message: "Notification not found"
            });
        }

        return res.status(200).json({
            message: "Notification deleted successfully"
        });

    } catch (error) {
        console.error("Delete notification error:", error.message);

        return res.status(500).json({
            message: "Failed to delete notification"
        });
    }
});


module.exports = router;