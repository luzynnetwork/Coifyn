/**
 * What authorize() needs to decide a scoped permission. A feature use case
 * resolves the salon (and, for a scopable grant, the branch) from the entity it
 * is acting on, then passes it here.
 */
export interface ResourceContext {
  /** The salon the action belongs to. Required — there is no salon-less action. */
  salonId: string;
  /**
   * The branch the action belongs to, when the entity has one. A branch-scoped
   * grant is satisfied only if the caller is a member of THIS branch. Omit for
   * salon-level actions.
   */
  branchId?: string | null;
}
