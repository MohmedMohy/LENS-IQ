import { db } from "../db/db.js";
import type { ScoringProfile } from "../engine/scoring/types.js";
import { DEFAULT_SCORING_PROFILE, DEFAULT_AFFORDABILITY_PROFILE } from "../engine/scoring/ScoringEngine.js";

export class ScoringProfileResolver {

  static async loadRiskProfile(tenantId: number): Promise<ScoringProfile> {
    return this.load(tenantId, "RISK");
  }

  static async loadAffordabilityProfile(tenantId: number): Promise<ScoringProfile> {
    return this.load(tenantId, "AFFORDABILITY");
  }

  static async load(tenantId: number, type: "RISK" | "AFFORDABILITY"): Promise<ScoringProfile> {
    const profile = await this.loadFromDb(tenantId, type);
    if (profile) return profile;

    const globalProfile = await this.loadFromDb(null, type);
    if (globalProfile) return globalProfile;

    return type === "RISK"
      ? { ...DEFAULT_SCORING_PROFILE, rules: [...DEFAULT_SCORING_PROFILE.rules] }
      : { ...DEFAULT_AFFORDABILITY_PROFILE, rules: [...DEFAULT_AFFORDABILITY_PROFILE.rules] };
  }

  private static async loadFromDb(
    tenantId: number | null,
    type: string
  ): Promise<ScoringProfile | null> {
    let result;
    if (tenantId === null) {
      result = await db.query(
        `SELECT id, name, base_score, thresholds, type
         FROM scoring_profiles
         WHERE tenant_id IS NULL AND type = $1 AND active = true
         ORDER BY id LIMIT 1`,
        [type]
      );
    } else {
      result = await db.query(
        `SELECT id, name, base_score, thresholds, type
         FROM scoring_profiles
         WHERE tenant_id = $1 AND type = $2 AND active = true
         ORDER BY id LIMIT 1`,
        [tenantId, type]
      );
    }

    if (result.rows.length === 0) return null;

    const row = result.rows[0];
    const profileId = row.id;

    const rulesResult = await db.query(
      `SELECT field, operator, value, score_adjustment, max_adjustment, conditions
       FROM scoring_profile_rules
       WHERE profile_id = $1
       ORDER BY priority`,
      [profileId]
    );

    return {
      id: `db_${type.toLowerCase()}_${profileId}`,
      name: row.name,
      baseScore: Number(row.base_score),
      thresholds: row.thresholds ?? (type === "RISK" ? { high: 65, medium: 35 } : { high: 60, medium: 30 }),
      rules: rulesResult.rows.map((r: any) => ({
        id: `rule_${profileId}_${r.field}_${r.operator}_${r.value}`,
        name: `${r.field} ${r.operator} ${r.value}`,
        field: r.field,
        operator: r.operator,
        value: r.value,
        scoreAdjustment: Number(r.score_adjustment),
        maxAdjustment: r.max_adjustment ? Number(r.max_adjustment) : undefined,
        conditions: r.conditions || undefined,
      })),
    };
  }
}
