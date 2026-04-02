export const trackEvent = async (eventName: string, properties?: Record<string, any>) => {
  try {
    console.log(`[Analytics] Event: ${eventName}`, properties);
  } catch (error) {
    console.error(`[Analytics Error] ${eventName}:`, error);
  }
};

export const identifyUser = async (userId: string, traits?: Record<string, any>) => {
  try {
    console.log(`[Analytics] Identify User: ${userId}`, traits);
  } catch (error) {
    console.error('[Analytics Error] Identify User:', error);
  }
};

export const ANALYTICS_EVENTS = {
  WORKOUT_STARTED: 'workout_started',
  WORKOUT_FINISHED: 'workout_finished',
  MEAL_ADDED: 'meal_added',
  PURCHASE_STARTED: 'purchase_started',
  PR_ACHIEVED: 'pr_achieved',
  ONBOARDING_COMPLETED: 'onboarding_completed',
};
