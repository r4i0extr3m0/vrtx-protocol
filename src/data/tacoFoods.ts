import type { TacoFood } from "@/src/types";

/**
 * Subconjunto curado da Tabela TACO (valores por 100 g / 100 ml).
 * Serve de ponto de partida para o coach montar o plano alimentar; pode ser
 * substituido pela tabela completa sem impacto no restante do app.
 */
export const TACO_FOODS: TacoFood[] = [
  // Cereais, graos e tuberculos
  { id: "t-arroz-branco", name: "Arroz branco cozido", category: "Cereais", caloriesPer100g: 128, proteinPer100g: 2.5, carbsPer100g: 28.1, fatPer100g: 0.2 },
  { id: "t-arroz-integral", name: "Arroz integral cozido", category: "Cereais", caloriesPer100g: 124, proteinPer100g: 2.6, carbsPer100g: 25.8, fatPer100g: 1.0 },
  { id: "t-feijao-carioca", name: "Feijao carioca cozido", category: "Leguminosas", caloriesPer100g: 76, proteinPer100g: 4.8, carbsPer100g: 13.6, fatPer100g: 0.5 },
  { id: "t-feijao-preto", name: "Feijao preto cozido", category: "Leguminosas", caloriesPer100g: 77, proteinPer100g: 4.5, carbsPer100g: 14.0, fatPer100g: 0.5 },
  { id: "t-lentilha", name: "Lentilha cozida", category: "Leguminosas", caloriesPer100g: 93, proteinPer100g: 6.3, carbsPer100g: 16.3, fatPer100g: 0.5 },
  { id: "t-grao-bico", name: "Grao-de-bico cozido", category: "Leguminosas", caloriesPer100g: 130, proteinPer100g: 7.8, carbsPer100g: 21.8, fatPer100g: 2.1 },
  { id: "t-soja-grao", name: "Soja cozida", category: "Leguminosas", caloriesPer100g: 172, proteinPer100g: 15.6, carbsPer100g: 9.0, fatPer100g: 8.8 },
  { id: "t-macarrao", name: "Macarrao cozido", category: "Cereais", caloriesPer100g: 122, proteinPer100g: 4.0, carbsPer100g: 24.0, fatPer100g: 1.3 },
  { id: "t-pao-frances", name: "Pao frances", category: "Panificados", caloriesPer100g: 300, proteinPer100g: 8.0, carbsPer100g: 58.6, fatPer100g: 3.1, defaultUnit: "unidade" },
  { id: "t-pao-integral", name: "Pao de forma integral", category: "Panificados", caloriesPer100g: 253, proteinPer100g: 9.4, carbsPer100g: 49.9, fatPer100g: 3.7, defaultUnit: "fatia" },
  { id: "t-pao-queijo", name: "Pao de queijo assado", category: "Panificados", caloriesPer100g: 363, proteinPer100g: 5.1, carbsPer100g: 38.2, fatPer100g: 21.4, defaultUnit: "unidade" },
  { id: "t-aveia", name: "Aveia em flocos", category: "Cereais", caloriesPer100g: 394, proteinPer100g: 13.9, carbsPer100g: 66.6, fatPer100g: 8.5 },
  { id: "t-tapioca", name: "Goma de tapioca", category: "Cereais", caloriesPer100g: 240, proteinPer100g: 0.0, carbsPer100g: 60.0, fatPer100g: 0.0 },
  { id: "t-cuscuz", name: "Cuscuz de milho cozido", category: "Cereais", caloriesPer100g: 113, proteinPer100g: 2.4, carbsPer100g: 25.3, fatPer100g: 0.7 },
  { id: "t-flocos-milho", name: "Flocos de milho", category: "Cereais", caloriesPer100g: 370, proteinPer100g: 6.9, carbsPer100g: 80.0, fatPer100g: 1.5 },
  { id: "t-farinha-mandioca", name: "Farinha de mandioca", category: "Cereais", caloriesPer100g: 361, proteinPer100g: 1.6, carbsPer100g: 87.9, fatPer100g: 0.3 },
  { id: "t-batata-doce", name: "Batata-doce cozida", category: "Tuberculos", caloriesPer100g: 77, proteinPer100g: 0.6, carbsPer100g: 18.4, fatPer100g: 0.1 },
  { id: "t-batata-inglesa", name: "Batata inglesa cozida", category: "Tuberculos", caloriesPer100g: 52, proteinPer100g: 1.2, carbsPer100g: 11.9, fatPer100g: 0.0 },
  { id: "t-mandioca", name: "Mandioca cozida", category: "Tuberculos", caloriesPer100g: 125, proteinPer100g: 0.6, carbsPer100g: 30.1, fatPer100g: 0.3 },
  { id: "t-inhame", name: "Inhame cozido", category: "Tuberculos", caloriesPer100g: 112, proteinPer100g: 1.5, carbsPer100g: 27.9, fatPer100g: 0.1 },
  { id: "t-quinoa", name: "Quinoa cozida", category: "Cereais", caloriesPer100g: 120, proteinPer100g: 4.4, carbsPer100g: 21.3, fatPer100g: 1.9 },

  // Carnes, ovos e peixes
  { id: "t-frango-peito", name: "Frango, peito sem pele, grelhado", category: "Carnes", caloriesPer100g: 159, proteinPer100g: 32.0, carbsPer100g: 0.0, fatPer100g: 2.5 },
  { id: "t-frango-coxa", name: "Frango, coxa sem pele, cozida", category: "Carnes", caloriesPer100g: 167, proteinPer100g: 26.9, carbsPer100g: 0.0, fatPer100g: 6.5 },
  { id: "t-frango-sobrecoxa", name: "Frango, sobrecoxa sem pele, cozida", category: "Carnes", caloriesPer100g: 176, proteinPer100g: 24.4, carbsPer100g: 0.0, fatPer100g: 8.4 },
  { id: "t-patinho", name: "Carne bovina, patinho, grelhado", category: "Carnes", caloriesPer100g: 219, proteinPer100g: 35.9, carbsPer100g: 0.0, fatPer100g: 7.3 },
  { id: "t-alcatra", name: "Carne bovina, alcatra, grelhada", category: "Carnes", caloriesPer100g: 241, proteinPer100g: 31.9, carbsPer100g: 0.0, fatPer100g: 11.6 },
  { id: "t-contrafile", name: "Carne bovina, contra-file, grelhado", category: "Carnes", caloriesPer100g: 194, proteinPer100g: 32.4, carbsPer100g: 0.0, fatPer100g: 6.9 },
  { id: "t-carne-moida", name: "Carne moida refogada", category: "Carnes", caloriesPer100g: 212, proteinPer100g: 26.7, carbsPer100g: 0.0, fatPer100g: 11.2 },
  { id: "t-lombo-porco", name: "Lombo de porco assado", category: "Carnes", caloriesPer100g: 210, proteinPer100g: 35.7, carbsPer100g: 0.0, fatPer100g: 6.4 },
  { id: "t-ovo-cozido", name: "Ovo de galinha cozido", category: "Ovos", caloriesPer100g: 146, proteinPer100g: 13.3, carbsPer100g: 0.6, fatPer100g: 9.5, defaultUnit: "unidade" },
  { id: "t-ovo-frito", name: "Ovo de galinha frito", category: "Ovos", caloriesPer100g: 240, proteinPer100g: 15.6, carbsPer100g: 1.2, fatPer100g: 18.6, defaultUnit: "unidade" },
  { id: "t-clara", name: "Clara de ovo cozida", category: "Ovos", caloriesPer100g: 59, proteinPer100g: 13.4, carbsPer100g: 0.3, fatPer100g: 0.0 },
  { id: "t-tilapia", name: "Tilapia grelhada", category: "Peixes", caloriesPer100g: 129, proteinPer100g: 26.2, carbsPer100g: 0.0, fatPer100g: 2.7 },
  { id: "t-salmao", name: "Salmao grelhado", category: "Peixes", caloriesPer100g: 243, proteinPer100g: 26.2, carbsPer100g: 0.0, fatPer100g: 14.5 },
  { id: "t-merluza", name: "Merluza cozida", category: "Peixes", caloriesPer100g: 122, proteinPer100g: 26.6, carbsPer100g: 0.0, fatPer100g: 0.9 },
  { id: "t-sardinha", name: "Sardinha em conserva", category: "Peixes", caloriesPer100g: 205, proteinPer100g: 22.0, carbsPer100g: 0.0, fatPer100g: 13.0 },
  { id: "t-atum", name: "Atum em conserva (agua)", category: "Peixes", caloriesPer100g: 116, proteinPer100g: 26.2, carbsPer100g: 0.0, fatPer100g: 0.9 },
  { id: "t-camarao", name: "Camarao cozido", category: "Peixes", caloriesPer100g: 90, proteinPer100g: 19.0, carbsPer100g: 0.0, fatPer100g: 1.0 },

  // Leite e derivados
  { id: "t-leite-integral", name: "Leite de vaca integral", category: "Lacteos", caloriesPer100g: 60, proteinPer100g: 3.2, carbsPer100g: 4.5, fatPer100g: 3.2, defaultUnit: "ml" },
  { id: "t-leite-desnatado", name: "Leite de vaca desnatado", category: "Lacteos", caloriesPer100g: 35, proteinPer100g: 3.4, carbsPer100g: 5.2, fatPer100g: 0.2, defaultUnit: "ml" },
  { id: "t-iogurte-integral", name: "Iogurte natural integral", category: "Lacteos", caloriesPer100g: 51, proteinPer100g: 4.1, carbsPer100g: 1.9, fatPer100g: 3.0 },
  { id: "t-iogurte-desnatado", name: "Iogurte natural desnatado", category: "Lacteos", caloriesPer100g: 41, proteinPer100g: 3.8, carbsPer100g: 5.8, fatPer100g: 0.3 },
  { id: "t-queijo-minas", name: "Queijo minas frescal", category: "Lacteos", caloriesPer100g: 264, proteinPer100g: 17.4, carbsPer100g: 3.2, fatPer100g: 20.2 },
  { id: "t-mussarela", name: "Queijo mussarela", category: "Lacteos", caloriesPer100g: 330, proteinPer100g: 22.6, carbsPer100g: 3.0, fatPer100g: 25.2 },
  { id: "t-cottage", name: "Queijo cottage", category: "Lacteos", caloriesPer100g: 98, proteinPer100g: 11.6, carbsPer100g: 3.2, fatPer100g: 4.6 },
  { id: "t-requeijao", name: "Requeijao cremoso", category: "Lacteos", caloriesPer100g: 257, proteinPer100g: 9.6, carbsPer100g: 2.4, fatPer100g: 23.4 },

  // Frutas
  { id: "t-banana-prata", name: "Banana prata", category: "Frutas", caloriesPer100g: 98, proteinPer100g: 1.3, carbsPer100g: 26.0, fatPer100g: 0.1, defaultUnit: "unidade" },
  { id: "t-banana-nanica", name: "Banana nanica", category: "Frutas", caloriesPer100g: 92, proteinPer100g: 1.4, carbsPer100g: 23.8, fatPer100g: 0.1, defaultUnit: "unidade" },
  { id: "t-maca", name: "Maca com casca", category: "Frutas", caloriesPer100g: 56, proteinPer100g: 0.3, carbsPer100g: 15.2, fatPer100g: 0.0, defaultUnit: "unidade" },
  { id: "t-laranja", name: "Laranja pera", category: "Frutas", caloriesPer100g: 37, proteinPer100g: 1.0, carbsPer100g: 8.9, fatPer100g: 0.1, defaultUnit: "unidade" },
  { id: "t-mamao", name: "Mamao formosa", category: "Frutas", caloriesPer100g: 45, proteinPer100g: 0.8, carbsPer100g: 11.6, fatPer100g: 0.1 },
  { id: "t-manga", name: "Manga palmer", category: "Frutas", caloriesPer100g: 64, proteinPer100g: 0.8, carbsPer100g: 16.8, fatPer100g: 0.2 },
  { id: "t-morango", name: "Morango", category: "Frutas", caloriesPer100g: 30, proteinPer100g: 0.9, carbsPer100g: 6.8, fatPer100g: 0.3 },
  { id: "t-uva", name: "Uva italia", category: "Frutas", caloriesPer100g: 53, proteinPer100g: 0.7, carbsPer100g: 13.6, fatPer100g: 0.2 },
  { id: "t-abacaxi", name: "Abacaxi", category: "Frutas", caloriesPer100g: 48, proteinPer100g: 0.9, carbsPer100g: 12.3, fatPer100g: 0.1 },
  { id: "t-melancia", name: "Melancia", category: "Frutas", caloriesPer100g: 33, proteinPer100g: 0.9, carbsPer100g: 8.1, fatPer100g: 0.0 },
  { id: "t-melao", name: "Melao", category: "Frutas", caloriesPer100g: 29, proteinPer100g: 0.7, carbsPer100g: 7.5, fatPer100g: 0.0 },
  { id: "t-kiwi", name: "Kiwi", category: "Frutas", caloriesPer100g: 51, proteinPer100g: 0.8, carbsPer100g: 11.5, fatPer100g: 0.5, defaultUnit: "unidade" },
  { id: "t-pera", name: "Pera williams", category: "Frutas", caloriesPer100g: 53, proteinPer100g: 0.6, carbsPer100g: 14.0, fatPer100g: 0.1, defaultUnit: "unidade" },
  { id: "t-abacate", name: "Abacate", category: "Frutas", caloriesPer100g: 96, proteinPer100g: 1.2, carbsPer100g: 6.0, fatPer100g: 8.4 },
  { id: "t-goiaba", name: "Goiaba vermelha", category: "Frutas", caloriesPer100g: 54, proteinPer100g: 1.1, carbsPer100g: 13.0, fatPer100g: 0.4, defaultUnit: "unidade" },
  { id: "t-tangerina", name: "Tangerina", category: "Frutas", caloriesPer100g: 38, proteinPer100g: 0.7, carbsPer100g: 9.6, fatPer100g: 0.1, defaultUnit: "unidade" },

  // Verduras e legumes
  { id: "t-alface", name: "Alface crespa", category: "Verduras", caloriesPer100g: 11, proteinPer100g: 1.3, carbsPer100g: 1.7, fatPer100g: 0.2 },
  { id: "t-tomate", name: "Tomate cru", category: "Legumes", caloriesPer100g: 15, proteinPer100g: 1.1, carbsPer100g: 3.1, fatPer100g: 0.2 },
  { id: "t-brocolis", name: "Brocolis cozido", category: "Verduras", caloriesPer100g: 25, proteinPer100g: 2.1, carbsPer100g: 4.4, fatPer100g: 0.5 },
  { id: "t-cenoura", name: "Cenoura crua", category: "Legumes", caloriesPer100g: 34, proteinPer100g: 1.3, carbsPer100g: 7.7, fatPer100g: 0.2 },
  { id: "t-abobrinha", name: "Abobrinha cozida", category: "Legumes", caloriesPer100g: 15, proteinPer100g: 1.1, carbsPer100g: 3.0, fatPer100g: 0.2 },
  { id: "t-couve", name: "Couve manteiga refogada", category: "Verduras", caloriesPer100g: 90, proteinPer100g: 1.9, carbsPer100g: 8.7, fatPer100g: 5.8 },
  { id: "t-pepino", name: "Pepino cru", category: "Legumes", caloriesPer100g: 15, proteinPer100g: 0.9, carbsPer100g: 3.0, fatPer100g: 0.1 },
  { id: "t-chuchu", name: "Chuchu cozido", category: "Legumes", caloriesPer100g: 19, proteinPer100g: 0.4, carbsPer100g: 4.8, fatPer100g: 0.0 },
  { id: "t-beterraba", name: "Beterraba cozida", category: "Legumes", caloriesPer100g: 32, proteinPer100g: 1.3, carbsPer100g: 7.2, fatPer100g: 0.1 },
  { id: "t-cebola", name: "Cebola crua", category: "Legumes", caloriesPer100g: 39, proteinPer100g: 1.7, carbsPer100g: 8.9, fatPer100g: 0.1 },
  { id: "t-repolho", name: "Repolho cru", category: "Verduras", caloriesPer100g: 17, proteinPer100g: 0.9, carbsPer100g: 3.9, fatPer100g: 0.1 },
  { id: "t-vagem", name: "Vagem cozida", category: "Legumes", caloriesPer100g: 25, proteinPer100g: 1.8, carbsPer100g: 5.3, fatPer100g: 0.2 },
  { id: "t-couve-flor", name: "Couve-flor cozida", category: "Verduras", caloriesPer100g: 19, proteinPer100g: 1.2, carbsPer100g: 4.0, fatPer100g: 0.2 },

  // Gorduras e oleaginosas
  { id: "t-azeite", name: "Azeite de oliva", category: "Gorduras", caloriesPer100g: 884, proteinPer100g: 0.0, carbsPer100g: 0.0, fatPer100g: 100.0, defaultUnit: "ml" },
  { id: "t-oleo-soja", name: "Oleo de soja", category: "Gorduras", caloriesPer100g: 884, proteinPer100g: 0.0, carbsPer100g: 0.0, fatPer100g: 100.0, defaultUnit: "ml" },
  { id: "t-manteiga", name: "Manteiga com sal", category: "Gorduras", caloriesPer100g: 726, proteinPer100g: 0.4, carbsPer100g: 0.1, fatPer100g: 82.4 },
  { id: "t-pasta-amendoim", name: "Pasta de amendoim integral", category: "Oleaginosas", caloriesPer100g: 588, proteinPer100g: 25.0, carbsPer100g: 20.0, fatPer100g: 50.0 },
  { id: "t-amendoim", name: "Amendoim torrado", category: "Oleaginosas", caloriesPer100g: 544, proteinPer100g: 22.5, carbsPer100g: 19.0, fatPer100g: 44.0 },
  { id: "t-castanha-para", name: "Castanha-do-para", category: "Oleaginosas", caloriesPer100g: 643, proteinPer100g: 14.5, carbsPer100g: 15.1, fatPer100g: 63.5 },
  { id: "t-castanha-caju", name: "Castanha de caju torrada", category: "Oleaginosas", caloriesPer100g: 570, proteinPer100g: 18.5, carbsPer100g: 29.1, fatPer100g: 46.3 },
  { id: "t-amendoa", name: "Amendoa torrada", category: "Oleaginosas", caloriesPer100g: 581, proteinPer100g: 21.2, carbsPer100g: 21.7, fatPer100g: 50.6 },
  { id: "t-noz", name: "Noz", category: "Oleaginosas", caloriesPer100g: 620, proteinPer100g: 14.0, carbsPer100g: 18.4, fatPer100g: 59.4 },
  { id: "t-chia", name: "Semente de chia", category: "Oleaginosas", caloriesPer100g: 486, proteinPer100g: 16.5, carbsPer100g: 42.1, fatPer100g: 30.7 },
  { id: "t-linhaca", name: "Semente de linhaca", category: "Oleaginosas", caloriesPer100g: 495, proteinPer100g: 14.1, carbsPer100g: 43.3, fatPer100g: 32.3 },

  // Bebidas
  { id: "t-cafe", name: "Cafe infusao", category: "Bebidas", caloriesPer100g: 9, proteinPer100g: 0.7, carbsPer100g: 1.5, fatPer100g: 0.1, defaultUnit: "ml" },
  { id: "t-suco-laranja", name: "Suco de laranja natural", category: "Bebidas", caloriesPer100g: 37, proteinPer100g: 0.7, carbsPer100g: 8.7, fatPer100g: 0.1, defaultUnit: "ml" },
  { id: "t-agua-coco", name: "Agua de coco", category: "Bebidas", caloriesPer100g: 22, proteinPer100g: 0.0, carbsPer100g: 5.3, fatPer100g: 0.0, defaultUnit: "ml" },
  { id: "t-refrigerante", name: "Refrigerante cola", category: "Bebidas", caloriesPer100g: 34, proteinPer100g: 0.0, carbsPer100g: 8.7, fatPer100g: 0.0, defaultUnit: "ml" },
  { id: "t-cerveja", name: "Cerveja pilsen", category: "Bebidas", caloriesPer100g: 41, proteinPer100g: 0.6, carbsPer100g: 3.3, fatPer100g: 0.0, defaultUnit: "ml" },

  // Doces, acucares e industrializados
  { id: "t-mel", name: "Mel", category: "Acucares", caloriesPer100g: 309, proteinPer100g: 0.7, carbsPer100g: 84.0, fatPer100g: 0.0 },
  { id: "t-acucar", name: "Acucar cristal", category: "Acucares", caloriesPer100g: 387, proteinPer100g: 0.0, carbsPer100g: 99.6, fatPer100g: 0.0 },
  { id: "t-doce-leite", name: "Doce de leite", category: "Doces", caloriesPer100g: 306, proteinPer100g: 5.5, carbsPer100g: 59.5, fatPer100g: 6.0 },
  { id: "t-chocolate", name: "Chocolate ao leite", category: "Doces", caloriesPer100g: 540, proteinPer100g: 7.2, carbsPer100g: 59.6, fatPer100g: 30.3 },
  { id: "t-granola", name: "Granola tradicional", category: "Industrializados", caloriesPer100g: 400, proteinPer100g: 8.0, carbsPer100g: 70.0, fatPer100g: 8.0 },
  { id: "t-achocolatado", name: "Achocolatado em po", category: "Industrializados", caloriesPer100g: 400, proteinPer100g: 4.2, carbsPer100g: 89.7, fatPer100g: 2.1 },
  { id: "t-biscoito-recheado", name: "Biscoito recheado", category: "Industrializados", caloriesPer100g: 480, proteinPer100g: 5.6, carbsPer100g: 68.0, fatPer100g: 20.0 },

  // Suplementos
  { id: "t-whey", name: "Whey protein concentrado", category: "Suplementos", caloriesPer100g: 400, proteinPer100g: 80.0, carbsPer100g: 8.0, fatPer100g: 6.0 },
  { id: "t-maltodextrina", name: "Maltodextrina", category: "Suplementos", caloriesPer100g: 380, proteinPer100g: 0.0, carbsPer100g: 95.0, fatPer100g: 0.0 },
  { id: "t-creatina", name: "Creatina", category: "Suplementos", caloriesPer100g: 0, proteinPer100g: 0.0, carbsPer100g: 0.0, fatPer100g: 0.0 },
];

function normalize(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

export function searchTacoFoods(query: string, limit = 30): TacoFood[] {
  const term = normalize(query);
  if (!term) return TACO_FOODS.slice(0, limit);

  const startsWith: TacoFood[] = [];
  const includes: TacoFood[] = [];

  for (const food of TACO_FOODS) {
    const name = normalize(food.name);
    if (name.startsWith(term)) {
      startsWith.push(food);
    } else if (name.includes(term)) {
      includes.push(food);
    }
  }

  return [...startsWith, ...includes].slice(0, limit);
}

export function findTacoFood(foodId: string | null | undefined): TacoFood | null {
  if (!foodId) return null;
  return TACO_FOODS.find((food) => food.id === foodId) ?? null;
}
