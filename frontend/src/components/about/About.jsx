import React from "react";
import { Link } from "react-router-dom";
import {
    FiCheckCircle,
    FiTarget,
    FiTrendingUp,
    FiSearch,
    FiEdit3,
    FiBarChart2,
    FiArrowRight,
    FiHeart
} from "react-icons/fi";

import "./About.css";

const features = [
    {
        icon: <FiEdit3 />,
        title: "Easy task management",
        description:
            "Create, edit, and delete tasks effortlessly. Keep all your important activities organized in one place."
    },
    {
        icon: <FiCheckCircle />,
        title: "Track your progress",
        description:
            "Mark tasks as completed and pending. See how much you've accomplished throughout your day."
    },
    {
        icon: <FiSearch />,
        title: "Find tasks quickly",
        description:
            "Search through your tasks and use filters to find exactly what you're looking for."
    },
    {
        icon: <FiBarChart2 />,
        title: "Understand your productivity",
        description:
            "Get a clear overview of your total tasks, completed tasks, pending tasks, and productivity."
    }
];

const About = () => {
    const isLoggedIn = Boolean(sessionStorage.getItem("id"));

    return (
        <main className="tf-about">

            {/* HERO */}
            <section className="tf-about-hero">
                <div className="tf-about-container">

                    <div className="tf-about-hero-content">
                        <span className="tf-about-eyebrow">
                            <FiHeart /> GET TO KNOW TASKFLOW
                        </span>

                        <h1>
                            A simpler way to
                            <span> make things happen.</span>
                        </h1>

                        <p>
                            TaskFlow is your personal space to organize tasks,
                            stay focused, and celebrate every little achievement.
                            Because meaningful progress starts with small steps.
                        </p>

                        <Link
                            to={isLoggedIn ? "/todo" : "/signup"}
                            className="tf-about-primary"
                        >
                            {isLoggedIn ? "Explore dashboard" : "Get started"}
                            <FiArrowRight />
                        </Link>
                    </div>

                    <div className="tf-about-hero-visual">
                        <div className="tf-about-circle tf-about-circle-one"></div>
                        <div className="tf-about-circle tf-about-circle-two"></div>

                        <div className="tf-about-quote-card">
                            <div className="tf-about-quote-icon">
                                <FiTarget />
                            </div>

                            <span>OUR PHILOSOPHY</span>

                            <h2>
                                Progress isn't about doing everything.
                                It's about doing what matters.
                            </h2>

                            <div className="tf-about-quote-line"></div>

                            <p>One task. One step. One achievement at a time.</p>
                        </div>

                        <div className="tf-about-floating">
                            <FiCheckCircle />
                            <div>
                                <strong>Keep moving forward</strong>
                                <span>Every step counts</span>
                            </div>
                        </div>
                    </div>

                </div>
            </section>

            {/* MISSION */}
            <section className="tf-about-mission">
                <div className="tf-about-container tf-about-mission-grid">

                    <div className="tf-about-mission-heading">
                        <span>WHY TASKFLOW?</span>
                        <h2>
                            Less chaos.
                            <span> More clarity.</span>
                        </h2>
                    </div>

                    <div className="tf-about-mission-copy">
                        <p>
                            We believe staying organized shouldn't be complicated.
                            When everyday responsibilities pile up, it's easy to
                            lose track of what matters.
                        </p>

                        <p>
                            That's why TaskFlow brings your tasks into one simple
                            workspace. Whether you're studying, working on a
                            project, or managing everyday activities, TaskFlow
                            helps you stay on top of your plans.
                        </p>
                    </div>

                </div>
            </section>

            {/* FEATURES */}
            <section className="tf-about-features">
                <div className="tf-about-container">

                    <div className="tf-about-section-heading">
                        <span>WHAT YOU CAN DO</span>
                        <h2>Everything in one simple workspace.</h2>
                        <p>
                            Useful tools designed to make your everyday task
                            management easier.
                        </p>
                    </div>

                    <div className="tf-about-feature-grid">
                        {features.map((feature, index) => (
                            <article
                                className="tf-about-feature-card"
                                key={feature.title}
                                style={{ animationDelay: `${index * 0.1}s` }}
                            >
                                <div className="tf-about-feature-icon">
                                    {feature.icon}
                                </div>

                                <h3>{feature.title}</h3>

                                <p>{feature.description}</p>
                            </article>
                        ))}
                    </div>

                </div>
            </section>

            {/* VALUES */}
            <section className="tf-about-values">
                <div className="tf-about-container">

                    <div className="tf-about-values-content">
                        <div className="tf-about-values-icon">
                            <FiTrendingUp />
                        </div>

                        <span>OUR APPROACH</span>

                        <h2>
                            Built around your everyday progress.
                        </h2>

                        <p>
                            We value simplicity, clarity, and a comfortable
                            experience. TaskFlow is designed to help you focus
                            on your work instead of spending time managing your
                            tools.
                        </p>

                        <div className="tf-about-value-points">
                            <div><FiCheckCircle /> Simple and intuitive</div>
                            <div><FiCheckCircle /> Clean and organized</div>
                            <div><FiCheckCircle /> Focused on progress</div>
                        </div>
                    </div>

                </div>
            </section>

            {/* FINAL CTA */}
            <section className="tf-about-cta">
                <div className="tf-about-container">

                    <span>YOUR NEXT STEP STARTS HERE</span>

                    <h2>Make every little step count.</h2>

                    <p>
                        Start organizing your tasks and turn your plans
                        into progress with TaskFlow.
                    </p>

                    <Link
                        to={isLoggedIn ? "/todo" : "/signup"}
                        className="tf-about-primary"
                    >
                        {isLoggedIn ? "Go to dashboard" : "Start your journey"}
                        <FiArrowRight />
                    </Link>

                </div>
            </section>

        </main>
    );
};

export default About;