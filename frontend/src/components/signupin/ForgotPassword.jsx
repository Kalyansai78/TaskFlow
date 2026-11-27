import React, { useState } from "react";
import "./Signup.css";
import Heading from "./Heading";
import { Link, useNavigate } from "react-router-dom";
import { apiV1 } from "../../api/axios";
import { toast } from "react-toastify";
import { FiMail, FiArrowRight, FiLock } from "react-icons/fi";

const ForgotPassword = () => {
    const navigate = useNavigate();

    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);

    const submit = async (e) => {
        e.preventDefault();

        if (!email.trim()) {
            toast.error("Please enter your email address.");
            return;
        }

        try {
            setLoading(true);

            const response = await apiV1.post( "/forgot-password",
                { email: email.trim() }
            );

            toast.success(response.data.message);

            navigate("/reset-password", {
                state: { email: email.trim() }
            });

        } catch (error) {
            toast.error(
                error.response?.data?.message ||
                "Unable to process your request. Please try again."
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="tf-auth-page">

            <div className="tf-auth-layout">

                <Heading
                    first="Forgot"
                    second="Password?"
                    description="Don't worry. We'll help you get back into your TaskFlow workspace."
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
                            <h2>Reset your password</h2>
                            <p>
                                Enter your registered email address
                                to receive a password reset code.
                            </p>
                        </div>

                        <form
                            className="tf-auth-form"
                            onSubmit={submit}
                        >
                            <label htmlFor="forgot-email">
                                Email address
                            </label>

                            <div className="tf-auth-input-wrap">
                                <FiMail />
                                <input
                                    id="forgot-email"
                                    type="email"
                                    placeholder="you@example.com"
                                    autoComplete="email"
                                    value={email}
                                    onChange={(e) =>
                                        setEmail(e.target.value)
                                    }
                                    required
                                />
                            </div>

                            <button
                                className="tf-auth-submit"
                                type="submit"
                                disabled={loading}
                            >
                                {loading
                                    ? "Sending code..."
                                    : "Send reset code"}

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

export default ForgotPassword;