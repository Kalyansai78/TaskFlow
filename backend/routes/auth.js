const router = require("express").Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/user");
const List = require("../models/list");
const Notification = require("../models/notification");
const verifyToken = require("../middleware/auth");
const crypto = require("crypto");
const sendEmail = require("../utils/sendEmail");
const EmailNotificationLog = require("../models/emailNotificationLog");
const { cancelAllTaskJobs } = require("../utils/taskNotificationJobs");

// ==================== SIGN UP WITH EMAIL OTP ====================
router.post("/register", async (req, res) => {
    try {
        const email = req.body.email?.trim().toLowerCase();
        const username = req.body.username?.trim();
        const password = req.body.password;

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

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!emailRegex.test(email)) {
            return res.status(400).json({
                message: "Please enter a valid email address"
            });
        }

        // Check whether this email already has an account
        const existingUser = await User.findOne({ email });

        if (existingUser) {

            // Already verified: ask the user to sign in
            if (existingUser.isEmailVerified) {
                return res.status(409).json({
                    message: "An account with this email already exists. Please sign in."
                });
            }

            // Check whether the submitted credentials match
            if (existingUser.username !== username) {
                return res.status(409).json({
                    message: "The username does not match the existing account."
                });
            }

            const passwordMatches = await bcrypt.compare(
                password,
                existingUser.password
            );

            if (!passwordMatches) {
                return res.status(401).json({
                    message: "Incorrect password for this unverified account."
                });
            }

            const now = new Date();

            // Enforce 60-second cooldown
            if (existingUser.emailVerificationLastSentAt) {
                const elapsedSeconds = Math.floor(
                    (now - existingUser.emailVerificationLastSentAt) / 1000
                );

                if (elapsedSeconds < 60) {
                    const remainingSeconds = 60 - elapsedSeconds;

                    return res.status(429).json({
                        message: `Please wait ${remainingSeconds} seconds before requesting another code.`,
                        remainingSeconds
                    });
                }
            }

            // Reset hourly resend window when necessary
            const windowExpired =
                !existingUser.emailVerificationResendWindowStartedAt ||
                now - existingUser.emailVerificationResendWindowStartedAt >=
                    60 * 60 * 1000;

            if (windowExpired) {
                existingUser.emailVerificationResendCount = 0;
                existingUser.emailVerificationResendWindowStartedAt = now;
            }

            // Maximum 5 resend requests per hour
            if (existingUser.emailVerificationResendCount >= 5) {
                return res.status(429).json({
                    message: "You have reached the maximum of 5 resend requests per hour. Please try again later."
                });
            }

            // Preserve the previous OTP information in case email fails
            const previousOtpDetails = {
                hash: existingUser.emailVerificationOTPHash,
                expires: existingUser.emailVerificationOTPExpires,
                lastSent: existingUser.emailVerificationLastSentAt,
                attempts: existingUser.emailVerificationAttempts,
                resendCount: existingUser.emailVerificationResendCount,
                windowStarted: existingUser.emailVerificationResendWindowStartedAt
            };

            // Generate a new OTP
            const otp = crypto.randomInt(100000, 1000000).toString();

            const otpHash = crypto
                .createHash("sha256")
                .update(otp)
                .digest("hex");

            existingUser.emailVerificationOTPHash = otpHash;
            existingUser.emailVerificationOTPExpires =
                new Date(now.getTime() + 10 * 60 * 1000);
            existingUser.emailVerificationLastSentAt = now;
            existingUser.emailVerificationAttempts = 0;
            existingUser.emailVerificationResendCount += 1;

            await existingUser.save();

            try {
                await sendEmail(
                    email,
                    "Your TaskFlow verification code",
                    `Your TaskFlow verification code is ${otp}. It expires in 10 minutes. Your previous code is no longer valid.`,
                    `
                        <div style="font-family: Arial, sans-serif; padding: 24px; color: #333;">
                            <h2 style="color: #527b65;">Verify your TaskFlow account</h2>
                            <p>Use this new code to verify your email address.</p>
                            <h1 style="letter-spacing: 8px; color: #527b65;">${otp}</h1>
                            <p>This code expires in <strong>10 minutes</strong>.</p>
                            <p>Your previous verification code is no longer valid.</p>
                        </div>
                    `
                );
            } catch (emailError) {
                console.error("Registration resend email error:", emailError.message);

                // Restore previous OTP information if email delivery fails
                existingUser.emailVerificationOTPHash = previousOtpDetails.hash;
                existingUser.emailVerificationOTPExpires = previousOtpDetails.expires;
                existingUser.emailVerificationLastSentAt = previousOtpDetails.lastSent;
                existingUser.emailVerificationAttempts = previousOtpDetails.attempts;
                existingUser.emailVerificationResendCount = previousOtpDetails.resendCount;
                existingUser.emailVerificationResendWindowStartedAt =
                    previousOtpDetails.windowStarted;

                await existingUser.save();

                return res.status(500).json({
                    message: "Unable to send verification email. Please try again."
                });
            }

            return res.status(200).json({
                message: "Your account is awaiting verification. A new verification code has been sent.",
                email
            });
        }

        // Email is new: check whether username is already taken
        const existingUsername = await User.findOne({ username });

        if (existingUsername) {
            return res.status(409).json({
                message: "This username is already taken. Please choose another."
            });
        }

        // Create a new account
        const hashedPassword = await bcrypt.hash(password, 10);

        const otp = crypto.randomInt(100000, 1000000).toString();

        const otpHash = crypto
            .createHash("sha256")
            .update(otp)
            .digest("hex");

        const now = new Date();

        const newUser = new User({
            email,
            username,
            password: hashedPassword,
            isEmailVerified: false,
            emailVerificationOTPHash: otpHash,
            emailVerificationOTPExpires: new Date(
                now.getTime() + 10 * 60 * 1000
            ),
            emailVerificationLastSentAt: now,
            emailVerificationAttempts: 0
        });

        await newUser.save();

        try {
            await sendEmail(
                email,
                "Verify your TaskFlow account",
                `Your TaskFlow verification code is ${otp}. It expires in 10 minutes.`,
                `
                    <div style="font-family: Arial, sans-serif; padding: 24px; color: #333;">
                        <h2 style="color: #527b65;">Welcome to TaskFlow!</h2>
                        <p>Use the verification code below to verify your email address.</p>
                        <h1 style="letter-spacing: 8px; color: #527b65;">${otp}</h1>
                        <p>This code expires in <strong>10 minutes</strong>.</p>
                        <p>If you did not create this account, you can ignore this email.</p>
                    </div>
                `
            );
        } catch (emailError) {
            console.error("OTP email error:", emailError.message);

            return res.status(500).json({
                message: "Account created, but the verification email could not be sent. Please try again shortly."
            });
        }

        return res.status(201).json({
            message: "Account created. Please check your email for the verification code.",
            email
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

// ==================== RESEND EMAIL VERIFICATION OTP ====================
router.post("/resend-verification", async (req, res) => {
    try {
        const email = req.body.email?.trim().toLowerCase();

        if (!email) {
            return res.status(400).json({
                message: "Email address is required"
            });
        }

        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).json({
                message: "Account not found"
            });
        }

        if (user.isEmailVerified) {
            return res.status(400).json({
                message: "This email is already verified"
            });
        }

        const now = new Date();

        // Enforce 60-second cooldown
        if (user.emailVerificationLastSentAt) {
            const elapsedSeconds = Math.floor(
                (now - user.emailVerificationLastSentAt) / 1000
            );

            if (elapsedSeconds < 60) {
                const remainingSeconds = 60 - elapsedSeconds;

                return res.status(429).json({
                    message: `Please wait ${remainingSeconds} seconds before requesting another code.`,
                    remainingSeconds
                });
            }
        }

        // Reset the resend counter after one hour
        const windowExpired =
            !user.emailVerificationResendWindowStartedAt ||
            now - user.emailVerificationResendWindowStartedAt >=
                60 * 60 * 1000;

        if (windowExpired) {
            user.emailVerificationResendCount = 0;
            user.emailVerificationResendWindowStartedAt = now;
        }

        // Maximum 5 resend requests per hour
        if (user.emailVerificationResendCount >= 5) {
            return res.status(429).json({
                message: "You have reached the maximum of 5 resend requests per hour. Please try again later."
            });
        }

        // Generate a fresh six-digit OTP
        const otp = crypto.randomInt(100000, 1000000).toString();

        const otpHash = crypto
            .createHash("sha256")
            .update(otp)
            .digest("hex");

        // Store the new OTP and invalidate the previous one
        user.emailVerificationOTPHash = otpHash;
        user.emailVerificationOTPExpires = new Date(
            now.getTime() + 10 * 60 * 1000
        );
        user.emailVerificationLastSentAt = now;
        user.emailVerificationAttempts = 0;
        user.emailVerificationResendCount += 1;

        await user.save();

        // Send the new OTP email
        try {
            await sendEmail(
                user.email,
                "Your new TaskFlow verification code",
                `Your new TaskFlow verification code is ${otp}. It expires in 10 minutes. Your previous code is no longer valid.`,
                `
                    <div style="font-family: Arial, sans-serif; padding: 24px; color: #333;">
                        <h2 style="color: #527b65;">Your new TaskFlow code</h2>
                        <p>Use this code to verify your email address.</p>
                        <h1 style="letter-spacing: 8px; color: #527b65;">
                            ${otp}
                        </h1>
                        <p>This code expires in <strong>10 minutes</strong>.</p>
                        <p>Your previous verification code is no longer valid.</p>
                    </div>
                `
            );
        } catch (emailError) {
            console.error("Resend OTP email error:", emailError.message);

            return res.status(500).json({
                message: "Unable to send the new verification email. Please try again after the cooldown."
            });
        }

        return res.status(200).json({
            message: "A new verification code has been sent to your email.",
            email: user.email
        });

    } catch (error) {
        console.error("Resend OTP error:", error.message);

        return res.status(500).json({
            message: "Unable to resend verification code"
        });
    }
});

// ==================== VERIFY EMAIL OTP ====================
router.post("/verify-email", async (req, res) => {
    try {
        const email = req.body.email?.trim().toLowerCase();
        const otp = req.body.otp?.trim();

        if (!email || !otp) {
            return res.status(400).json({
                message: "Email and verification code are required"
            });
        }

        if (!/^\d{6}$/.test(otp)) {
            return res.status(400).json({
                message: "Please enter a valid six-digit code"
            });
        }

        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).json({
                message: "Account not found"
            });
        }

        if (user.isEmailVerified) {
            const token = jwt.sign(
                { userId: user._id.toString() },
                process.env.JWT_SECRET,
                { expiresIn: "1d" }
            );

            return res.status(200).json({
                message: "Email is already verified",
                token,
                others: {
                    _id: user._id,
                    email: user.email,
                    username: user.username
                },
                welcomeEmailSent: false
            });
        }

        if (!user.emailVerificationOTPHash ||
            !user.emailVerificationOTPExpires) {
            return res.status(400).json({
                message: "No active verification code. Please request a new one."
            });
        }

        if (user.emailVerificationOTPExpires < new Date()) {
            return res.status(400).json({
                message: "Verification code has expired. Please request a new one."
            });
        }

        if (user.emailVerificationAttempts >= 5) {
            return res.status(429).json({
                message: "Too many incorrect attempts. Please request a new code."
            });
        }

        const submittedHash = crypto
            .createHash("sha256")
            .update(otp)
            .digest("hex");

        if (submittedHash !== user.emailVerificationOTPHash) {
            user.emailVerificationAttempts += 1;
            await user.save();

            return res.status(400).json({
                message: "Incorrect verification code"
            });
        }

        // Verify the email
        user.isEmailVerified = true;
        if (!process.env.JWT_SECRET) {
            throw new Error("JWT_SECRET is not configured");
        }
        user.emailVerificationOTPHash = null;
        user.emailVerificationOTPExpires = null;
        user.emailVerificationLastSentAt = null;
        user.emailVerificationAttempts = 0;

        await user.save();

        // Send welcome email after successful verification
        let welcomeEmailSent = false;

        try {
            await sendEmail(
                user.email,
                "Welcome to TaskFlow!",
                `Hi ${user.username},

        Your email has been successfully verified!

        Welcome to TaskFlow. Your account is ready.

        Start organizing your tasks and making every day productive!

        The TaskFlow Team`,
                `
                <div style="
                    font-family: Arial, sans-serif;
                    max-width: 600px;
                    margin: auto;
                    padding: 30px;
                    color: #304538;
                    background: #ffffff;
                ">
                    <h1 style="color: #527966;">
                        Welcome to TaskFlow!
                    </h1>

                    <p>Hi ${user.username},</p>

                    <p>
                        Your email has been successfully verified,
                        and your account is ready!
                    </p>

                    <p>
                        We're excited to have you on board.
                        Start organizing your tasks, managing deadlines,
                        and tracking your productivity.
                    </p>

                    <div style="
                        background: #edf5ef;
                        padding: 20px;
                        border-radius: 12px;
                        text-align: center;
                        margin: 25px 0;
                    ">
                        <h3 style="color: #527966;">
                            Your goals. Your progress. Your flow.
                        </h3>
                        <p>Let's make every day productive!</p>
                    </div>

                    <p>Best regards,<br><strong>The TaskFlow Team</strong></p>
                </div>
                `
            );

            welcomeEmailSent = true;

            console.log("Welcome email sent successfully");

        } catch (emailError) {
            console.error("Welcome email error:", emailError.message);
        }

        // Generate login token after successful email verification
        const token = jwt.sign(
            { userId: user._id.toString() },
            process.env.JWT_SECRET,
            { expiresIn: "1d" }
        );

        return res.status(200).json({
            message: welcomeEmailSent
                ? "Email verified successfully. Welcome to TaskFlow!"
                : "Email verified successfully, but the welcome email could not be sent.",
            token,
            others: {
                _id: user._id,
                email: user.email,
                username: user.username
            },
            welcomeEmailSent
        });

    } catch (error) {
        console.error("Email verification error:", error.message);

        return res.status(500).json({
            message: "Email verification failed"
        });
    }
});

 // ==================== FORGOT PASSWORD ====================
