import "dotenv/config";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import { env } from "./lib/env.js";
import { errorHandler } from "./middleware/error-handler.js";
import authRoutes from "./routes/auth.routes.js";
import meRoutes from "./routes/me.routes.js";
import resumesRoutes from "./routes/resumes.routes.js";

const app = express();

app.use(helmet());
app.use(
  cors({
    origin: env.WEB_URL
  })
);
app.use(express.json({ limit: "4mb" }));
app.use(morgan("dev"));

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/auth", authRoutes);
app.use("/me", meRoutes);
app.use("/resumes", resumesRoutes);

app.use((_req, res) => {
  res.status(404).json({ message: "Rota nao encontrada" });
});

app.use(errorHandler);

app.listen(env.PORT, () => {
  console.log(`API rodando em http://localhost:${env.PORT}`);
});

process.on("SIGINT", () => process.exit(0));
process.on("SIGTERM", () => process.exit(0));