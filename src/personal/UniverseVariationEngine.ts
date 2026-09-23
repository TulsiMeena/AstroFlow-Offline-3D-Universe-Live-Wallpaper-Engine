import { UniverseRecipe, VariationModifier } from './types';
import { UniverseRecipeEngine } from './UniverseRecipeEngine';

export class UniverseVariationEngine {
  /**
   * Derives a deterministic seed variation (1 through 4) while strictly preserving base concept.
   */
  public static createVariation(baseRecipe: UniverseRecipe, variationIndex: 1 | 2 | 3 | 4): UniverseRecipe {
    const variationSeed = `${baseRecipe.seed}-V${variationIndex}`;

    return UniverseRecipeEngine.createRecipe({
      worldType: baseRecipe.worldType,
      style: baseRecipe.style,
      atmosphere: baseRecipe.atmosphere,
      motion: baseRecipe.motion,
      performance: baseRecipe.performance,
      customPrompt: baseRecipe.customPrompt,
      seed: variationSeed,
      name: `${baseRecipe.name} (Variation ${variationIndex})`
    });
  }

  /**
   * Produces a modified recipe by applying a directional conceptual shift.
   */
  public static applyModifier(baseRecipe: UniverseRecipe, modifier: VariationModifier): UniverseRecipe {
    const clone = { ...baseRecipe };
    const seed = `${baseRecipe.seed}-${modifier.replace(/[\s-]+/g, '').substring(4, 8)}`;

    switch (modifier) {
      case 'MORE COSMIC':
        return UniverseRecipeEngine.createRecipe({
          worldType: baseRecipe.worldType === 'SPACE' ? 'SPACE' : 'MIXED',
          style: baseRecipe.style,
          atmosphere: 'COSMIC',
          motion: baseRecipe.motion,
          performance: baseRecipe.performance,
          customPrompt: `${baseRecipe.customPrompt || ''} galaxy stars nebula cosmic dust`,
          seed,
          name: `${baseRecipe.name} [Cosmic Shift]`
        });

      case 'MORE CALM':
        return UniverseRecipeEngine.createRecipe({
          worldType: baseRecipe.worldType,
          style: 'PEACEFUL',
          atmosphere: 'CALM',
          motion: 'SUBTLE',
          performance: baseRecipe.performance,
          customPrompt: `${baseRecipe.customPrompt || ''} calm gentle soft peace`,
          seed,
          name: `${baseRecipe.name} [Calm Shift]`
        });

      case 'MORE DYNAMIC':
        return UniverseRecipeEngine.createRecipe({
          worldType: baseRecipe.worldType,
          style: 'NEON',
          atmosphere: 'DYNAMIC',
          motion: 'DYNAMIC',
          performance: baseRecipe.performance,
          customPrompt: `${baseRecipe.customPrompt || ''} energetic motion dynamic particles storm`,
          seed,
          name: `${baseRecipe.name} [Dynamic Shift]`
        });

      case 'MORE COLORFUL':
        return UniverseRecipeEngine.createRecipe({
          worldType: baseRecipe.worldType,
          style: 'NEON',
          atmosphere: baseRecipe.atmosphere,
          motion: baseRecipe.motion,
          performance: baseRecipe.performance,
          customPrompt: `${baseRecipe.customPrompt || ''} colorful glowing cyan magenta gold aurora`,
          seed,
          name: `${baseRecipe.name} [Colorful Shift]`
        });

      case 'MORE DARK':
        return UniverseRecipeEngine.createRecipe({
          worldType: baseRecipe.worldType,
          style: 'AMOLED',
          atmosphere: 'DEEP',
          motion: baseRecipe.motion,
          performance: baseRecipe.performance,
          customPrompt: `${baseRecipe.customPrompt || ''} dark black night void amoled`,
          seed,
          name: `${baseRecipe.name} [Dark Shift]`
        });

      case 'MORE REALISTIC-STYLE':
        return UniverseRecipeEngine.createRecipe({
          worldType: baseRecipe.worldType,
          style: 'REALISTIC-STYLE',
          atmosphere: 'CALM',
          motion: 'BALANCED',
          performance: baseRecipe.performance,
          customPrompt: `${baseRecipe.customPrompt || ''} natural realistic terrain lighting`,
          seed,
          name: `${baseRecipe.name} [Realistic Shift]`
        });

      case 'MORE ABSTRACT':
        return UniverseRecipeEngine.createRecipe({
          worldType: 'ABSTRACT',
          style: 'MYSTICAL',
          atmosphere: 'DREAMLIKE',
          motion: baseRecipe.motion,
          performance: baseRecipe.performance,
          customPrompt: `${baseRecipe.customPrompt || ''} fractal crystal portal geometric surreal`,
          seed,
          name: `${baseRecipe.name} [Abstract Shift]`
        });
    }

    return clone;
  }
}
