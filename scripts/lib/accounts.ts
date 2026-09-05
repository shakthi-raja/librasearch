import type { Connection } from "mysql2/promise";
import type { AccountsEnv } from "../../src/lib/config/schema";

export type Account = { user: string; password: string; role: string };

/** Application accounts and the database role each one is granted. */
export function accounts(env: AccountsEnv): Account[] {
  return [{ user: env.DB_AUTH_USER, password: env.DB_AUTH_PASSWORD, role: "r_auth" }];
}

/**
 * Creates or updates each login account from the environment and grants its
 * role. Safe to run on every migrate: passwords follow the environment.
 */
export async function provisionAccounts(db: Connection, list: Account[]) {
  for (const account of list) {
    await db.query("CREATE USER IF NOT EXISTS ?@'%' IDENTIFIED BY ?", [
      account.user,
      account.password,
    ]);
    await db.query("ALTER USER ?@'%' IDENTIFIED BY ?", [account.user, account.password]);
    await db.query(`GRANT ${account.role} TO ?@'%'`, [account.user]);
    await db.query("SET DEFAULT ROLE ALL TO ?@'%'", [account.user]);
  }
}
