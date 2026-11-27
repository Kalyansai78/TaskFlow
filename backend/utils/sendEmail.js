const nodemailer = require("nodemailer");

if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    throw new Error("EMAIL_USER and EMAIL_PASS must be configured.");
}

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

const sendEmail = (to, subject, text, html) => {
    return transporter.sendMail({
        from: `"TaskFlow" <${process.env.EMAIL_USER}>`,
        to,
        subject,
        text,
        html
    });
};

module.exports = sendEmail;