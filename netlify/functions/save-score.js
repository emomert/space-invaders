import { neon } from '@netlify/neon';

const sql = neon(process.env.NETLIFY_DATABASE_URL);

export const handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const { name = 'Anonymous', score, wave = 1, enemiesKilled = 0 } = JSON.parse(event.body || '{}');

    if (!Number.isFinite(score)) {
      return { statusCode: 400, body: 'Score is required' };
    }

    const rows = await sql`
      insert into scores (name, score, wave, enemies_killed)
      values (${name}, ${score}, ${wave}, ${enemiesKilled})
      returning id, created_at;
    `;

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, ...rows[0] }),
    };
  } catch (err) {
    console.error(err);
    return { statusCode: 500, body: 'Failed to save score' };
  }
};
