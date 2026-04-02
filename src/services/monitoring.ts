import * as Sentry from '@sentry/react-native';

let firebaseInitialized = false;
let analyticsAvailable = false;
let crashlyticsAvailable = false;

export const initMonitoring = () => {
  // Sentry is initialized by the Sentry plugin in app.config.ts
  // This function is kept for compatibility but Sentry initialization
  // happens automatically through the @sentry/react-native plugin
  console.log('[Monitoring] Initialized');
};

export const initFirebase = () => {
  try {
    // Firebase is initialized automatically by the plugin
    // This function is kept for explicit initialization if needed
    
    // Try to load Firebase modules dynamically
    try {
      const crashlytics = require('@react-native-firebase/crashlytics').default;
      crashlytics().setCrashlyticsCollectionEnabled(true);
      crashlyticsAvailable = true;
      console.log('[Firebase] Crashlytics enabled');
    } catch (e) {
      console.log('[Firebase] Crashlytics not available:', (e as Error).message);
    }

    try {
      const { getAnalytics, logEvent } = require('@react-native-firebase/analytics');
      analyticsAvailable = true;
      console.log('[Firebase] Analytics available');
    } catch (e) {
      console.log('[Firebase] Analytics not available:', (e as Error).message);
    }

    firebaseInitialized = true;
    console.log('[Firebase] Initialized');
  } catch (error) {
    console.error('[Firebase] Initialization error:', error);
  }
};

export const captureError = (error: any, context?: Record<string, any>) => {
  console.error('[Error Capture]:', error, context);
  if (context) {
    Sentry.captureException(error, { contexts: { custom: context } });
  } else {
    Sentry.captureException(error);
  }
  
  // Also log to Firebase Crashlytics if available
  if (crashlyticsAvailable) {
    try {
      const crashlytics = require('@react-native-firebase/crashlytics').default;
      crashlytics().recordError(error);
    } catch (e) {
      console.error('[Crashlytics] Error logging:', e);
    }
  }
};

export const logBreadcrumb = (message: string, category?: string, level?: string) => {
  console.log(`[Breadcrumb] ${category || 'default'}: ${message}`, level);
  Sentry.captureMessage(message, level as Sentry.SeverityLevel || 'info');
};

export const logAnalyticsEvent = (eventName: string, params?: Record<string, any>) => {
  if (!analyticsAvailable) {
    console.log(`[Analytics] Not available, skipping event: ${eventName}`);
    return;
  }

  try {
    const { getAnalytics, logEvent } = require('@react-native-firebase/analytics');
    const analytics = getAnalytics();
    logEvent(analytics, eventName, params);
    console.log(`[Analytics] Event logged: ${eventName}`, params);
  } catch (error) {
    console.error('[Analytics] Error logging event:', error);
  }
};
