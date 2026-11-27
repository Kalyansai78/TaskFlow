import React, { useEffect, useState } from "react";
import "./Signup.css";
import Heading from "./Heading";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { apiV1 } from "../../api/axios";
import { ToastContainer, toast } from "react-toastify";
import {
    FiMail,
    FiLock,
    FiArrowRight,
    FiEye,
    FiEyeOff
} from "react-icons/fi";

const SetNewPassword = () => {
    const location = useLocation();
    const navigate = useNavigate();

    const email = location.state?.email || "";
    const otp = location.state?.otp || "";

    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!email || !otp) {
            toast.error("Please verify your reset code first.");
            navigate("/forgot-password", { replace: true });
        }
    }, [email, otp, navigate]);

    const submit = async (e) => {
        e.preventDefault();

        if (newPassword.length < 6) {
            toast.error("Password must be at least 6 characters.");
            return;
        }

        if (newPassword !== confirmPassword) {
            toast.error("Passwords do not match.");
            return;
        }

        try {
            setLoading(true);

            const response = await apiV1.post("/reset-password",
                {
                    email,
                    otp,
                    newPassword
                }
            );

            toast.success(
                response.data.message || "Password reset successfully!"
            );

            setTimeout(() => {
                navigate("/signin", { replace: true });
            }, 1500);

        } catch (error) {
            toast.error(
                error.response?.data?.message ||
                "Unable to reset your password. Please try again."
            );
        } finally {
            setLoading(false);
        }
    };

    if (!email || !otp) return null;

    return (
        <main className="tf-auth-page">
            <ToastContainer position="top-right" autoClose={2500} />

            <div className="tf-auth-layout">

                <Heading
                    first="New"
                    second="Password."
                    description="Choose a strong new password to secure your TaskFlow account."
                />

                <section className="tf-auth-form-section">
                    <div className="tf-auth-form-wrapper">

                        <div className="tf-auth-mobile-brand">
                            <span className="tf-auth-aside-logo">
                                <FiLock />
                            </span>
                            TaskFlow
                        </div>

                        <div className="tf-auth-heading">
                            <span>PASSWORD RECOVERY</span>
                            <h2>Create a new password</h2>
                            <p>
                                Your email has been verified.
                                Enter your new password below.
                            </p>
                        </div>

                        <form
                            className="tf-auth-form"
                            onSubmit={submit}
                        >

                            <label>Email address</label>

                            <div className="tf-auth-input-wrap">
                                <FiMail />
                                <input
                                    type="email"
                                    value={email}
                                    readOnly
                                />
                            </div>

                            <label htmlFor="new-password">
                                New password
                            </label>

                            <div className="tf-auth-input-wrap">
                                <FiLock />

                                <input
                                    id="new-password"
                                    type={showPassword ? "text" : "password"}
                                    placeholder="Enter new password"
                                    autoComplete="new-password"
                                    value={newPassword}
                                    onChange={(e) =>
                                        setNewPassword(e.target.value)
                                    }
                                    required
                                />

                                <button
                                    type="button"
                                    className="tf-password-toggle"
                                    onClick={() =>
                                        setShowPassword(!showPassword)
                                    }
                                    aria-label={
                                        showPassword
                                            ? "Hide password"
                                            : "Show password"
                                    }
                                >
                                    {showPassword
                                        ? <FiEyeOff />
                                        : <FiEye />}
                                </button>
                            </div>

                            <label htmlFor="confirm-new-password">
                                Confirm new password
                            </label>

                            <div className="tf-auth-input-wrap">
                                <FiLock />

                                <input
                                    id="confirm-new-password"
                                    type={
                                        showConfirmPassword
                                            ? "text"
                                            : "password"
                                    }
                                    placeholder="Re-enter new password"
                                    autoComplete="new-password"
                                    value={confirmPassword}
                                    onChange={(e) =>
                                        setConfirmPassword(e.target.value)
                                    }
                                    required
                                />

                                <button
                                    type="button"
                                    className="tf-password-toggle"
                                    onClick={() =>
                                        setShowConfirmPassword(
                                            !showConfirmPassword
                                        )
                                    }
                                    aria-label={
                                        showConfirmPassword
                                            ? "Hide confirm password"
                                            : "Show confirm password"
                                    }
                                >
                                    {showConfirmPassword
                                        ? <FiEyeOff />
                                        : <FiEye />}
                                </button>
                            </div>

                            {confirmPassword && (
                                <div
                                    className={
                                        newPassword === confirmPassword
                                            ? "tf-password-match success"
                                            : "tf-password-match error"
                                    }
                                >
                                    {newPassword === confirmPassword
                                        ? "✓ Passwords match"
                                        : "✕ Passwords do not match"}
                                </div>
                            )}

                            <button
                                className="tf-auth-submit"
                                type="submit"
                                disabled={loading}
                            >
                                {loading
                                    ? "Updating password..."
                                    : "Reset password"}

                                {!loading && <FiArrowRight />}
                            </button>

                        </form>

                        <div className="tf-auth-switch">
                            Remember your password?
                            <Link to="/signin"> Sign in</Link>
                        </div>

                        <div className="tf-auth-bottom-note">
                            Your goals. Your progress. Your flow.
                        </div>

                    </div>
                </section>

            </div>
        </main>
    );
};

export default SetNewPassword;