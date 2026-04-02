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
  'Plus': 'add',
  'Edit': 'edit',
  'Settings': 'settings',
  'Home': 'home',
  'Clock': 'history',
  'BarChart': 'bar-chart',
  'Dumbbell': 'fitness-center',
};

export function AppIcon({ 
  name, 
  size = 24, 
  color, 
  style, 
}: AppIconProps) {
  const { colors } = useTheme();
  const iconName = ICON_MAP[name] || name;

  return (
    <MaterialIcons 
      name={iconName as any}
      size={size} 
      color={color || colors.foreground} 
      style={style}
    />
  );
}
