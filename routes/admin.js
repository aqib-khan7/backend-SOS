import express from "express";
import { AdminController } from "../controller/adminController.js";
import { CommentController } from "../controller/commentController.js";
import { authenticate, requireAdmin } from "../middleware/auth.js";

const adminRouter = express.Router();

// Authentication routes (public - no auth required)
adminRouter.post("/login", AdminController.login);

// Issue management routes (protected - require admin authentication)
adminRouter.get("/issues", authenticate, requireAdmin, AdminController.getIssues);
adminRouter.get("/issues/:id", authenticate, requireAdmin, AdminController.getIssueById);
adminRouter.put("/issues/:id/status", authenticate, requireAdmin, AdminController.updateIssueStatus);

// Comment routes (protected - require admin authentication)
adminRouter.post("/issues/:issueId/comments", authenticate, requireAdmin, CommentController.createComment);
adminRouter.get("/issues/:issueId/comments", authenticate, requireAdmin, CommentController.getCommentsByIssue);
adminRouter.put("/comments/:commentId", authenticate, requireAdmin, CommentController.updateComment);
adminRouter.delete("/comments/:commentId", authenticate, requireAdmin, CommentController.deleteComment);

export default adminRouter;