router.post("/forgot-password", async (req, res) => {
    try {
        const email = req.body.email?.trim().toLowerCase();

        if (!email) {
            return res.status(400).json({
                message: "Email address is required."
            });
        }

        const genericMessage =
            "If an eligible account exists for this email, a password reset code will be sent.";

        const user = await User.findOne({ email });

        // Do not reveal whether an account exists or is verified
        if (!user || !user.isEmailVerified) {
            return res.status(200).json({
                message: genericMessage
            });
        }

        const now = new Date();

        // Enforce 60-second cooldown
        if (user.passwordResetLastSentAt) {
            const elapsedSeconds = Math.floor(
                (now - user.passwordResetLastSentAt) / 1000
            );

            if (elapsedSeconds < 60) {
                return res.status(200).json({
                    message: genericMessage
                });
            }
        }

        // Reset hourly resend window when necessary
        const windowExpired =
            !user.passwordResetResendWindowStartedAt ||
            now - user.passwordResetResendWindowStartedAt >=
                60 * 60 * 1000;

        if (windowExpired) {
            user.passwordResetResendCount = 0;
            user.passwordResetResendWindowStartedAt = now;
        }

        // Maximum 5 reset-code requests per hour
        if (user.passwordResetResendCount >= 5) {
            await user.save();

            return res.status(200).json({
                message: genericMessage
            });
        }

        // Generate a six-digit OTP
        const otp = crypto.randomInt(100000, 1000000).toString();

        const otpHash = crypto
            .createHash("sha256")
            .update(otp)
            .digest("hex");

        // Save previous values in case email delivery fails
        const previousDetails = {
            hash: user.passwordResetOTPHash,
            expires: user.passwordResetOTPExpires,
            lastSent: user.passwordResetLastSentAt,
            attempts: user.passwordResetAttempts,
            count: user.passwordResetResendCount,
            windowStarted: user.passwordResetResendWindowStartedAt
        };

        user.passwordResetOTPHash = otpHash;
        user.passwordResetOTPExpires =
            new Date(now.getTime() + 10 * 60 * 1000);
        user.passwordResetLastSentAt = now;
        user.passwordResetAttempts = 0;
        user.passwordResetResendCount += 1;

        await user.save();

        try {
            await sendEmail(
                user.email,
                "TaskFlow password reset code",
                `Your password reset code is ${otp}. It expires in 10 minutes. If you did not request this, ignore this email.`,
                `
                    <div style="font-family: Arial, sans-serif; padding: 24px; color: #333;">
                        <h2 style="color: #527b65;">Reset your TaskFlow password</h2>
                        <p>Use the following code to reset your password.</p>
                        <h1 style="letter-spacing: 8px; color: #527b65;">${otp}</h1>
                        <p>This code expires in <strong>10 minutes</strong>.</p>
                        <p>If you did not request a password reset, you can safely ignore this email.</p>
                    </div>
                `
            );
        } catch (emailError) {
            console.error("Password reset email error:", emailError.message);

            // Restore previous reset details
            user.passwordResetOTPHash = previousDetails.hash;
            user.passwordResetOTPExpires = previousDetails.expires;
            user.passwordResetLastSentAt = previousDetails.lastSent;
            user.passwordResetAttempts = previousDetails.attempts;
            user.passwordResetResendCount = previousDetails.count;
            user.passwordResetResendWindowStartedAt =
                previousDetails.windowStarted;

            await user.save();

            return res.status(500).json({
                message: "Unable to send the password reset email. Please try again."
            });
        }

        return res.status(200).json({
            message: genericMessage
        });

    } catch (error) {
        console.error("Forgot password error:", error.message);

        return res.status(500).json({
            message: "Unable to process your request."
        });
    }
});

