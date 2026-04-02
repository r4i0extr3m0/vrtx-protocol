import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import * as Localization from "expo-localization";
import { storage } from "@/src/infra/mmkv";

const LANGUAGE_KEY = "ironlog.settings.language";

const resources = {
  en: {
    translation: {
      common: {
        save: "Save",
        cancel: "Cancel",
        delete: "Delete",
        edit: "Edit",
        add: "Add",
        loading: "Loading...",
        error: "Error",
        success: "Success",
      },
      tabs: {
        home: "Home",
        workout: "Workout",
        diet: "Diet",
        history: "History",
        profile: "Profile",
      },
      workout: {
        start: "Start Workout",
        finish: "Finish Workout",
        addExercise: "Add Exercise",
        restTimer: "Rest Timer",
        sets: "Sets",
        reps: "Reps",
        weight: "Weight",
        pr: "Personal Record!",
      },
      diet: {
        calories: "Calories",
        protein: "Protein",
        carbs: "Carbs",
        fat: "Fat",
        addMeal: "Add Meal",
        goals: "Daily Goals",
        water: "Water",
      }
    }
  },
  pt: {
    translation: {
      common: {
        save: "Salvar",
        cancel: "Cancelar",
        delete: "Excluir",
        edit: "Editar",
        add: "Adicionar",
        loading: "Carregando...",
        error: "Erro",
        success: "Sucesso",
      },
      tabs: {
        home: "Início",
        workout: "Treino",
        diet: "Dieta",
        history: "Histórico",
        profile: "Perfil",
      },
      workout: {
        start: "Iniciar Treino",
        finish: "Finalizar Treino",
        addExercise: "Adicionar Exercício",
        restTimer: "Timer de Descanso",
        sets: "Séries",
        reps: "Reps",
        weight: "Peso",
        pr: "Recorde Pessoal!",
      },
      diet: {
        calories: "Calorias",
        protein: "Proteína",
        carbs: "Carbos",
        fat: "Gordura",
        addMeal: "Adicionar Refeição",
        goals: "Metas Diárias",
        water: "Água",
      }
    }
  },
  es: {
    translation: {
      common: {
        save: "Guardar",
        cancel: "Cancelar",
        delete: "Eliminar",
        edit: "Editar",
        add: "Añadir",
        loading: "Cargando...",
        error: "Error",
        success: "Éxito",
      },
      tabs: {
        home: "Inicio",
        workout: "Entrenamiento",
        diet: "Dieta",
        history: "Historial",
        profile: "Perfil",
      },
      workout: {
        start: "Iniciar Entrenamiento",
        finish: "Finalizar Entrenamiento",
        addExercise: "Añadir Ejercicio",
        restTimer: "Temporizador de Descanso",
        sets: "Series",
        reps: "Reps",
        weight: "Peso",
        pr: "¡Record Personal!",
      },
      diet: {
        calories: "Calorías",
        protein: "Proteína",
        carbs: "Carbohidratos",
        fat: "Grasa",
        addMeal: "Añadir Comida",
        goals: "Metas Diarias",
        water: "Agua",
      }
    }
  }
};

const getInitialLanguage = () => {
  const saved = storage.getString(LANGUAGE_KEY);
  if (saved) return saved;
  
  const locale = Localization.getLocales()[0].languageCode;
  if (locale === "pt") return "pt";
  if (locale === "es") return "es";
  return "en";
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: getInitialLanguage(),
    fallbackLng: "en",
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;
