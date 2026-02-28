import { Request, Response } from "express";
import { IdentityService } from "../services/identity.service";

const service = new IdentityService();

export const identifyController = async (
    req: Request,
    res: Response
): Promise<void> => {
    try {
        const result = await service.identify(req.body);
        res.status(200).json(result);
    } catch (err) {
        console.error("Identify error:", err);
        res.status(500).json({ error: "Internal server error" });
    }
};