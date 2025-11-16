const { neon } = require('@netlify/neon');

async function clearScores() {
  const connection = process.env.NETLIFY_DATABASE_URL;
  if (!connection) {
    console.error('NETLIFY_DATABASE_URL is not set. Use `netlify env:get NETLIFY_DATABASE_URL` to load it locally.');
    process.exit(1);
  }

  try {
    const sql = neon(connection);
    await sql`truncate table scores restart identity;`;
    console.log('Leaderboard cleared successfully.');
  } catch (error) {
    console.error('Failed to clear leaderboard:', error);
    process.exit(1);
  }
}

clearScores();
