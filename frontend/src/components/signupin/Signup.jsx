import React, { useState } from "react";
import "./Signup.css";
import Heading from "./Heading";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import {
    FiMail,
    FiUser,
    FiLock,
    FiArrowRight
} from "react-icons/fi";

const Signup = () => {
    const navigate = useNavigate();

    const [inputs, setInputs] = useState({
        email: "",
        username: "",
        password: "",
    });

    const [loading, setLoading] = useState(false);

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

        try {
            setLoading(true);

            const response = await axios.post(
                "http://localhost:1000/api/v1/register",
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

            navigate("/signin");

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
            <ToastContainer position="top-right" autoClose={2500} />

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
                                    type="password"
                                    name="password"
                                    placeholder="Create a password"
                                    autoComplete="new-password"
                                    value={inputs.password}
                                    onChange={change}
                                    required
                                />
                            </div>

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