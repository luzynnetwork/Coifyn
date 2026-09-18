import { baseFetch } from "../http/base-fetch";
import type { AppointmentView, CreateAppointmentInput } from "./types";

/** POST /appointments */
export function createAppointment(input: CreateAppointmentInput): Promise<AppointmentView> {
  return baseFetch<AppointmentView>("/appointments", { method: "POST", body: input });
}
