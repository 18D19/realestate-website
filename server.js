require('dotenv').config();
const express = require("express");
const path = require("path");
const fs = require("fs");
const nodemailer = require("nodemailer");

const app = express();
const port = 3000;

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(__dirname));

// Serve index.html
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

// POST handler for form
app.post("/submit-form", async (req, res) => {
  const { name, email, message } = req.body;

  // 1) Save message to local file
  const log = `\n[${new Date().toISOString()}]\nName: ${name}\nEmail: ${email}\nMessage: ${message}\n--------------------\n`;
  try {
    fs.appendFileSync("submissions.txt", log, "utf8");
  } catch (err) {
    console.error("Error writing to file:", err);
  }

  // 2) Send email via Gmail (Nodemailer)
  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASS
      }
    });

    const mailOptions = {
      from: process.env.GMAIL_USER,
      to: process.env.GMAIL_USER, // send to yourself
      subject: `New contact form message from ${name}`,
      text: `You have a new message:\n\nName: ${name}\nEmail: ${email}\nMessage:\n${message}`
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("Email sent:", info.response);

    // Respond with a friendly success page (or redirect back)
    res.send(`
      <h2 style="font-family:sans-serif;">Thank you, ${name}! Your message was sent.</h2>
      <p><a href="/">Go back to site</a></p>
    `);
  } catch (err) {
    console.error("Error sending email:", err);
    res.status(500).send(`
      <h2 style="font-family:sans-serif;">Sorry, something went wrong. Please try again later.</h2>
      <p><a href="/">Go back</a></p>
    `);
  }
});

app.listen(port, () => {
  console.log(`✅ Server running at http://localhost:${port}`);
});
