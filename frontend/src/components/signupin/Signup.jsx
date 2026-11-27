import React, { useState } from "react";
import "./Signup.css";
import Heading from "./Heading";
import { Link, useNavigate } from "react-router-dom";
import { apiV1 } from "../../api/axios";
import { toast } from "react-toastify";
import {
    FiMail,
    FiUser,
    FiLock,
    FiArrowRight,
    FiEye,
    FiEyeOff
} from "react-icons/fi";

const Signup = () => {
    const navigate = useNavigate();

    const [inputs, setInputs] = useState({
        email: "",
        username: "",
        password: "",
    });

    const [loading, setLoading] = useState(false);

    const [confirmPassword, setConfirmPassword] = useState("");

    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const change = (e) => {
        const { name, value } = e.target;

        setInputs((previous) => ({
            ...previous,
            [name]: value,
        }));
    };

    const submit = async (e) => {
        e.preventDefault();

        if (
            !inputs.email.trim() ||
            !inputs.username.trim() ||
            !inputs.password
        ) {
            toast.error("Please fill in all fields.");
            return;
        }

        if (inputs.password.length < 6) {
            toast.error("Password must be at least 6 characters.");
            return;
        }

        if (inputs.password !== confirmPassword) {
            toast.error("Passwords do not match.");
            return;
        }

        try {
            setLoading(true);

            const response = await apiV1.post("/register",
                {
                    email: inputs.email.trim(),
                    username: inputs.username.trim(),
                    password: inputs.password,
                }
            );

            toast.success(
                response.data.message || "Account created successfully!"
            );

            setInputs({
                email: "",
                username: "",
                password: "",
                
            });

            setConfirmPassword("");
            setShowPassword(false);
            setShowConfirmPassword(false);

            navigate("/verify-email", {
                state: { email: response.data.email }
            });

        } catch (error) {
            console.error(
                "Signup error:",
                error.response?.data || error.message
            );

            if (error.response?.status === 409) {
                toast.error(
                    error.response?.data?.message ||
                    "Email or username already exists."
                );
            } else if (error.response?.status === 400) {
                toast.error(
                    error.response?.data?.message ||
                    "Please check the information you entered."
                );
            } else {
                toast.error(
                    error.response?.data?.message ||
                    "Registration failed. Please try again."
                );
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="tf-auth-page">

            <div className="tf-auth-layout">

                <Heading
                    first="Start"
                    second="Fresh."
                    description="Create your personal workspace and take the first step towards a more organized, productive day."
                />

                <section className="tf-auth-form-section">
                    <div className="tf-auth-form-wrapper">

                        <div className="tf-auth-mobile-brand">
                            <span className="tf-auth-aside-logo">
                                <FiUser />
                            </span>
                            TaskFlow
                        </div>

                        <div className="tf-auth-heading">
                            <span>GET STARTED</span>
                            <h2>Create your account</h2>
                            <p>A few details and your workspace is ready.</p>
                        </div>

                        <form className="tf-auth-form" onSubmit={submit}>

                            <label htmlFor="signup-username">Your name</label>

                            <div className="tf-auth-input-wrap">
                                <FiUser />
                                <input
                                    id="signup-username"
                                    type="text"
                                    name="username"
                                    placeholder="Enter your name"
                                    autoComplete="username"
                                    value={inputs.username}
                                    onChange={change}
                                    required
                                />
                            </div>

                            <label htmlFor="signup-email">Email address</label>

                            <div className="tf-auth-input-wrap">
                                <FiMail />
                                <input
                                    id="signup-email"
                                    type="email"
                                    name="email"
                                    placeholder="you@example.com"
                                    autoComplete="email"
                                    value={inputs.email}
                                    onChange={change}
                                    required
                                />
                            </div>
                            
                            <label htmlFor="signup-password">Password</label>

                            <div className="tf-auth-input-wrap">
                                <FiLock />

                                <input
                                    id="signup-password"
                                    type={showPassword ? "text" : "password"}
                                    name="password"
                                    placeholder="Create a password"
                                    autoComplete="new-password"
                                    value={inputs.password}
                                    onChange={change}
                                    required
                                />

                                <button
                                    type="button"
                                    className="tf-password-toggle"
                                    onClick={() => setShowPassword(!showPassword)}
                                    aria-label={showPassword ? "Hide password" : "Show password"}
                                >
                                    {showPassword ? <FiEyeOff /> : <FiEye />}
                                </button>
                            </div>

                            <label htmlFor="confirm-password">Confirm password</label>

                            <div className="tf-auth-input-wrap">
                                <FiLock />

                                <input
                                    id="confirm-password"
                                    type={showConfirmPassword ? "text" : "password"}
                                    placeholder="Re-enter your password"
                                    autoComplete="new-password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    required
                                />

                                <button
                                    type="button"
                                    className="tf-password-toggle"
                                    onClick={() =>
                                        setShowConfirmPassword(!showConfirmPassword)
                                    }
                                    aria-label={
                                        showConfirmPassword
                                            ? "Hide confirm password"
                                            : "Show confirm password"
                                    }
                                >
                                    {showConfirmPassword ? <FiEyeOff /> : <FiEye />}
                                </button>
                            </div>

                            {confirmPassword && (
                                <div
                                    className={
                                        inputs.password === confirmPassword
                                            ? "tf-password-match success"
                                            : "tf-password-match error"
                                    }
                                >
                                    {inputs.password === confirmPassword
                                        ? "✓ Passwords match"
                                        : "✕ Passwords do not match"}
                                </div>
                            )}

                            <button
                                className="tf-auth-submit"
                                type="submit"
                                disabled={loading}
                            >
                                {loading ? "Creating account..." : "Create account"}
                                {!loading && <FiArrowRight />}
                            </button>

                        </form>

                        <div className="tf-auth-switch">
                            Already have an account?
                            <Link to="/signin"> Sign in</Link>
                        </div>

                        <div className="tf-auth-bottom-note">
                            Your journey starts with one small step.
                        </div>

                    </div>
                </section>

            </div>
        </main>
    );
};

export default Signup;