import request from "supertest";
import { app } from "../app";

describe("Identity Reconciliation", () => {
    it("should create primary contact", async () => {
        const res = await request(app)
            .post("/identify")
            .send({
                email: "test1@example.com",
                phoneNumber: "111111",
            });

        expect(res.status).toBe(200);
        expect(res.body.contact.emails).toContain("test1@example.com");
    });

    it("should create secondary on new info", async () => {
        await request(app).post("/identify").send({
            email: "test2@example.com",
            phoneNumber: "222222",
        });

        const res = await request(app).post("/identify").send({
            email: "test3@example.com",
            phoneNumber: "222222",
        });

        expect(res.body.contact.emails.length).toBeGreaterThan(1);
    });
});