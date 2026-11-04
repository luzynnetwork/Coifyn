/** Where the NestJS API lives, as seen from this Next server (never the browser). */
export function backendUrl(): string {
  return process.env.API_URL ?? "http://localhost:4000";
}
