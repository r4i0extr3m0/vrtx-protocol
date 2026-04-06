import { useState } from "react";
import { 
  StyleSheet, 
  Text, 
  View, 
  Pressable, 
  Image, 
  ActivityIndicator, 
  Alert,
  ScrollView
} from "react-native";
import { router } from "expo-router";
import Animated, { FadeIn, FadeInDown, ZoomIn } from "react-native-reanimated";
import { ScreenContainer } from "@/components/screen-container";
import { AppButton } from "@/src/components/AppButton";
import { SectionCard } from "@/src/components/SectionCard";
import { useTheme } from "@/src/hooks";
import { recognizeFood, FoodRecognitionResult } from "@/src/services/foodRecognition";
import { useDietStore } from "@/src/store/dietStore";
import { radius, spacing } from "@/src/theme";
import { toIsoDate } from "@/src/utils";

export function CameraScreen() {
  const { colors } = useTheme();
  const { addMeal } = useDietStore();
  
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [results, setResults] = useState<FoodRecognitionResult | null>(null);

  // Simular captura de imagem (em um dispositivo real usaríamos react-native-vision-camera)
  const simulateCapture = () => {
    // Placeholder de imagem de comida
    setCapturedImage("https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=500&auto=format&fit=crop");
    setResults(null);
  };

  const handleRecognize = async () => {
    if (!capturedImage) return;
    
    setIsAnalyzing(true);
    try {
      const data = await recognizeFood(capturedImage);
      setResults(data);
    } catch {
      Alert.alert("Nao foi possivel analisar", "Tente novamente em instantes ou escolha outra foto.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleAddMeal = () => {
    if (!results) return;

    const totalCalories = results.foods.reduce((acc, f) => acc + f.calories, 0);
    const totalProtein = results.foods.reduce((acc, f) => acc + f.protein, 0);
    const totalCarbs = results.foods.reduce((acc, f) => acc + f.carbs, 0);
    const totalFat = results.foods.reduce((acc, f) => acc + f.fat, 0);

    addMeal({
      date: toIsoDate(new Date()),
      mealType: "lunch", // Default para o mock
      items: results.foods.map(f => ({
        name: f.name,
        amount: f.servingSize,
        unit: f.servingUnit,
        calories: f.calories,
        protein: f.protein,
        carbs: f.carbs,
        fat: f.fat,
      })),
      totalCalories,
      totalProtein,
      totalCarbs,
      totalFat,
      notes: "Registrado com ajuda da camera inteligente",
    });

    Alert.alert("Refeicao salva", "Os alimentos identificados ja foram adicionados ao seu diario.", [
      { text: "OK", onPress: () => router.replace("/diet" as never) }
    ]);
  };

  return (
    <ScreenContainer className="bg-black">
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.closeBtn}>
            <Text style={{ color: "#fff", fontSize: 24 }}>✕</Text>
          </Pressable>
          <Text style={styles.headerTitle}>Camera inteligente</Text>
          <View style={{ width: 40 }} />
        </View>

        {!capturedImage ? (
          <View style={styles.cameraPlaceholder}>
            <Animated.View entering={ZoomIn} style={styles.cameraCircle}>
              <Text style={{ fontSize: 48 }}>📸</Text>
            </Animated.View>
            <Text style={styles.placeholderText}>Fotografe sua refeicao para estimar os alimentos com mais rapidez.</Text>
            <AppButton 
              label="Usar foto de exemplo" 
              onPress={simulateCapture} 
              style={styles.captureBtn}
            />
          </View>
        ) : (
          <ScrollView contentContainerStyle={styles.scrollContent}>
            <Animated.View entering={FadeIn} style={styles.previewContainer}>
              <Image source={{ uri: capturedImage }} style={styles.previewImage} />
              <Pressable onPress={() => setCapturedImage(null)} style={styles.retakeBtn}>
                <Text style={styles.retakeText}>Refazer</Text>
              </Pressable>
            </Animated.View>

            {!results && !isAnalyzing && (
              <Animated.View entering={FadeInDown} style={styles.actionBox}>
                <Text style={styles.actionTitle}>Foto pronta</Text>
                <Text style={styles.actionDesc}>Analise a imagem para sugerir alimentos, calorias e macros automaticamente.</Text>
                <AppButton label="Analisar foto" onPress={handleRecognize} />
              </Animated.View>
            )}

            {isAnalyzing && (
              <View style={styles.loadingBox}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={[styles.loadingText, { color: "#fff" }]}>Analisando sua refeicao...</Text>
              </View>
            )}

            {results && (
              <Animated.View entering={FadeInDown} style={styles.resultsContainer}>
                <SectionCard title="Alimentos encontrados" subtitle="Veja a estimativa da analise antes de salvar.">
                  {results.foods.map((food, index) => (
                    <View key={index} style={[styles.resultItem, { borderBottomColor: colors.border }]}>
                      <View style={styles.resultMain}>
                        <Text style={[styles.foodName, { color: colors.foreground }]}>{food.name}</Text>
                        <Text style={[styles.confidence, { color: colors.success }]}>
                          {Math.round(food.confidence * 100)}% de confianca
                        </Text>
                      </View>
                      <Text style={[styles.foodCalories, { color: colors.primary }]}>
                        {food.calories} kcal
                      </Text>
                    </View>
                  ))}
                  
                  <View style={styles.totalBox}>
                    <Text style={[styles.totalLabel, { color: colors.muted }]}>Total estimado</Text>
                    <Text style={[styles.totalValue, { color: colors.foreground }]}>
                      {results.foods.reduce((acc, f) => acc + f.calories, 0)} kcal
                    </Text>
                  </View>

                  <AppButton 
                    label="Salvar refeicao" 
                    onPress={handleAddMeal} 
                    variant="success"
                    style={{ marginTop: spacing.md }}
                  />
                </SectionCard>
              </Animated.View>
            )}
          </ScrollView>
        )}
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  headerTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "900",
    letterSpacing: -0.3,
  },
  closeBtn: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  cameraPlaceholder: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: spacing.xl,
  },
  cameraCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "rgba(255,255,255,0.1)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.2)",
  },
  placeholderText: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 17,
    fontWeight: "500",
    lineHeight: 24,
    textAlign: "center",
    paddingHorizontal: spacing.xl,
  },
  captureBtn: {
    minWidth: 200,
  },
  scrollContent: {
    padding: spacing.lg,
    gap: spacing.lg,
  },
  previewContainer: {
    width: "100%",
    height: 300,
    borderRadius: radius.xl,
    overflow: "hidden",
    position: "relative",
  },
  previewImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  retakeBtn: {
    position: "absolute",
    bottom: 16,
    right: 16,
    backgroundColor: "rgba(0,0,0,0.6)",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
  },
  retakeText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 12,
  },
  actionBox: {
    backgroundColor: "rgba(255,255,255,0.05)",
    padding: spacing.xl,
    borderRadius: radius.xl,
    alignItems: "center",
    gap: spacing.sm,
  },
  actionTitle: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "900",
  },
  actionDesc: {
    color: "rgba(255,255,255,0.6)",
    textAlign: "center",
    lineHeight: 22,
    marginBottom: spacing.md,
  },
  loadingBox: {
    padding: spacing.xxl,
    alignItems: "center",
    gap: spacing.md,
  },
  loadingText: {
    fontSize: 16,
    fontWeight: "700",
  },
  resultsContainer: {
    gap: spacing.md,
  },
  resultItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
  },
  resultMain: {
    flex: 1,
    gap: 2,
  },
  foodName: {
    fontSize: 16,
    fontWeight: "800",
  },
  confidence: {
    fontSize: 12,
    fontWeight: "600",
  },
  foodCalories: {
    fontSize: 18,
    fontWeight: "900",
  },
  totalBox: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: spacing.md,
    paddingTop: spacing.md,
  },
  totalLabel: {
    fontSize: 14,
    fontWeight: "700",
  },
  totalValue: {
    fontSize: 22,
    fontWeight: "900",
  },
});
