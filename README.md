# 📚 Sistema de Controle - Semana de Talentos (Evento Escolar)

Sistema web integrado ao **Google Apps Script**, **Google Sheets** e **Google Drive** desenvolvido para o gerenciamento centralizado de inscrições, atribuição de notas/pontos, controle de situações e geração automática de planilhas e arquivos CSV para eventos escolares e culturais.

---

## 🚀 Funcionalidades Principais

- **📊 Gestão em Tempo Real:** Relatório completo com filtros rápidos por Turma, Categoria e Busca por Nome/Matrícula.
- **🔒 Segurança e Autenticação:** Modo de visualização público para consulta e modo de edição protegido por senha com hash **SHA-256**.
- **🎯 Validação Inteligente:** O sistema impede que um aluno se inscreva mais de uma vez na mesma categoria ou repita disciplinas já selecionadas.
- **⚡ Controle de Concorrência:** Proteção contra escritas simultâneas usando o `LockService` do Google Apps Script.
- **📁 Exportação Automática para o Drive:**
  - Gera pastas organizadas por **Área do Conhecimento**.
  - Cria planilhas consolidadas divididas em abas por turma.
  - Gera arquivos **CSV** formatados (`Matrícula,Pontos`) prontos para importação no SIGE / sistema escolar.
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
