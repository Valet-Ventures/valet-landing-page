/** Test doubles that mirror the contracts in lib/waitlist. */
import type { Mailer, OutgoingEmail } from "../../lib/waitlist/mailer";
import type { ClaimOutcome, SignupInput, WaitlistStore } from "../../lib/waitlist/store";

export interface FakeStore extends WaitlistStore {
  rows: Map<string, { number: number | null; status: string; source: string }>;
  claimCalls: number;
  /** Seed a row that predates the migration, i.e. present but with no number. */
  seedUnnumbered(email: string): void;
}

/**
 * Mirrors `claim_founding_member`: claims are serialised the way the counter row lock
 * serialises them in Postgres, and a known email returns its existing number without
 * consuming a new one.
 */
export function createFakeStore(startAt = 50): FakeStore {
  const rows = new Map<string, { number: number | null; status: string; source: string }>();
  let counter = startAt;
  let queue: Promise<unknown> = Promise.resolve();

  const store: FakeStore = {
    rows,
    claimCalls: 0,

    seedUnnumbered(email) {
      rows.set(email, { number: null, status: "new", source: "landing" });
    },

    async claimFoundingMember(input: SignupInput): Promise<ClaimOutcome> {
      store.claimCalls += 1;
      const run = async (): Promise<ClaimOutcome> => {
        // Yield, so an unserialised implementation would interleave here and double-assign.
        await new Promise((r) => setTimeout(r, 0));
        const existing = rows.get(input.email);
        if (existing) {
          return { foundingMemberNumber: existing.number, created: false, status: existing.status };
        }
        counter += 1;
        rows.set(input.email, { number: counter, status: "waitlisted", source: input.source });
        return { foundingMemberNumber: counter, created: true, status: "waitlisted" };
      };
      const result = queue.then(run);
      queue = result.catch(() => undefined);
      return result;
    },

    async addSignup(input: SignupInput) {
      if (rows.has(input.email)) return { created: false };
      rows.set(input.email, { number: null, status: "waitlisted", source: input.source });
      return { created: true };
    },
  };

  return store;
}

export interface RecordingMailer extends Mailer {
  sent: OutgoingEmail[];
}

export function createRecordingMailer(failWith?: Error): RecordingMailer {
  const sent: OutgoingEmail[] = [];
  return {
    sent,
    async send(email) {
      if (failWith) throw failWith;
      sent.push(email);
    },
  };
}
