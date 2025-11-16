import { neon } from '@netlify/neon';

const sql = neon(process.env.NETLIFY_DATABASE_URL);

export const handler = async () => {
  try {
    const rows = await sql`
      select id, name, score, wave, enemies_killed, created_at
      from scores
      order by score desc, created_at asc
      limit 50;
    `;
    return {
      statusCode: 200,
      body: JSON.stringify(rows),
    };
  } catch (err) {
    console.error(err);
    return { statusCode: 500, body: 'Failed to load scores' };
  }
};
