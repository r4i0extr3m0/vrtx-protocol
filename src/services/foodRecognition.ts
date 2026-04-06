export interface FoodRecognitionItem {
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  confidence: number;
  servingSize: number;
  servingUnit: string;
}

export interface FoodRecognitionResult {
  foods: FoodRecognitionItem[];
  timestamp: string;
}

/**
 * Serviço de reconhecimento de alimentos via IA.
 * Atualmente implementado com dados mockados para simular a resposta da API.
 */
export async function recognizeFood(imageUri: string): Promise<FoodRecognitionResult> {
  console.log("[FoodRecognition] Processando imagem:", imageUri);

  // Simular delay de rede/processamento da IA
  await new Promise((resolve) => setTimeout(resolve, 2000));

  // Mock de resultados baseados em uma "análise visual" simulada
  // Em produção, aqui seria feita uma chamada POST para FOOD_API_URL com a imagem em base64 ou multipart
  const mockResults: FoodRecognitionResult = {
    foods: [
      {
        name: "Peito de Frango Grelhado",
        calories: 165,
        protein: 31,
        carbs: 0,
        fat: 3.6,
        confidence: 0.95,
        servingSize: 100,
        servingUnit: "g",
      },
      {
        name: "Arroz Branco Cozido",
        calories: 130,
        protein: 2.7,
        carbs: 28,
        fat: 0.3,
        confidence: 0.88,
        servingSize: 100,
        servingUnit: "g",
      },
      {
        name: "Brócolis no Vapor",
        calories: 35,
        protein: 2.4,
        carbs: 7,
        fat: 0.4,
        confidence: 0.92,
        servingSize: 100,
        servingUnit: "g",
      },
    ],
    timestamp: new Date().toISOString(),
  };

  return mockResults;
}

/**
 * Função auxiliar para converter URI local em Base64 (necessário para APIs reais)
 */
export async function imageToBase64(uri: string): Promise<string> {
  // Para Native, usaríamos expo-file-system ou react-native-fs
  return "base64_placeholder";
}
