import React, { useEffect, useRef, useState } from "react";
import "./Signup.css";
import Heading from "./Heading";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { apiV1 } from "../../api/axios";
import { toast } from "react-toastify";
import { FiMail, FiShield, FiArrowRight } from "react-icons/fi";
import { useDispatch } from "react-redux";
import { authActions } from "../../store";

const VerifyEmail = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const dispatch = useDispatch();

    const [email, setEmail] = useState(
        location.state?.email || ""
    );

    const [otp, setOtp] = useState(["", "", "", "", "", ""]);
    const otpRefs = useRef([]);
    const [loading, setLoading] = useState(false);
    const [resendLoading, setResendLoading] = useState(false);
    const [countdown, setCountdown] = useState(60);

    useEffect(() => {
        if (countdown <= 0) return;

        const timer = setTimeout(() => {
            setCountdown((previous) => previous - 1);
        }, 1000);

        return () => clearTimeout(timer);
    }, [countdown]);

    const handleOtpChange = (value, index) => {
        const digit = value.replace(/\D/g, "");

        if (!digit) {
            const updatedOtp = [...otp];
            updatedOtp[index] = "";
            setOtp(updatedOtp);
            return;
        }

        const updatedOtp = [...otp];

        // Support Pasting The Complete OTP

        if (digit.length > 1) {
            const digits = digit.slice(0, 6).split("");

            digits.forEach((item, i) => {
                if (i < 6) updatedOtp[i] = item;
            });

            setOtp(updatedOtp);

            const nextIndex = Math.min(digits.length, 5);
            otpRefs.current[nextIndex]?.focus();
            return;
        }

        updatedOtp[index] = digit;
        setOtp(updatedOtp);

        // Automatically Focus The Next Box

        if (index < 5) {
            otpRefs.current[index + 1]?.focus();
        }
    };

    const handleOtpKeyDown = (e, index) => {
        if (e.key === "Backspace" && !otp[index] && index > 0) {
            otpRefs.current[index - 1]?.focus();
        }

        if (e.key === "ArrowLeft" && index > 0) {
            otpRefs.current[index - 1]?.focus();
        }

        if (e.key === "ArrowRight" && index < 5) {
            otpRefs.current[index + 1]?.focus();
        }
    };

    const resendOtp = async () => {
        if (countdown > 0 || resendLoading) return;

        try {
            setResendLoading(true);

            const response = await apiV1.post("/resend-verification",
                {
                    email: email.trim()
                }
            );

            setOtp(["", "", "", "", "", ""]);
            otpRefs.current[0]?.focus();

            setCountdown(60);

            toast.success(
                response.data.message || "A new OTP has been sent!"
            );

        } catch (error) {
            const remainingSeconds =
                error.response?.data?.remainingSeconds;

            if (remainingSeconds) {
                setCountdown(remainingSeconds);
            }

            toast.error(
                error.response?.data?.message ||
                "Unable to resend OTP. Please try again."
            );

        } finally {
            setResendLoading(false);
        }
    };

    const submit = async (e) => {
        e.preventDefault();

        const enteredOtp = otp.join("");

        if (!email.trim() || enteredOtp.length !== 6) {
            toast.error("Please enter all six digits of the verification code.");
            return;
        }

        try {
            setLoading(true);

            const response = await apiV1.post("/verify-email",
                {
                    email: email.trim(),
                    otp: enteredOtp
                }
            );

            const user = response.data?.others;
            const token = response.data?.token;

            if (!user?._id || !token) {
                toast.error("Verification succeeded, but login information was not received. Please sign in.");
                return;
            }

            // Save Authentication Details

            sessionStorage.setItem("token", token);
            sessionStorage.setItem("id", user._id);
            sessionStorage.setItem("username", user.username || "User");
            sessionStorage.setItem("email", user.email || email);

            // Update Redux Authentication State

            dispatch(
                authActions.login({
                    _id: user._id,
                    username: user.username || "User",
                    email: user.email || email
                })
            );

            toast.success("Welcome to TaskFlow! Your account is ready.");

            setTimeout(() => {
                navigate("/dashboard");
            }, 1200);

        } catch (error) {
            toast.error(
                error.response?.data?.message ||
                "Email verification failed. Please try again."
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="tf-auth-page">

            <div className="tf-auth-layout">

                <Heading
                    first="Verify"
                    second="Email."
                    description="One quick step to secure your TaskFlow account and get started."
                />

                <section className="tf-auth-form-section">
                    <div className="tf-auth-form-wrapper">

                        <div className="tf-auth-mobile-brand">
                            <span className="tf-auth-aside-logo">
                                <FiShield />
                            </span>
                            TaskFlow
                        </div>

                        <div className="tf-auth-heading">
                            <span>EMAIL VERIFICATION</span>
                            <h2>Check your inbox</h2>
                            <p>
                                Enter the six-digit verification code
                                sent to your email address.
                            </p>
                        </div>

                        <form className="tf-auth-form" onSubmit={submit}>

                            <label htmlFor="verify-email">
                                Email address
                            </label>

                            <div className="tf-auth-input-wrap">
                                <FiMail />
                                <input
                                    type="email"
                                    value={email}
                                    readOnly
                                    placeholder="Enter your email"
                                />
                            </div>

                            <label>Verification code</label>

                            <div className="tf-otp-container">
                                {otp.map((digit, index) => (
                                    <input
                                        key={index}
                                        ref={(element) => {
                                            otpRefs.current[index] = element;
                                        }}
                                        type="text"
                                        inputMode="numeric"
                                        autoComplete={index === 0 ? "one-time-code" : "off"}
                                        maxLength="1"
                                        value={digit}
                                        onChange={(e) =>
                                            handleOtpChange(e.target.value, index)
                                        }
                                        onKeyDown={(e) =>
                                            handleOtpKeyDown(e, index)
                                        }
                                        className="tf-otp-input"
                                        aria-label={`Verification digit ${index + 1}`}
                                    />
                                ))}
                            </div>

                            <div className="tf-resend-section">
                                {countdown > 0 ? (
                                    <p>
                                        Didn't receive the code? Resend in{" "}
                                        <span>{countdown}s</span>
                                    </p>
                                ) : (
                                    <p>
                                        Didn't receive the code?{" "}
                                        <button
                                            type="button"
                                            onClick={resendOtp}
                                            disabled={resendLoading || loading}
                                        >
                                            {resendLoading ? "Sending..." : "Resend OTP"}
                                        </button>
                                    </p>
                                )}
                            </div>

                            <button
                                className="tf-auth-submit"
                                type="submit"
                                disabled={loading}
                            >
                                {loading ? "Verifying..." : "Verify email"}
                                {!loading && <FiArrowRight />}
                            </button>

                        </form>

                        <div className="tf-auth-switch">
                            Already verified?
                            <Link to="/signin"> Sign in</Link>
                        </div>

                        <div className="tf-auth-bottom-note">
                            Your TaskFlow journey is almost ready.
                        </div>

                    </div>
                </section>

            </div>
        </main>
    );
};

export default VerifyEmail;