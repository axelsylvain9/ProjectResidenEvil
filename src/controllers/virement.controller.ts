// controllers/virement.controller.ts
import { Request, Response } from "express";
import virementService from "../services/virement.service";

// Fonction utilitaire pour extraire une string de req.query
const getQueryString = (value: any): string | undefined => {
  if (typeof value === 'string') return value;
  if (Array.isArray(value) && value.length > 0 && typeof value[0] === 'string') return value[0];
  return undefined;
};

// Fonction utilitaire pour extraire un nombre de req.query
const getQueryNumber = (value: any): number | undefined => {
  const str = getQueryString(value);
  return str ? Number(str) : undefined;
};

// CREATE VIREMENT
export const createVirement = async (req: Request, res: Response) => {
  try {
    const { 
      compteSource, 
      compteDestinataire, 
      montant, 
      type, 
      nomDestinataire, 
      banqueDestinataire, 
      motif,
      emailDestinataire 
    } = req.body;

    // Validation des champs requis
    if (!compteSource || !compteDestinataire || !montant || !type || !nomDestinataire) {
      return res.status(400).json({
        success: false,
        message: "Tous les champs requis doivent être fournis: compteSource, compteDestinataire, montant, type, nomDestinataire"
      });
    }

    // Validation du montant
    if (montant <= 0) {
      return res.status(400).json({
        success: false,
        message: "Le montant doit être supérieur à 0"
      });
    }

    // Validation du type
    if (!['interne', 'externe', 'permanent'].includes(type)) {
      return res.status(400).json({
        success: false,
        message: "Type de virement invalide"
      });
    }

    const result = await virementService.createVirement({
      compteSource,
      compteDestinataire,
      montant: Number(montant),
      type,
      nomDestinataire,
      banqueDestinataire,
      motif,
      emailDestinataire
    });

    return res.status(201).json(result);

  } catch (error: any) {
    console.error("Erreur createVirement:", error);
    return res.status(400).json({
      success: false,
      message: error.message || "Erreur lors de la création du virement"
    });
  }
};

// GET VIREMENT BY ID
export const getVirementById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const compteSource = getQueryString(req.query.compteSource);

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "ID du virement requis"
      });
    }

    // Vérifier que id est une string
    const virementId = Array.isArray(id) ? id[0] : id;
    if (!virementId || typeof virementId !== 'string') {
      return res.status(400).json({
        success: false,
        message: "ID du virement invalide"
      });
    }

    const result = await virementService.getVirementById(virementId, compteSource);

    return res.status(200).json(result);

  } catch (error: any) {
    console.error("Erreur getVirementById:", error);
    return res.status(404).json({
      success: false,
      message: error.message || "Virement non trouvé"
    });
  }
};

// GET ALL VIREMENTS BY ACCOUNT
export const getVirementsByAccount = async (req: Request, res: Response) => {
  try {
    const { accountNumber } = req.params;
    
    // Utiliser les fonctions utilitaires pour extraire les query params
    const limit = getQueryNumber(req.query.limit);
    const offset = getQueryNumber(req.query.offset);
    const startDate = getQueryString(req.query.startDate);
    const endDate = getQueryString(req.query.endDate);
    const typeParam = getQueryString(req.query.type);

    if (!accountNumber) {
      return res.status(400).json({
        success: false,
        message: "Numéro de compte requis"
      });
    }

    // Vérifier que accountNumber est une string
    const compte = Array.isArray(accountNumber) ? accountNumber[0] : accountNumber;
    if (!compte || typeof compte !== 'string') {
      return res.status(400).json({
        success: false,
        message: "Numéro de compte invalide"
      });
    }

    const options: any = {};
    
    if (limit !== undefined) {
      options.limit = limit;
    }
    
    if (offset !== undefined) {
      options.offset = offset;
    }
    
    if (startDate) {
      options.startDate = startDate;
    }
    
    if (endDate) {
      options.endDate = endDate;
    }
    
    if (typeParam && ['interne', 'externe', 'permanent'].includes(typeParam)) {
      options.type = typeParam as 'interne' | 'externe' | 'permanent';
    }

    const result = await virementService.getVirementsByAccount(compte, options);

    return res.status(200).json(result);

  } catch (error: any) {
    console.error("Erreur getVirementsByAccount:", error);
    return res.status(404).json({
      success: false,
      message: error.message || "Erreur lors de la récupération des virements"
    });
  }
};

// GET RECENT VIREMENTS
export const getRecentVirements = async (req: Request, res: Response) => {
  try {
    const { accountNumber } = req.params;
    const limit = getQueryNumber(req.query.limit) || 5;

    if (!accountNumber) {
      return res.status(400).json({
        success: false,
        message: "Numéro de compte requis"
      });
    }

    // Vérifier que accountNumber est une string
    const compte = Array.isArray(accountNumber) ? accountNumber[0] : accountNumber;
    if (!compte || typeof compte !== 'string') {
      return res.status(400).json({
        success: false,
        message: "Numéro de compte invalide"
      });
    }

    const result = await virementService.getRecentVirements(compte, limit);

    return res.status(200).json(result);

  } catch (error: any) {
    console.error("Erreur getRecentVirements:", error);
    return res.status(404).json({
      success: false,
      message: error.message || "Erreur lors de la récupération des virements récents"
    });
  }
};

// CANCEL VIREMENT
export const cancelVirement = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { accountNumber } = req.body;

    if (!id || !accountNumber) {
      return res.status(400).json({
        success: false,
        message: "ID du virement et numéro de compte requis"
      });
    }

    // Vérifier que id est une string
    const virementId = Array.isArray(id) ? id[0] : id;
    if (!virementId || typeof virementId !== 'string') {
      return res.status(400).json({
        success: false,
        message: "ID du virement invalide"
      });
    }

    const result = await virementService.cancelVirement(virementId, accountNumber);

    return res.status(200).json(result);

  } catch (error: any) {
    console.error("Erreur cancelVirement:", error);
    return res.status(400).json({
      success: false,
      message: error.message || "Erreur lors de l'annulation du virement"
    });
  }
};