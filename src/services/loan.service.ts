// services/loan.service.ts
import mongoose, { Types } from 'mongoose';
import { Loan } from '../models/ILoan.model';
import { Account } from '../models/Account.model';
import { User } from '../models/User.model';
import transactionService from './transaction.service';
import { emailService } from './sendEmail';
import { ILoan } from '../interfaces/IUser';

interface LoanPaymentData {
  loanId: string;
  accountNumber: string;
  amount: number;
  userId: string;
}

interface PaymentHistoryEntry {
  date: string;
  amount: number;
  interest: number;
  capital: number;
  remainingAfter: number;
}

interface CreateLoanData {
  userId: string;
  type: string;
  amount: number;
  interestRate: number;
  durationInMonths: number;
  accountNumber?: string;
}

export class LoanService {
  
  // Générer un ID de prêt unique
  private generateLoanId(): string {
    const prefix = 'LOAN';
    const date = new Date().toISOString().slice(2, 10).replace(/-/g, '');
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `${prefix}${date}${random}`;
  }

  // Calculer les détails du prêt
  private calculateLoanDetails(amount: number, interestRate: number, durationInMonths: number) {
    const monthlyRate = interestRate / 100 / 12;
    const monthlyPayment = amount * monthlyRate * Math.pow(1 + monthlyRate, durationInMonths) / (Math.pow(1 + monthlyRate, durationInMonths) - 1);
    
    const totalInterest = (monthlyPayment * durationInMonths) - amount;
    const totalPayment = amount + totalInterest;
    
    return {
      monthlyPayment: Math.round(monthlyPayment * 100) / 100,
      totalInterest: Math.round(totalInterest * 100) / 100,
      totalPayment: Math.round(totalPayment * 100) / 100,
      durationInMonths
    };
  }

