import { PoolClient } from "pg";
import { Contact } from "../types/contact.types";

export class ContactRepository {
  async findMatches(
    client: PoolClient,
    email?: string,
    phone?: string
  ): Promise<Contact[]> {
    const { rows } = await client.query(
      `
      SELECT * FROM contacts
      WHERE deleted_at IS NULL
      AND (email = $1 OR phone_number = $2)
      `,
      [email ?? null, phone ?? null]
    );
    return rows;
  }

  async findCluster(
    client: PoolClient,
    primaryId: number
  ): Promise<Contact[]> {
    const { rows } = await client.query(
      `
      SELECT * FROM contacts
      WHERE deleted_at IS NULL
      AND (id = $1 OR linked_id = $1)
      ORDER BY created_at ASC
      `,
      [primaryId]
    );
    return rows;
  }

  async createPrimary(
    client: PoolClient,
    email?: string,
    phone?: string
  ): Promise<Contact> {
    const { rows } = await client.query(
      `
      INSERT INTO contacts (email, phone_number, link_precedence)
      VALUES ($1, $2, 'primary')
      RETURNING *
      `,
      [email ?? null, phone ?? null]
    );
    return rows[0];
  }

  async createSecondary(
    client: PoolClient,
    primaryId: number,
    email?: string,
    phone?: string
  ): Promise<Contact> {
    const { rows } = await client.query(
      `
      INSERT INTO contacts (email, phone_number, linked_id, link_precedence)
      VALUES ($1, $2, $3, 'secondary')
      RETURNING *
      `,
      [email ?? null, phone ?? null, primaryId]
    );
    return rows[0];
  }

  async updateToSecondary(
    client: PoolClient,
    id: number,
    primaryId: number
  ): Promise<void> {
    await client.query(
      `
      UPDATE contacts
      SET linked_id = $1,
          link_precedence = 'secondary',
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      `,
      [primaryId, id]
    );
  }

  async findById(
    client: PoolClient,
    id: number
  ): Promise<Contact | undefined> {
    const { rows } = await client.query(
      `SELECT * FROM contacts WHERE id = $1`,
      [id]
    );
    return rows[0];
  }
}