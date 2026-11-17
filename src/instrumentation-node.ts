import { setDefaultAutoSelectFamilyAttemptTimeout } from "node:net";

/**
 * Node tries each address of a host for only 250 ms before the next one. On a
 * slow network (campus Wi-Fi, a phone hotspot) that fails connections curl
 * makes fine, Google sign-in's token exchange among them. Two seconds per
 * address still falls back quickly when an address is really down.
 */
export function configureNetwork() {
  setDefaultAutoSelectFamilyAttemptTimeout(2000);
}