// ==================== VERIFY PASSWORD RESET OTP ====================
router.post("/verify-password-reset-otp", async (req, res) => {
    try {
        const email = req.body.email?.trim().toLowerCase();
        const otp = req.body.otp?.trim();

        if (!email || !otp) {
            return res.status(400).json({
                message: "Email and verification code are required."
            });
        }

        if (!/^\d{6}$/.test(otp)) {
            return res.status(400).json({
                message: "Please enter a valid six-digit code."
            });
        }

        const user = await User.findOne({ email });

        if (!user || !user.isEmailVerified) {
            return res.status(400).json({
                message: "Invalid or expired password reset code."
            });
        }

        if (
            !user.passwordResetOTPHash ||
            !user.passwordResetOTPExpires
        ) {
            return res.status(400).json({
                message: "No active reset code. Please request a new one."
            });
        }

        if (user.passwordResetOTPExpires < new Date()) {
            return res.status(400).json({
                message: "Reset code has expired. Please request a new one."
            });
        }

        if (user.passwordResetAttempts >= 5) {
            return res.status(429).json({
                message: "Too many incorrect attempts. Please request a new code."
            });
        }

        const submittedHash = crypto
            .createHash("sha256")
            .update(otp)
            .digest("hex");

        if (submittedHash !== user.passwordResetOTPHash) {
            user.passwordResetAttempts += 1;
            await user.save();

            return res.status(400).json({
                message: "Incorrect password reset code."
            });
        }

        return res.status(200).json({
            message: "OTP verified successfully. You can now create a new password."
        });

    } catch (error) {
        console.error("Password reset OTP verification error:", error.message);

        return res.status(500).json({
            message: "Unable to verify the reset code."
        });
    }
});

