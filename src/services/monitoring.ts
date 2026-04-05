import * as Sentry from '@sentry/react-native';

let analyticsAvailable = false;
let crashlyticsAvailable = false;
let monitoringInitialized = false;
let firebaseInitialized = false;

let analyticsModulePromise: Promise<typeof import('@react-native-firebase/analytics')> | null = null;
let crashlyticsModulePromise: Promise<typeof import('@react-native-firebase/crashlytics')> | null = null;

const getAnalyticsModule = () => {
  if (!analyticsModulePromise) {
    analyticsModulePromise = import('@react-native-firebase/analytics');
  }

  return analyticsModulePromise;
};

const getCrashlyticsModule = () => {
  if (!crashlyticsModulePromise) {
    crashlyticsModulePromise = import('@react-native-firebase/crashlytics');
  }

  return crashlyticsModulePromise;
};

export const initMonitoring = () => {
  if (monitoringInitialized) {
    return;
  }

  const dsn = process.env.EXPO_PUBLIC_SENTRY_DSN;
  Sentry.init({
    dsn,
    enabled: Boolean(dsn),
    tracesSampleRate: 1.0,
  });

  monitoringInitialized = true;
  console.log('[Monitoring] Initialized');
};

export const initFirebase = async () => {
  if (firebaseInitialized) {
    return;
  }

  try {
    // Firebase is initialized automatically by the plugin
    // This function is kept for explicit initialization if needed
    
    try {
      const crashlyticsModule = await getCrashlyticsModule();
      const crashlytics = crashlyticsModule.default;
      crashlytics().setCrashlyticsCollectionEnabled(true);
      crashlyticsAvailable = true;
      console.log('[Firebase] Crashlytics enabled');
    } catch (e) {
      console.log('[Firebase] Crashlytics not available:', (e as Error).message);
    }

    try {
      await getAnalyticsModule();
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
    void getCrashlyticsModule()
      .then((crashlyticsModule) => {
        const crashlytics = crashlyticsModule.default;
        const normalizedError = error instanceof Error ? error : new Error(String(error));
        crashlytics().recordError(normalizedError);
      })
      .catch((e) => {
        console.error('[Crashlytics] Error logging:', e);
      });
  }
};

export const logBreadcrumb = (message: string, category?: string, level?: string) => {
  console.log(`[Breadcrumb] ${category || 'default'}: ${message}`, level);
  Sentry.captureMessage(message, level as Sentry.SeverityLevel || 'info');
};

export const logAnalyticsEvent = async (eventName: string, params?: Record<string, any>) => {
  if (!analyticsAvailable) {
    console.log(`[Analytics] Not available, skipping event: ${eventName}`);
    return;
  }

  try {
    const analyticsModule = await getAnalyticsModule();
    const analytics = analyticsModule.default;
    await analytics().logEvent(eventName, params);
    console.log(`[Analytics] Event logged: ${eventName}`, params);
  } catch (error) {
    console.error('[Analytics] Error logging event:', error);
  }
};