  // CREATE LOAN - SANS TRANSACTION
  async createLoan(loanData: CreateLoanData) {
    // 1. Vérifier que l'utilisateur existe
    const user = await User.findById(loanData.userId);
    if (!user) {
      throw new Error('Utilisateur non trouvé');
    }

    // 2. Calculer les détails du prêt
    const details = this.calculateLoanDetails(
      loanData.amount, 
      loanData.interestRate, 
      loanData.durationInMonths
    );

    // 3. Créer le prêt
    const loan = new Loan({
      type: loanData.type,
      amount: loanData.amount,
      remaining: loanData.amount,
      interestRate: loanData.interestRate,
      nextPayment: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      status: 'active',
      userId: loanData.userId
    });

    await loan.save();

    // 4. Si un compte de réception est spécifié, créditer le montant
    if (loanData.accountNumber) {
      const destinationAccount = await Account.findOne({ 
        accountNumber: loanData.accountNumber 
      });

      if (destinationAccount) {
        // Vérifier que le compte appartient bien à l'utilisateur
        if (destinationAccount.userId.toString() !== loanData.userId) {
          // Si le compte n'appartient pas à l'utilisateur, supprimer le prêt créé
          await Loan.findByIdAndDelete(loan._id);
          throw new Error('Ce compte ne vous appartient pas');
        }

        // Créditer le compte
        destinationAccount.balance += loanData.amount;
        await destinationAccount.save();

        // Ajouter le prêt à la liste des prêts de l'utilisateur
        if (!user.prets) user.prets = [];
        user.prets.push(loan._id as Types.ObjectId);
        await user.save();

        // Créer une transaction de crédit
        await transactionService.createTransaction({
          transactionId: `TXN-${Date.now()}`,
          description: `Déblocage prêt ${loanData.type}`,
          amount: loanData.amount,
          type: 'credit',
          category: 'Prêt',
          accountId: destinationAccount._id.toString(),
          userId: loanData.userId,
          reference: this.generateLoanId(),
          beneficiaryName: 'BNP Paribas - Crédit',
          status: 'completed'
        });
      }
    }

    // Récupérer le prêt avec les détails calculés
    const loanResponse = loan.toObject();
    
    return {
      success: true,
      message: 'Prêt créé avec succès',
      data: {
        ...loanResponse,
        id: loanResponse._id,
        _id: undefined,
        __v: undefined,
        details: {
          monthlyPayment: details.monthlyPayment,
          totalInterest: details.totalInterest,
          totalPayment: details.totalPayment,
          durationInMonths: details.durationInMonths
        }
      }
    };
  }

 
  async getUserLoans(userId: string) {
    if (!Types.ObjectId.isValid(userId)) {
      throw new Error('ID utilisateur invalide');
    }

    // 1️⃣ Recherche principale via userId
    let loans = await Loan.find({ userId }).sort({ createdAt: -1 });

    // 2️⃣ Fallback si aucun prêt trouvé
    if (loans.length === 0) {
      const user = await User.findById(userId).select('prets');

      if (user?.prets?.length) {
        loans = await Loan.find({
          _id: { $in: user.prets }
        }).sort({ createdAt: -1 });
      }
    }

    // 3️⃣ Transformation + statistiques individuelles
    const formattedLoans = loans.map(loan => {
      const paidAmount = loan.amount - loan.remaining;
      const paidPercentage = loan.amount > 0
        ? Math.round((paidAmount / loan.amount) * 100)
        : 0;

      const remainingPercentage = 100 - paidPercentage;

      const nextPaymentDate = loan.nextPayment
        ? new Date(loan.nextPayment)
        : null;

      const today = new Date();
      const daysUntilNextPayment = nextPaymentDate
        ? Math.ceil((nextPaymentDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
        : null;

      return {
        id: loan._id,
        type: loan.type,
        amount: loan.amount,
        remaining: loan.remaining,
        interestRate: loan.interestRate,
        nextPayment: loan.nextPayment,
        status: loan.status,
        userId: loan.userId,
        createdAt: loan.createdAt,
        updatedAt: loan.updatedAt,
        stats: {
          paidAmount,
          paidPercentage,
          remainingPercentage,
          daysUntilNextPayment,
          nextPaymentDate: nextPaymentDate
            ? nextPaymentDate.toLocaleDateString('fr-FR')
            : null,
          isOverdue: daysUntilNextPayment !== null && daysUntilNextPayment < 0,
          createdAt: loan.createdAt.toLocaleDateString('fr-FR')
        }
      };
    });

    // 4️⃣ Résumé global
    const totalLoaned = loans.reduce((acc, loan) => acc + loan.amount, 0);
    const totalRemaining = loans.reduce((acc, loan) => acc + loan.remaining, 0);
    const totalPaid = totalLoaned - totalRemaining;

    const globalPaidPercentage = totalLoaned > 0
      ? Math.round((totalPaid / totalLoaned) * 100)
      : 0;

    const summary = {
      totalLoans: loans.length,
      activeLoans: loans.filter(l => l.status === 'active').length,
      totalLoaned,
      totalRemaining,
      totalPaid,
      globalPaidPercentage
    };

    return {
      success: true,
      data: {
        loans: formattedLoans,
        summary
      }
    };
  }


  // GET LOAN BY ID
  async getLoanById(loanId: string, userId: string) {
    if (!Types.ObjectId.isValid(loanId)) {
      throw new Error('ID de prêt invalide');
    }

    const loan = await Loan.findOne({ _id: loanId, userId });

    if (!loan) {
      throw new Error('Prêt non trouvé');
    }

    // Calculer les détails avancés
    const loanObj = loan.toObject();
    
    // Utiliser createdAt depuis le document
    const createdAt = (loan as any).createdAt || new Date();
    
    // Historique des paiements simulé
    const paymentHistory: PaymentHistoryEntry[] = [];
    let remaining = loanObj.amount;
    const monthlyPayment = loanObj.amount / 12; // Simplifié pour l'exemple
    
    for (let i = 1; i <= 12; i++) {
      if (remaining <= 0) break;
      
      const paymentDate = new Date(createdAt);
      paymentDate.setMonth(paymentDate.getMonth() + i);
      
      if (paymentDate <= new Date()) {
        const paymentAmount = Math.min(monthlyPayment, remaining);
        remaining -= paymentAmount;
        
        paymentHistory.push({
          date: paymentDate.toISOString().split('T')[0] || '',
          amount: Math.round(paymentAmount * 100) / 100,
          interest: Math.round(paymentAmount * (loanObj.interestRate / 100 / 12) * 100) / 100,
          capital: Math.round(paymentAmount * (1 - loanObj.interestRate / 100 / 12) * 100) / 100,
          remainingAfter: Math.round(remaining * 100) / 100
        });
      }
    }

    const paidAmount = loanObj.amount - loanObj.remaining;
    const paidPercentage = (paidAmount / loanObj.amount) * 100;
    
    const nextPaymentDate = new Date(loanObj.nextPayment);
    const daysUntilNextPayment = Math.ceil((nextPaymentDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));

    return {
      success: true,
      data: {
        ...loanObj,
        id: loanObj._id,
        _id: undefined,
        __v: undefined,
        stats: {
          paidAmount: Math.round(paidAmount * 100) / 100,
          paidPercentage: Math.round(paidPercentage * 100) / 100,
          remainingPercentage: Math.round(100 - paidPercentage),
          daysUntilNextPayment,
          nextPaymentDate: nextPaymentDate.toLocaleDateString('fr-FR'),
          isOverdue: daysUntilNextPayment < 0
        },
        paymentHistory
      }
    };
  }

  // PAYMENT LOAN - SANS TRANSACTION
  async payLoan(paymentData: LoanPaymentData) {
    // 1. Récupérer le prêt
    const loan = await Loan.findOne({ 
      _id: paymentData.loanId,
      userId: paymentData.userId,
      status: 'active'
    });

    if (!loan) {
      throw new Error('Prêt non trouvé ou déjà soldé');
    }

    // 2. Vérifier que le montant du paiement ne dépasse pas le restant dû
    if (paymentData.amount > loan.remaining) {
      throw new Error('Le montant du paiement dépasse le restant dû');
    }

    // 3. Récupérer le compte source
    const sourceAccount = await Account.findOne({ 
      accountNumber: paymentData.accountNumber,
      status: 'active'
    });

    if (!sourceAccount) {
      throw new Error('Compte source introuvable ou inactif');
    }

    // 4. Vérifier que le compte appartient à l'utilisateur
    if (sourceAccount.userId.toString() !== paymentData.userId) {
      throw new Error('Ce compte ne vous appartient pas');
    }

    // 5. Vérifier le solde disponible
    if (sourceAccount.balance < paymentData.amount) {
      throw new Error('Solde insuffisant pour effectuer ce paiement');
    }

    // 6. IMPACTER LES SOLDES
    sourceAccount.balance -= paymentData.amount;
    await sourceAccount.save();

    // 7. Mettre à jour le prêt
    loan.remaining -= paymentData.amount;
    
    // Calculer les intérêts payés
    const interestPaid = paymentData.amount * (loan.interestRate / 100 / 12);
    const capitalPaid = paymentData.amount - interestPaid;

    // Mettre à jour le statut si le prêt est soldé
    if (loan.remaining <= 0) {
      loan.status = 'paid';
      loan.remaining = 0;
    }

    // Mettre à jour la prochaine date de paiement
    const nextPaymentDate = new Date(loan.nextPayment);
    nextPaymentDate.setMonth(nextPaymentDate.getMonth() + 1);
    loan.nextPayment = nextPaymentDate;

    await loan.save();

    // 8. Créer une transaction de débit
    await transactionService.createTransaction({
      transactionId: `TXN-${Date.now()}`,
      description: `Remboursement prêt ${loan.type}`,
      amount: paymentData.amount,
      type: 'debit',
      category: 'Remboursement prêt',
      accountId: sourceAccount._id.toString(),
      userId: paymentData.userId,
      reference: loan._id.toString(),
      beneficiaryName: 'BNP Paribas - Prêt',
      status: 'completed'
    });

    // 9. Envoyer un email de confirmation
    try {
      const user = await User.findById(paymentData.userId);
      if (user) {
        await emailService.sendEmail(
          user.email,
          `Remboursement prêt ${loan._id.toString().slice(-8)}`,
          this.getPaymentEmailTemplate(user.fullName, loan, paymentData.amount, loan.remaining)
        );
      }
    } catch (emailError) {
      console.error('Erreur envoi email paiement:', emailError);
    }

    return {
      success: true,
      message: loan.remaining === 0 ? 'Prêt entièrement remboursé' : 'Paiement effectué avec succès',
      data: {
        loanId: loan._id,
        amountPaid: paymentData.amount,
        remainingBalance: loan.remaining,
        interestPaid: Math.round(interestPaid * 100) / 100,
        capitalPaid: Math.round(capitalPaid * 100) / 100,
        isFullyPaid: loan.remaining === 0,
        newBalance: sourceAccount.balance
      }
    };
  }

  // GET LOAN SUMMARY
  async getLoanSummary(userId: string) {
    const loans = await Loan.find({ userId });

    const activeLoans = loans.filter(l => l.status === 'active');
    const paidLoans = loans.filter(l => l.status === 'paid');
    const delayedLoans = loans.filter(l => l.status === 'delayed');

    const totalLoaned = loans.reduce((sum, l) => sum + l.amount, 0);
    const totalRemaining = loans.reduce((sum, l) => sum + l.remaining, 0);
    const totalPaid = totalLoaned - totalRemaining;

    // Prochains paiements
    const upcomingPayments = activeLoans
      .map(l => ({
        loanId: l._id,
        type: l.type,
        amount: l.remaining,
        nextPayment: l.nextPayment,
        daysLeft: Math.ceil((new Date(l.nextPayment).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
      }))
      .filter(p => p.daysLeft <= 30)
      .sort((a, b) => a.daysLeft - b.daysLeft);

    return {
      success: true,
      data: {
        counts: {
          total: loans.length,
          active: activeLoans.length,
          paid: paidLoans.length,
          delayed: delayedLoans.length
        },
        amounts: {
          totalLoaned: Math.round(totalLoaned * 100) / 100,
          totalRemaining: Math.round(totalRemaining * 100) / 100,
          totalPaid: Math.round(totalPaid * 100) / 100
        },
        upcomingPayments,
        healthScore: this.calculateLoanHealthScore(loans)
      }
    };
  }

  private calculateLoanHealthScore(loans: ILoan[]): number {
    if (loans.length === 0) return 100;

    let score = 100;

    const delayedCount = loans.filter(l => l.status === 'delayed').length;
    score -= delayedCount * 15;

    const totalRemaining = loans.reduce((sum, l) => sum + l.remaining, 0);
    if (totalRemaining > 50000) score -= 10;
    if (totalRemaining > 100000) score -= 15;

    const activeLoans = loans.filter(l => l.status === 'active');
    const wellPaidLoans = activeLoans.filter(l => l.remaining / l.amount < 0.5);
    score += wellPaidLoans.length * 5;

    return Math.max(0, Math.min(100, Math.round(score)));
  }

  private getPaymentEmailTemplate(userName: string, loan: any, amountPaid: number, remaining: number): string {
    return `
      <h2>Bonjour ${userName},</h2>
      <p>Nous vous confirmons le remboursement partiel de votre prêt.</p>
      
      <div style="background: #f0f9f0; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <p><strong>Type de prêt :</strong> ${loan.type}</p>
        <p><strong>Montant remboursé :</strong> ${amountPaid.toFixed(2)} €</p>
        <p><strong>Reste à rembourser :</strong> ${remaining.toFixed(2)} €</p>
        <p><strong>Prochain paiement :</strong> ${new Date(loan.nextPayment).toLocaleDateString('fr-FR')}</p>
      </div>
      
      <p>Merci de votre confiance.</p>
    `;
  }
}

export default new LoanService();