import React, { useState } from "react";
import "./Signup.css";
import Heading from "./Heading";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { authActions } from "../../store";
import { ToastContainer, toast } from "react-toastify";
import {
    FiMail,
    FiLock,
    FiArrowRight
} from "react-icons/fi";

const Signin = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const [inputs, setInputs] = useState({
        email: "",
        password: "",
    });

    const [loading, setLoading] = useState(false);

    const change = (e) => {
        const { name, value } = e.target;

        setInputs((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const submit = async (e) => {
        e.preventDefault();

        if (!inputs.email.trim() || !inputs.password) {
            toast.error("Please enter your email and password.");
            return;
        }

        try {
            setLoading(true);

            const response = await axios.post(
                "http://localhost:1000/api/v1/signin",
                {
                    email: inputs.email.trim(),
                    password: inputs.password,
                }
            );

            const user = response.data?.others;
            const userId = user?._id;

            if (!userId || userId === "null" || userId === "undefined") {
                toast.error("User information was not returned. Please try again.");
                return;
            }

            const token = response.data?.token;

            if (!token) {
                toast.error("Authentication token was not received.");
                return;
            }

            sessionStorage.setItem("token", token);
            sessionStorage.setItem("id", userId);
            sessionStorage.setItem("username", user.username || "User");
            sessionStorage.setItem("email", user.email || inputs.email.trim());

            dispatch(
                authActions.login({
                    _id: userId,
                    username: user.username || "User",
                    email: user.email || inputs.email.trim()
                })
            );

            toast.success("Welcome back!");

            navigate("/todo");
        } catch (error) {
            const message =
                error.response?.data?.message ||
                "Unable to sign in. Please check your connection and try again.";

            console.error("Signin error:", {
                status: error.response?.status,
                message,
            });

            toast.error(message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="tf-auth-page">
            <ToastContainer position="top-right" autoClose={2500} />

            <div className="tf-auth-layout">

                <Heading
                    first="Welcome"
                    second="Back."
                    description="Your goals are waiting. Sign in and pick up right where you left off."
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
                            <span>WELCOME BACK</span>
                            <h2>Sign in to your account</h2>
                            <p>Enter your details to access your workspace.</p>
                        </div>

                        <form className="tf-auth-form" onSubmit={submit}>

                            <label htmlFor="signin-email">Email address</label>

                            <div className="tf-auth-input-wrap">
                                <FiMail />
                                <input
                                    id="signin-email"
                                    type="email"
                                    name="email"
                                    placeholder="you@example.com"
                                    autoComplete="email"
                                    value={inputs.email}
                                    onChange={change}
                                    required
                                />
                            </div>

                            <label htmlFor="signin-password">Password</label>

                            <div className="tf-auth-input-wrap">
                                <FiLock />
                                <input
                                    id="signin-password"
                                    type="password"
                                    name="password"
                                    placeholder="Enter your password"
                                    autoComplete="current-password"
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
                                {loading ? "Signing in..." : "Sign in"}
                                {!loading && <FiArrowRight />}
                            </button>

                        </form>

                        <div className="tf-auth-switch">
                            Don't have an account?
                            <Link to="/signup"> Create one</Link>
                        </div>

                        <div className="tf-auth-bottom-note">
                            Made for your next big thing.
                        </div>

                    </div>
                </section>

            </div>
        </main>
    );
};

export default Signin;