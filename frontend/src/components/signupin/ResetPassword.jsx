import React, { useEffect, useRef, useState } from "react";
import "./Signup.css";
import Heading from "./Heading";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { apiV1 } from "../../api/axios";
import { ToastContainer, toast } from "react-toastify";
import { FiMail, FiShield, FiArrowRight } from "react-icons/fi";

const ResetPassword = () => {
    const location = useLocation();
    const navigate = useNavigate();

    const email = location.state?.email || "";

    const [otp, setOtp] = useState(["", "", "", "", "", ""]);
    const otpRefs = useRef([]);

    const [loading, setLoading] = useState(false);
    const [resendLoading, setResendLoading] = useState(false);
    const [countdown, setCountdown] = useState(60);

    useEffect(() => {
        if (!email) {
            navigate("/forgot-password", { replace: true });
        }
    }, [email, navigate]);

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

        if (digit.length > 1) {
            const digits = digit.slice(0, 6).split("");

            digits.forEach((item, i) => {
                updatedOtp[i] = item;
            });

            setOtp(updatedOtp);

            otpRefs.current[Math.min(digits.length, 5)]?.focus();
            return;
        }

        updatedOtp[index] = digit;
        setOtp(updatedOtp);

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
        if (countdown > 0 || resendLoading || !email) return;

        try {
            setResendLoading(true);

            const response = await apiV1.post("/forgot-password",
                { email }
            );

            setOtp(["", "", "", "", "", ""]);
            otpRefs.current[0]?.focus();
            setCountdown(60);

            toast.success(response.data.message);

        } catch (error) {
            toast.error(
                error.response?.data?.message ||
                "Unable to resend the reset code."
            );
        } finally {
            setResendLoading(false);
        }
    };

    const submit = async (e) => {
        e.preventDefault();

        const enteredOtp = otp.join("");

        if (enteredOtp.length !== 6) {
            toast.error("Please enter all six digits of the reset code.");
            return;
        }

        try {
            setLoading(true);

            const response = await apiV1.post("/verify-password-reset-otp",
                {
                    email,
                    otp: enteredOtp
                }
            );

            toast.success(
                response.data.message || "OTP verified successfully!"
            );

            navigate("/set-new-password", {
                state: {
                    email,
                    otp: enteredOtp
                }
            });

        } catch (error) {
            toast.error(
                error.response?.data?.message ||
                "OTP verification failed. Please try again."
            );
        } finally {
            setLoading(false);
        }
    };

    if (!email) return null;

    return (
        <main className="tf-auth-page">
            <ToastContainer position="top-right" autoClose={2500} />

            <div className="tf-auth-layout">

                <Heading
                    first="Verify"
                    second="Code."
                    description="Enter the code we sent to your email to continue resetting your password."
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
                            <span>PASSWORD RECOVERY</span>
                            <h2>Verify your email</h2>
                            <p>
                                Enter the six-digit password reset code
                                sent to your email address.
                            </p>
                        </div>

                        <form className="tf-auth-form" onSubmit={submit}>

                            <label>Email address</label>

                            <div className="tf-auth-input-wrap">
                                <FiMail />
                                <input
                                    type="email"
                                    value={email}
                                    readOnly
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
                                        autoComplete={
                                            index === 0
                                                ? "one-time-code"
                                                : "off"
                                        }
                                        maxLength="1"
                                        value={digit}
                                        onChange={(e) =>
                                            handleOtpChange(
                                                e.target.value,
                                                index
                                            )
                                        }
                                        onKeyDown={(e) =>
                                            handleOtpKeyDown(e, index)
                                        }
                                        className="tf-otp-input"
                                        aria-label={`Reset code digit ${index + 1}`}
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
                                            {resendLoading
                                                ? "Sending..."
                                                : "Resend OTP"}
                                        </button>
                                    </p>
                                )}
                            </div>

                            <button
                                className="tf-auth-submit"
                                type="submit"
                                disabled={loading}
                            >
                                {loading ? "Verifying..." : "Verify OTP"}
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

export default ResetPassword;