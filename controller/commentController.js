import prisma from "../lib/prisma.js";

export class CommentController {
  // Create a comment on an issue (admin only)
  static createComment = async (req, res) => {
    try {
      const { issueId } = req.params;
      const { content } = req.body;
      const adminId = req.user.sub; // Get admin ID from authenticated token

      if (!content || content.trim().length === 0) {
        return res.status(400).json({
          message: "Comment content is required",
        });
      }

      // Verify issue exists
      const issue = await prisma.issue.findUnique({
        where: { id: issueId },
      });

      if (!issue) {
        return res.status(404).json({ message: "Issue not found" });
      }

      // Verify admin exists
      const admin = await prisma.admin.findUnique({
        where: { id: adminId },
      });

      if (!admin) {
        return res.status(404).json({ message: "Admin not found" });
      }

      const comment = await prisma.comment.create({
        data: {
          content: content.trim(),
          issueId,
          adminId,
        },
        include: {
          admin: {
            select: {
              id: true,
              email: true,
            },
          },
          issue: {
            select: {
              id: true,
              title: true,
            },
          },
        },
      });

      return res.status(201).json({
        message: "Comment created successfully",
        comment,
      });
    } catch (error) {
      console.error("[Comment] createComment failed:", error);
      return res.status(500).json({ message: "Failed to create comment" });
    }
  };

  // Get all comments for a specific issue
  static getCommentsByIssue = async (req, res) => {
    try {
      const { issueId } = req.params;
      const userId = req.user?.sub; // Get user ID if it's a user request
      const adminId = req.user?.sub; // Get admin ID if it's an admin request

      // Verify issue exists
      const issue = await prisma.issue.findUnique({
        where: { id: issueId },
      });

      if (!issue) {
        return res.status(404).json({ message: "Issue not found" });
      }

      // If it's a user request, verify they own the issue
      if (req.user.role === "user" && issue.userId !== userId) {
        return res.status(403).json({
          message: "You can only view comments on your own issues",
        });
      }

      const comments = await prisma.comment.findMany({
        where: {
          issueId,
        },
        include: {
          admin: {
            select: {
              id: true,
              email: true,
            },
          },
        },
        orderBy: {
          createdAt: "asc",
        },
      });

      return res.status(200).json({
        message: "Comments retrieved successfully",
        comments,
        count: comments.length,
      });
    } catch (error) {
      console.error("[Comment] getCommentsByIssue failed:", error);
      return res.status(500).json({ message: "Failed to retrieve comments" });
    }
  };

  // Update a comment (admin only - can only update their own comments)
  static updateComment = async (req, res) => {
    try {
      const { commentId } = req.params;
      const { content } = req.body;
      const adminId = req.user.sub; // Get admin ID from authenticated token

      if (!content || content.trim().length === 0) {
        return res.status(400).json({
          message: "Comment content is required",
        });
      }

      // Find comment and verify it belongs to the admin
      const comment = await prisma.comment.findUnique({
        where: { id: commentId },
      });

      if (!comment) {
        return res.status(404).json({ message: "Comment not found" });
      }

      // Note: any authenticated admin may update comments. Ownership check removed.

      const updatedComment = await prisma.comment.update({
        where: { id: commentId },
        data: {
          content: content.trim(),
        },
        include: {
          admin: {
            select: {
              id: true,
              email: true,
            },
          },
          issue: {
            select: {
              id: true,
              title: true,
            },
          },
        },
      });

      return res.status(200).json({
        message: "Comment updated successfully",
        comment: updatedComment,
      });
    } catch (error) {
      console.error("[Comment] updateComment failed:", error);
      return res.status(500).json({ message: "Failed to update comment" });
    }
  };

  // Delete a comment (admin only - can only delete their own comments)
  static deleteComment = async (req, res) => {
    try {
      const { commentId } = req.params;
      const adminId = req.user.sub; // Get admin ID from authenticated token

      // Find comment and verify it belongs to the admin
      const comment = await prisma.comment.findUnique({
        where: { id: commentId },
      });

      if (!comment) {
        return res.status(404).json({ message: "Comment not found" });
      }

      // Note: any authenticated admin may delete comments. Ownership check removed.

      await prisma.comment.delete({
        where: { id: commentId },
      });

      return res.status(200).json({
        message: "Comment deleted successfully",
      });
    } catch (error) {
      console.error("[Comment] deleteComment failed:", error);
      return res.status(500).json({ message: "Failed to delete comment" });
    }
  };
}

