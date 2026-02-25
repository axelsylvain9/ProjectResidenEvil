import { Request, Response } from 'express';
import { UserService } from '../services/user.service';
import { AuthRequest } from '../middlewares/auth.middleware';

const userService = new UserService();

export const register = async (req: Request, res: Response) => {
  try {
    const { fullName, email, password, phone, cin, address } = req.body;

    if (!fullName || !email || !password || !phone || !cin || !address) {
      return res.status(400).json({
        success: false,
        message: 'Tous les champs sont requis'
      });
    }

    const result = await userService.register({
      fullName,
      email,
      password,
      phone,
      cin,
      address
    });

    return res.status(201).json(result);
  } catch (error: any) {
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

export const getProfile = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user?.userId) {
      return res.status(401).json({
        success: false,
        message: "Non authentifié"
      });
    }

    const result = await userService.getProfile(req.user.userId);
    return res.status(200).json(result);

  } catch (error: any) {
    console.error("❌ Erreur getProfile:", error);
    return res.status(400).json({
      success: false,
      message: error.message || "Erreur lors de la récupération du profil"
    });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { accountNumber, password } = req.body;

    if (!accountNumber || !password) {
      return res.status(400).json({
        success: false,
        message: 'Numéro de compte et mot de passe requis'
      });
    }

    const result = await userService.login(accountNumber, password);
    return res.status(200).json(result);
  } catch (error: any) {
    return res.status(401).json({
      success: false,
      message: error.message
    });
  }
};

export const getUserById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = await userService.getUserById(id as string);
    return res.status(200).json(result);
  } catch (error: any) {
    return res.status(404).json({
      success: false,
      message: error.message
    });
  }
};

export const getCurrentUser = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Non authentifié'
      });
    }

    const result = await userService.getUserById(userId);
    return res.status(200).json(result);
  } catch (error: any) {
    return res.status(404).json({
      success: false,
      message: error.message
    });
  }
};

export const updateUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const result = await userService.updateUser(id as string, updateData);
    return res.status(200).json(result);
  } catch (error: any) {
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

export const updateCurrentUser = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Non authentifié'
      });
    }

    const result = await userService.updateUser(userId, req.body);
    return res.status(200).json(result);
  } catch (error: any) {
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }
};