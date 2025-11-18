import twilio from "twilio";
import jwt from "jsonwebtoken";
import prisma from "../lib/prisma.js";

// the user will be authenticated using the twilio verify API

const twilioClient =
  process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN
    ? twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)
    : null;

const TWILIO_VERIFY_SERVICE_SID = process.env.TWILIO_VERIFY_SERVICE_SID;

export class UserController {
  static requestLoginOtp = async (req, res) => {
    try {
      const { phone } = req.body;

      if (!phone) {
        return res.status(400).json({ message: "Phone number is required." });
      }

      if (!twilioClient || !TWILIO_VERIFY_SERVICE_SID) {
        console.error("[Auth] Twilio credentials missing");
        return res.status(500).json({ message: "SMS service not configured." });
      }

      // Send OTP using Twilio Verify API
      const verification = await twilioClient.verify.v2
        .services(TWILIO_VERIFY_SERVICE_SID)
        .verifications.create({
          to: phone,
          channel: "sms",
        });

      return res.status(200).json({
        message: "OTP sent successfully. Please check your phone.",
        sid: verification.sid,
      });
    } catch (error) {
      console.error("[Auth] requestLoginOtp failed:", error);
      if (error.code === 60200) {
        return res.status(400).json({ message: "Invalid phone number format." });
      }
      return res.status(500).json({ message: "Unable to send OTP right now." });
    }
  };

  static verifyLoginOtp = async (req, res) => {
    try {
      const { phone, otp } = req.body;

      if (!phone || !otp) {
        return res
          .status(400)
          .json({ message: "Phone number and OTP are required." });
      }

      if (!twilioClient || !TWILIO_VERIFY_SERVICE_SID) {
        console.error("[Auth] Twilio credentials missing");
        return res.status(500).json({ message: "SMS service not configured." });
      }

      // Verify OTP using Twilio Verify API
      const verificationCheck = await twilioClient.verify.v2
        .services(TWILIO_VERIFY_SERVICE_SID)
        .verificationChecks.create({
          to: phone,
          code: otp,
        });

      if (verificationCheck.status !== "approved") {
        return res.status(401).json({ message: "Invalid or expired OTP." });
      }

      // Find or create user
      let user = await prisma.user.findUnique({
        where: { number: phone },
      });

      // Auto-register user if they don't exist
      if (!user) {
        user = await prisma.user.create({
          data: {
            number: phone,
          },
        });
      }

      if (!process.env.JWT_SECRET) {
        console.error("[Auth] JWT_SECRET missing");
        return res.status(500).json({ message: "Server misconfiguration." });
      }

      // Generate JWT token after successful verification with user role
      const token = jwt.sign(
        {
          sub: user.id,
          number: user.number,
          role: "user",
        },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN ?? "12h" }
      );

      // Return JWT token and user info
      return res.status(200).json({
        success: true,
        message: "Login successful. OTP verified.",
        token, // JWT token with user role
        user: {
          id: user.id,
          number: user.number,
          role: "user",
        },
      });
    } catch (error) {
      console.error("[Auth] verifyLoginOtp failed:", error);
      if (error.code === 20404) {
        return res.status(400).json({ message: "OTP not found. Request a new one." });
      }
      return res
        .status(500)
        .json({ message: "Unable to verify OTP right now." });
    }
  };
}