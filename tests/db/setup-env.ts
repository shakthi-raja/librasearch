import { loadDotEnv, testDatabaseName } from "../support/load-env";

loadDotEnv();
process.env.DB_NAME = testDatabaseName();
// the worker tests write vectors; keep them out of the development collections
process.env.QDRANT_COLLECTION_PREFIX = "test_";
