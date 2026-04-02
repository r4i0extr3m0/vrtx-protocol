import React from 'react';
import { View } from 'react-native';
import { AppButton } from '../../src/components/AppButton';

export default {
  title: 'Components/AppButton',
  component: AppButton,
  argTypes: {
    onPress: { action: 'pressed' },
  },
  decorators: [
    (Story) => (
      <View style={{ padding: 16, flex: 1, justifyContent: 'center' }}>
        <Story />
      </View>
    ),
  ],
};

export const Primary = {
  args: {
    label: 'Botão Primário',
    variant: 'primary',
  },
};

export const Secondary = {
  args: {
    label: 'Botão Secundário',
    variant: 'secondary',
  },
};

export const Brand = {
  args: {
    label: 'Botão Brand',
    variant: 'brand',
  },
};

export const Ghost = {
  args: {
    label: 'Botão Ghost',
    variant: 'ghost',
  },
};
