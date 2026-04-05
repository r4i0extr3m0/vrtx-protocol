import { 
  withSpring, 
  withTiming, 
  Easing,
  WithSpringConfig,
  WithTimingConfig
} from "react-native-reanimated";

/**
 * VRTX Protocol Animation Presets
 * Focus on "Heavy Metallic" feel (damped springs) and "Cinematic" fades.
 */

export const animations = {
  // Heavy Metal Spring (Damped, high stiffness)
  spring: {
    heavy: {
      damping: 15,
      stiffness: 120,
      mass: 1,
    } as WithSpringConfig,
    
    // Light Bounce for Buttons
    pop: {
      damping: 10,
      stiffness: 300,
      mass: 0.8,
    } as WithSpringConfig,
    tight: {
      damping: 12,
      stiffness: 220,
      mass: 0.9,
    } as WithSpringConfig,
    
    // Smooth Transition
    smooth: {
      damping: 20,
      stiffness: 100,
      mass: 1,
    } as WithSpringConfig,
  },
  
  // Cinematic Timing (Exponential/Bezier)
  timing: {
    cinematic: {
      duration: 600,
      easing: Easing.bezier(0.25, 0.1, 0.25, 1),
    } as WithTimingConfig,
    
    fast: {
      duration: 250,
      easing: Easing.out(Easing.quad),
    } as WithTimingConfig,
    
    slow: {
      duration: 1200,
      easing: Easing.inOut(Easing.ease),
    } as WithTimingConfig,
  },
  
  // Stagger Presets
  stagger: {
    base: 50,
    delayed: 100,
    long: 200,
  },
};

// Helper for entering animations
export const entrance = {
  duration: 600,
  springify: (config = animations.spring.heavy) => ({
    damping: config.damping,
    stiffness: config.stiffness,
    mass: config.mass,
  }),
};
