// src/routes/user.routes.ts
import express from "express";
import { login, register, getCurrentUser, getUserById, updateCurrentUser, updateUser } from "../controllers/user.controller";
import { authMiddleware } from "../middlewares/auth.middleware";

const userRouter = express.Router();

// ====================================
// ROUTES PUBLIQUES (pas besoin de token)
// ====================================

// 1. Inscription - Pas besoin de token
userRouter.post("/register", register);

// 2. Connexion - Pas besoin de token
userRouter.post("/login", login);

// ====================================
// ROUTES PROTÉGÉES (nécessitent un token)
// ====================================

// 3. Profil utilisateur - Besoin du token
userRouter.get("/profile", authMiddleware, getCurrentUser);

// 4. Mettre à jour le profil - Besoin du token
userRouter.put("/profile", authMiddleware, updateCurrentUser);


userRouter.put("/modif_pro/:id", authMiddleware, updateUser);

userRouter.put("/search/:id", authMiddleware, getUserById);

export default userRouter;