import * as Localization from "expo-localization";
import { create } from "zustand";

import { storage } from "@/src/infra/mmkv";

const LANGUAGE_KEY = "vrtxprotocol.settings.language";

const resources = {
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
      },
      signup: {
        accountTypeLabel: "Tipo de conta",
        clientLabel: "Praticante",
        clientHint: "Registro meus treinos. Posso vincular a um personal depois.",
        coachLabel: "Personal trainer",
        coachHint: "Acompanho alunos e prescrevo treinos.",
        crefPlaceholder: "CREF (opcional)",
      },
      coach: {
        tabLabel: "Alunos",
        myStudents: "Meus Alunos",
        subtitleOnline: "Vincule alunos e acompanhe cada conta separadamente.",
        subtitleOffline: "Vincular alunos requer conexão com o Supabase neste build.",
        active: "Ativo",
        pending: "Aguardando",
        planOf: "Plano {plan}",
        seats: "{used}/{cap} vagas em uso · {price}",
        plans: {
          free: "Free",
          basic: "Básico",
          plus: "Plus",
          premier: "Premier",
        },
        newStudent: "Novo aluno",
        generating: "Gerando...",
        codeLabel: "Código gerado — envie ao aluno",
        share: "Compartilhar",
        close: "Fechar",
        emptyLoading: "Carregando alunos...",
        empty: "Nenhum aluno ainda. Toque em Novo aluno para gerar um código de convite.",
        awaitingStudent: "Aguardando aluno entrar",
        student: "Aluno",
        codeTap: "Código: {code} · toque para enviar",
        removeTitle: "Remover aluno",
        remove: "Remover",
        removeBody: "Desvincular {name}? Ele perde o acesso aos seus treinos.",
        removeFailTitle: "Falha ao remover",
        inviteFailTitle: "Não foi possível gerar o convite",
        shareInviteBody:
          "Entre no meu time no VRTX Protocol com o código: {code}\n\nBaixe o app e, no Perfil, toque em \"Vincular a um personal\".",
      },
      profile: {
        roleCoach: "Personal Trainer",
        studentsCta: "Meus Alunos",
        joinCoachCta: "Vincular a um personal",
      },
      join: {
        title: "Vincular a um personal",
        subtitle:
          "Peça o código para o seu personal e cole aqui. Seus treinos ficam separados por conta — sem misturar dados.",
        offline: "Vincular requer conexão com o Supabase neste build.",
        checking: "Verificando vínculo...",
        linkedTitle: "Vinculado ao personal {coach}",
        linkedSub: "Seus treinos prescritos aparecerão aqui.",
        placeholder: "Código (ex.: VRTX-7K2P)",
        action: "Vincular",
        actioning: "Vinculando...",
        coachOnlyTitle: "Conta de personal",
        coachOnlyBody:
          "Esta tela é para quem treina com um personal. Sua conta já é de treinador — gerencie seus alunos na aba Alunos.",
        invalidCodeTitle: "Código inválido",
        linkedOkTitle: "Vinculado!",
        linkedOkBody: "Agora seu personal {coach} poderá enviar seus treinos.",
      },
    },
  },
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
      },
      signup: {
        accountTypeLabel: "Account type",
        clientLabel: "Athlete",
        clientHint: "I log my workouts. I can link to a coach later.",
        coachLabel: "Personal trainer",
        coachHint: "I coach clients and prescribe workouts.",
        crefPlaceholder: "CREF (optional)",
      },
      coach: {
        tabLabel: "Students",
        myStudents: "My Students",
        subtitleOnline: "Link students and track each account separately.",
        subtitleOffline: "Linking students requires a Supabase connection in this build.",
        active: "Active",
        pending: "Pending",
        planOf: "{plan} plan",
        seats: "{used}/{cap} seats in use · {price}",
        plans: {
          free: "Free",
          basic: "Basic",
          plus: "Plus",
          premier: "Premier",
        },
        newStudent: "New Student",
        generating: "Generating...",
        codeLabel: "Code generated — send it to your student",
        share: "Share",
        close: "Close",
        emptyLoading: "Loading students...",
        empty: "No students yet. Tap New Student to generate an invite code.",
        awaitingStudent: "Waiting for the student to join",
        student: "Student",
        codeTap: "Code: {code} · tap to send",
        removeTitle: "Remove student",
        remove: "Remove",
        removeBody: "Unlink {name}? They will lose access to your workouts.",
        removeFailTitle: "Failed to remove",
        inviteFailTitle: "Could not create the invite",
        shareInviteBody:
          "Join my team on VRTX Protocol with the code: {code}\n\nDownload the app and, in Profile, tap \"Link to a coach\".",
      },
      profile: {
        roleCoach: "Personal Trainer",
        studentsCta: "My Students",
        joinCoachCta: "Link to a coach",
      },
      join: {
        title: "Link to a coach",
        subtitle:
          "Ask your coach for the code and paste it here. Your workouts stay separated per account — no data mixing.",
        offline: "Linking requires a Supabase connection in this build.",
        checking: "Checking link...",
        linkedTitle: "Linked to coach {coach}",
        linkedSub: "Your prescribed workouts will show up here.",
        placeholder: "Code (e.g.: VRTX-7K2P)",
        action: "Link",
        actioning: "Linking...",
        coachOnlyTitle: "Coach account",
        coachOnlyBody:
          "This screen is for people who train with a coach. Your account is already a trainer — manage your students in the Students tab.",
        invalidCodeTitle: "Invalid code",
        linkedOkTitle: "Linked!",
        linkedOkBody: "Your coach {coach} can now send you workouts.",
      },
    },
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
      },
      signup: {
        accountTypeLabel: "Tipo de cuenta",
        clientLabel: "Atleta",
        clientHint: "Registro mis entrenamientos. Puedo vincularme a un entrenador después.",
        coachLabel: "Entrenador personal",
        coachHint: "Acompaño alumnos y prescribo entrenamientos.",
        crefPlaceholder: "CREF (opcional)",
      },
      coach: {
        tabLabel: "Alumnos",
        myStudents: "Mis Alumnos",
        subtitleOnline: "Vincula alumnos y acompaña cada cuenta por separado.",
        subtitleOffline: "Vincular alumnos requiere conexión con Supabase en este build.",
        active: "Activo",
        pending: "Pendiente",
        planOf: "Plan {plan}",
        seats: "{used}/{cap} vacantes en uso · {price}",
        plans: {
          free: "Free",
          basic: "Básico",
          plus: "Plus",
          premier: "Premier",
        },
        newStudent: "Nuevo alumno",
        generating: "Generando...",
        codeLabel: "Código generado — envíalo al alumno",
        share: "Compartir",
        close: "Cerrar",
        emptyLoading: "Cargando alumnos...",
        empty: "Aún no tienes alumnos. Toca en Nuevo alumno para generar un código de invitación.",
        awaitingStudent: "Esperando que el alumno entre",
        student: "Alumno",
        codeTap: "Código: {code} · toca para enviar",
        removeTitle: "Eliminar alumno",
        remove: "Eliminar",
        removeBody: "¿Desvincular a {name}? Perderá el acceso a tus entrenamientos.",
        removeFailTitle: "No se pudo eliminar",
        inviteFailTitle: "No se pudo generar la invitación",
        shareInviteBody:
          "Únete a mi equipo en VRTX Protocol con el código: {code}\n\nDescarga la app y, en Perfil, toca \"Vincular a un entrenador\".",
      },
      profile: {
        roleCoach: "Entrenador Personal",
        studentsCta: "Mis Alumnos",
        joinCoachCta: "Vincular a un entrenador",
      },
      join: {
        title: "Vincular a un entrenador",
        subtitle:
          "Pide el código a tu entrenador y pégalo aquí. Tus entrenamientos quedan separados por cuenta — sin mezclar datos.",
        offline: "Vincular requiere conexión con Supabase en este build.",
        checking: "Verificando vínculo...",
        linkedTitle: "Vinculado al entrenador {coach}",
        linkedSub: "Tus entrenamientos prescritos aparecerán aquí.",
        placeholder: "Código (ej.: VRTX-7K2P)",
        action: "Vincular",
        actioning: "Vinculando...",
        coachOnlyTitle: "Cuenta de entrenador",
        coachOnlyBody:
          "Esta pantalla es para quien entrena con un entrenador. Tu cuenta ya es de entrenador — gestiona tus alumnos en la pestaña Alumnos.",
        invalidCodeTitle: "Código inválido",
        linkedOkTitle: "¡Vinculado!",
        linkedOkBody: "Ahora tu entrenador {coach} podrá enviarte tus entrenamientos.",
      },
    },
  },
} as const;

