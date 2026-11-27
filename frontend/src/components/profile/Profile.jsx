import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import {
    FiUser,
    FiMail,
    FiShield,
    FiCalendar,
    FiRefreshCw,
    FiEdit2,
    FiSave,
    FiX
} from "react-icons/fi";

import { apiV1 } from "../../api/axios";
import { authActions } from "../../store";
import "./Profile.css";

const Profile = () => {
    const navigate = useNavigate();
    const dispatch = useDispatch();

    const [profile, setProfile] = useState(null);
    const [formData, setFormData] = useState({
        username: "",
        email: ""
    });

    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState({
        type: "",
        text: ""
    });

    // Fetch Profile
    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const response = await apiV1.get("/profile");

                const user = response.data.user;

                setProfile(user);
                setFormData({
                    username: user.username,
                    email: user.email
                });

            } catch (error) {
                console.error(
                    "Profile error:",
                    error.response?.data || error.message
                );

                if (error.response?.status === 401) {
                    sessionStorage.clear();
                    dispatch(authActions.logout());
                    navigate("/signin");
                }

            } finally {
                setLoading(false);
            }
        };

        fetchProfile();
    }, [dispatch, navigate]);

    // Handle Input Changes
    const handleChange = (e) => {
        const { name, value } = e.target;

        setFormData((previous) => ({
            ...previous,
            [name]: value
        }));

        setMessage({
            type: "",
            text: ""
        });
    };

    // Enable Edit Code
    const handleEdit = () => {
        setFormData({
            username: profile.username,
            email: profile.email
        });

        setMessage({
            type: "",
            text: ""
        });

        setEditing(true);
    };

    // Cancel Editing
    const handleCancel = () => {
        setFormData({
            username: profile.username,
            email: profile.email
        });

        setEditing(false);

        setMessage({
            type: "",
            text: ""
        });
    };

    // Save Profile
    const handleSubmit = async (e) => {
        e.preventDefault();

        const username = formData.username.trim();
        const email = formData.email.trim();

        if (!username || !email) {
            setMessage({
                type: "error",
                text: "Username and email are required."
            });
            return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!emailRegex.test(email)) {
            setMessage({
                type: "error",
                text: "Please enter a valid email address."
            });
            return;
        }

        try {
            setSaving(true);

            const response = await apiV1.put("/update-profile", {
                username,
                email
            });

            const updatedUser = response.data.user;

            // Update Local Profile
            setProfile(updatedUser);

            setFormData({
                username: updatedUser.username,
                email: updatedUser.email
            });

            // Update Session Storage
            sessionStorage.setItem(
                "id",
                updatedUser._id
            );

            sessionStorage.setItem(
                "username",
                updatedUser.username
            );

            sessionStorage.setItem(
                "email",
                updatedUser.email
            );

            // Update Redux So Navbar Re-Renders
            dispatch(
                authActions.login({
                    _id: updatedUser._id,
                    username: updatedUser.username,
                    email: updatedUser.email
                })
            );

            setEditing(false);

            setMessage({
                type: "success",
                text: "Your profile has been updated successfully!"
            });

        } catch (error) {
            console.error(
                "Update profile error:",
                error.response?.data || error.message
            );

            setMessage({
                type: "error",
                text:
                    error.response?.data?.message ||
                    "Unable to update profile. Please try again."
            });

        } finally {
            setSaving(false);
        }
    };

    // User Initials
    const initials = profile?.username
        ?.split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0].toUpperCase())
        .join("");

    // Loading State
    if (loading) {
        return (
            <div className="tf-profile-page">
                <div className="tf-profile-loading">
                    <FiRefreshCw className="tf-profile-spinner" />
                    <p>Loading your profile...</p>
                </div>
            </div>
        );
    }

    // Error State
    if (!profile) {
        return (
            <div className="tf-profile-page">
                <div className="tf-profile-error">
                    <h2>Unable to load profile</h2>
                    <p>Please try signing in again.</p>

                    <button onClick={() => navigate("/signin")}>
                        Sign in
                    </button>
                </div>
            </div>
        );
    }

    return (
        <main className="tf-profile-page">
            <div className="tf-profile-container">

                <section className="tf-profile-heading">
                    <span>ACCOUNT SETTINGS</span>
                    <h1>My Profile</h1>
                    <p>
                        Manage your personal information and account details.
                    </p>
                </section>

                <section className="tf-profile-card">

                    <div className="tf-profile-banner" />

                    {/* User Header */}
                    <div className="tf-profile-user">

                        <div className="tf-profile-avatar">
                            {initials || "U"}
                        </div>

                        <div className="tf-profile-user-details">
                            <h2>{profile.username}</h2>
                            <p>{profile.email}</p>
                        </div>

                        <span className="tf-profile-status">
                            <span />
                            Active account
                        </span>

                    </div>

                    <div className="tf-profile-divider" />

                    {/* Personal Information */}
                    <div className="tf-profile-section-heading">

                        <div>
                            <h3>Personal information</h3>
                            <p>
                                {editing
                                    ? "Update your registered account details."
                                    : "Your registered account details."}
                            </p>
                        </div>

                        {!editing && (
                            <button
                                className="tf-profile-edit-btn"
                                onClick={handleEdit}
                            >
                                <FiEdit2 />
                                Edit Profile
                            </button>
                        )}

                    </div>

                    {/* Notification */}
                    {message.text && (
                        <div className={`tf-profile-message ${message.type}`}>
                            {message.text}
                        </div>
                    )}

                    <form onSubmit={handleSubmit}>

                        <div className="tf-profile-info-grid">

                            {/* Username */}
                            <div className="tf-profile-info-item">

                                <span className="tf-profile-info-icon">
                                    <FiUser />
                                </span>

                                <div className="tf-profile-field">
                                    <label htmlFor="profile-username">
                                        Username
                                    </label>

                                    {editing ? (
                                        <input
                                            id="profile-username"
                                            type="text"
                                            name="username"
                                            value={formData.username}
                                            onChange={handleChange}
                                            placeholder="Enter username"
                                            required
                                        />
                                    ) : (
                                        <strong>{profile.username}</strong>
                                    )}
                                </div>

                            </div>

                            {/* Email */}
                            <div className="tf-profile-info-item">

                                <span className="tf-profile-info-icon">
                                    <FiMail />
                                </span>

                                <div className="tf-profile-field">
                                    <label htmlFor="profile-email">
                                        Email address
                                    </label>

                                    {editing ? (
                                        <input
                                            id="profile-email"
                                            type="email"
                                            name="email"
                                            value={formData.email}
                                            onChange={handleChange}
                                            placeholder="Enter email"
                                            required
                                        />
                                    ) : (
                                        <strong>{profile.email}</strong>
                                    )}
                                </div>

                            </div>

                            {/* Account Status */}
                            <div className="tf-profile-info-item">

                                <span className="tf-profile-info-icon">
                                    <FiShield />
                                </span>

                                <div>
                                    <label>Account status</label>
                                    <strong>Active</strong>
                                </div>

                            </div>

                            {/* Account ID */}
                            <div className="tf-profile-info-item">

                                <span className="tf-profile-info-icon">
                                    <FiCalendar />
                                </span>

                                <div>
                                    <label>Account ID</label>
                                    <strong className="tf-profile-id">
                                        {profile._id}
                                    </strong>
                                </div>

                            </div>

                        </div>

                        {/* Save And Cancel */}
                        {editing && (
                            <div className="tf-profile-form-actions">

                                <button
                                    type="button"
                                    className="tf-profile-cancel-btn"
                                    onClick={handleCancel}
                                    disabled={saving}
                                >
                                    <FiX />
                                    Cancel
                                </button>

                                <button
                                    type="submit"
                                    className="tf-profile-save-btn"
                                    disabled={saving}
                                >
                                    {saving ? (
                                        <>
                                            <FiRefreshCw className="tf-profile-spinner" />
                                            Saving...
                                        </>
                                    ) : (
                                        <>
                                            <FiSave />
                                            Save Changes
                                        </>
                                    )}
                                </button>

                            </div>
                        )}

                    </form>

                    <div className="tf-profile-footer">
                        <span>TaskFlow</span>
                        <span>Your personal productivity space.</span>
                    </div>

                </section>

            </div>
        </main>
    );
};

export default Profile;