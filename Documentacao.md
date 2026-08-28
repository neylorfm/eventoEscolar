# 📚 Sistema de Controle - Semana de Talentos

Sistema web integrado ao **Google Apps Script**, **Google Sheets** e **Google Drive** para gerenciamento de inscrições, pontuações, situações e exportação de relatórios para eventos escolares (ex: Semana de Talentos).

---

## 📌 Visão Geral

O sistema permite que a equipe escolar controle todo o ciclo de vida das inscrições de alunos em categorias culturais/artísticas e suas respectivas disciplinas pontuadas. Ele conta com:
- **Interface Web Moderna e Responsiva** com TailwindCSS e SweetAlert2.
- **Painel de Gerenciamento** com filtros rápidos (Turma, Categoria, Busca por Aluno) e suporte a impressão.
- **Controle de Acesso por Senha** com hash seguro SHA-256 armazenado na planilha.
- **Formulário de Inscrição Inteligente** com validação em tempo real que bloqueia categorias e disciplinas já utilizadas pelo mesmo aluno.
- **Geração Automática de Resultados no Google Drive** criando planilhas estruturadas por Turma e arquivos CSV prontos para importação no SIGE / lançamento de notas.
- **Proteção contra Concorrência** via `LockService` para garantir integridade quando múltiplos coordenadores utilizam o sistema simultaneamente.

---

## 🏗️ Arquitetura e Estrutura dos Arquivos

```text
├── Codigo.gs          # Backend (Google Apps Script: regras de negócio, autenticação, Drive e Sheets API)
├── Index.html         # Frontend (HTML5, TailwindCSS, JavaScript, SweetAlert2, UI/UX)
├── Documentacao.md    # Documentação técnica e operacional do projeto
└── .gitignore         # Configuração de arquivos ignorados pelo Git
```

---

## 🗄️ Estrutura das Planilhas (Google Sheets)

A planilha Google vinculada ao script contém 3 abas principais:

### 1. Aba `SETUP`
Responsável pela segurança e configurações básicas.
- **`A1`**: Rótulo `"SENHA"`.
- **`A2`**: Hash **SHA-256** da senha mestra.
  - *Dica:* Para resetar a senha para o padrão (`1234567890`), basta deixar a célula `A2` vazia.

### 2. Aba `DADOS`
Base de alunos, categorias, disciplinas e áreas de conhecimento.
- **`A (ROLLNO)`**: Matrícula do aluno.
- **`B (CLASS)`**: Turma / Série (ex: `1ºA`, `2ºB`).
- **`C (NAME)`**: Nome completo do aluno.
  > *Nota:* As colunas A:C podem ser importadas via `=IMPORTRANGE("URL_DA_PLANILHA"; "EVALBEE!A1:C")`.
- **`E (CATEGORIAS)`**: Lista de modalidades disponíveis (ex: Produção Literária, Artes Visuais, Dança, The Voice, Lipsync, Audiovisual, Batalha de Rimas).
- **`F (DISCIPLINAS)`**: Lista de disciplinas (ex: Química, Física, Biologia, Artes, Matemática, Filosofia, etc.).
- **`G (AREA)`**: Área de conhecimento correspondente à disciplina (ex: `NATUREZA`, `LINGUAGENS`, `MATEMATICA`, `HUMANAS`, `OUTRA`).

### 3. Aba `CADASTRO`
Registro das inscrições efetuadas.
- **`A (MATRICULA)`**: Matrícula do aluno inscrito.
- **`B (CATEGORIA)`**: Modalidade da inscrição.
- **`C (SITUACAO)`**: Status (`EM ABERTO`, `REALIZADO`, `NAO REALIZADO`).
- **`D (PONTOS)`**: Pontuação atribuída (padrão: `1` ponto).
- **`E em diante (DISCIPLINAS)`**: Disciplinas vinculadas à inscrição (definido por `QTD_DISCIPLINAS = 3`).

---

## ⚙️ Regras de Negócio

