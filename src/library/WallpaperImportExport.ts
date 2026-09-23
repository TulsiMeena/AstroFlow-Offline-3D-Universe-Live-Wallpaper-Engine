import { LibraryWallpaperItem } from './types';
import { PersonalPresetManager } from '../personal/PersonalPresetManager';
import { CustomWallpaperManager } from '../designer/storage/CustomWallpaperManager';
import { FusionStorage } from '../infinite/storage/FusionStorage';
import { PersonalWorld } from '../personal/types';
import { DesignDNA } from '../designer/types/designDNA';
import { FusionDNA } from '../infinite/types/infiniteTypes';

const WORLD_CODE_PREFIX = 'HW-UNIVERSE-v1:';
const DESIGN_CODE_PREFIX = 'HW-DESIGN-v1:';
const FUSION_CODE_PREFIX = 'HW-FUSION-v1:';

export interface ImportResult {
  success: boolean;
  message: string;
  importedId?: string;
  type?: 'world' | 'design' | 'fusion';
}

export class WallpaperImportExport {
  /**
   * Generates a transportable, compact World Code or Design Code for the wallpaper.
   */
  public static exportToCode(item: LibraryWallpaperItem): string {
    if (item.personalWorld) {
      return PersonalPresetManager.exportWorldCode(item.personalWorld);
    }

    if (item.designDNA) {
      const payload = {
        type: 'design',
        name: item.name,
        seed: item.seed,
        dna: item.designDNA
      };
      const json = JSON.stringify(payload);
      return `${DESIGN_CODE_PREFIX}${btoa(encodeURIComponent(json))}`;
    }

    if (item.fusionDNA) {
      const payload = {
        type: 'fusion',
        dna: item.fusionDNA
      };
      const json = JSON.stringify(payload);
      return `${FUSION_CODE_PREFIX}${btoa(encodeURIComponent(json))}`;
    }

    // Built-in configuration code
    const payload = {
      type: 'builtin',
      id: item.id,
      name: item.name,
      seed: item.seed,
      category: item.category,
      accentColor: item.accentColor,
      secondaryColor: item.secondaryColor
    };
    const json = JSON.stringify(payload);
    return `${WORLD_CODE_PREFIX}${btoa(encodeURIComponent(json))}`;
  }

  /**
   * Generates clean formatted JSON for file download or clipboard copy.
   */
  public static exportToJSON(item: LibraryWallpaperItem): string {
    const cleanObject: any = {
      app: 'Amit HyperWall',
      version: '1.0.0',
      exportTime: new Date().toISOString(),
      metadata: {
        id: item.id,
        name: item.name,
        category: item.category,
        environment: item.environment,
        style: item.style,
        weather: item.weather,
        seed: item.seed,
        tags: item.tags,
        batteryImpact: item.batteryImpact,
        performance: item.performance
      }
    };

    if (item.personalWorld) {
      cleanObject.personalWorld = item.personalWorld;
    } else if (item.designDNA) {
      cleanObject.designDNA = item.designDNA;
    } else if (item.fusionDNA) {
      cleanObject.fusionDNA = item.fusionDNA;
    } else {
      cleanObject.builtinReference = item.id;
    }

    return JSON.stringify(cleanObject, null, 2);
  }

  /**
   * Strictly validates and imports a World Code, Design Code, or JSON string.
   */
  public static importFromCodeOrJSON(rawInput: string): ImportResult {
    const input = rawInput.trim();
    if (!input) {
      return { success: false, message: 'Input cannot be empty.' };
    }

    // 1. Check for Prototype Pollution or Code Injection risks
    if (
      input.includes('__proto__') ||
      input.includes('constructor') ||
      input.includes('prototype') ||
      input.includes('<script') ||
      input.includes('javascript:')
    ) {
      return {
        success: false,
        message: 'Security validation failed: Prohibited keys detected in payload.'
      };
    }

    // 2. Direct World Code (HW-UNIVERSE-v1:)
    if (input.startsWith(WORLD_CODE_PREFIX)) {
      const world = PersonalPresetManager.importWorldCode(input);
      if (world) {
        PersonalPresetManager.saveWorld(world);
        return {
          success: true,
          message: `Successfully imported universe: "${world.name}"`,
          importedId: `personal-${world.id}`,
          type: 'world'
        };
      }
      return { success: false, message: 'Invalid or corrupt World Code.' };
    }

    // 3. Design Code (HW-DESIGN-v1:)
    if (input.startsWith(DESIGN_CODE_PREFIX)) {
      try {
        const encoded = input.slice(DESIGN_CODE_PREFIX.length);
        const json = decodeURIComponent(atob(encoded));
        const parsed = JSON.parse(json);
        if (parsed && parsed.dna && parsed.dna.seed) {
          const saved = CustomWallpaperManager.saveWallpaper(parsed.name || 'Imported Design', parsed.dna);
          return {
            success: true,
            message: `Successfully imported design: "${saved.name}"`,
            importedId: `custom-design-${saved.seed}`,
            type: 'design'
          };
        }
      } catch (e) {
        return { success: false, message: 'Failed to decode Design Code.' };
      }
    }

    // 4. Fusion Code (HW-FUSION-v1:)
    if (input.startsWith(FUSION_CODE_PREFIX)) {
      try {
        const encoded = input.slice(FUSION_CODE_PREFIX.length);
        const json = decodeURIComponent(atob(encoded));
        const parsed = JSON.parse(json);
        if (parsed && parsed.dna && parsed.dna.id) {
          FusionStorage.saveWorld(parsed.dna);
          return {
            success: true,
            message: `Successfully imported fused world: "${parsed.dna.name}"`,
            importedId: `fused-${parsed.dna.id}`,
            type: 'fusion'
          };
        }
      } catch (e) {
        return { success: false, message: 'Failed to decode Fusion Code.' };
      }
    }

    // 5. Raw JSON Payload
    if (input.startsWith('{')) {
      try {
        const parsed = JSON.parse(input);

        // Check if Personal World
        if (parsed.personalWorld && parsed.personalWorld.recipe) {
          const pw = parsed.personalWorld as PersonalWorld;
          PersonalPresetManager.saveWorld(pw);
          return {
            success: true,
            message: `Imported Universe: "${pw.name}"`,
            importedId: `personal-${pw.id}`,
            type: 'world'
          };
        }

        // Check if DesignDNA
        if (parsed.designDNA && parsed.designDNA.seed) {
          const dna = parsed.designDNA as DesignDNA;
          const name = parsed.metadata?.name || 'Imported JSON Design';
          const saved = CustomWallpaperManager.saveWallpaper(name, dna);
          return {
            success: true,
            message: `Imported Design: "${saved.name}"`,
            importedId: `custom-design-${saved.seed}`,
            type: 'design'
          };
        }

        // Check if FusionDNA
        if (parsed.fusionDNA && parsed.fusionDNA.id) {
          const fdna = parsed.fusionDNA as FusionDNA;
          FusionStorage.saveWorld(fdna);
          return {
            success: true,
            message: `Imported Fused World: "${fdna.name}"`,
            importedId: `fused-${fdna.id}`,
            type: 'fusion'
          };
        }
      } catch (e) {
        return { success: false, message: 'Malformed JSON payload.' };
      }
    }

    return {
      success: false,
      message: 'Unrecognized format. Must start with HW-UNIVERSE-v1:, HW-DESIGN-v1:, or be valid HyperWall JSON.'
    };
  }
}
