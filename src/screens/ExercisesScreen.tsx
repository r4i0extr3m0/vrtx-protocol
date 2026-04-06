import { useState, useMemo } from "react";
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { FlashList } from "@shopify/flash-list";
import Animated, { FadeInDown } from "react-native-reanimated";

import { ScreenContainer } from "@/components/screen-container";
import { AppButton } from "@/src/components/AppButton";
import { EmptyState } from "@/src/components/EmptyState";
import { useTheme } from "@/src/hooks";
import { useExerciseStore } from "@/src/store/exerciseStore";
import { radius, spacing, typography } from "@/src/theme";
import type { Exercise } from "@/src/types";

const MUSCLE_GROUPS = [
  "Peito", "Costas", "Ombros", "Bíceps", "Tríceps", 
  "Pernas", "Glúteos", "Core", "Cardio", "Geral"
];

interface ExerciseFormData {
  name: string;
  muscleGroup: string;
  equipment: string;
  notes: string;
}

const emptyForm: ExerciseFormData = {
  name: "",
  muscleGroup: "Geral",
  equipment: "",
  notes: "",
};

export function ExercisesScreen() {
  const { colors } = useTheme();
  const { exercises, createExercise, updateExercise, deleteExercise } = useExerciseStore();
  const [modalVisible, setModalVisible] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ExerciseFormData>(emptyForm);
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    return exercises.filter(
      (ex) =>
        ex.name.toLowerCase().includes(search.toLowerCase()) ||
        ex.muscleGroup.toLowerCase().includes(search.toLowerCase()),
    );
  }, [exercises, search]);

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setModalVisible(true);
  };

  const openEdit = (exercise: Exercise) => {
    setEditingId(exercise.id);
    setForm({
      name: exercise.name,
      muscleGroup: exercise.muscleGroup,
      equipment: exercise.equipment ?? "",
      notes: exercise.notes ?? "",
    });
    setModalVisible(true);
  };

  const handleSave = () => {
    if (!form.name.trim()) {
      Alert.alert("Falta um nome", "Informe o nome do exercicio para salvar.");
      return;
    }
    if (editingId) {
      updateExercise(editingId, {
        name: form.name.trim(),
        muscleGroup: form.muscleGroup,
        equipment: form.equipment.trim() || undefined,
        notes: form.notes.trim() || undefined,
      });
    } else {
      createExercise({
        name: form.name.trim(),
        muscleGroup: form.muscleGroup,
        equipment: form.equipment.trim() || undefined,
        notes: form.notes.trim() || undefined,
      });
    }
    setModalVisible(false);
  };

  const handleDelete = (exercise: Exercise) => {
    Alert.alert(
      "Excluir exercicio",
      `Deseja remover "${exercise.name}" da sua biblioteca?`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Excluir",
          style: "destructive",
          onPress: () => deleteExercise(exercise.id),
        },
      ],
    );
  };

  const renderItem = ({ item: exercise, index }: { item: Exercise; index: number }) => (
    <Animated.View 
      entering={FadeInDown.delay(index * 30)}
      style={[styles.item, { backgroundColor: colors.surface, borderColor: colors.border }]}
    >
      <View style={styles.itemText}>
        <Text style={[styles.itemTitle, { color: colors.foreground }]}>{exercise.name}</Text>
        <Text style={[styles.itemMeta, { color: colors.muted }]}>
          {exercise.muscleGroup}{exercise.equipment ? ` · ${exercise.equipment}` : ""}
        </Text>
      </View>
      <View style={styles.itemActions}>
        <AppButton
          label="Editar"
          onPress={() => openEdit(exercise)}
          variant="ghost"
          style={styles.actionBtn}
        />
        <AppButton
          label="Excluir"
          onPress={() => handleDelete(exercise)}
          variant="ghost"
          style={styles.actionBtn}
        />
      </View>
    </Animated.View>
  );

  const inputStyle = [
    styles.input,
    { backgroundColor: colors.surfaceAlt, borderColor: colors.border, color: colors.foreground },
  ];

  return (
    <ScreenContainer className="px-0 py-0">
      <FlashList
        data={filtered}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.foreground }]}>Exercícios</Text>
            <Text style={[styles.subtitle, { color: colors.muted }]}>
              Organize sua biblioteca de exercicios e encontre cada movimento com mais facilidade.
            </Text>
            <TextInput
              autoCapitalize="none"
              autoCorrect={false}
              onChangeText={setSearch}
              placeholder="Buscar exercicio..."
              placeholderTextColor={colors.muted}
              style={inputStyle}
              value={search}
            />
            <AppButton label="Novo exercicio" onPress={openCreate} />
          </View>
        }
        ListEmptyComponent={
          exercises.length === 0 ? (
            <EmptyState 
              emoji="🏋️"
              title="Sua biblioteca esta vazia"
              description="Crie seu primeiro exercicio para montar treinos com mais rapidez."
              actionLabel="Criar exercicio"
              onAction={openCreate}
            />
          ) : (
            <Text style={[styles.empty, { color: colors.muted }]}>
              Nenhum exercicio corresponde a essa busca.
            </Text>
          )
        }
      />

      <Modal
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
        transparent
        visible={modalVisible}
      >
        <Pressable onPress={() => setModalVisible(false)} style={styles.overlay} />
        <View style={[styles.modalContent, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.modalTitle, { color: colors.foreground }]}>
            {editingId ? "Editar exercicio" : "Novo exercicio"}
          </Text>

          <TextInput
            autoCapitalize="words"
            onChangeText={(v) => setForm((f) => ({ ...f, name: v }))}
            placeholder="Nome do exercicio *"
            placeholderTextColor={colors.muted}
            style={inputStyle}
            value={form.name}
          />

          <Text style={[styles.label, { color: colors.muted }]}>Grupo muscular</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
            {MUSCLE_GROUPS.map((group) => (
              <Pressable
                key={group}
                onPress={() => setForm((f) => ({ ...f, muscleGroup: group }))}
                style={[
                  styles.chip,
                  {
                    backgroundColor: form.muscleGroup === group ? colors.primary : colors.surfaceAlt,
                    borderColor: colors.border,
                  },
                ]}
              >
                <Text style={[styles.chipText, { color: form.muscleGroup === group ? "#fff" : colors.foreground }]}>
                  {group}
                </Text>
              </Pressable>
            ))}
          </ScrollView>

          <TextInput
            autoCapitalize="words"
            onChangeText={(v) => setForm((f) => ({ ...f, equipment: v }))}
            placeholder="Equipamento (opcional)"
            placeholderTextColor={colors.muted}
            style={inputStyle}
            value={form.equipment}
          />

          <TextInput
            multiline
            numberOfLines={3}
            onChangeText={(v) => setForm((f) => ({ ...f, notes: v }))}
            placeholder="Observações (opcional)"
            placeholderTextColor={colors.muted}
            style={[inputStyle, styles.textarea]}
            value={form.notes}
          />

          <View style={styles.modalActions}>
            <AppButton
              label="Cancelar"
              onPress={() => setModalVisible(false)}
              variant="secondary"
              style={styles.modalBtn}
            />
            <AppButton
              label={editingId ? "Salvar" : "Criar"}
              onPress={handleSave}
              style={styles.modalBtn}
            />
          </View>
        </View>
      </Modal>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  listContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xxxl,
  },
  header: {
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  title: {
    fontSize: typography.title,
    fontWeight: "900",
    letterSpacing: -1,
  },
  subtitle: {
    fontSize: typography.body,
    lineHeight: 24,
    fontWeight: "500",
  },
  empty: {
    fontSize: typography.body,
    lineHeight: 24,
    textAlign: "center",
    paddingVertical: spacing.xxl,
    fontWeight: "500",
  },
  item: {
    borderRadius: radius.xl,
    borderWidth: 1,
    padding: spacing.lg,
    gap: spacing.md,
    marginBottom: spacing.md,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  itemText: {
    gap: spacing.xs,
  },
  itemTitle: {
    fontSize: 18,
    fontWeight: "800",
    letterSpacing: -0.3,
  },
  itemMeta: {
    fontSize: 14,
    fontWeight: "500",
    lineHeight: 20,
  },
  itemActions: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  actionBtn: {
    flex: 1,
    minHeight: 40,
    borderRadius: radius.md,
  },
  input: {
    minHeight: 54,
    borderRadius: radius.lg,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    fontSize: 16,
    fontWeight: "600",
  },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalContent: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: radius.xxl,
    borderTopRightRadius: radius.xxl,
    borderWidth: 1,
    padding: spacing.xl,
    gap: spacing.lg,
    maxHeight: "85%",
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: "900",
    letterSpacing: -0.5,
  },
  label: {
    fontSize: 12,
    fontWeight: "700",
  },
  chipRow: {
    flexGrow: 0,
  },
  chip: {
    borderRadius: radius.pill,
    borderWidth: 1,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    marginRight: spacing.sm,
  },
  chipText: {
    fontSize: 12,
    fontWeight: "700",
  },
  textarea: {
    minHeight: 100,
    paddingTop: spacing.md,
    textAlignVertical: "top",
  },
  modalActions: {
    flexDirection: "row",
    gap: spacing.md,
    marginTop: spacing.sm,
  },
  modalBtn: {
    flex: 1,
  },
});
