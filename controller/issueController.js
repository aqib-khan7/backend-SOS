import prisma from "../lib/prisma.js";
import { calculatePriority, getMaxRepostCount } from "../utils/priority.js";

export class IssueController {
  // Create a new civic issue
  static createIssue = async (req, res) => {
    try {
      const { title, description, image, categoryId, importanceRating } = req.body;
      const userId = req.user.sub; // Get user ID from authenticated token

      if (!title || !description || !categoryId) {
        return res.status(400).json({
          message: "Title, description, and categoryId are required",
        });
      }

      // Validate importance rating (0-5)
      const rating = importanceRating !== undefined ? parseInt(importanceRating) : 0;
      if (rating < 0 || rating > 5) {
        return res.status(400).json({
          message: "Importance rating must be between 0 and 5",
        });
      }

      // Verify user exists (should always exist since they're authenticated)
      const user = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Verify category exists
      const category = await prisma.category.findUnique({
        where: { id: categoryId },
      });

      if (!category) {
        return res.status(404).json({ message: "Category not found" });
      }

      const issue = await prisma.issue.create({
        data: {
          title,
          description,
          image: image || null,
          importanceRating: rating,
          status: 0, // Default status is 0 (pending)
          categoryId,
          userId,
        },
        include: {
          category: true,
          user: {
            select: {
              id: true,
              number: true,
            },
          },
          comments: {
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
          },
          reposts: {
            select: {
              id: true,
              userId: true,
            },
          },
        },
      });

      // Calculate priority (repost count will be 0 for new issue)
      const maxReposts = await getMaxRepostCount(prisma);
      const repostCount = issue.reposts.length;
      const priority = calculatePriority(issue.importanceRating, repostCount, maxReposts);

      return res.status(201).json({
        message: "Issue created successfully",
        issue: {
          ...issue,
          repostCount,
          priority,
        },
      });
    } catch (error) {
      console.error("[Issue] createIssue failed:", error);
      return res.status(500).json({ message: "Failed to create issue" });
    }
  };

  // Get all issues with optional filters (users can only see their own issues)
  static getIssues = async (req, res) => {
    try {
      const { status, categoryId, sortBy = "createdAt", order = "desc" } = req.query;
      const userId = req.user.sub; // Get user ID from authenticated token

      const where = {
        userId, // Users can only see their own issues
      };
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
          comments: {
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
          },
          reposts: {
            select: {
              id: true,
              userId: true,
            },
          },
        },
        orderBy: {
          [sortBy]: order,
        },
      });

      // Get max repost count for normalization
      const maxReposts = await getMaxRepostCount(prisma);

      // Calculate priority for each issue
      const issuesWithPriority = issues.map((issue) => {
        const repostCount = issue.reposts.length;
        const priority = calculatePriority(issue.importanceRating, repostCount, maxReposts);
        
        return {
          ...issue,
          repostCount,
          priority,
        };
      });

      // Sort by priority if requested
      if (sortBy === "priority") {
        issuesWithPriority.sort((a, b) => {
          return order === "desc"
            ? b.priority.totalPriority - a.priority.totalPriority
            : a.priority.totalPriority - b.priority.totalPriority;
        });
      }

      return res.status(200).json({
        message: "Issues retrieved successfully",
        issues: issuesWithPriority,
        count: issuesWithPriority.length,
      });
    } catch (error) {
      console.error("[Issue] getIssues failed:", error);
      return res.status(500).json({ message: "Failed to retrieve issues" });
    }
  };

  // Get a single issue by ID
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
          comments: {
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
      console.error("[Issue] getIssueById failed:", error);
      return res.status(500).json({ message: "Failed to retrieve issue" });
    }
  };
}

