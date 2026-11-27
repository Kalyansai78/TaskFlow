import React from "react";
import { Link } from "react-router-dom";
import {
    FiArrowRight,
    FiCheckCircle,
    FiClock,
    FiTarget,
    FiCheck,
    FiPlus,
    FiCalendar
} from "react-icons/fi";

import "./Home.css";

const Home = () => {
    const isLoggedIn = Boolean(sessionStorage.getItem("id"));

    return (
        <main className="tf-home">

            {/* Hero Section */}
            <section className="tf-home-hero">

                <div className="tf-home-container">

                    <div className="tf-home-hero-grid">

                        {/* Hero Content */}
                        <div className="tf-home-content">

                            <div className="tf-home-label">
                                <span className="tf-home-label-dot"></span>
                                A BETTER WAY TO GET THINGS DONE
                            </div>

                            <h1>
                                Make room for
                                <span> what matters.</span>
                            </h1>

                            <p className="tf-home-description">
                                Bring clarity to your busy days. Organize your
                                tasks, track your progress, and turn your goals
                                into meaningful achievements with TaskFlow.
                            </p>

                            <div className="tf-home-actions">

                                <Link
                                    to={isLoggedIn ? "/dashboard" : "/signup"}
                                    className="tf-home-primary"
                                >
                                    {isLoggedIn ? "Go to dashboard" : "Get started"}
                                    <FiArrowRight />
                                </Link>

                                <Link
                                    to="/about"
                                    className="tf-home-secondary"
                                >
                                    Explore TaskFlow
                                </Link>

                            </div>

                            <div className="tf-home-trust">
                                <span><FiCheckCircle /> Simple to use</span>
                                <span><FiCheckCircle /> Stay organized</span>
                                <span><FiCheckCircle /> Track progress</span>
                            </div>

                        </div>

                        {/* Dashboard Preview */}
                        <div className="tf-home-visual">

                            <div className="tf-home-decoration tf-decoration-one"></div>
                            <div className="tf-home-decoration tf-decoration-two"></div>

                            <div className="tf-preview-card">

                                <div className="tf-preview-header">

                                    <div>
                                        <span className="tf-preview-eyebrow">
                                            YOUR WORKSPACE
                                        </span>
                                        <h3>Today's overview</h3>
                                    </div>

                                    <div className="tf-preview-avatar">T</div>

                                </div>

                                <div className="tf-preview-progress">

                                    <div className="tf-preview-progress-info">
                                        <span>Daily progress</span>
                                        <strong>75%</strong>
                                    </div>

                                    <div className="tf-preview-progress-track">
                                        <div className="tf-preview-progress-fill"></div>
                                    </div>

                                </div>

                                <div className="tf-preview-tasks-heading">
                                    <h4>Your tasks</h4>
                                    <span>Today</span>
                                </div>

                                <div className="tf-preview-task">
                                    <span className="tf-preview-check">
                                        <FiCheck />
                                    </span>

                                    <div>
                                        <strong>Plan your day</strong>
                                        <span>Start with a clear plan</span>
                                    </div>

                                    <span className="tf-preview-done">Done</span>
                                </div>

                                <div className="tf-preview-task">
                                    <span className="tf-preview-check">
                                        <FiCheck />
                                    </span>

                                    <div>
                                        <strong>Complete your project</strong>
                                        <span>Make steady progress</span>
                                    </div>

                                    <span className="tf-preview-done">Done</span>
                                </div>

                                <div className="tf-preview-task tf-preview-pending">
                                    <span className="tf-preview-empty"></span>

                                    <div>
                                        <strong>Learn something new</strong>
                                        <span>Keep growing every day</span>
                                    </div>

                                    <span className="tf-preview-pending-label">
                                        Next
                                    </span>
                                </div>

                                <div className="tf-preview-add">
                                    <FiPlus />
                                    Add another task
                                </div>

                            </div>

                            <div className="tf-floating-note">
                                <span><FiTarget /></span>
                                <div>
                                    <strong>Keep going!</strong>
                                    <small>You're making progress.</small>
                                </div>
                            </div>

                            <div className="tf-floating-date">
                                <FiCalendar />
                                Make today count
                            </div>

                        </div>

                    </div>

                </div>

            </section>

            {/* Features Section */}
            <section className="tf-home-features">

                <div className="tf-home-container">

                    <div className="tf-features-heading">
                        <span>THE TASKFLOW EXPERIENCE</span>
                        <h2>Everything you need to stay on track.</h2>
                        <p>
                            Less time feeling overwhelmed. More time making progress.
                        </p>
                    </div>

                    <div className="tf-feature-grid">

                        <article className="tf-feature-card">
                            <div className="tf-feature-icon">
                                <FiCheckCircle />
                            </div>

                            <h3>Stay organized</h3>

                            <p>
                                Keep your tasks and ideas in one simple,
                                organized workspace.
                            </p>
                        </article>

                        <article className="tf-feature-card">
                            <div className="tf-feature-icon tf-feature-icon-peach">
                                <FiClock />
                            </div>

                            <h3>Focus on what matters</h3>

                            <p>
                                Find your priorities and spend your time
                                on the things that count.
                            </p>
                        </article>

                        <article className="tf-feature-card">
                            <div className="tf-feature-icon tf-feature-icon-blue">
                                <FiTarget />
                            </div>

                            <h3>Celebrate progress</h3>

                            <p>
                                Track completed tasks and appreciate
                                every small achievement.
                            </p>
                        </article>

                    </div>

                </div>

            </section>

            {/* Final CTA */}
            <section className="tf-home-cta">

                <div className="tf-home-container">

                    <div className="tf-cta-content">
                        <span>YOUR NEXT CHAPTER STARTS HERE</span>

                        <h2>Small steps. Big results.</h2>

                        <p>
                            A little progress every day adds up to something
                            remarkable. Start organizing your day with TaskFlow.
                        </p>

                        <Link
                            to={isLoggedIn ? "/dashboard" : "/signup"}
                            className="tf-home-primary tf-cta-button"
                        >
                            {isLoggedIn ? "Open dashboard" : "Start your journey"}
                            <FiArrowRight />
                        </Link>
                    </div>

                </div>

            </section>

        </main>
    );
};

export default Home;