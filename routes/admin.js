import express from "express";
import { AdminController } from "../controller/adminController.js";
import { authenticate, requireAdmin } from "../middleware/auth.js";

const adminRouter = express.Router();

// Authentication routes (public - no auth required)
adminRouter.post("/auth/login", AdminController.login);

// Issue management routes (protected - require admin authentication)
adminRouter.get("/issues", authenticate, requireAdmin, AdminController.getIssues);
adminRouter.get("/issues/:id", authenticate, requireAdmin, AdminController.getIssueById);
adminRouter.put("/issues/:id/status", authenticate, requireAdmin, AdminController.updateIssueStatus);

export default adminRouter;

