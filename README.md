# 📚 Sistema de Controle - Semana de Talentos (Evento Escolar)

Sistema web integrado ao **Google Apps Script**, **Google Sheets** e **Google Drive** desenvolvido para o gerenciamento centralizado de inscrições, atribuição de notas/pontos, controle de situações e lançamento automatizado de notas no **SIGE / Professor Online** via **Bookmarklet JavaScript**.

---

## 🚀 Funcionalidades Principais

- **📊 Gestão em Tempo Real:** Relatório completo com filtros rápidos por Turma, Categoria e Busca por Nome/Matrícula.
- **🔒 Segurança e Autenticação:** Modo de visualização público para consulta e modo de edição protegido por senha com hash **SHA-256**.
- **⚡ Injeção de Notas no SIGE via Bookmarklet:**
  - Substituição de planilhas CSV manuais por injeção automatizada e segura client-side diretamente na tela de notas do SIGE.
  - Botão arrastável (*drag-and-drop*) para instalação instantânea na Barra de Favoritos.
  - Janela de confirmação detalhada para evitar lançamentos incorretos em turmas erradas.
- **🔓 Controle de Liberação de Resultados (Célula H2 de DADOS):**
  - Acesso público e direto para lançamento de notas quando liberado pela coordenação (`H2 = SIM`).
  - Bloqueio automático quando `H2 = NÃO`, exigindo senha administrativa para liberação.
- **🎯 Validação Inteligente:** O sistema impede que um aluno se inscreva mais de uma vez na mesma categoria ou repita disciplinas já selecionadas.
- **⚡ Controle de Concorrência:** Proteção contra escritas simultâneas usando o `LockService` do Google Apps Script.
- **🖨️ Impressão Smart para Jurados:**
  - Agrupamento automático por **Categoria** com quebras de página individuais.
  - **5 colunas de critérios/códigos (C1 a C5)** para preenchimento de notas pela banca.
  - Pontuação inteligente: `EM ABERTO` sai em branco, `REALIZADO` exibe os pontos e `NÃO REALIZADO` exibe 0.
  - **Folha Separada de Critérios:** Tabela de referência dos 5 códigos com espaço amplo para descrição de diretrizes, pesos e parecer final dos jurados.

---

## 🗂️ Estrutura do Repositório

```text
├── Codigo.gs          # Backend (Google Apps Script: autenticação, regras, Drive e Sheets API)
├── Index.html         # Frontend (HTML5, TailwindCSS, JavaScript, SweetAlert2)
├── Documentacao.md    # Documentação técnica e arquitetura das planilhas
├── README.md          # Apresentação geral do projeto
└── .gitignore         # Arquivos ignorados pelo Git
```

---

## 🛠️ Como Implantar no Google Apps Script

1. Crie uma nova planilha no [Google Sheets](https://sheets.google.com).
2. Configure as abas conforme descrito em [Documentacao.md](Documentacao.md) (`SETUP`, `DADOS`, `CADASTRO`).
3. No menu superior da planilha, vá em **Extensões** > **Apps Script**.
4. Substitua o código padrão pelo conteúdo de `Codigo.gs`.
5. Crie um arquivo HTML chamado `Index.html` e cole o código correspondente.
6. Clique em **Implantar** > **Nova implantação**:
   - Tipo: **App da Web**
   - Executar como: *Eu*
   - Quem pode acessar: *Qualquer pessoa* (ou restrito à organização).
7. Copie a URL gerada para utilizar o sistema.

---

## 📄 Documentação Completa

Para detalhes aprofundados sobre regras de negócio, colunas das planilhas e hashes de segurança, consulte o arquivo [Documentacao.md](Documentacao.md).
