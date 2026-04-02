import { logAnalyticsEvent } from './monitoring';
import { captureEvent, identifyUser } from './posthog';
import * as Sentry from '@sentry/react-native';

/**
 * Test function to verify all monitoring services are working
 * Call this from a button or screen to test event logging
 */
export const testAllMonitoringServices = async () => {
  console.log('[Test] Starting monitoring services test...');

  try {
    // Test Firebase Analytics
    await logAnalyticsEvent('test_event', {
      source: 'manual',
      timestamp: new Date().toISOString(),
    });
    console.log('[Test] Firebase Analytics event logged');
  } catch (error) {
    console.error('[Test] Firebase Analytics error:', error);
  }

  try {
    // Test PostHog
    captureEvent('test_event', {
      source: 'manual',
      timestamp: new Date().toISOString(),
    });
    console.log('[Test] PostHog event captured');
  } catch (error) {
    console.error('[Test] PostHog error:', error);
  }

  try {
    // Test Sentry
    Sentry.captureMessage('Test Sentry message', 'info');
    console.log('[Test] Sentry message captured');
  } catch (error) {
    console.error('[Test] Sentry error:', error);
  }

  console.log('[Test] Monitoring services test completed');
};

/**
 * Test function to identify a user across all services
 */
export const testUserIdentification = async (userId: string, email?: string) => {
  console.log('[Test] Starting user identification test...');

  try {
    // Identify in PostHog
    identifyUser(userId, {
      email,
      identified_at: new Date().toISOString(),
    });
    console.log('[Test] User identified in PostHog');
  } catch (error) {
    console.error('[Test] PostHog identification error:', error);
  }

  try {
    // Set user context in Sentry
    Sentry.setUser({
      id: userId,
      email,
    });
    console.log('[Test] User context set in Sentry');
  } catch (error) {
    console.error('[Test] Sentry user context error:', error);
  }

  console.log('[Test] User identification test completed');
};
