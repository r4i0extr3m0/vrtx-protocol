import * as Localization from "expo-localization";
import { storage } from "@/src/infra/mmkv";

const LANGUAGE_KEY = "vrtxprotocol.settings.language";

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

type SupportedLanguage = keyof typeof resources;
interface TranslationTree {
  [key: string]: string | TranslationTree;
}

let currentLanguage = getInitialLanguage() as SupportedLanguage;

function resolveTranslation(language: SupportedLanguage, key: string): string {
  const root = resources[language]?.translation as TranslationTree;
  const value = key.split(".").reduce<string | TranslationTree | undefined>((acc, segment) => {
    if (!acc || typeof acc === "string") {
      return acc;
    }
    return acc[segment];
  }, root);

  return typeof value === "string" ? value : key;
}

const i18n = {
  language: currentLanguage,
  get resolvedLanguage() {
    return currentLanguage;
  },
  async changeLanguage(nextLanguage: string) {
    if (nextLanguage in resources) {
      currentLanguage = nextLanguage as SupportedLanguage;
      this.language = currentLanguage;
      storage.set(LANGUAGE_KEY, currentLanguage);
    }
    return this;
  },
  t(key: string) {
    return resolveTranslation(currentLanguage, key);
  },
};

export default i18n;
