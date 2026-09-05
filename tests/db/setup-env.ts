import { loadDotEnv, testDatabaseName } from "../support/load-env";

loadDotEnv();
process.env.DB_NAME = testDatabaseName();
