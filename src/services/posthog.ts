import { PostHog } from 'posthog-react-native';

let posthogInstance: PostHog | null = null;

export const initPostHog = (apiKey: string, host?: string) => {
  try {
    if (!apiKey) {
      console.log('[PostHog] API key not configured, skipping initialization');
      return;
    }

    posthogInstance = new PostHog(apiKey, {
      host: host || 'https://us.i.posthog.com',
    });

    console.log('[PostHog] Initialized');
  } catch (error) {
    console.error('[PostHog] Initialization error:', error);
  }
};

export const captureEvent = (eventName: string, properties?: Record<string, any>) => {
  try {
    if (!posthogInstance) {
      console.log('[PostHog] Not initialized, skipping event capture');
      return;
    }

    posthogInstance.capture(eventName, properties);
    console.log(`[PostHog] Event captured: ${eventName}`, properties);
  } catch (error) {
    console.error('[PostHog] Error capturing event:', error);
  }
};

export const identifyUser = (userId: string, properties?: Record<string, any>) => {
  try {
    if (!posthogInstance) {
      console.log('[PostHog] Not initialized, skipping user identification');
      return;
    }

    posthogInstance.identify(userId, properties);
    console.log(`[PostHog] User identified: ${userId}`, properties);
  } catch (error) {
    console.error('[PostHog] Error identifying user:', error);
  }
};

export const resetUser = () => {
  try {
    if (!posthogInstance) {
      console.log('[PostHog] Not initialized, skipping user reset');
      return;
    }

    posthogInstance.reset();
    console.log('[PostHog] User reset');
  } catch (error) {
    console.error('[PostHog] Error resetting user:', error);
  }
};
