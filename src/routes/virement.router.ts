// routes/virement.routes.ts
import express from "express";
import {
  createVirement,
  getVirementById,
  getVirementsByAccount,
  getRecentVirements,
  cancelVirement
} from "../controllers/virement.controller";
import { authMiddleware } from "../middlewares/auth.middleware";

const viroRouter = express.Router();

// Routes virements
viroRouter.post("/virements", authMiddleware, createVirement);
viroRouter.get("/virements/:id", authMiddleware, getVirementById);
viroRouter.get("/virements/compte/:accountNumber",authMiddleware, getVirementsByAccount);
viroRouter.get("/virements/compte/:accountNumber/recent",authMiddleware, getRecentVirements);
viroRouter.put("/virements/:id/annuler", authMiddleware, cancelVirement);

export default viroRouter;