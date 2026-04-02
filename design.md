# IronLog — Plano de Design Mobile

## Visão de produto
O **IronLog** será um diário de treino mobile orientado a atletas de musculação que precisam registrar séries com o mínimo de atrito possível, mesmo sem conexão. A interface será pensada para **uso em retrato 9:16**, operação com **uma mão** e leitura rápida em ambientes de academia com iluminação variável. O comportamento visual seguirá convenções dominantes do iOS, com hierarquia clara, superfícies escuras, tipografia forte e áreas de toque confortáveis.

## Princípios de interface
O produto deve transmitir **precisão**, **robustez** e **velocidade operacional**. A experiência prioriza captura rápida de dados, baixa carga cognitiva e confirmação imediata de que a ação foi salva localmente. O usuário nunca deve depender de internet para registrar uma sessão; por isso, os estados de sincronização serão discretos, porém sempre visíveis quando relevantes.

| Princípio | Aplicação no app |
|---|---|
| Baixa latência percebida | Ações primárias ficam no alcance do polegar, com respostas visuais instantâneas e salvamento local imediato. |
| Clareza técnica | Métricas como volume total e 1RM aparecem em linguagem objetiva, com destaque numérico e contexto mínimo. |
| Resiliência offline-first | Indicadores de sincronização mostram fila pendente, último status e falhas recuperáveis sem bloquear a interface. |
| Densidade controlada | Listas de treinos e exercícios mostram bastante informação, mas com agrupamento por blocos e boa separação visual. |

## Lista de telas
O aplicativo precisa de um conjunto enxuto de telas centrais, organizadas para suportar autenticação, registro de treino, consulta histórica e análise de progresso.

| Tela | Objetivo principal |
|---|---|
| Splash inicial | Exibir identidade do produto enquanto o estado persistido e a sessão local são restaurados. |
| Login | Permitir autenticação por e-mail e senha e também acesso em modo local quando o usuário ainda não sincronizou. |
| Home | Resumir o treino mais recente, treinos da semana, volume acumulado, status da sincronização e atalhos de ação. |
| Workout Log | Registrar ou editar uma sessão de treino com exercícios, séries, repetições, carga e observações. |
| Exercise Picker / Quick Add | Adicionar exercícios rapidamente a uma sessão com busca e sugestões frequentes. |
| History | Exibir sessões anteriores com filtros por data, nome do treino e grupamento. |
| Workout Detail | Mostrar os detalhes completos de um treino já salvo, incluindo volume total e estimativas de desempenho. |
| Statistics | Exibir métricas de progressão, tendências de volume e estimativas de 1RM por exercício. |
| Sync Status Sheet | Mostrar operações pendentes, último erro e estado atual da fila de sincronização. |
| Settings | Ajustar tema, preferências de unidade, comportamento de sincronização e logout. |

## Conteúdo e funcionalidade por tela
A **Splash inicial** terá fundo escuro, logotipo central e um texto curto indicando restauração local. Ela existe apenas para carregar estado persistido, reidratar stores e encaminhar o usuário para a navegação correta.

A **Login** apresentará cabeçalho com o nome IronLog, descrição curta do benefício do produto, campos de e-mail e senha, ação principal de entrar, ação secundária para continuar com dados locais quando apropriado e mensagens claras para falhas de autenticação. O layout deve posicionar os campos no terço superior-médio da tela para facilitar uso com uma mão.

A **Home** será a tela de controle operacional. Ela mostrará um cartão principal com o último treino ou um CTA para iniciar uma nova sessão, um resumo de métricas recentes, uma seção de exercícios mais recorrentes e um pequeno indicador de sincronização. O botão primário “Novo treino” ficará em destaque visual e posicionado próximo à área inferior útil da tela.

A **Workout Log** será a tela de maior densidade. Ela exibirá o nome da sessão, data, lista de exercícios, linhas de séries com repetições e carga, total de volume por exercício e ações rápidas para duplicar série, remover item e concluir treino. O foco é minimizar toques: campos numéricos grandes, linhas compactas e feedback imediato de salvamento local.

A **Exercise Picker / Quick Add** funcionará como folha modal ou tela empilhada. Ela mostrará busca, exercícios recentes e sugestões mais usadas. O usuário deve conseguir inserir um exercício em poucos toques, retornando direto para o treino em edição.

A **History** mostrará uma lista cronológica de sessões com cards compactos, data, nome, total de exercícios, volume total e um marcador de sincronização. A filtragem será simples e visível, com busca por nome do treino e agrupamento por período.

A **Workout Detail** aprofundará a sessão salva. O usuário verá exercícios, séries, observações, volume por bloco e estimativas derivadas. Essa tela privilegia leitura e comparação, não edição intensa.

A **Statistics** apresentará cards resumidos e gráficos simples com volume semanal, melhor 1RM estimado por exercício e evolução recente. O desenho deve priorizar comparações rápidas, sem excesso de ornamentação.

A **Sync Status Sheet** será acessada a partir de indicadores da Home ou do cabeçalho. Ela mostrará fila pendente em ordem cronológica, estado de conectividade, última sincronização bem-sucedida e mensagens recuperáveis quando houver falhas.

A **Settings** incluirá alternância de tema, informações da conta sincronizada, ações de logout e controles relacionados à experiência, sem expandir escopo para recursos não solicitados.

