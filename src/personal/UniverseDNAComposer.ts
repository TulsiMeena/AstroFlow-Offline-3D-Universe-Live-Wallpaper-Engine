import { UniverseRecipe, PersonalWorld } from './types';
import { WorldRecipeManager } from './WorldRecipeManager';
import { BatteryImpactEstimator } from '../power/BatteryImpactEstimator';
import { QualityProfile } from '../types/engine';

export class UniverseDNAComposer {
  /**
   * Assembles a complete PersonalWorld from a UniverseRecipe.
   */
  public static compose(recipe: UniverseRecipe): PersonalWorld {
    // 1. Generate all compatible DNA systems
    const worldDNA = WorldRecipeManager.toWorldDNA(recipe);
    const environmentDNA = WorldRecipeManager.toEnvironmentDNA(recipe);
    const ecosystemDNA = WorldRecipeManager.toEcosystemDNA(recipe);
    const fusionDNA = WorldRecipeManager.toFusionDNA(recipe);
    const designDNA = WorldRecipeManager.toDesignDNA(recipe);

    // 2. Battery Impact Assessment
    const assessment = BatteryImpactEstimator.estimateImpact(designDNA);

    // Update recipe assessment in place
    recipe.batteryAssessment = {
      impact: assessment.impact,
      performanceLoad: assessment.performanceLoad,
      recommendedQuality: assessment.recommendedQuality
    };

    return {
      id: `pw_${recipe.numericSeed}_${recipe.createdAt}`,
      name: recipe.name,
      seed: recipe.seed,
      numericSeed: recipe.numericSeed,
      recipe,
      worldDNA,
      environmentDNA,
      ecosystemDNA,
      fusionDNA,
      designDNA,
      isFavorite: false,
      createdAt: recipe.createdAt,
      lastModified: Date.now()
    };
  }
}
