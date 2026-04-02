export const VoiceCoach = {
  speak: (text: string) => {
    console.log('[VoiceCoach]', text);
  },
  
  announceSetComplete: (setNumber: number, weight: number, reps: number) => {
    VoiceCoach.speak(`Série ${setNumber} concluída. ${reps} repetições com ${weight} quilos.`);
  },
  
  announceRestStart: (seconds: number) => {
    VoiceCoach.speak(`Iniciando descanso de ${seconds} segundos.`);
  },
  
  announceRestComplete: () => {
    VoiceCoach.speak(`Descanso finalizado. Prepare-se para a próxima série.`);
  },
  
  stop: () => {
    // Voice coach stop
  }
};
