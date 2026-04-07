import { useActor as _useActor } from "@caffeineai/core-infrastructure";
import { type Backend, createActor } from "../backend";

/**
 * Returns the typed Backend actor and isFetching status.
 * authClient is managed internally by InternetIdentityProvider via useRef (not useState).
 */
export function useActor(): { actor: Backend | null; isFetching: boolean } {
  return _useActor<Backend>(createActor);
}
