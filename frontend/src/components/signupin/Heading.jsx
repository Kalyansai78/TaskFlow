import React from "react";
import { FiCheckCircle, FiTarget, FiTrendingUp } from "react-icons/fi";

const Heading = ({ first, second, description }) => {
    return (
        <div className="tf-auth-aside">
            <div className="tf-auth-aside-content">
                <div className="tf-auth-aside-brand">
                    <span className="tf-auth-aside-logo">
                        <FiCheckCircle />
                    </span>
                    <span>Task<span>Flow</span></span>
                </div>

                <div className="tf-auth-aside-main">
                    <div className="tf-auth-aside-icon">
                        <FiTarget />
                    </div>

                    <span className="tf-auth-eyebrow">
                        YOUR PRODUCTIVITY PARTNER
                    </span>

                    <h1>{first} <span>{second}</span></h1>

                    <p>
                        {description ||
                            "Make every day count. Organize your thoughts, manage your tasks, and celebrate your progress."}
                    </p>

                    <div className="tf-auth-benefits">
                        <div>
                            <FiCheckCircle />
                            <span>Everything in one place</span>
                        </div>
                        <div>
                            <FiTrendingUp />
                            <span>Progress at your own pace</span>
                        </div>
                    </div>
                </div>

                <div className="tf-auth-aside-footer">
                    Small steps. Big results.
                </div>
            </div>
        </div>
    );
};

export default Heading;