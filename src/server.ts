import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import userRouter from "./routes/user.router";
import transacRouter from "./routes/transaction.router";
import connectDB from "./config/database";
import cardRouter from "./routes/card.router";
import viroRouter from "./routes/virement.router";
import loanRouter from "./routes/loan.router";

dotenv.config();

const app = express();

app.use(cors({
  origin: [ "http://localhost:5173", "https://project-resident-evil.vercel.app" ],
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  credentials: true
}));

app.use(express.json());

app.use(userRouter);
app.use(transacRouter);
app.use(cardRouter);
app.use(viroRouter);
app.use(loanRouter);


const startServer = async () => {
  try {
    await connectDB();
    const PORT = process.env.PORT || 3001;
    app.listen(PORT, () => {
      console.log(`Serveur lancé sur le port ${PORT}`);
    });
  } catch (error) {
    console.error("Erreur au démarrage du serveur :", error);
  }
};

startServer()