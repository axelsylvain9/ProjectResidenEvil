import express from "express";
import {
  createLoan,
  getUserLoans,
  getLoanById,
  payLoan,
  getLoanSummary
} from "../controllers/loan.controller";
import { authMiddleware } from "../middlewares/auth.middleware";

const loanRouter = express.Router();

// Routes principales
loanRouter.post("/loans", authMiddleware, createLoan);
loanRouter.get("/loans/user/:userId",  authMiddleware, getUserLoans);
loanRouter.get("/loans/:loanId/user/:userId", authMiddleware, getLoanById);
loanRouter.post("/loans/:loanId/pay", authMiddleware, payLoan);
loanRouter.get("/loans/summary/:userId", authMiddleware, getLoanSummary);

export default loanRouter;