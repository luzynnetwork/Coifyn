import { baseFetch } from "../http/base-fetch";
import type { JoinQueueInput, QueueEntryView } from "./types";

/** POST /queue */
export function joinQueue(input: JoinQueueInput): Promise<QueueEntryView> {
  return baseFetch<QueueEntryView>("/queue", { method: "POST", body: input });
}
