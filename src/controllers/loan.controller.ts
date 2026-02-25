// controllers/loan.controller.ts
import { Request, Response } from "express";
import loanService from "../services/loan.service";

// CREATE LOAN
export const createLoan = async (req: Request, res: Response) => {
  try {
    const { userId, type, amount, interestRate, durationInMonths, accountNumber } = req.body;

    // Validation des champs requis
    if (!userId || !type || !amount || !interestRate || !durationInMonths) {
      return res.status(400).json({
        success: false,
        message: "Tous les champs requis doivent être fournis: userId, type, amount, interestRate, durationInMonths"
      });
    }

    // Validation du montant
    if (amount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Le montant doit être supérieur à 0"
      });
    }

    // Validation du taux d'intérêt
    if (interestRate < 0 || interestRate > 100) {
      return res.status(400).json({
        success: false,
        message: "Le taux d'intérêt doit être compris entre 0 et 100"
      });
    }

    // Validation de la durée
    if (durationInMonths <= 0) {
      return res.status(400).json({
        success: false,
        message: "La durée doit être supérieure à 0 mois"
      });
    }

    const result = await loanService.createLoan({
      userId,
      type,
      amount: Number(amount),
      interestRate: Number(interestRate),
      durationInMonths: Number(durationInMonths),
      accountNumber
    });

    return res.status(201).json(result);

  } catch (error: any) {
    console.error(" Erreur createLoan:", error);
    return res.status(400).json({
      success: false,
      message: error.message || "Erreur lors de la création du prêt"
    });
  }
};

// GET USER LOANS
export const getUserLoans = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "userId requis"
      });
    }

    const result = await loanService.getUserLoans(userId as string);

    return res.status(200).json(result);

  } catch (error: any) {
    console.error(" Erreur getUserLoans:", error);
    return res.status(404).json({
      success: false,
      message: error.message || "Erreur lors de la récupération des prêts"
    });
  }
};

// GET LOAN BY ID
export const getLoanById = async (req: Request, res: Response) => {
  try {
    const { loanId, userId } = req.params;

    if (!loanId || !userId) {
      return res.status(400).json({
        success: false,
        message: "loanId et userId requis"
      });
    }

    const result = await loanService.getLoanById(loanId as string, userId as string);

    return res.status(200).json(result);

  } catch (error: any) {
    console.error(" Erreur getLoanById:", error);
    return res.status(404).json({
      success: false,
      message: error.message || "Prêt non trouvé"
    });
  }
};

// PAY LOAN
export const payLoan = async (req: Request, res: Response) => {
  try {
    const { loanId } = req.params;
    const { accountNumber, amount, userId } = req.body;

    if (!loanId || !accountNumber || !amount || !userId) {
      return res.status(400).json({
        success: false,
        message: "loanId, accountNumber, amount et userId requis"
      });
    }

    if (amount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Le montant doit être supérieur à 0"
      });
    }

    const result = await loanService.payLoan({
      loanId : loanId as string,
      accountNumber,
      amount: Number(amount),
      userId
    });

    return res.status(200).json(result);

  } catch (error: any) {
    console.error("Erreur payLoan:", error);
    return res.status(400).json({
      success: false,
      message: error.message || "Erreur lors du paiement"
    });
  }
};

// GET LOAN SUMMARY
export const getLoanSummary = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "userId requis"
      });
    }

    const result = await loanService.getLoanSummary(userId as string);

    return res.status(200).json(result);

  } catch (error: any) {
    console.error(" Erreur getLoanSummary:", error);
    return res.status(400).json({
      success: false,
      message: error.message || "Erreur lors de la récupération du résumé"
    });
  }
};