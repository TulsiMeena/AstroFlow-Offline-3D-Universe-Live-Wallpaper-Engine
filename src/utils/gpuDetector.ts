import { GPUInfo, GPUCapability } from '../types/engine';

export function detectGPU(): GPUInfo {
  const fallback: GPUInfo = {
    tier: 'MEDIUM',
    vendor: 'Unknown',
    renderer: 'Generic WebGL',
    isWebGL2: false
  };

  if (typeof window === 'undefined') return fallback;

  try {
    const canvas = document.createElement('canvas');
    const gl = (canvas.getContext('webgl2') ||
      canvas.getContext('webgl') ||
      canvas.getContext('experimental-webgl')) as WebGLRenderingContext | WebGL2RenderingContext | null;

    if (!gl) {
      return { ...fallback, tier: 'LOW' };
    }

    const isWebGL2 = typeof WebGL2RenderingContext !== 'undefined' && gl instanceof WebGL2RenderingContext;
    const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
    const vendor = debugInfo ? gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL) : gl.getParameter(gl.VENDOR) || 'Unknown';
    const renderer = debugInfo ? gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER) || 'Generic';

    const rendererStr = (renderer || '').toLowerCase();
    let tier: GPUCapability = 'MEDIUM';

    // High performance discrete GPUs or modern flagship mobile GPUs
    if (
      rendererStr.includes('nvidia') ||
      rendererStr.includes('radeon rx') ||
      rendererStr.includes('geforce') ||
      rendererStr.includes('apple m') ||
      rendererStr.includes('adreno 7') ||
      rendererStr.includes('mali-g7') ||
      rendererStr.includes('immortalis')
    ) {
      tier = 'HIGH';
    } else if (
      rendererStr.includes('intel hd') ||
      rendererStr.includes('mali-400') ||
      rendererStr.includes('adreno 3') ||
      rendererStr.includes('swiftshader') ||
      rendererStr.includes('basic render')
    ) {
      tier = 'LOW';
    } else {
      tier = 'MEDIUM';
    }

    return {
      tier,
      vendor: String(vendor),
      renderer: String(renderer),
      isWebGL2
    };
  } catch (e) {
    console.warn('GPU capability detection error:', e);
    return fallback;
  }
}
