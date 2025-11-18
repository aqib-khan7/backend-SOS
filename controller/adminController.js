import prisma from "../lib/prisma.js";
import jwt from "jsonwebtoken";

export class AdminController {
  // now we need to authenticate the admin using the email and password itself
  static login = async (req, res) => {
    try {
      const { email, password } = req.body;
      const admin = await prisma.admin.findUnique({ where: { email } });
      if (!admin) {
        return res.status(401).json({ message: "Admin not found" });
      }
      if (admin.password !== password) {
        return res.status(401).json({ message: "Invalid password" });
      }

      if (!process.env.JWT_SECRET) {
        console.error("[Admin] JWT_SECRET missing");
        return res.status(500).json({ message: "Server misconfiguration." });
      }

      // Generate JWT token with admin role
      const token = jwt.sign(
        {
          sub: admin.id,
          email: admin.email,
          role: "admin",
        },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN ?? "12h" }
      );

      return res.status(200).json({
        success: true,
        message: "Admin logged in successfully",
        token, // JWT token with admin role
        admin: {
          id: admin.id,
          email: admin.email,
          role: "admin",
        },
      });
    } catch (error) {
      console.error("[Admin] login failed:", error);
      return res.status(500).json({ message: "Login failed" });
    }
  };

  // Update issue status (0-5 scale)
  static updateIssueStatus = async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;

      if (status === undefined) {
        return res.status(400).json({ message: "Status is required" });
      }

      const statusValue = parseInt(status);
      if (statusValue < 0 || statusValue > 5) {
        return res.status(400).json({
          message: "Status must be between 0 and 5 (0=pending, 5=resolved)",
        });
      }

      const issue = await prisma.issue.findUnique({
        where: { id },
      });

      if (!issue) {
        return res.status(404).json({ message: "Issue not found" });
      }

      const updatedIssue = await prisma.issue.update({
        where: { id },
        data: { status: statusValue },
        include: {
          category: true,
          user: {
            select: {
              id: true,
              number: true,
            },
          },
        },
      });

      return res.status(200).json({
        message: "Issue status updated successfully",
        issue: updatedIssue,
      });
    } catch (error) {
      console.error("[Admin] updateIssueStatus failed:", error);
      return res.status(500).json({ message: "Failed to update issue status" });
    }
  };

  // Get all issues for admin dashboard
  static getIssues = async (req, res) => {
    try {
      const { status, categoryId, sortBy = "createdAt", order = "desc" } = req.query;

      const where = {};
      if (status !== undefined) {
        where.status = parseInt(status);
      }
      if (categoryId) {
        where.categoryId = categoryId;
      }

      const issues = await prisma.issue.findMany({
        where,
        include: {
          category: true,
          user: {
            select: {
              id: true,
              number: true,
            },
          },
        },
        orderBy: {
          [sortBy]: order,
        },
      });

      return res.status(200).json({
        message: "Issues retrieved successfully",
        issues,
        count: issues.length,
      });
    } catch (error) {
      console.error("[Admin] getIssues failed:", error);
      return res.status(500).json({ message: "Failed to retrieve issues" });
    }
  };

  // Get single issue by ID for admin
  static getIssueById = async (req, res) => {
    try {
      const { id } = req.params;

      const issue = await prisma.issue.findUnique({
        where: { id },
        include: {
          category: true,
          user: {
            select: {
              id: true,
              number: true,
            },
          },
        },
      });

      if (!issue) {
        return res.status(404).json({ message: "Issue not found" });
      }

      return res.status(200).json({
        message: "Issue retrieved successfully",
        issue,
      });
    } catch (error) {
      console.error("[Admin] getIssueById failed:", error);
      return res.status(500).json({ message: "Failed to retrieve issue" });
    }
  };
}   