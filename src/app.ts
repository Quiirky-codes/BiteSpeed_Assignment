import express from "express";
import identifyRoutes from "./routes/identify.routes";

export const app = express();

app.use(express.json());
app.use("/", identifyRoutes);