1. **Unicidade de Categoria por Aluno:**
   - Um aluno não pode ter mais de uma inscrição na mesma categoria.
2. **Unicidade de Disciplinas por Aluno:**
   - Cada inscrição requer a seleção de exatamente 3 disciplinas (`QTD_DISCIPLINAS = 3`).
   - Um aluno não pode repetir uma mesma disciplina entre categorias diferentes.
3. **Edição e Exclusão Segura:**
   - Apenas registros com situação **`EM ABERTO`** podem ser editados ou excluídos.
   - Registros marcados como `REALIZADO` ou `NAO REALIZADO` ficam bloqueados para evitar alterações acidentais após a execução da atividade.
4. **Controle de Concorrência:**
   - Operações de escrita usam `LockService.getScriptLock()` com limite de 15 segundos (`TEMPO_ESPERA_BLOQUEIO_MS`) e `SpreadsheetApp.flush()`.
5. **Autenticação:**
   - Usuários não autenticados têm acesso apenas de **leitura** (visualizar tabela, filtrar e imprimir).
   - Para cadastrar, alterar pontuação inline, mudar status, editar, excluir ou gerar arquivos no Drive, é necessário desbloquear com a senha.

---

## 🖥️ Módulos da Interface

1. **Aba Gerenciamento (Relatório e Situação):**
   - Tabela interativa com listagem de todos os inscritos.
   - Filtro por Turma e por Categoria.
   - Campo de busca instantânea (filtra por Nome ou Matrícula).
   - Edição de pontos e situação diretamente na tabela (quando autenticado).
   - **Impressão Smart para Jurados:**
     - Cabeçalho formal com **Nome do Evento**, espaço para **Data**, **Nome do Avaliador(a)** e **Categoria**.
     - **Coluna de Marcação (`AVALIAR [ ]`)**: Largura dimensionada para o jurado assinalar com visto (✓) os alunos atribuídos à sua banca.
     - **Colunas Otimizadas**: Removidas as colunas *Matrícula* e *Disciplinas* para maximizar a área útil da folha.
     - **Coluna `VISTO / OBS` Expandida**: Configurada como a maior coluna da tabela para anotações e pareceres dos jurados.
     - **5 Colunas de Códigos (C1 a C5)**: Espaço para pontuação de critérios individuais.
     - Regras de pontuação: `EM ABERTO` (em branco), `REALIZADO` (pontuação numérica), `NAO REALIZADO` (`0`).
     - **Folha de Critérios Exclusiva**: Anexa uma folha separada com tabela dos 5 códigos e pautas limpas para descrição de critérios e assinaturas da banca.
2. **Aba Cadastro:**
   - Seleção facilitada de Aluno (com filtro prévio por Turma).
   - Seleção de Categoria e Disciplinas com bloqueio visual automático de itens já preenchidos.
3. **Aba Resultados:**
   - Processamento de todos os registros com situação `REALIZADO`.
   - Gera no Google Drive:
     - **Planilhas (`planilhas/<Area>/<Disciplina>(SUFIXO)`):** Planilhas organizadas com abas por turma, contendo colunas Matrícula, Nome do Aluno e Pontos.
     - **Arquivos CSV (`csv/<Area>/<Turma>_<Disciplina>(SUFIXO).csv`):** Arquivos prontos no formato `Matrícula,Pontos` para importação direta no SIGE.

---

## 🚀 Publicação no Google Apps Script

1. Abra a planilha no Google Sheets.
2. Acesse **Extensões** > **Apps Script**.
3. Cole o conteúdo de `Codigo.gs` no arquivo de script e crie o arquivo HTML `Index.html`.
4. Clique em **Implantar** > **Nova implantação**.
5. Selecione o tipo **App da Web**:
   - **Executar como:** *Eu (seu e-mail)*
   - **Quem tem acesso:** *Qualquer pessoa* (ou restrito ao domínio da escola, conforme necessidade).
6. Copie e compartilhe o link gerado.
