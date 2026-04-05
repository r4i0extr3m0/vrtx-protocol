import React, { useRef, useState, useCallback } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  FlatList, 
  Dimensions, 
  Platform,
  NativeSyntheticEvent,
  NativeScrollEvent
} from 'react-native';
import { router } from 'expo-router';
import Animated, { 
  useSharedValue, 
  useAnimatedScrollHandler, 
  FadeIn,
  FadeInDown,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/src/hooks';
import { typography } from '@/src/theme';
import { AppIcon } from '@/src/components/AppIcon';
import { 
  ScreenWrapper, 
  GlassCardLiquid, 
  ParallaxLayer, 
  TiltCard3D, 
  LiquidProgress,
  NeonButton 
} from '../components/ui';

const { width, height } = Dimensions.get('window');

interface OnboardingSlide {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  iconColor: string;
}

const SLIDES: OnboardingSlide[] = [
  {
    id: '1',
    title: 'VRTX PROTOCOL',
    subtitle: 'Inicializando protocolo de performance humana de elite.',
    icon: 'Cpu',
    iconColor: '#3B82F6',
  },
  {
    id: '2',
    title: 'COMMAND CENTER',
    subtitle: 'Treino, nutrição, IA preditiva e gamificação em um único protocolo.',
    icon: 'LayoutGrid',
    iconColor: '#3B82F6',
  },
  {
    id: '3',
    title: 'ELITE PERFORMANCE',
    subtitle: 'Projetado para atletas e profissionais de alto nível. Precisão industrial.',
    icon: 'Zap',
    iconColor: '#3B82F6',
  },
  {
    id: '4',
    title: 'READY TO EXECUTE?',
    subtitle: 'Sistema calibrado. Protocolo pronto para ativação imediata.',
    icon: 'Activity',
    iconColor: '#3B82F6',
  },
];

export function OnboardingScreen() {
  const { colors } = useTheme();
  const scrollX = useSharedValue(0);
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  const onScroll = useAnimatedScrollHandler((event) => {
    scrollX.value = event.contentOffset.x;
  });

  const onMomentumScrollEnd = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const index = Math.round(event.nativeEvent.contentOffset.x / width);
    if (index !== currentIndex) {
      setCurrentIndex(index);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }, [currentIndex]);

  const handleFinish = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    // TODO: Integrar com navegação existente após onboarding
    router.replace('/login' as any);
  };

  const renderItem = ({ item, index }: { item: OnboardingSlide; index: number }) => {
    const isLast = index === SLIDES.length - 1;

    return (
      <View style={[styles.slide, { width }]}>
        <View style={styles.layersContainer}>
          {/* Layer 1: Floating Icon with Parallax */}
          <ParallaxLayer 
            scrollX={scrollX} 
            index={index} 
            width={width} 
            speed={0.4}
            style={styles.iconLayer}
          >
            <View style={[styles.iconContainer, { backgroundColor: 'rgba(59, 130, 246, 0.05)' }]}>
              <AppIcon name={item.icon as any} size={80} color={item.iconColor} />
              <View style={[styles.iconGlow, { backgroundColor: item.iconColor }]} />
            </View>
          </ParallaxLayer>

          {/* Layer 2: Main Content Card with 3D Tilt */}
          <TiltCard3D scrollX={scrollX} index={index} width={width} style={styles.cardLayer}>
            <GlassCardLiquid intensity={40} style={styles.card}>
              <Animated.View entering={FadeInDown.delay(200).duration(800)}>
                <Text style={[
                  styles.title, 
                  { 
                    color: colors.foreground, 
                    fontFamily: typography.family.heading,
                    letterSpacing: -1.5,
                  }
                ]}>
                  {item.title}
                </Text>
                
                <Text style={[
                  styles.subtitle, 
                  { 
                    color: colors.foregroundMuted, 
                    fontFamily: typography.family.mono 
                  }
                ]}>
                  {item.subtitle.toUpperCase()}
                </Text>

                {isLast && (
                  <Animated.View entering={FadeIn.delay(600)} style={styles.buttonContainer}>
                    <NeonButton 
                      label="ENTRAR NO SISTEMA" 
                      onPress={handleFinish} 
                      variant="primary"
                      style={styles.finishButton}
                    />
                  </Animated.View>
                )}
              </Animated.View>
            </GlassCardLiquid>
          </TiltCard3D>
        </View>
      </View>
    );
  };

  return (
    <ScreenWrapper withSafeArea={false} withPadding={false} style={styles.container}>
      <Animated.FlatList
        ref={flatListRef}
        data={SLIDES}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={onScroll}
        onMomentumScrollEnd={onMomentumScrollEnd}
        scrollEventThrottle={16}
        snapToInterval={width}
        decelerationRate="fast"
        bounces={false}
      />

      {/* Footer Navigation */}
      <View style={styles.footer}>
        <LiquidProgress 
          progress={(currentIndex + 1) / SLIDES.length} 
          count={SLIDES.length} 
          width={width * 0.4}
        />
        
        {currentIndex < SLIDES.length - 1 && (
          <Text style={[
            styles.footerText, 
            { color: colors.muted, fontFamily: typography.family.mono }
          ]}>
            DESLIZE_PARA_CALIBRAR
          </Text>
        )}
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0D0D0D',
  },
  slide: {
    flex: 1,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  layersContainer: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconLayer: {
    position: 'absolute',
    top: height * 0.15,
  },
  iconContainer: {
    width: 160,
    height: 160,
    borderRadius: 80,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  iconGlow: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    opacity: 0.1,
  },
  cardLayer: {
    width: '100%',
    paddingHorizontal: 20,
    marginTop: height * 0.2,
  },
  card: {
    width: '100%',
    minHeight: 280,
    justifyContent: 'center',
  },
  title: {
    fontSize: 36,
    fontWeight: '900',
    marginBottom: 16,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 11,
    lineHeight: 18,
    textAlign: 'center',
    opacity: 0.8,
    letterSpacing: 1,
  },
  buttonContainer: {
    marginTop: 32,
    width: '100%',
  },
  finishButton: {
    width: '100%',
    height: 56,
  },
  footer: {
    position: 'absolute',
    bottom: 60,
    left: 0,
    right: 0,
    alignItems: 'center',
    gap: 16,
  },
  footerText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 2,
    opacity: 0.4,
  },
});
