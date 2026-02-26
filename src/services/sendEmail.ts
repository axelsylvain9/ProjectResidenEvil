import nodemailer from 'nodemailer';

export class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    // Configuration avec TES identifiants Ethereal
    this.transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false, // true pour 465, false pour 587
      auth: {
        user: 'tyson77@ethereal.email',
        pass: 'WWdFJFqzySeB94xvH9'
      },
      logger: true,
      debug: true 
    });


     /*
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp-relay.brevo.com',
      port: Number(process.env.SMTP_PORT) || 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      },
      logger: true,
      debug: true
    });
    */

    console.log('✅ Service email configuré avec Ethereal');
    
    // Test de connexion
    this.verifyConnection();
  }

  private async verifyConnection() {
    try {
      await this.transporter.verify();
      console.log('✅ Connexion Ethereal établie avec succès');
    } catch (error) {
      console.error('❌ Erreur de connexion Ethereal:', error);
    }
  }

  // Template HTML avec logo (inchangé)
  private getEmailTemplate(content: string): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333333;
            margin: 0;
            padding: 0;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
          }
          .header {
            background: linear-gradient(135deg, #006d44 0%, #00915a 100%);
            padding: 30px 20px;
            text-align: center;
          }
          .logo {
            font-size: 32px;
            font-weight: bold;
            color: white;
            margin-bottom: 10px;
          }
          .logo-sub {
            font-size: 14px;
            color: rgba(255,255,255,0.9);
          }
          .content {
            padding: 30px 20px;
            background-color: #f9f9f9;
          }
          .footer {
            background-color: #f0f0f0;
            padding: 20px;
            text-align: center;
            font-size: 12px;
            color: #666666;
            border-top: 1px solid #dddddd;
          }
          .amount {
            font-size: 28px;
            color: #006d44;
            font-weight: bold;
            text-align: center;
            padding: 15px;
            background: white;
            border-radius: 8px;
            margin: 15px 0;
          }
          .details-card {
            background: white;
            border-radius: 8px;
            padding: 20px;
            margin: 20px 0;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          }
          .detail-row {
            display: flex;
            justify-content: space-between;
            padding: 10px 0;
            border-bottom: 1px solid #eeeeee;
          }
          .detail-row:last-child {
            border-bottom: none;
          }
          .detail-label {
            font-weight: bold;
            color: #666666;
          }
          .detail-value {
            color: #333333;
          }
          .badge {
            display: inline-block;
            padding: 5px 10px;
            border-radius: 15px;
            font-size: 12px;
            font-weight: bold;
          }
          .badge-success {
            background-color: #28c3a9;
            color: white;
          }
          .badge-warning {
            background-color: #ffc107;
            color: #333;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">BNP PARIBAS</div>
            <div class="logo-sub">La banque d'un monde qui change</div>
          </div>
          
          <div class="content">
            ${content}
          </div>
          
          <div class="footer">
            <p>Ce message est automatique, merci de ne pas y répondre.</p>
            <p>© ${new Date().getFullYear()} BNP Paribas. Tous droits réservés.</p>
            <p>Si vous avez des questions, contactez votre conseiller.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  // Email de confirmation pour l'émetteur
  async sendVirementConfirmation(
    to: string,
    data: {
      nom: string;
      reference: string;
      montant: number;
      destinataire: string;
      date: string;
      type: string;
      compteSource: string;
      motif?: string;
    }
  ) {
    const montantFormate = data.montant.toFixed(2).replace('.', ',');
    const dateFormatee = new Date(data.date).toLocaleString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    const content = `
      <h2 style="color: #006d44; margin-top: 0;">Bonjour ${data.nom},</h2>
      
      <p>Nous vous confirmons que votre virement a été effectué avec succès.</p>
      
      <div class="amount">${montantFormate} €</div>
      
      <div class="details-card">
        <h3 style="color: #006d44; margin-top: 0;">Détails du virement</h3>
        
        <div class="detail-row">
          <span class="detail-label">Référence :</span>
          <span class="detail-value">${data.reference}</span>
        </div>
        
        <div class="detail-row">
          <span class="detail-label">Date d'exécution :</span>
          <span class="detail-value">${dateFormatee}</span>
        </div>
        
        <div class="detail-row">
          <span class="detail-label">Type de virement :</span>
          <span class="detail-value">
            ${data.type === 'interne' ? 'Interne BNP Paribas' : 'Externe'}
          </span>
        </div>
        
        <div class="detail-row">
          <span class="detail-label">Compte débiteur :</span>
          <span class="detail-value">${data.compteSource}</span>
        </div>
        
        <div class="detail-row">
          <span class="detail-label">Bénéficiaire :</span>
          <span class="detail-value">${data.destinataire}</span>
        </div>
        
        ${data.motif ? `
        <div class="detail-row">
          <span class="detail-label">Motif :</span>
          <span class="detail-value">${data.motif}</span>
        </div>
        ` : ''}
      </div>
      
      <div style="text-align: center; margin-top: 30px;">
        <span class="badge badge-success">✓ Virement effectué</span>
      </div>
      
      <p style="margin-top: 30px; font-size: 14px; color: #666;">
        Le montant a été débité de votre compte. Vous pouvez consulter le détail 
        de cette opération dans votre espace client.
      </p>
    `;

    const subject = `✓ Virement confirmé - ${data.reference}`;
    return this.sendEmail(to, subject, this.getEmailTemplate(content));
  }

  // Email de notification pour le destinataire
  async sendVirementRecu(
    to: string,
    data: {
      nom: string;
      expediteur: string;
      montant: number;
      reference: string;
      date: string;
      motif?: string;
    }
  ) {
    const montantFormate = data.montant.toFixed(2).replace('.', ',');
    const dateFormatee = new Date(data.date).toLocaleString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    const content = `
      <h2 style="color: #006d44; margin-top: 0;">Bonjour ${data.nom},</h2>
      
      <p>Vous avez reçu un virement sur votre compte BNP Paribas.</p>
      
      <div class="amount">+ ${montantFormate} €</div>
      
      <div class="details-card">
        <h3 style="color: #006d44; margin-top: 0;">Détails du virement reçu</h3>
        
        <div class="detail-row">
          <span class="detail-label">Référence :</span>
          <span class="detail-value">${data.reference}</span>
        </div>
        
        <div class="detail-row">
          <span class="detail-label">Date de réception :</span>
          <span class="detail-value">${dateFormatee}</span>
        </div>
        
        <div class="detail-row">
          <span class="detail-label">Expéditeur :</span>
          <span class="detail-value">${data.expediteur}</span>
        </div>
        
        ${data.motif ? `
        <div class="detail-row">
          <span class="detail-label">Motif :</span>
          <span class="detail-value">${data.motif}</span>
        </div>
        ` : ''}
      </div>
      
      <div style="text-align: center; margin-top: 30px;">
        <span class="badge badge-success">✓ Crédité sur votre compte</span>
      </div>
      
      <p style="margin-top: 30px; font-size: 14px; color: #666;">
        Le montant a été crédité sur votre compte. Vous pouvez consulter votre solde 
        et l'historique de vos transactions dans votre espace client.
      </p>
    `;

    const subject = `💰 Virement reçu - ${data.reference}`;
    return this.sendEmail(to, subject, this.getEmailTemplate(content));
  }

  // Email d'échec de virement
  async sendVirementEchec(
    to: string,
    data: {
      nom: string;
      reference: string;
      montant: number;
      destinataire: string;
      date: string;
      raison: string;
    }
  ) {
    const montantFormate = data.montant.toFixed(2).replace('.', ',');
    const dateFormatee = new Date(data.date).toLocaleString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    const content = `
      <h2 style="color: #006d44; margin-top: 0;">Bonjour ${data.nom},</h2>
      
      <p>Nous vous informons que votre virement n'a pas pu être effectué.</p>
      
      <div class="amount" style="color: #dc3545;">${montantFormate} €</div>
      
      <div class="details-card">
        <h3 style="color: #006d44; margin-top: 0;">Détails du virement échoué</h3>
        
        <div class="detail-row">
          <span class="detail-label">Référence :</span>
          <span class="detail-value">${data.reference}</span>
        </div>
        
        <div class="detail-row">
          <span class="detail-label">Date de la tentative :</span>
          <span class="detail-value">${dateFormatee}</span>
        </div>
        
        <div class="detail-row">
          <span class="detail-label">Bénéficiaire :</span>
          <span class="detail-value">${data.destinataire}</span>
        </div>
        
        <div class="detail-row">
          <span class="detail-label">Raison de l'échec :</span>
          <span class="detail-value" style="color: #dc3545;">${data.raison}</span>
        </div>
      </div>
      
      <div style="background: #fff3cd; border: 1px solid #ffeeba; border-radius: 5px; padding: 15px; margin: 20px 0;">
        <p style="margin: 0; color: #856404;">
          <strong>⚠️ Aucun montant n'a été débité de votre compte.</strong>
        </p>
      </div>
      
      <p style="margin-top: 20px;">
        Vous pouvez réessayer l'opération ou contacter votre conseiller pour plus d'informations.
      </p>
    `;

    const subject = `❌ Échec de virement - ${data.reference}`;
    return this.sendEmail(to, subject, this.getEmailTemplate(content));
  }

  // Méthode générique d'envoi
  async sendEmail(to: string, subject: string, html: string) {
    try {
      console.log(`Envoi via Ethereal...`);
      console.log(`À: ${to}`);
      console.log(`Sujet: ${subject}`);

      const info = await this.transporter.sendMail({
        from: '"BNP Paribas" <no-reply@bnpparibas.com>',
        to: to,
        subject: subject,
        html: html
      });

      console.log('Email envoyé avec succès!');
      console.log('URL pour voir l\'email:', nodemailer.getTestMessageUrl(info));
      console.log('Message ID:', info.messageId);
      
      return { 
        success: true, 
        messageId: info.messageId,
        previewUrl: nodemailer.getTestMessageUrl(info)
      };
    } catch (error) {
      console.error('Erreur lors de l\'envoi:', error);
      return { success: false, error };
    }
  }
}

// Création et export d'une instance unique
export const emailService = new EmailService();