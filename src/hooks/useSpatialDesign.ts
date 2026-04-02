import { useMemo } from 'react';
import { useTheme } from './useTheme';
import { shadows } from '../theme/shadows';

export function useSpatialDesign() {
  const { scheme, colors } = useTheme();

  return useMemo(() => {
    const isDark = scheme === 'dark';

    return {
      blurIntensity: isDark ? 40 : 25,
      blurTint: isDark ? 'dark' : 'light',
      shadowStyle: isDark ? {
        ...shadows.card,
        shadowColor: '#000',
        shadowOpacity: 0.5,
        shadowRadius: 15,
      } : {
        ...shadows.card,
        shadowColor: colors.border,
        shadowOpacity: 0.1,
        shadowRadius: 10,
      },
      elevation: isDark ? 5 : 2,
    };
  }, [scheme, colors]);
}
