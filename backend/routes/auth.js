const router = require("express").Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/user");
const verifyToken = require("../middleware/auth");

// ==================== SIGN UP ====================
router.post("/register", async (req, res) => {
    try {
        const { email, username, password } = req.body;

        if (!email || !username || !password) {
            return res.status(400).json({
                message: "All fields are required"
            });
        }

        if (password.length < 6) {
            return res.status(400).json({
                message: "Password must be at least 6 characters"
            });
        }

        const existingUser = await User.findOne({
            $or: [{ email }, { username }]
        });

        if (existingUser) {
            return res.status(409).json({
                message: "Email or username already exists"
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = new User({
            email,
            username,
            password: hashedPassword
        });

        await newUser.save();

        return res.status(201).json({
            message: "Sign Up Successful"
        });

    } catch (error) {
        console.error("Registration error:", error.message);

        if (error.code === 11000) {
            return res.status(409).json({
                message: "Email or username already exists"
            });
        }

        return res.status(500).json({
            message: "Registration failed"
        });
    }
});

// ==================== SIGN IN ====================
router.post("/signin", async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                message: "Email and password are required"
            });
        }

        const user = await User.findOne({ email });

        if (!user) {
            return res.status(401).json({
                message: "Incorrect email or password"
            });
        }

        const isPasswordCorrect = await bcrypt.compare(
            password,
            user.password
        );

        if (!isPasswordCorrect) {
            return res.status(401).json({
                message: "Incorrect email or password"
            });
        }

        // Generate JWT token
        if (!process.env.JWT_SECRET) {
            throw new Error("JWT_SECRET is not configured");
        }

        const token = jwt.sign(
            { userId: user._id.toString() },
            process.env.JWT_SECRET,
            { expiresIn: "1d" }
        );

        return res.status(200).json({
            message: "Signin Successful",
            token,
            others: {
                _id: user._id,
                email: user.email,
                username: user.username
            }
        });

    } catch (error) {
        console.error("Signin error:", error.message);

        return res.status(500).json({
            message: "Signin failed due to a server error"
        });
    }
});

// ==================== GET USER PROFILE ====================
router.get("/profile", verifyToken, async (req, res) => {
    try {
        const user = await User.findById(req.user.userId)
            .select("-password -list");

        if (!user) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        return res.status(200).json({
            message: "Profile fetched successfully",
            user: {
                _id: user._id,
                username: user.username,
                email: user.email
            }
        });

    } catch (error) {
        console.error("Get profile error:", error.message);

        return res.status(500).json({
            message: "Failed to fetch profile"
        });
    }
});


// ==================== UPDATE USER PROFILE ====================
router.put("/update-profile", verifyToken, async (req, res) => {
    try {
        const { username, email } = req.body;

        // Validate required fields
        if (!username || !email) {
            return res.status(400).json({
                message: "Username and email are required"
            });
        }

        const updatedUsername = username.trim();
        const updatedEmail = email.trim();

        if (!updatedUsername || !updatedEmail) {
            return res.status(400).json({
                message: "Username and email cannot be empty"
            });
        }

        // Basic email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!emailRegex.test(updatedEmail)) {
            return res.status(400).json({
                message: "Please enter a valid email address"
            });
        }

        // Check whether another user already uses this email or username
        const existingUser = await User.findOne({
            _id: { $ne: req.user.userId },
            $or: [
                { email: updatedEmail },
                { username: updatedUsername }
            ]
        });

        if (existingUser) {
            return res.status(409).json({
                message: "Email or username is already taken"
            });
        }

        // Find the authenticated user
        const user = await User.findById(req.user.userId);

        if (!user) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        // Update profile fields
        user.username = updatedUsername;
        user.email = updatedEmail;

        await user.save();

        return res.status(200).json({
            message: "Profile updated successfully",
            user: {
                _id: user._id,
                username: user.username,
                email: user.email
            }
        });

    } catch (error) {
        console.error("Update profile error:", error.message);

        if (error.code === 11000) {
            return res.status(409).json({
                message: "Email or username is already taken"
            });
        }

        return res.status(500).json({
            message: "Failed to update profile"
        });
    }
});

module.exports = router;