// ==================== RESET PASSWORD ====================
router.post("/reset-password", async (req, res) => {
    try {
        const email = req.body.email?.trim().toLowerCase();
        const otp = req.body.otp?.trim();
        const newPassword = req.body.newPassword;

        if (!email || !otp || !newPassword) {
            return res.status(400).json({
                message: "Email, verification code and new password are required."
            });
        }

        if (!/^\d{6}$/.test(otp)) {
            return res.status(400).json({
                message: "Please enter a valid six-digit code."
            });
        }

        if (typeof newPassword !== "string" || newPassword.length < 6) {
            return res.status(400).json({
                message: "Password must be at least 6 characters."
            });
        }

        const user = await User.findOne({ email });

        if (!user || !user.isEmailVerified) {
            return res.status(400).json({
                message: "Invalid or expired password reset code."
            });
        }

        if (
            !user.passwordResetOTPHash ||
            !user.passwordResetOTPExpires
        ) {
            return res.status(400).json({
                message: "No active password reset code. Please request a new one."
            });
        }

        if (user.passwordResetOTPExpires < new Date()) {
            return res.status(400).json({
                message: "Password reset code has expired. Please request a new one."
            });
        }

        if (user.passwordResetAttempts >= 5) {
            return res.status(429).json({
                message: "Too many incorrect attempts. Please request a new reset code."
            });
        }

        const submittedHash = crypto
            .createHash("sha256")
            .update(otp)
            .digest("hex");

        if (submittedHash !== user.passwordResetOTPHash) {
            user.passwordResetAttempts += 1;
            await user.save();

            return res.status(400).json({
                message: "Incorrect password reset code."
            });
        }

        // Hash and update the new password
        user.password = await bcrypt.hash(newPassword, 10);

        // Invalidate the reset OTP after successful password change
        user.passwordResetOTPHash = null;
        user.passwordResetOTPExpires = null;
        user.passwordResetLastSentAt = null;
        user.passwordResetAttempts = 0;
        user.passwordResetResendCount = 0;
        user.passwordResetResendWindowStartedAt = null;

        await user.save();

        return res.status(200).json({
            message: "Password reset successfully. Please sign in with your new password."
        });

    } catch (error) {
        console.error("Reset password error:", error.message);

        return res.status(500).json({
            message: "Unable to reset your password."
        });
    }
});

