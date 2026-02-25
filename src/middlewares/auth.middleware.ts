// src/middleware/auth.middleware.ts
import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export interface AuthRequest extends Request {
  user?: {
    userId: string;
    email: string;
  };
}

export const authMiddleware = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const token = req.headers.authorization?.replace("Bearer ", "");

    if (!token) {
      res.status(401).json({
        success: false,
        message: "Token manquant. Veuillez vous connecter."
      });
      return;
    }

    const jwtSecret = process.env.JWT_SECRET || "monSuperCodeSecretAxel123456@";
      console.log('JWT_SECRET utilisé pour VÉRIFIER:', jwtSecret);
      console.log('Token reçu:', token);
    const decoded = jwt.verify(token, jwtSecret) as {
      userId: string;
      email: string;
    };
    console.log('Decoded user:', decoded);

    req.user = {
      userId: decoded.userId,
      email: decoded.email
    };

    next();
  } catch (error: any) {
    if (error.name === "TokenExpiredError") {
      res.status(401).json({
        success: false,
        message: "Token expiré"
      });
    } else if (error.name === "JsonWebTokenError") {
      res.status(401).json({
        success: false,
        message: "Token invalide"
      });
    } else {
      res.status(401).json({
        success: false,
        message: "Erreur d'authentification"
      });
    }
  }
};