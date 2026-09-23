import React, { useEffect, useState } from 'react';
import { TransitionScheduler } from '../../scheduler/TransitionScheduler';
import { TransitionState } from '../../scheduler/types';

export const TransitionOverlay: React.FC = () => {
  const [transitionState, setTransitionState] = useState<TransitionState>({
    isTransitioning: false,
    type: 'crossfade',
    progress: 0,
    duration: 1.0,
    fromWallpaperId: null,
    toWallpaperId: null
  });

  useEffect(() => {
    const scheduler = TransitionScheduler.getInstance();
    const unsub = scheduler.subscribe((state) => {
      setTransitionState(state);
    });
    return unsub;
  }, []);

  if (!transitionState.isTransitioning) {
    return null;
  }

  const { type, progress } = transitionState;

  // Render transition visuals based on type
  switch (type) {
    case 'fade': {
      // Dark fade out and back in
      const opacity = progress < 0.5 ? progress * 2 : (1 - progress) * 2;
      return (
        <div
          className="fixed inset-0 z-30 pointer-events-none bg-black transition-none"
          style={{ opacity }}
        />
      );
    }

    case 'portal': {
      // Expanding glowing radial portal
      const scale = 0.2 + progress * 2.5;
      const opacity = 1 - progress;
      return (
        <div className="fixed inset-0 z-30 pointer-events-none flex items-center justify-center overflow-hidden">
          <div
            className="w-96 h-96 rounded-full border-4 border-[#00F0FF] shadow-[0_0_100px_#00F0FF,inset_0_0_100px_#7000FF] bg-gradient-to-r from-[#00F0FF]/30 to-[#7000FF]/40 blur-sm"
            style={{
              transform: `scale(${scale})`,
              opacity
            }}
          />
        </div>
      );
    }

    case 'energy': {
      // High-frequency energy flash
      const opacity = progress < 0.3 ? progress * 3.3 : (1 - progress) * 1.4;
      return (
        <div
          className="fixed inset-0 z-30 pointer-events-none bg-gradient-to-b from-[#00F0FF]/40 via-[#7000FF]/30 to-black/60 backdrop-blur-xs"
          style={{ opacity }}
        />
      );
    }

    case 'particle_dissolve': {
      // Shimmer dissolve effect
      const opacity = Math.sin(progress * Math.PI) * 0.85;
      return (
        <div
          className="fixed inset-0 z-30 pointer-events-none bg-radial from-transparent via-[#00FFA3]/20 to-black/80 backdrop-blur-sm"
          style={{ opacity }}
        />
      );
    }

    case 'smooth_camera':
    case 'crossfade':
    default: {
      // Smooth subtle dark blend
      const opacity = Math.sin(progress * Math.PI) * 0.6;
      return (
        <div
          className="fixed inset-0 z-30 pointer-events-none bg-[#05070e]"
          style={{ opacity }}
        />
      );
    }
  }
};
