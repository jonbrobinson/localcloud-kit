import express from "express";
import axios from "axios";
import nodemailer from "nodemailer";
import { addLog } from "../lib/context.js";

const router = express.Router();

const MAILPIT_INTERNAL_URL = process.env.MAILPIT_INTERNAL_URL || "http://mailpit:8025";

router.get("/mailpit/stats", async (req, res) => {
  try {
    const response = await axios.get(`${MAILPIT_INTERNAL_URL}/api/v1/info`, { timeout: 3000 });
    const { Messages: total = 0, Unread: unread = 0 } = response.data;
    res.json({ success: true, data: { total, unread, status: "healthy" } });
  } catch (error) {
    res.json({
      success: false,
      data: { total: 0, unread: 0, status: "unavailable" },
      error: error.message,
    });
  }
});

router.get("/mailpit/messages", async (req, res) => {
  try {
    const limit = req.query.limit || 10;
    const response = await axios.get(
      `${MAILPIT_INTERNAL_URL}/api/v1/messages?limit=${limit}`,
      { timeout: 3000 }
    );
    res.json({ success: true, data: response.data });
  } catch (error) {
    res.json({ success: false, data: { messages: [], total: 0 }, error: error.message });
  }
});

router.post("/mailpit/send-test", async (req, res) => {
  const { from, to, subject, body } = req.body;
  if (!from || !to || !subject || !body) {
    return res.status(400).json({
      success: false,
      error: "from, to, subject, and body are required",
    });
  }
  try {
    const transporter = nodemailer.createTransport({ host: "mailpit", port: 1025, secure: false });
    await transporter.sendMail({ from, to, subject, text: body });
    addLog("info", `Test email sent to ${to}`, "mailpit");
    res.json({ success: true, data: { message: `Email sent to ${to}` } });
  } catch (error) {
    addLog("error", `Failed to send test email: ${error.message}`, "mailpit");
    res.status(500).json({ success: false, error: error.message });
  }
});

router.delete("/mailpit/messages", async (req, res) => {
  try {
    await axios.delete(`${MAILPIT_INTERNAL_URL}/api/v1/messages`, { timeout: 5000 });
    addLog("info", "Mailpit messages cleared", "mailpit");
    res.json({ success: true, data: { message: "All messages deleted" } });
  } catch (error) {
    addLog("error", `Failed to clear Mailpit messages: ${error.message}`, "mailpit");
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