## Fluxos principais do usuário
Os fluxos precisam ser diretos e previsíveis, sempre preservando o princípio de que o dado é salvo localmente antes de qualquer tráfego de rede.

| Fluxo | Passos |
|---|---|
| Entrar no app | Splash restaura estado local → verificação de sessão → Login ou Home. |
| Iniciar treino | Home → tocar em “Novo treino” → Workout Log com sessão criada localmente → adicionar exercícios e séries → salvar automaticamente. |
| Adicionar exercício | Workout Log → tocar em adicionar exercício → Exercise Picker / Quick Add → selecionar exercício → retornar ao Workout Log com foco na nova seção. |
| Finalizar treino | Workout Log → revisar volume e séries → concluir treino → store local atualizada → operação enfileirada para sincronização. |
| Consultar histórico | Home ou aba History → lista cronológica → abrir Workout Detail. |
| Acompanhar progresso | Aba Statistics → visualizar volume semanal e 1RM estimado por exercício. |
| Ver estado de sincronização | indicador de sync → abrir Sync Status Sheet → revisar pendências ou erro → reprocessamento automático quando houver conexão. |

## Arquitetura visual
A estética será escura e técnica, com superfícies quase pretas, contraste alto e acento metálico frio. A intenção não é reproduzir uma interface gamer, mas uma ferramenta profissional de treino.

| Elemento | Diretriz visual |
|---|---|
| Fundo principal | Preto grafite profundo para reduzir brilho em ambientes internos. |
| Superfícies elevadas | Cinza antracite com separação sutil por borda fina. |
| Cor de destaque | Azul aço frio para ações primárias e estados ativos. |
| Sucesso | Verde controlado para confirmação de salvamento e sync ok. |
| Aviso/erro | Âmbar e vermelho moderados para não competir com conteúdo principal. |
| Tipografia | Escala clara com números grandes para métricas e labels compactas para campos de treino. |

## Escolhas de cor específicas
As cores abaixo serão a base da identidade do IronLog e deverão ser transformadas em tokens em `src/theme/` e no tema global do projeto.

| Token conceitual | Cor | Uso |
|---|---|---|
| Background base | `#0B0D10` | Fundo principal do app. |
| Surface primary | `#151A20` | Cards e painéis. |
| Surface secondary | `#1B2129` | Blocos internos e inputs. |
| Accent steel | `#7CC6FF` | Botões primários, tabs ativas e links. |
| Accent strong | `#4AA8F0` | Press states e destaques secundários. |
| Text primary | `#F4F7FB` | Texto principal. |
| Text secondary | `#97A6B5` | Metadados e legendas. |
| Border subtle | `#28313B` | Separadores e contornos. |
| Success | `#39D98A` | Confirmações. |
| Warning | `#F5B942` | Atenção. |
| Error | `#FF6B6B` | Falha e exclusão. |

## Layout e ergonomia
A navegação principal deverá usar **tabs** com rótulos curtos e áreas de toque grandes. A tela Home, Workout Log, History e Statistics devem estar sempre acessíveis por abas. Ações críticas, como iniciar treino e salvar série, precisam ficar no raio confortável do polegar na metade inferior da tela. Modais e folhas deslizantes são preferíveis para tarefas rápidas, como adicionar exercícios ou inspecionar o estado de sincronização, pois preservam contexto e reduzem ida e volta.

A interface deve evitar excesso de campos simultâneos. Em **Workout Log**, cada exercício aparecerá como um bloco expansível, com cabeçalho compacto e tabela simplificada de séries. As entradas numéricas devem ter contraste alto, bordas discretas e diferenciação por foco. As métricas derivadas, como **VTT** e **1RM estimado**, serão exibidas como complemento útil e não como distração dominante durante a digitação.

## Estrutura de navegação proposta
A navegação será dividida em duas pilhas. A primeira é o **AuthStack**, responsável por Login. A segunda é o **AppTabs**, contendo Home, Workout Log, History e Statistics. Telas auxiliares como Workout Detail, Exercise Picker e Settings serão empilhadas sobre o contexto principal via stack. Um guardião de navegação verificará autenticação persistida e sessão inválida, encaminhando o usuário para Login quando necessário.

## Estados especiais
O design deve contemplar estados vazios, offline e de erro desde o início. Se não houver treinos, a Home mostrará uma explicação curta e um CTA central para começar. Quando a conexão estiver indisponível, a interface continuará plenamente funcional e mostrará um selo discreto indicando que as alterações aguardam sincronização. Em caso de erro permanente de uma operação, o app apresentará mensagem clara e ação de tentativa posterior, sem perda dos dados locais.

## Resultado esperado da experiência
O produto final deve parecer uma ferramenta de treino séria, estável e veloz. O usuário deve sentir que consegue abrir o app, registrar um treino pesado com rapidez, revisar histórico e acompanhar sua progressão sem depender da rede e sem navegar por telas supérfluas.

## Referências
As decisões de orientação a retrato, clareza hierárquica, alvos de toque confortáveis e aderência a padrões nativos seguem as recomendações da Apple Human Interface Guidelines para iPhone e navegação mobile [1].

[1]: https://developer.apple.com/design/human-interface-guidelines "Apple Human Interface Guidelines"
