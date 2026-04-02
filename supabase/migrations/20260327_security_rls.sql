-- Habilitar RLS em todas as tabelas
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE workouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE meals ENABLE ROW LEVEL SECURITY;
ALTER TABLE foods ENABLE ROW LEVEL SECURITY;
ALTER TABLE gamification ENABLE ROW LEVEL SECURITY;

-- Políticas para 'profiles'
CREATE POLICY "Usuários podem ver seu próprio perfil" ON profiles
  FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Usuários podem atualizar seu próprio perfil" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Políticas genéricas para tabelas com 'user_id'
-- (exercises, templates, workouts, meals, foods, gamification)

-- Exercises
CREATE POLICY "Usuários podem gerenciar seus próprios exercícios" ON exercises
  FOR ALL USING (auth.uid() = user_id);

-- Templates
CREATE POLICY "Usuários podem gerenciar seus próprios templates" ON templates
  FOR ALL USING (auth.uid() = user_id);

-- Workouts
CREATE POLICY "Usuários podem gerenciar seus próprios treinos" ON workouts
  FOR ALL USING (auth.uid() = user_id);

-- Meals
CREATE POLICY "Usuários podem gerenciar suas próprias refeições" ON meals
  FOR ALL USING (auth.uid() = user_id);

-- Foods
CREATE POLICY "Usuários podem gerenciar seus próprios alimentos customizados" ON foods
  FOR ALL USING (auth.uid() = user_id);

-- Gamification
CREATE POLICY "Usuários podem ver seu próprio progresso" ON gamification
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Sistema pode atualizar progresso do usuário" ON gamification
  FOR ALL USING (auth.uid() = user_id);

-- Nota: Garantir que todas as tabelas tenham a coluna 'user_id' do tipo UUID 
-- referenciando auth.users(id).
