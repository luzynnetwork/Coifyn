import 'dotenv/config';
import postgres from 'postgres';

/**
 * `npm run db:seed` — development only. Placeholder until the RBAC module lands
 * (it will own the permission-catalog + standard-role bootstrap, and this script
 * will then add one demo salon, owner and a few stylists on top).
 */
async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL is not set');
  const sql = postgres(url, { max: 1 });
  const [{ now }] = await sql`select now()`;
  console.log(`Connected. DB time: ${now}. Nothing to seed yet.`);
  await sql.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
