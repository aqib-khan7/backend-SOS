import express from "express";
import { UserController } from "../controller/userController.js";
import { IssueController } from "../controller/issueController.js";
import { authenticate, requireUser } from "../middleware/auth.js";

const userRouter = express.Router();

// Authentication routes
userRouter.post("/request-otp", UserController.requestLoginOtp);
userRouter.post("/verify-otp", UserController.verifyLoginOtp);

// Issue routes (protected - require user authentication)
userRouter.post("/issues", authenticate, requireUser, IssueController.createIssue);
userRouter.get("/issues", authenticate, requireUser, IssueController.getIssues);
userRouter.get("/issues/:id", authenticate, requireUser, IssueController.getIssueById);

export default userRouter;
