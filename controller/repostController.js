import prisma from "../lib/prisma.js";

export class RepostController {
  // Repost an issue (associate user with issue)
  static repostIssue = async (req, res) => {
    try {
      const { issueId } = req.params;
      const userId = req.user.sub; // Get user ID from authenticated token

      // Verify issue exists
      const issue = await prisma.issue.findUnique({
        where: { id: issueId },
      });

      if (!issue) {
        return res.status(404).json({ message: "Issue not found" });
      }

      // Check if user already reposted this issue
      const existingRepost = await prisma.repost.findUnique({
        where: {
          issueId_userId: {
            issueId,
            userId,
          },
        },
      });

      if (existingRepost) {
        return res.status(400).json({
          message: "You have already reposted this issue",
        });
      }

      // Prevent users from reposting their own issues
      if (issue.userId === userId) {
        return res.status(400).json({
          message: "You cannot repost your own issue",
        });
      }

      // Create repost
      const repost = await prisma.repost.create({
        data: {
          issueId,
          userId,
        },
        include: {
          issue: {
            select: {
              id: true,
              title: true,
            },
          },
          user: {
            select: {
              id: true,
              number: true,
            },
          },
        },
      });

      // Get updated repost count
      const repostCount = await prisma.repost.count({
        where: { issueId },
      });

      return res.status(201).json({
        message: "Issue reposted successfully",
        repost,
        repostCount,
      });
    } catch (error) {
      console.error("[Repost] repostIssue failed:", error);
      if (error.code === "P2002") {
        return res.status(400).json({
          message: "You have already reposted this issue",
        });
      }
      return res.status(500).json({ message: "Failed to repost issue" });
    }
  };

  // Remove repost (unrepost)
  static unrepostIssue = async (req, res) => {
    try {
      const { issueId } = req.params;
      const userId = req.user.sub; // Get user ID from authenticated token

      // Find and delete repost
      const repost = await prisma.repost.findUnique({
        where: {
          issueId_userId: {
            issueId,
            userId,
          },
        },
      });

      if (!repost) {
        return res.status(404).json({
          message: "Repost not found",
        });
      }

      await prisma.repost.delete({
        where: {
          issueId_userId: {
            issueId,
            userId,
          },
        },
      });

      // Get updated repost count
      const repostCount = await prisma.repost.count({
        where: { issueId },
      });

      return res.status(200).json({
        message: "Repost removed successfully",
        repostCount,
      });
    } catch (error) {
      console.error("[Repost] unrepostIssue failed:", error);
      return res.status(500).json({ message: "Failed to remove repost" });
    }
  };

  // Check if user has reposted an issue
  static checkRepost = async (req, res) => {
    try {
      const { issueId } = req.params;
      const userId = req.user.sub; // Get user ID from authenticated token

      const repost = await prisma.repost.findUnique({
        where: {
          issueId_userId: {
            issueId,
            userId,
          },
        },
      });

      return res.status(200).json({
        hasReposted: !!repost,
        repost: repost || null,
      });
    } catch (error) {
      console.error("[Repost] checkRepost failed:", error);
      return res.status(500).json({ message: "Failed to check repost status" });
    }
  };
}

