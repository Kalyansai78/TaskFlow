import React, { useState, useEffect } from "react";
import {
    FiLock,
    FiBell,
    FiMoon,
    FiUser,
    FiTrash2,
    FiChevronRight,
    FiEye,
    FiEyeOff,
    FiSave
} from "react-icons/fi";

import { apiV1 } from "../../api/axios";
import "./Settings.css";

import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { FiLogOut } from "react-icons/fi";
import { authActions } from "../../store";

const Settings = () => {
    const [activeSection, setActiveSection] = useState("security");

    const [passwordData, setPasswordData] = useState({
        currentPassword: "",
        newPassword: "",
        confirmPassword: ""
    });

    const [showPasswords, setShowPasswords] = useState({
        current: false,
        new: false,
        confirm: false
    });

    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState({
        type: "",
        text: ""
    });

    const [notificationPreferences, setNotificationPreferences] = useState({
        task_due_soon: true,
        task_overdue: true,
        task_completed: true,
        task_reminder: true
    });

    const [notificationLoading, setNotificationLoading] = useState(false);
    const [notificationSaving, setNotificationSaving] = useState(false);
    const [notificationMessage, setNotificationMessage] = useState({
        type: "",
        text: ""
    });

    const [emailNotificationPreferences, setEmailNotificationPreferences] = useState({
        enabled: true,
        task_due_soon: true,
        task_overdue: true,
        task_reminder: true
    });

    const [emailNotificationLoading, setEmailNotificationLoading] = useState(false);
    const [emailNotificationSaving, setEmailNotificationSaving] = useState(false);

    const [emailNotificationMessage, setEmailNotificationMessage] = useState({
        type: "",
        text: ""
    });

    const [theme, setTheme] = useState("light");
    const [themeLoading, setThemeLoading] = useState(false);
    const [themeSaving, setThemeSaving] = useState(false);

    const [themeMessage, setThemeMessage] = useState({
        type: "",
        text: ""
    });

    // Account Information
    const [accountInfo, setAccountInfo] = useState(null);
    const [accountLoading, setAccountLoading] = useState(false);
    const [accountMessage, setAccountMessage] = useState({
        type: "",
        text: ""
    });

    // Delete Account
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deletePassword, setDeletePassword] = useState("");
    const [deleteConfirmed, setDeleteConfirmed] = useState(false);
    const [deleteLoading, setDeleteLoading] = useState(false);
    const [deleteMessage, setDeleteMessage] = useState("");

    const dispatch = useDispatch();
    const navigate = useNavigate();

    const handleLogout = () => {
        sessionStorage.removeItem("token");
        sessionStorage.removeItem("id");
        sessionStorage.removeItem("username");
        sessionStorage.removeItem("email");

        dispatch(authActions.logout());

        navigate("/signin");
    };

    const handleDeleteAccount = async (e) => {
        e.preventDefault();

        if (!deletePassword.trim()) {
            setDeleteMessage("Please enter your current password.");
            return;
        }

        if (!deleteConfirmed) {
            setDeleteMessage("Please confirm that you understand this action is permanent.");
            return;
        }

        try {
            setDeleteLoading(true);
            setDeleteMessage("");

            const response = await apiV1.post("/delete-account", {
                currentPassword: deletePassword
            });

            // Clear Local Authentication Data
            sessionStorage.removeItem("token");
            sessionStorage.removeItem("id");
            sessionStorage.removeItem("username");
            sessionStorage.removeItem("email");

            // Update Redux Authentication State
            dispatch(authActions.logout());

            // Redirect To Sign In
            navigate("/signin", {
                replace: true,
                state: {
                    message: response.data.message
                }
            });

        } catch (error) {
            setDeleteMessage(
                error.response?.data?.message ||
                "Unable to delete your account. Please try again."
            );
        } finally {
            setDeleteLoading(false);
        }
    };

    useEffect(() => {
        if (activeSection !== "notifications") return;

        const fetchNotificationPreferences = async () => {
            try {
                setNotificationLoading(true);
                setNotificationMessage({ type: "", text: "" });

                const response = await apiV1.get("/notification-preferences");

                setNotificationPreferences((previous) => ({
                    ...previous,
                    ...response.data.notificationPreferences
                }));

            } catch (error) {
                setNotificationMessage({
                    type: "error",
                    text: error.response?.data?.message ||
                        "Unable to load notification preferences."
                });

            } finally {
                setNotificationLoading(false);
            }
        };

        fetchNotificationPreferences();
    }, [activeSection]);

    // Fetch Email Notification Preferences
    useEffect(() => {
        if (activeSection !== "notifications") return;

        const fetchEmailNotificationPreferences = async () => {
            try {
                setEmailNotificationLoading(true);
                setEmailNotificationMessage({ type: "", text: "" });

                const response = await apiV1.get("/email-notification-preferences");

                setEmailNotificationPreferences((previous) => ({
                    ...previous,
                    ...response.data.emailNotificationPreferences
                }));

            } catch (error) {
                setEmailNotificationMessage({
                    type: "error",
                    text: error.response?.data?.message ||
                        "Unable to load email notification preferences."
                });

            } finally {
                setEmailNotificationLoading(false);
            }
        };

        fetchEmailNotificationPreferences();
    }, [activeSection]);

    useEffect(() => {
        if (activeSection !== "appearance") return;

        const fetchAppearance = async () => {
            try {
                setThemeLoading(true);
                setThemeMessage({ type: "", text: "" });

                const response = await apiV1.get("/appearance");

                setTheme(response.data.appearance?.theme || "light");

            } catch (error) {
                setThemeMessage({
                    type: "error",
                    text: error.response?.data?.message ||
                        "Unable to load appearance settings."
                });

            } finally {
                setThemeLoading(false);
            }
        };

        fetchAppearance();
    }, [activeSection]);

    // Fetch Account Information
    useEffect(() => {
        if (activeSection !== "account") return;

        const fetchAccountInfo = async () => {
            try {
                setAccountLoading(true);
                setAccountMessage({ type: "", text: "" });

                const response = await apiV1.get("/profile");

                setAccountInfo(response.data.user);

            } catch (error) {
                setAccountMessage({
                    type: "error",
                    text: error.response?.data?.message ||
                        "Unable to load account information."
                });

            } finally {
                setAccountLoading(false);
            }
        };

        fetchAccountInfo();
    }, [activeSection]);

    const settingsSections = [
        {
            id: "security",
            title: "Security",
            description: "Manage your password and account security.",
            icon: <FiLock />
        },
        {
            id: "notifications",
            title: "Notifications",
            description: "Control your notification preferences.",
            icon: <FiBell />
        },
        {
            id: "appearance",
            title: "Appearance",
            description: "Customize how TaskFlow looks.",
            icon: <FiMoon />
        },
        {
            id: "account",
            title: "Account Management",
            description: "Manage your account and personal data.",
            icon: <FiUser />
        }
    ];

    const handlePasswordChange = (e) => {
        const { name, value } = e.target;

        setPasswordData((previous) => ({
            ...previous,
            [name]: value
        }));

        setMessage({ type: "", text: "" });
    };

    const handleNotificationToggle = (name) => {
        setNotificationPreferences((previous) => ({
            ...previous,
            [name]: !previous[name]
        }));

        setNotificationMessage({ type: "", text: "" });
    };

    const handleSaveNotifications = async () => {
        try {
            setNotificationSaving(true);
            setNotificationMessage({ type: "", text: "" });

            const response = await apiV1.put(
                "/notification-preferences",
                notificationPreferences
            );

            setNotificationPreferences(response.data.notificationPreferences);

            setNotificationMessage({
                type: "success",
                text: response.data.message ||
                    "Notification preferences saved successfully."
            });

        } catch (error) {
            setNotificationMessage({
                type: "error",
                text: error.response?.data?.message ||
                    "Unable to save notification preferences."
            });

        } finally {
            setNotificationSaving(false);
        }
    };

    const handleEmailNotificationToggle = (name) => {
        setEmailNotificationPreferences((previous) => ({
            ...previous,
            [name]: !previous[name]
        }));

        setEmailNotificationMessage({ type: "", text: "" });
    };

    const handleSaveEmailNotifications = async () => {
        try {
            setEmailNotificationSaving(true);
            setEmailNotificationMessage({ type: "", text: "" });

            const response = await apiV1.put(
                "/email-notification-preferences",
                emailNotificationPreferences
            );

            setEmailNotificationPreferences(
                response.data.emailNotificationPreferences
            );

            setEmailNotificationMessage({
                type: "success",
                text: response.data.message ||
                    "Email notification preferences saved successfully."
            });

        } catch (error) {
            setEmailNotificationMessage({
                type: "error",
                text: error.response?.data?.message ||
                    "Unable to save email notification preferences."
            });

        } finally {
            setEmailNotificationSaving(false);
        }
    };

    const handleSaveAppearance = async () => {
        try {
            setThemeSaving(true);
            setThemeMessage({ type: "", text: "" });

            const response = await apiV1.put("/appearance", { theme });

            setTheme(response.data.appearance.theme);

            window.dispatchEvent(
                new CustomEvent("themeChanged", {
                    detail: response.data.appearance.theme
                })
            );

            setThemeMessage({
                type: "success",
                text: response.data.message ||
                    "Appearance preference saved successfully."
            });

        } catch (error) {
            setThemeMessage({
                type: "error",
                text: error.response?.data?.message ||
                    "Unable to save appearance preference."
            });

        } finally {
            setThemeSaving(false);
        }
    };

    const togglePasswordVisibility = (field) => {
        setShowPasswords((previous) => ({
            ...previous,
            [field]: !previous[field]
        }));
    };

    const handleChangePassword = async (e) => {
        e.preventDefault();

        const {
            currentPassword,
            newPassword,
            confirmPassword
        } = passwordData;

        if (!currentPassword || !newPassword || !confirmPassword) {
            setMessage({
                type: "error",
                text: "Please fill in all password fields."
            });
            return;
        }

        if (newPassword.length < 6) {
            setMessage({
                type: "error",
                text: "New password must be at least 6 characters."
            });
            return;
        }

        if (newPassword !== confirmPassword) {
            setMessage({
                type: "error",
                text: "New password and confirm password do not match."
            });
            return;
        }

        try {
            setSaving(true);

            const response = await apiV1.put("/change-password", {
                currentPassword,
                newPassword
            });

            setMessage({
                type: "success",
                text: response.data.message ||
                    "Password changed successfully."
            });

            setPasswordData({
                currentPassword: "",
                newPassword: "",
                confirmPassword: ""
            });

        } catch (error) {
            setMessage({
                type: "error",
                text: error.response?.data?.message ||
                    "Unable to change password. Please try again."
            });

        } finally {
            setSaving(false);
        }
    };

    const renderPasswordField = (label, name, visibilityKey) => (
        <div className="tf-settings-password-field">
            <label htmlFor={name}>{label}</label>

            <div className="tf-settings-password-input">
                <input
                    id={name}
                    type={showPasswords[visibilityKey] ? "text" : "password"}
                    name={name}
                    value={passwordData[name]}
                    onChange={handlePasswordChange}
                    placeholder={`Enter ${label.toLowerCase()}`}
                    autoComplete="off"
                    required
                />

                <button
                    type="button"
                    onClick={() => togglePasswordVisibility(visibilityKey)}
                    aria-label={
                        showPasswords[visibilityKey]
                            ? "Hide password"
                            : "Show password"
                    }
                >
                    {showPasswords[visibilityKey] ? <FiEyeOff /> : <FiEye />}
                </button>
            </div>
        </div>
    );

    return (
        <main className="tf-settings-page">
            <div className="tf-settings-container">

                <section className="tf-settings-heading">
                    <span>ACCOUNT PREFERENCES</span>
                    <h1>Settings</h1>
                    <p>
                        Customize your TaskFlow experience and manage
                        your account preferences.
                    </p>
                </section>

                <div className="tf-settings-layout">

                    <aside className="tf-settings-sidebar">
                        <h3>Preferences</h3>

                        {settingsSections.map((section) => (
                            <button
                                key={section.id}
                                className={`tf-settings-nav ${
                                    activeSection === section.id ? "active" : ""
                                }`}
                                onClick={() => {
                                    setActiveSection(section.id);
                                    setMessage({ type: "", text: "" });
                                }}
                            >
                                <span className="tf-settings-nav-icon">
                                    {section.icon}
                                </span>

                                <span className="tf-settings-nav-text">
                                    {section.title}
                                </span>

                                <FiChevronRight />
                            </button>
                        ))}
                    </aside>

                    <section className="tf-settings-content">

                        {activeSection === "security" && (
                            <div>
                                <div className="tf-settings-section-heading">
                                    <span><FiLock /></span>
                                    <div>
                                        <h2>Security</h2>
                                        <p>
                                            Keep your TaskFlow account secure.
                                        </p>
                                    </div>
                                </div>

                                {message.text && (
                                    <div className={`tf-settings-message ${message.type}`}>
                                        {message.text}
                                    </div>
                                )}

                                <form
                                    className="tf-settings-password-form"
                                    onSubmit={(e) => {
                                        e.preventDefault();
                                        handleChangePassword(e);
                                    }}
                                >
                                    <div className="tf-settings-password-title">
                                        <h3>Change Password</h3>
                                        <p>
                                            Choose a strong password to protect
                                            your account.
                                        </p>
                                    </div>

                                    {renderPasswordField(
                                        "Current password",
                                        "currentPassword",
                                        "current"
                                    )}

                                    {renderPasswordField(
                                        "New password",
                                        "newPassword",
                                        "new"
                                    )}

                                    {renderPasswordField(
                                        "Confirm new password",
                                        "confirmPassword",
                                        "confirm"
                                    )}

                                    <div className="tf-settings-password-hint">
                                        Your new password must contain at least
                                        6 characters.
                                    </div>

                                    <button
                                        type="submit"
                                        className="tf-settings-save-btn"
                                        disabled={saving}
                                    >
                                        <FiSave />
                                        {saving ? "Updating..." : "Update Password"}
                                    </button>
                                </form>
                            </div>
                        )}
                        
                        {activeSection === "notifications" && (
                            <div>
                                <div className="tf-settings-section-heading">
                                    <span><FiBell /></span>
                                    <div>
                                        <h2>Notifications</h2>
                                        <p>
                                            Manage how TaskFlow notifies you.
                                        </p>
                                    </div>
                                </div>

                                {notificationMessage.text && (
                                    <div className={`tf-settings-message ${notificationMessage.type}`}>
                                        {notificationMessage.text}
                                    </div>
                                )}

                                {notificationLoading ? (
                                    <p className="tf-settings-placeholder">
                                        Loading notification preferences...
                                    </p>
                                ) : (
                                    <div className="tf-notification-settings">

                                        <div className="tf-notification-item">
                                            <div>
                                                <h3>Task Due Soon</h3>
                                                <p>Get notified when a task deadline is approaching.</p>
                                            </div>

                                            <input
                                                type="checkbox"
                                                checked={notificationPreferences.task_due_soon}
                                                onChange={() => handleNotificationToggle("task_due_soon")}
                                            />
                                        </div>

                                        <div className="tf-notification-item">
                                            <div>
                                                <h3>Overdue Tasks</h3>
                                                <p>Get notified when a task passes its deadline.</p>
                                            </div>

                                            <input
                                                type="checkbox"
                                                checked={notificationPreferences.task_overdue}
                                                onChange={() => handleNotificationToggle("task_overdue")}
                                            />
                                        </div>

                                        <div className="tf-notification-item">
                                            <div>
                                                <h3>Task Completed</h3>
                                                <p>Receive a notification when you complete a task.</p>
                                            </div>

                                            <input
                                                type="checkbox"
                                                checked={notificationPreferences.task_completed}
                                                onChange={() => handleNotificationToggle("task_completed")}
                                            />
                                        </div>

                                        <div className="tf-notification-item">
                                            <div>
                                                <h3>Task Reminders</h3>
                                                <p>Get notified when your scheduled task reminder arrives.</p>
                                            </div>

                                            <input
                                                type="checkbox"
                                                checked={notificationPreferences.task_reminder}
                                                onChange={() => handleNotificationToggle("task_reminder")}
                                            />
                                        </div>

                                        <button
                                            type="button"
                                            className="tf-settings-save-btn"
                                            onClick={handleSaveNotifications}
                                            disabled={notificationSaving}
                                        >
                                            <FiSave />
                                            {notificationSaving ? "Saving..." : "Save Preferences"}
                                        </button>

                                    </div>

                                )}

                                {/* Email Notification Settings */}
                                <div className="tf-notification-settings">

                                    <div className="tf-settings-section-heading">
                                        <span><FiBell /></span>
                                        <div>
                                            <h2>Email Notifications</h2>
                                            <p>Choose which task updates you want to receive by email.</p>
                                        </div>
                                    </div>

                                    {emailNotificationMessage.text && (
                                        <div className={`tf-settings-message ${emailNotificationMessage.type}`}>
                                            {emailNotificationMessage.text}
                                        </div>
                                    )}

                                    {emailNotificationLoading ? (
                                        <p className="tf-settings-placeholder">
                                            Loading email preferences...
                                        </p>
                                    ) : (
                                        <>
                                            <div className="tf-notification-item">
                                                <div>
                                                    <h3>Enable Email Notifications</h3>
                                                    <p>Turn all TaskFlow task-related emails on or off.</p>
                                                </div>

                                                <input
                                                    type="checkbox"
                                                    checked={emailNotificationPreferences.enabled}
                                                    onChange={() => handleEmailNotificationToggle("enabled")}
                                                />
                                            </div>

                                            <div className="tf-notification-item">
                                                <div>
                                                    <h3>Task Due Soon</h3>
                                                    <p>Receive an email 24 hours before a task deadline.</p>
                                                </div>

                                                <input
                                                    type="checkbox"
                                                    checked={emailNotificationPreferences.task_due_soon}
                                                    disabled={!emailNotificationPreferences.enabled}
                                                    onChange={() => handleEmailNotificationToggle("task_due_soon")}
                                                />
                                            </div>

                                            <div className="tf-notification-item">
                                                <div>
                                                    <h3>Overdue Tasks</h3>
                                                    <p>Receive an email when a task becomes overdue.</p>
                                                </div>

                                                <input
                                                    type="checkbox"
                                                    checked={emailNotificationPreferences.task_overdue}
                                                    disabled={!emailNotificationPreferences.enabled}
                                                    onChange={() => handleEmailNotificationToggle("task_overdue")}
                                                />
                                            </div>

                                            <div className="tf-notification-item">
                                                <div>
                                                    <h3>Task Reminders</h3>
                                                    <p>Receive an email when your scheduled reminder arrives.</p>
                                                </div>

                                                <input
                                                    type="checkbox"
                                                    checked={emailNotificationPreferences.task_reminder}
                                                    disabled={!emailNotificationPreferences.enabled}
                                                    onChange={() => handleEmailNotificationToggle("task_reminder")}
                                                />
                                            </div>

                                            <button
                                                type="button"
                                                className="tf-settings-save-btn"
                                                onClick={handleSaveEmailNotifications}
                                                disabled={emailNotificationSaving || emailNotificationLoading}
                                            >
                                                <FiSave />
                                                {emailNotificationSaving
                                                    ? "Saving..."
                                                    : "Save Email Preferences"}
                                            </button>
                                        </>
                                    )}
                                </div>

                            </div>
                        )}

                        {activeSection === "appearance" && (
                            <div>
                                <div className="tf-settings-section-heading">
                                    <span><FiMoon /></span>
                                    <div>
                                        <h2>Appearance</h2>
                                        <p>Personalize your workspace.</p>
                                    </div>
                                </div>

                                {themeMessage.text && (
                                    <div className={`tf-settings-message ${themeMessage.type}`}>
                                        {themeMessage.text}
                                    </div>
                                )}

                                {themeLoading ? (
                                    <p className="tf-settings-placeholder">
                                        Loading appearance settings...
                                    </p>
                                ) : (
                                    <div className="tf-appearance-settings">

                                        <div className="tf-appearance-title">
                                            <h3>Choose your theme</h3>
                                            <p>Select the appearance you prefer for TaskFlow.</p>
                                        </div>

                                        <div className="tf-theme-options">

                                            <button
                                                type="button"
                                                className={`tf-theme-option ${theme === "light" ? "active" : ""}`}
                                                onClick={() => {
                                                    setTheme("light");
                                                    setThemeMessage({ type: "", text: "" });
                                                }}
                                            >
                                                <div className="tf-theme-preview light-preview">
                                                    <div className="tf-preview-sidebar"></div>
                                                    <div className="tf-preview-content">
                                                        <div></div>
                                                        <div></div>
                                                        <div></div>
                                                    </div>
                                                </div>

                                                <div className="tf-theme-option-info">
                                                    <span>Light Mode</span>
                                                    <small>Clean and refreshing</small>
                                                </div>

                                                <span className="tf-theme-radio">
                                                    {theme === "light" ? "✓" : ""}
                                                </span>
                                            </button>

                                            <button
                                                type="button"
                                                className={`tf-theme-option ${theme === "dark" ? "active" : ""}`}
                                                onClick={() => {
                                                    setTheme("dark");
                                                    setThemeMessage({ type: "", text: "" });
                                                }}
                                            >
                                                <div className="tf-theme-preview dark-preview">
                                                    <div className="tf-preview-sidebar"></div>
                                                    <div className="tf-preview-content">
                                                        <div></div>
                                                        <div></div>
                                                        <div></div>
                                                    </div>
                                                </div>

                                                <div className="tf-theme-option-info">
                                                    <span>Dark Mode</span>
                                                    <small>Comfortable in low light</small>
                                                </div>

                                                <span className="tf-theme-radio">
                                                    {theme === "dark" ? "✓" : ""}
                                                </span>
                                            </button>

                                        </div>

                                        <button
                                            type="button"
                                            className="tf-settings-save-btn"
                                            onClick={handleSaveAppearance}
                                            disabled={themeSaving}
                                        >
                                            <FiSave />
                                            {themeSaving ? "Saving..." : "Save Appearance"}
                                        </button>

                                    </div>
                                )}
                            </div>
                        )}

                        {activeSection === "account" && (
                            <div>
                                <div className="tf-settings-section-heading">
                                    <span><FiUser /></span>
                                    <div>
                                        <h2>Account Management</h2>
                                        <p>
                                            View your account information and status.
                                        </p>
                                    </div>
                                </div>

                                {accountMessage.text && (
                                    <div className={`tf-settings-message ${accountMessage.type}`}>
                                        {accountMessage.text}
                                    </div>
                                )}

                                {accountLoading ? (
                                    <p className="tf-settings-placeholder">
                                        Loading account information...
                                    </p>
                                ) : accountInfo && (
                                    <div className="tf-account-info">

                                        <div className="tf-account-info-header">
                                            <div className="tf-account-avatar">
                                                {accountInfo.username
                                                    ?.charAt(0).toUpperCase()}
                                            </div>

                                            <div>
                                                <h3>{accountInfo.username}</h3>
                                                <p>{accountInfo.email}</p>
                                            </div>

                                            <span className="tf-account-status">
                                                {accountInfo.accountStatus}
                                            </span>
                                        </div>

                                        <div className="tf-account-divider"></div>

                                        <h3 className="tf-account-info-title">
                                            Account Information
                                        </h3>

                                        <div className="tf-account-info-grid">

                                            <div className="tf-account-info-item">
                                                <label>Username</label>
                                                <strong>{accountInfo.username}</strong>
                                            </div>

                                            <div className="tf-account-info-item">
                                                <label>Email Address</label>
                                                <strong>{accountInfo.email}</strong>
                                            </div>

                                            <div className="tf-account-info-item">
                                                <label>Email Verification</label>
                                                <span className={
                                                    accountInfo.isEmailVerified
                                                        ? "tf-account-verified"
                                                        : "tf-account-unverified"
                                                }>
                                                    {accountInfo.isEmailVerified
                                                        ? "Verified"
                                                        : "Not Verified"}
                                                </span>
                                            </div>

                                            <div className="tf-account-info-item">
                                                <label>Account Status</label>
                                                <strong>{accountInfo.accountStatus}</strong>
                                            </div>

                                            <div className="tf-account-info-item">
                                                <label>Member Since</label>
                                                <strong>
                                                    {new Date(
                                                        accountInfo.createdAt
                                                    ).toLocaleDateString("en-IN", {
                                                        day: "2-digit",
                                                        month: "long",
                                                        year: "numeric"
                                                    })}
                                                </strong>
                                            </div>

                                            <div className="tf-account-info-item">
                                                <label>Account ID</label>
                                                <strong className="tf-account-id">
                                                    {accountInfo._id}
                                                </strong>
                                            </div>

                                        </div>

                                    </div>
                                )}

                                <div className="tf-account-logout">
                                    <div>
                                        <h3>Sign Out</h3>
                                        <p>
                                            Sign out of your TaskFlow account on this device.
                                        </p>
                                    </div>

                                    <button
                                        type="button"
                                        onClick={handleLogout}
                                    >
                                        <FiLogOut />
                                        Sign Out
                                    </button>
                                </div>

                                {/* Delete Account */}
                                <div className="tf-account-delete">
                                    <div>
                                        <h3>Delete Account</h3>
                                        <p>
                                            Permanently delete your TaskFlow account and
                                            all associated data. This action cannot be undone.
                                        </p>
                                    </div>

                                    <button
                                        type="button"
                                        onClick={() => {
                                            setDeleteMessage("");
                                            setDeletePassword("");
                                            setDeleteConfirmed(false);
                                            setShowDeleteModal(true);
                                        }}
                                    >
                                        <FiTrash2 />
                                        Delete Account
                                    </button>
                                </div>

                                {/* Delete Account Modal */}
                                {showDeleteModal && (
                                    <div className="tf-delete-modal-overlay">
                                        <div
                                            className="tf-delete-modal"
                                            role="dialog"
                                            aria-modal="true"
                                            aria-labelledby="tf-delete-title"
                                        >
                                            <div className="tf-delete-modal-icon">
                                                <FiTrash2 />
                                            </div>

                                            <h2 id="tf-delete-title">Delete Your Account?</h2>

                                            <p className="tf-delete-warning">
                                                This action is permanent. Your account and
                                                associated data will be deleted. You cannot
                                                recover your account after deletion.
                                            </p>

                                            {deleteMessage && (
                                                <div className="tf-settings-message error">
                                                    {deleteMessage}
                                                </div>
                                            )}

                                            <form onSubmit={handleDeleteAccount}>
                                                <div className="tf-delete-password-field">
                                                    <label htmlFor="deleteCurrentPassword">
                                                        Enter your current password
                                                    </label>

                                                    <input
                                                        id="deleteCurrentPassword"
                                                        type="password"
                                                        value={deletePassword}
                                                        onChange={(e) => {
                                                            setDeletePassword(e.target.value);
                                                            setDeleteMessage("");
                                                        }}
                                                        placeholder="Enter your password"
                                                        autoComplete="current-password"
                                                        required
                                                    />
                                                </div>

                                                <label className="tf-delete-confirm-checkbox">
                                                    <input
                                                        type="checkbox"
                                                        checked={deleteConfirmed}
                                                        onChange={(e) => {
                                                            setDeleteConfirmed(e.target.checked);
                                                            setDeleteMessage("");
                                                        }}
                                                    />

                                                    <span>
                                                        I understand that this action is permanent
                                                        and cannot be undone.
                                                    </span>
                                                </label>

                                                <div className="tf-delete-modal-actions">
                                                    <button
                                                        type="button"
                                                        className="tf-delete-cancel-btn"
                                                        onClick={() => {
                                                            setShowDeleteModal(false);
                                                            setDeletePassword("");
                                                            setDeleteConfirmed(false);
                                                            setDeleteMessage("");
                                                        }}
                                                        disabled={deleteLoading}
                                                    >
                                                        Cancel
                                                    </button>

                                                    <button
                                                        type="submit"
                                                        className="tf-delete-confirm-btn"
                                                        disabled={deleteLoading || !deleteConfirmed}
                                                    >
                                                        <FiTrash2 />
                                                        {deleteLoading
                                                            ? "Deleting..."
                                                            : "Permanently Delete"}
                                                    </button>
                                                </div>
                                            </form>
                                        </div>
                                    </div>
                                )}

                            </div>
                        )}

                    </section>
                </div>
            </div>
        </main>
    );
};

export default Settings;