import nodemailer from "nodemailer";

export const sendEmail = async ({ to, subject, text, html }) => {
  try {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || "smtp.gmail.com",
      port: process.env.SMTP_PORT || 587,
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER, // your email
        pass: process.env.SMTP_PASS, // app password
      },
    });

    const info = await transporter.sendMail({
      from: `"Travest App" <${process.env.SMTP_USER}>`,
      to,
      subject,
      text,
      html,
    });

    console.log("Message sent: %s", info.messageId);
    return info;
  } catch (err) {
    console.error("Email sending failed:", err);
    throw new Error("Email delivery failed");
  }
};