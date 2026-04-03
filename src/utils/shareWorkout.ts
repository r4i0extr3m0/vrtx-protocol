import { Share, Alert } from 'react-native';
import * as Linking from 'expo-linking';
import { Workout } from '../types';

/**
 * Gera um link profundo (deep link) para compartilhar o template do treino.
 * Em um cenário real, isso geraria um link que o app saberia abrir.
 */
export async function shareWorkoutTemplate(workout: Workout) {
  try {
    // Usa o scheme configurado no app (Expo) para gerar o deep link corretamente.
    const shareUrl = Linking.createURL('import-template', {
      queryParams: { id: workout.id, name: workout.name },
    });
    
    const result = await Share.share({
      message: `Confira meu treino "${workout.name}" no VRTX Protocol! Clique no link para importar: ${shareUrl}`,
      url: shareUrl,
      title: `Compartilhar Treino: ${workout.name}`
    });

    if (result.action === Share.sharedAction) {
      if (result.activityType) {
        // compartilhado com tipo de atividade
      } else {
        // compartilhado
      }
    } else if (result.action === Share.dismissedAction) {
      // cancelado
    }
  } catch (error: any) {
    Alert.alert('Erro ao compartilhar', error.message);
  }
}

/**
 * Simula a geração de um QR Code para o treino.
 */
export function generateWorkoutQRCode(workoutId: string) {
  // Retornaria um objeto ou string para ser renderizado por uma lib de QR Code
  return `COREIRONTRACK_QR_${workoutId}`;
}