// ==================== SIGN IN ====================
router.post("/signin", async (req, res) => {
    try {
        const email = req.body.email?.trim().toLowerCase();
        const password = req.body.password;

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

        // Block accounts that are still waiting for email verification
        if (!user.isEmailVerified && user.emailVerificationOTPHash) {
            return res.status(403).json({
                message: "Please verify your email before signing in."
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
                email: user.email,
                isEmailVerified: user.isEmailVerified,
                accountStatus: "Active",
                createdAt: user.createdAt
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

// ==================== CHANGE PASSWORD ====================

router.put("/change-password", verifyToken, async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        // Validate required fields
        if (!currentPassword || !newPassword) {
            return res.status(400).json({
                message: "Current password and new password are required."
            });
        }

        if (
            typeof currentPassword !== "string" ||
            typeof newPassword !== "string"
        ) {
            return res.status(400).json({
                message: "Invalid password format."
            });
        }

        // Validate new password length
        if (newPassword.length < 6) {
            return res.status(400).json({
                message: "New password must be at least 6 characters."
            });
        }

        // Find authenticated user
        const user = await User.findById(req.user.userId);

        if (!user) {
            return res.status(404).json({
                message: "User not found."
            });
        }

        // Verify current password
        const isPasswordCorrect = await bcrypt.compare(
            currentPassword,
            user.password
        );

        if (!isPasswordCorrect) {
            return res.status(400).json({
                message: "Your current password is incorrect."
            });
        }

        // Prevent reusing the same password
        const isSamePassword = await bcrypt.compare(
            newPassword,
            user.password
        );

        if (isSamePassword) {
            return res.status(400).json({
                message: "New password must be different from your current password."
            });
        }

        // Hash and save new password
        user.password = await bcrypt.hash(newPassword, 10);

        await user.save();

        return res.status(200).json({
            message: "Password changed successfully."
        });

    } catch (error) {
        console.error("Change password error:", error.message);

        return res.status(500).json({
            message: "Unable to change password. Please try again."
        });
    }
});

// Get notification preferences
router.get("/notification-preferences", verifyToken, async (req, res) => {
    try {
        const user = await User.findById(req.user.userId)
            .select("notificationPreferences");

        if (!user) {
            return res.status(404).json({
                message: "User not found."
            });
        }

        return res.status(200).json({
            notificationPreferences: user.notificationPreferences
        });

    } catch (error) {
        console.error("Get notification preferences error:", error);

        return res.status(500).json({
            message: "Failed to fetch notification preferences."
        });
    }
});

// Update notification preferences
router.put("/notification-preferences", verifyToken, async (req, res) => {
    try {
        const allowedPreferences = [
            "task_due_soon",
            "task_overdue",
            "task_completed",
            "task_reminder"
        ];

        const updates = {};

        allowedPreferences.forEach((key) => {
            if (typeof req.body[key] === "boolean") {
                updates[`notificationPreferences.${key}`] = req.body[key];
            }
        });

        if (Object.keys(updates).length === 0) {
            return res.status(400).json({
                message: "Please provide valid notification preferences."
            });
        }

        const user = await User.findByIdAndUpdate(
            req.user.userId,
            { $set: updates },
            {
                new: true,
                runValidators: true
            }
        ).select("notificationPreferences");

        if (!user) {
            return res.status(404).json({
                message: "User not found."
            });
        }

        return res.status(200).json({
            message: "Notification preferences updated successfully.",
            notificationPreferences: user.notificationPreferences
        });

    } catch (error) {
        console.error("Update notification preferences error:", error);

        return res.status(500).json({
            message: "Failed to update notification preferences."
        });
    }
});

// ==================== EMAIL NOTIFICATION PREFERENCES ====================

// Get email notification preferences
router.get("/email-notification-preferences", verifyToken, async (req, res) => {
    try {
        const user = await User.findById(req.user.userId)
            .select("emailNotificationPreferences");

        if (!user) {
            return res.status(404).json({
                message: "User not found."
            });
        }

        const defaultPreferences = {
            enabled: true,
            task_due_soon: true,
            task_overdue: true,
            task_reminder: true
        };

        return res.status(200).json({
            emailNotificationPreferences: {
                ...defaultPreferences,
                ...(user.emailNotificationPreferences?.toObject?.() ||
                    user.emailNotificationPreferences || {})
            }
        });

    } catch (error) {
        console.error("Get email notification preferences error:", error);

        return res.status(500).json({
            message: "Failed to fetch email notification preferences."
        });
    }
});

// Update email notification preferences
router.put("/email-notification-preferences", verifyToken, async (req, res) => {
    try {
        const allowedPreferences = [
            "enabled",
            "task_due_soon",
            "task_overdue",
            "task_reminder"
        ];

        const updates = {};

        allowedPreferences.forEach((key) => {
            if (typeof req.body[key] === "boolean") {
                updates[`emailNotificationPreferences.${key}`] = req.body[key];
            }
        });

        if (Object.keys(updates).length === 0) {
            return res.status(400).json({
                message: "Please provide valid email notification preferences."
            });
        }

        const user = await User.findByIdAndUpdate(
            req.user.userId,
            { $set: updates },
            {
                new: true,
                runValidators: true
            }
        ).select("emailNotificationPreferences");

        if (!user) {
            return res.status(404).json({
                message: "User not found."
            });
        }

        return res.status(200).json({
            message: "Email notification preferences updated successfully.",
            emailNotificationPreferences: user.emailNotificationPreferences
        });

    } catch (error) {
        console.error("Update email notification preferences error:", error);

        return res.status(500).json({
            message: "Failed to update email notification preferences."
        });
    }
});

 // Get appearance preference
router.get("/appearance", verifyToken, async (req, res) => {
    try {
        const user = await User.findById(req.user.userId)
            .select("appearance");

        if (!user) {
            return res.status(404).json({
                message: "User not found."
            });
        }

        return res.status(200).json({
            appearance: user.appearance || { theme: "light" }
        });

    } catch (error) {
        console.error("Get appearance error:", error);

        return res.status(500).json({
            message: "Failed to fetch appearance preference."
        });
    }
});

// Update appearance preference
router.put("/appearance", verifyToken, async (req, res) => {
    try {
        const { theme } = req.body;

        if (!["light", "dark"].includes(theme)) {
            return res.status(400).json({
                message: "Theme must be light or dark."
            });
        }

        const user = await User.findByIdAndUpdate(
            req.user.userId,
            {
                $set: {
                    "appearance.theme": theme
                }
            },
            {
                new: true,
                runValidators: true
            }
        ).select("appearance");

        if (!user) {
            return res.status(404).json({
                message: "User not found."
            });
        }

        return res.status(200).json({
            message: "Appearance preference updated successfully.",
            appearance: user.appearance
        });

    } catch (error) {
        console.error("Update appearance error:", error);

        return res.status(500).json({
            message: "Failed to update appearance preference."
        });
    }
});

// ==================== DELETE USER ACCOUNT ====================
router.delete("/delete-account", verifyToken, async (req, res) => {
    const { currentPassword } = req.body;
    const userId = req.user.userId;

    if (
        typeof currentPassword !== "string" ||
        !currentPassword.trim()
    ) {
        return res.status(400).json({
            message: "Current password is required."
        });
    }

    const session = await User.startSession();

    try {
        const user = await User.findById(userId).session(session);

        if (!user) {
            return res.status(404).json({
                message: "User not found."
            });
        }

        // Verify the current password
        const isPasswordCorrect = await bcrypt.compare(
            currentPassword,
            user.password
        );

        if (!isPasswordCorrect) {
            return res.status(400).json({
                message: "Your current password is incorrect."
            });
        }

        let tasksToDelete = [];
        
        await session.withTransaction(async () => {

            // Find all tasks belonging to this user
            const userTasks = await List.find({
                user: userId
            })
                .select("_id")
                .session(session);

            tasksToDelete = userTasks.map((task) => task._id);

            // Delete all tasks belonging to this user
            if (tasksToDelete.length > 0) {
                await List.deleteMany(
                    { _id: { $in: tasksToDelete } },
                    { session }
                );
            }

            // Delete the user's notifications and notifications
            // associated with tasks that are being deleted
            await Notification.deleteMany({
                $or: [
                    { user: userId },
                    { task: { $in: tasksToDelete } }
                ]
            }).session(session);

            // Delete the user's email notification logs
            // and logs associated with their deleted tasks
            await EmailNotificationLog.deleteMany({
                $or: [
                    { user: userId },
                    { task: { $in: tasksToDelete } }
                ]
            }).session(session);
            
            // Finally, delete the user account
            await User.deleteOne(
                { _id: userId },
                { session }
            );
        });

        tasksToDelete.forEach((taskId) => {
            cancelAllTaskJobs(taskId);
        });

        return res.status(200).json({
            message: "Your TaskFlow account and associated data have been permanently deleted."
        });

    } catch (error) {
        console.error("Delete account error:", error.message);

        return res.status(500).json({
            message: "Unable to delete your account. Please try again."
        });

    } finally {
        await session.endSession();
    }
});

module.exports = router;