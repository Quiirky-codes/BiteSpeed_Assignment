import { ContactRepository } from "../repositories/contact.repository";
import { pgPool } from "../config/db.postgres";
import { PoolClient } from "pg";
import {
    IdentifyRequest,
    IdentifyResponse,
    Contact,
} from "../types/contact.types";

export class IdentityService {
    private repo = new ContactRepository();

    /**
     * 🔒 Atomic identity reconciliation (Postgres transaction)
     */
    async identify(data: IdentifyRequest): Promise<IdentifyResponse> {
        const client = await pgPool.connect();

        try {
            await client.query("BEGIN");

            const { email, phoneNumber } = data;

            const matches = await this.repo.findMatches(client, email, phoneNumber);

            // ✅ Case 1: No matches → create primary
            if (matches.length === 0) {
                const primary = await this.repo.createPrimary(client, email, phoneNumber);
                await client.query("COMMIT");
                return await this.buildResponse(client, primary.id);
            }

            // 🔥 Find all possible primaries
            const primaryCandidates = await this.getPrimaryCandidates(client, matches);

            // 🔥 Oldest becomes true primary
            const truePrimary = this.getOldest(primaryCandidates);

            // 🔥 Merge other primaries
            for (const contact of primaryCandidates) {
                if (contact.id !== truePrimary.id) {
                    await this.repo.updateToSecondary(client, contact.id, truePrimary.id);
                }
            }

            // 🔥 Refresh cluster
            const cluster = await this.repo.findCluster(client, truePrimary.id);

            // ✅ Exact pair check
            const existsExact = cluster.some(
                (c) => c.email === email && c.phone_number === phoneNumber
            );

            // ✅ Create secondary if new info
            if (!existsExact) {
                const hasNewEmail =
                    email && !cluster.some((c) => c.email === email);

                const hasNewPhone =
                    phoneNumber &&
                    !cluster.some((c) => c.phone_number === phoneNumber);

                if (hasNewEmail || hasNewPhone) {
                    await this.repo.createSecondary(
                        client,
                        truePrimary.id,
                        email,
                        phoneNumber
                    );
                }
            }

            await client.query("COMMIT");

            // 🔁 Final fresh read
            return await this.buildResponse(client, truePrimary.id);
        } catch (err) {
            await client.query("ROLLBACK");
            throw err;
        } finally {
            client.release();
        }
    }

    /**
     * 🔎 Resolve candidate primaries
     */
    private async getPrimaryCandidates(
        client: PoolClient,
        matches: Contact[]
    ): Promise<Contact[]> {
        const primaries: Contact[] = [];

        for (const c of matches) {
            if (c.link_precedence === "primary") {
                primaries.push(c);
            } else if (c.linked_id) {
                const parent = await this.repo.findById(client, c.linked_id);
                if (parent) primaries.push(parent);
            }
        }

        // remove duplicates
        const map = new Map<number, Contact>();
        primaries.forEach((p) => map.set(p.id, p));
        return [...map.values()];
    }

    /**
     * 🕒 Oldest wins
     */
    private getOldest(contacts: Contact[]): Contact {
        return contacts.sort(
            (a, b) =>
                new Date(a.created_at).getTime() -
                new Date(b.created_at).getTime()
        )[0];
    }

    /**
     * ⭐ Deterministic response builder
     */
    private async buildResponse(
        client: PoolClient,
        primaryId: number
    ): Promise<IdentifyResponse> {
        const cluster = await this.repo.findCluster(client, primaryId);

        const primary = cluster.find((c) => c.id === primaryId)!;
        const secondaries = cluster.filter((c) => c.id !== primaryId);

        // ✅ emails (unique, primary first)
        const emailSet = new Set<string>();
        const emails: string[] = [];

        if (primary.email) {
            emailSet.add(primary.email);
            emails.push(primary.email);
        }

        for (const c of secondaries) {
            if (c.email && !emailSet.has(c.email)) {
                emailSet.add(c.email);
                emails.push(c.email);
            }
        }

        // ✅ phones (unique, primary first)
        const phoneSet = new Set<string>();
        const phones: string[] = [];

        if (primary.phone_number) {
            phoneSet.add(primary.phone_number);
            phones.push(primary.phone_number);
        }

        for (const c of secondaries) {
            if (c.phone_number && !phoneSet.has(c.phone_number)) {
                phoneSet.add(c.phone_number);
                phones.push(c.phone_number);
            }
        }

        return {
            contact: {
                primaryContatctId: primaryId,
                emails,
                phoneNumbers: phones,
                secondaryContactIds: secondaries.map((c) => c.id),
            },
        };
    }
}