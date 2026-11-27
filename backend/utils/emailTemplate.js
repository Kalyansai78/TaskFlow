const escapeHtml = (value = "") => {
    return String(value).replace(/[&<>"']/g, (character) => {
        const entities = {
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;"
        };

        return entities[character];
    });
};

const formatDate = (date) => {
    if (!date) return "Not specified";

    return new Date(date).toLocaleString("en-IN", {
        timeZone: "Asia/Kolkata",
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true
    });
};

const createEmailTemplate = ({ type, task, message }) => {
    const designs = {
        task_due_soon: {
            label: "UPCOMING DEADLINE",
            heading: "Your deadline is approaching!",
            subtitle: "A little reminder to keep your plans on track.",
            accent: "#527966",
            background: "#edf5ef",
            status: "Due Soon"
        },
        task_overdue: {
            label: "OVERDUE TASK",
            heading: "This task needs your attention!",
            subtitle: "Your deadline has passed. Let's get things back on track.",
            accent: "#c65d52",
            background: "#fff0ed",
            status: "Overdue"
        },
        task_reminder: {
            label: "TASK REMINDER",
            heading: "Time to make progress!",
            subtitle: "Your scheduled reminder is here. Let's get started.",
            accent: "#6385a5",
            background: "#edf3fa",
            status: "Reminder"
        }
    };

    const design = designs[type] || designs.task_reminder;

    const safeTitle = escapeHtml(task.title);
    const safePriority = escapeHtml(task.priority || "Medium");
    const safeCategory = escapeHtml(task.category || "Personal");

    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>TaskFlow Notification</title>
    </head>

    <body style="
        margin: 0;
        padding: 30px 12px;
        background-color: #f3f6f3;
        font-family: Arial, Helvetica, sans-serif;
        color: #304538;
    ">

    <div style="
        max-width: 580px;
        margin: auto;
        background: #ffffff;
        border-radius: 14px;
        overflow: hidden;
        border: 1px solid #e5ebe6;
    ">
                
        <div style="
            background: #527966;
            padding: 30px 20px;
            text-align: center;
        ">
            <table role="presentation" align="center"
                cellpadding="0" cellspacing="0" border="0">
                <tr>
                    <td style="
                        width: 42px;
                        height: 42px;
                        background: #ffffff;
                        border-radius: 11px;
                        text-align: center;
                        vertical-align: middle;
                    ">
                        <span style="
                            color: #527966;
                            font-size: 27px;
                            font-weight: bold;
                            line-height: 42px;
                        ">✓</span>
                    </td>

                    <td style="
                        padding-left: 10px;
                        color: #ffffff;
                        font-family: Arial, Helvetica, sans-serif;
                        font-size: 27px;
                        font-weight: bold;
                        vertical-align: middle;
                    ">
                        TaskFlow
                    </td>
                </tr>
            </table>

            <p style="
                margin: 8px 0 0;
                color: #e4eee7;
                font-size: 11px;
                letter-spacing: 2px;
            ">
                PLAN SMARTER. GET MORE DONE.
            </p>
        </div>



            <div style="padding: 24px 18px;">

                <div style="
                    display: inline-block;
                    padding: 8px 12px;
                    border-radius: 20px;
                    background: ${design.background};
                    color: ${design.accent};
                    font-size: 10px;
                    font-weight: bold;
                    letter-spacing: 1px;
                ">
                    ${design.label}
                </div>

                <h2 style="
                    margin: 22px 0 10px;
                    color: #263b30;
                    font-size: 24px;
                    line-height: 1.35;
                ">
                    ${design.heading}
                </h2>

                <p style="
                    margin: 0 0 24px;
                    color: #718078;
                    font-size: 14px;
                    line-height: 1.7;
                ">
                    ${design.subtitle}
                </p>

                <div style="
                    padding: 18px;
                    background: #f5f8f5;
                    border: 1px solid #e6ede7;
                    border-radius: 10px;
                ">

                    <p style="
                        margin: 0 0 8px;
                        color: #89958d;
                        font-size: 11px;
                        font-weight: bold;
                        letter-spacing: 1px;
                    ">
                        YOUR TASK
                    </p>

                    <h3 style="
                        margin: 0 0 10px;
                        color: #304538;
                        font-size: 19px;
                        line-height: 1.5;
                    ">
                        ${safeTitle}
                    </h3>

                    <p style="
                        margin: 0 0 18px;
                        color: #718078;
                        font-size: 13px;
                        line-height: 1.7;
                    ">
                        ${escapeHtml(task.body || "No description provided.")}
                    </p>

                    <div style="
                        border-top: 1px solid #dfe7e0;
                        padding-top: 15px;
                    ">
                        
                        <p style="
                            margin: 0 0 12px;
                            color: #65736a;
                            font-size: 13px;
                            line-height: 1.8;
                        ">
                            <strong>Priority:</strong>

                            <span style="
                                display: inline-block;
                                margin-left: 5px;
                                padding: 4px 10px;
                                border-radius: 20px;
                                background: ${
                                    task.priority === "High" ? "#fdebea" :
                                    task.priority === "Low" ? "#e8f2eb" :
                                    "#fff3dc"
                                };
                                color: ${
                                    task.priority === "High" ? "#c65d52" :
                                    task.priority === "Low" ? "#527966" :
                                    "#a47a35"
                                };
                                font-size: 11px;
                                font-weight: bold;
                                vertical-align: middle;
                            ">
                                ${safePriority}
                            </span>
                        </p>


                        <p style="
                            margin: 0 0 12px;
                            color: #65736a;
                            font-size: 13px;
                        ">
                            <strong>Category:</strong>
                            ${safeCategory}
                        </p>

                        <p style="
                            margin: 0;
                            color: #65736a;
                            font-size: 13px;
                        ">
                            <strong>Due date:</strong>
                            ${formatDate(task.dueDate)}
                        </p>

                    </div>

                    <div style="
                        margin-top: 18px;
                        padding: 10px 12px;
                        border-radius: 7px;
                        background: ${design.background};
                        color: ${design.accent};
                        font-size: 12px;
                        font-weight: bold;
                        text-align: center;
                    ">
                        ${design.status}
                    </div>

                </div>

                <p style="
                    margin: 22px 0 0;
                    color: #527966;
                    font-size: 14px;
                    font-weight: bold;
                ">
                    Stay organized. Stay productive!
                </p>

            </div>

            <div style="
                padding: 22px 18px;
                background: #f7f9f7;
                border-top: 1px solid #e7ece8;
                text-align: center;
            ">
                <p style="
                    margin: 0 0 8px;
                    color: #527966;
                    font-size: 15px;
                    font-weight: bold;
                ">
                    The TaskFlow Team
                </p>

                <p style="
                    margin: 0;
                    color: #929d95;
                    font-size: 11px;
                    line-height: 1.7;
                ">
                    You're receiving this email because email notifications
                    are enabled in your TaskFlow account.
                    <br>
                    © ${new Date().getFullYear()} TaskFlow. All rights reserved.
                </p>
            </div>

        </div>

    </body>
    </html>
    `;
};

module.exports = createEmailTemplate;