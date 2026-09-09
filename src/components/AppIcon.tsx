import React from 'react';
import { StyleProp, TextStyle } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '@/src/hooks';

export type IconName = string;

interface AppIconProps {
  name: IconName;
  size?: number;
  color?: string;
  style?: StyleProp<TextStyle>;
  strokeWidth?: number;
}

const ICON_MAP: Record<string, string> = {
  'Maximize2': 'fullscreen',
  'Trash2': 'delete',
  'Check': 'check',
  'ChevronRight': 'chevron-right',
  'Plus': 'add',
  'Edit': 'edit',
  'Settings': 'settings',
  'Home': 'home',
  'Clock': 'history',
  'BarChart': 'bar-chart',
  'BarChart2': 'bar-chart',
  'Dumbbell': 'fitness-center',
  'Zap': 'bolt',
  'Cpu': 'memory',
  'ClipboardList': 'assignment',
  'Apple': 'apple',
  'TrendingUp': 'trending-up',
  'User': 'person',
  'Users': 'group',
  'UserPlus': 'person-add',
  'UserMinus': 'person-remove',
  'Link': 'link',
  'Copy': 'content-copy',
  'Send': 'send',
  'Refresh': 'refresh',
  'PersonSearch': 'manage-search',
  'Camera': 'photo-camera',
  'Beef': 'set-meal',
  'Wheat': 'grain',
  'Droplets': 'water-drop',
  'Utensils': 'restaurant',
  'Coffee': 'coffee',
  'Moon': 'dark-mode',
  'Flame': 'local-fire-department',
  'Star': 'star',
  'Trophy': 'emoji-events',
  'Calendar': 'calendar-today',
  'AlertTriangle': 'warning-amber',
  'X': 'close',
};

export function AppIcon({ 
  name, 
  size = 24, 
  color, 
  style, 
}: AppIconProps) {
  const { colors } = useTheme();
  const iconName = ICON_MAP[name] || name || 'help_outline';

  return (
    <MaterialIcons 
      name={iconName as any}
      size={size} 
      color={color || colors.foreground} 
      style={style}
    />
  );
}
