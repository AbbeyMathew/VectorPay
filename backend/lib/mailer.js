const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.mailtrap.io",
    port: Number(process.env.SMTP_PORT || 587),
    secure: false,
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});

async function sendEmail(to, subject, text, html) {
    const info = await transporter.sendMail({
        from: process.env.SMTP_FROM || '"VectorPay" <no-reply@vectorpay.test>',
        to,
        subject,
        text,
        html,
    });
    console.log("Mail sent:", info.messageId, "accepted:", info.accepted);
    return info;
}

module.exports = { sendEmail };