type SupportedLanguage = keyof typeof resources;

interface TranslationTree {
  [key: string]: string | TranslationTree;
}

const getInitialLanguage = (): SupportedLanguage => {
  const saved = storage.getString(LANGUAGE_KEY);
  if (saved && saved in resources) return saved as SupportedLanguage;

  const locale = Localization.getLocales()[0]?.languageCode;
  if (locale === "pt") return "pt";
  if (locale === "es") return "es";
  return "en";
};

function resolveTranslation(language: SupportedLanguage, key: string): string {
  const root = resources[language]?.translation as unknown as TranslationTree;
  const value = key.split(".").reduce<string | TranslationTree | undefined>((acc, segment) => {
    if (!acc || typeof acc === "string") {
      return acc;
    }
    return acc[segment];
  }, root);

  return typeof value === "string" ? value : key;
}

function interpolate(value: string, params?: Record<string, string | number>): string {
  if (!params) return value;
  return Object.entries(params).reduce(
    (result, [token, replacement]) => result.replace(`{${token}}`, String(replacement)),
    value,
  );
}

interface I18nState {
  language: SupportedLanguage;
  setLanguage: (next: string) => void;
}

const useI18nStore = create<I18nState>((set) => ({
  language: getInitialLanguage(),
  setLanguage: (next: string) => {
    if (next in resources) {
      const language = next as SupportedLanguage;
      storage.set(LANGUAGE_KEY, language);
      set({ language });
    }
  },
}));

export function useI18n() {
  const language = useI18nStore((state) => state.language);
  const t = (key: string, params?: Record<string, string | number>) =>
    interpolate(resolveTranslation(language, key), params);
  return { language, t };
}

const i18n = {
  get language() {
    return useI18nStore.getState().language;
  },
  async changeLanguage(next: string) {
    useI18nStore.getState().setLanguage(next);
    return this;
  },
  t(key: string, params?: Record<string, string | number>) {
    return interpolate(resolveTranslation(useI18nStore.getState().language, key), params);
  },
};

export default i18n;
