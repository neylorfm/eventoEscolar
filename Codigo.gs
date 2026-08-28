// =================================================================================
// CONFIGURAÇÕES GERAIS (VARIÁVEIS DE CONTROLE)
// =================================================================================
const FOLDER_ID_PADRAO = ""; 
const NOME_EVENTO = "Semana de Talentos"; 
const PONTOS_PADRAO = 1;                 
const NOME_PASTA_PLANILHAS = "planilhas"; 
const NOME_PASTA_CSV = "csv";             
const SUFIXO_ARQUIVOS = "SEMANA-TALENTOS-2026";

// NOVA VARIÁVEL: Quantidade de disciplinas que o aluno deve escolher por categoria
const QTD_DISCIPLINAS = 3; 

// NOVA VARIÁVEL: Tempo máximo de espera para concorrência (em milissegundos)
// Exemplo: 15000 = 15 segundos
const TEMPO_ESPERA_BLOQUEIO_MS = 15000; 

// CONFIGURAÇÕES DE SEGURANÇA E SENHA
const NOME_ABA_SETUP = "SETUP";
const SENHA_PADRAO = "1234567890";

// =================================================================================
// INICIALIZAÇÃO DA INTERFACE
// =================================================================================
function doGet() {
  return HtmlService.createTemplateFromFile('Index')
    .evaluate()
    .setTitle(`Controle - ${NOME_EVENTO}`)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

// =================================================================================
// FUNÇÕES DE SEGURANÇA E AUTENTICAÇÃO (HASHCODE SHA-256)
// =================================================================================

/**
 * Calcula o hash SHA-256 de uma string e retorna como string hexadecimal (64 caracteres).
 */
function calcularHash(texto) {
  if (texto === null || texto === undefined) return "";
  const rawHash = Utilities.computeDigest(
    Utilities.DigestAlgorithm.SHA_256,
    String(texto),
    Utilities.Charset.UTF_8
  );
  let txtHash = "";
  for (let i = 0; i < rawHash.length; i++) {
    let byteVal = rawHash[i];
    if (byteVal < 0) byteVal += 256;
    let byteHex = byteVal.toString(16);
    if (byteHex.length === 1) byteHex = "0" + byteHex;
    txtHash += byteHex;
  }
  return txtHash.toLowerCase();
}

/**
 * Obtém o hash da senha configurada na aba SETUP (Célula A2).
 * Se a célula estiver vazia ou contiver texto puro (não-hash de 64 hexadecimais),
 * retorna o hash da senha padrão (SENHA_PADRAO = '1234567890').
 */
function getSenhaHashArmazenada() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let abaSetup = ss.getSheetByName(NOME_ABA_SETUP);
  
  if (!abaSetup) {
    abaSetup = ss.insertSheet(NOME_ABA_SETUP);
    abaSetup.getRange("A1").setValue("SENHA");
    abaSetup.getRange("A2").setValue("");
    SpreadsheetApp.flush();
    return calcularHash(SENHA_PADRAO);
  }
  
  const valorA2 = String(abaSetup.getRange("A2").getValue() || "").trim();
  
  // Verifica se é um hashcode hexadecimal válido de 64 caracteres (SHA-256)
  const isHashValido = /^[a-fA-F0-9]{64}$/.test(valorA2);
  
  if (!valorA2 || !isHashValido) {
    return calcularHash(SENHA_PADRAO);
  }
  
  return valorA2.toLowerCase();
}

/**
 * Valida se um token/hash fornecido confere com o hash atual da senha.
 */
function validarAcesso(token) {
  const hashAtual = getSenhaHashArmazenada();
  if (!token || String(token).toLowerCase() !== hashAtual) {
    throw new Error("Acesso não autorizado. Por favor, autentique-se com a senha para realizar alterações.");
  }
  return true;
}

/**
 * Autentica o usuário comparando a senha informada com o hash armazenado.
 */
function autenticar(senha) {
  const hashEsperado = getSenhaHashArmazenada();
  const hashDigitado = calcularHash(senha);
  
  if (hashDigitado === hashEsperado) {
    return { sucesso: true, token: hashDigitado };
  } else {
    throw new Error("Senha incorreta.");
  }
}

/**
 * Permite alterar a senha no sistema gravando o novo hash na célula A2 da aba SETUP.
 */
function alterarSenha(tokenAtual, novaSenha) {
  validarAcesso(tokenAtual);
  
  if (!novaSenha || String(novaSenha).trim().length < 4) {
    throw new Error("A nova senha deve ter no mínimo 4 caracteres.");
  }
  
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(TEMPO_ESPERA_BLOQUEIO_MS)) {
    throw new Error("Sistema ocupado, tente novamente.");
  }
  
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let abaSetup = ss.getSheetByName(NOME_ABA_SETUP);
    if (!abaSetup) {
      abaSetup = ss.insertSheet(NOME_ABA_SETUP);
      abaSetup.getRange("A1").setValue("SENHA");
    }
    
    const novoHash = calcularHash(String(novaSenha).trim());
    abaSetup.getRange("A2").setValue(novoHash);
    SpreadsheetApp.flush();
    
    return { sucesso: true, novoToken: novoHash };
  } finally {
    lock.releaseLock();
  }
}

// =================================================================================
// FUNÇÕES DE LEITURA (PÚBLICAS PARA VISUALIZAÇÃO)
// =================================================================================

function getDadosIniciais() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const abaDados = ss.getSheetByName("DADOS");
  const dados = abaDados.getDataRange().getValues();
  
  let alunos = [];
  let categorias = [];
  let disciplinas = [];
  
  for (let i = 1; i < dados.length; i++) {
    if (dados[i][0]) {
      alunos.push({
        matricula: String(dados[i][0]).trim(),
        turma: String(dados[i][1]).trim(),
        nome: String(dados[i][2]).trim()
      });
    }
    if (dados[i][4]) categorias.push(String(dados[i][4]).trim());
    if (dados[i][5]) disciplinas.push(String(dados[i][5]).trim());
  }
  
  return {
    alunos: alunos,
    categorias: categorias,
    disciplinas: disciplinas,
    folderIdPadrao: FOLDER_ID_PADRAO,
    nomeEvento: NOME_EVENTO,
    nomePastaPlanilhas: NOME_PASTA_PLANILHAS,
    nomePastaCsv: NOME_PASTA_CSV,
    qtdDisciplinas: QTD_DISCIPLINAS
  };
}

function getCadastros() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const abaCadastro = ss.getSheetByName("CADASTRO");
  const dados = abaCadastro.getDataRange().getValues();
  
  let cadastros = [];
  // LEITURA DA NOVA ESTRUTURA: A(0)=Mat, B(1)=Cat, C(2)=Sit, D(3)=Pts, E(4)=D1...
  for (let i = 1; i < dados.length; i++) {
    if (dados[i][0]) {
      let disc = [];
      for (let j = 0; j < QTD_DISCIPLINAS; j++) {
        disc.push(String(dados[i][4 + j] || "").trim());
      }
      
      cadastros.push({
        linha: i + 1,
        matricula: String(dados[i][0]).trim(),
        categoria: String(dados[i][1]).trim(),
        situacao: String(dados[i][2]).trim(),
        pontos: dados[i][3] !== undefined && dados[i][3] !== "" ? Number(dados[i][3]) : 0,
        disciplinas: disc 
      });
    }
  }
  return cadastros;
}

// =================================================================================
// FUNÇÕES DE ESCRITA, EDIÇÃO E EXCLUSÃO (PROTEGIDAS POR SENHA E LOCKSERVICE)
// =================================================================================

function salvarCadastro(dadosForm, token) {
  // 0. Validação de Autorização
  validarAcesso(token);

  // 1. Solicita a chave de bloqueio do script
  const lock = LockService.getScriptLock();
  
  // 2. Tenta aguardar na fila usando a variável configurada
  if (!lock.tryLock(TEMPO_ESPERA_BLOQUEIO_MS)) {
    throw new Error("O sistema está recebendo muitos acessos simultâneos. Por favor, aguarde alguns segundos e clique em salvar novamente.");
  }

  try {
    const { matricula, categoria, disciplinasEscolhidas } = dadosForm;
    
    // Como estamos sob bloqueio, a leitura de getCadastros() será a mais atualizada possível
    const cadastros = getCadastros();
    const cadastrosAluno = cadastros.filter(c => c.matricula === matricula);
    
    // Regra 1: Não repetir categoria
    if (cadastrosAluno.some(c => c.categoria === categoria)) {
      throw new Error("Este aluno já está cadastrado nesta categoria.");
    }
    
    // Regra 2: Não repetir disciplinas
    let disciplinasUsadas = [];
    cadastrosAluno.forEach(c => disciplinasUsadas.push(...c.disciplinas));
    
    for (let d of disciplinasEscolhidas) {
      if (disciplinasUsadas.includes(d)) {
        throw new Error(`A disciplina '${d}' já foi escolhida por este aluno em outra categoria.`);
      }
    }
    
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const abaCadastro = ss.getSheetByName("CADASTRO");
    
    let novaLinha = [matricula, categoria, "EM ABERTO", PONTOS_PADRAO];
    novaLinha.push(...disciplinasEscolhidas);
    
    abaCadastro.appendRow(novaLinha);
    
    // 3. Força o Google Sheets a aplicar a alteração fisicamente na planilha AGORA
    SpreadsheetApp.flush();
    
    return true;
  } finally {
    // 4. Libera o bloqueio para os próximos usuários, mesmo se algo der erro na validação
    lock.releaseLock();
  }
}

function atualizarSituacao(linha, novaSituacao, token) {
  validarAcesso(token);

  const lock = LockService.getScriptLock();
  if (!lock.tryLock(TEMPO_ESPERA_BLOQUEIO_MS)) throw new Error("Sistema ocupado, tente novamente.");
  
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const abaCadastro = ss.getSheetByName("CADASTRO");
    abaCadastro.getRange(linha, 3).setValue(novaSituacao); // Coluna C (3)
    SpreadsheetApp.flush();
    return true;
  } finally {
    lock.releaseLock();
  }
}

function atualizarPontos(linha, novosPontos, token) {
  validarAcesso(token);

  const lock = LockService.getScriptLock();
  if (!lock.tryLock(TEMPO_ESPERA_BLOQUEIO_MS)) throw new Error("Sistema ocupado, tente novamente.");

  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const abaCadastro = ss.getSheetByName("CADASTRO");
    abaCadastro.getRange(linha, 4).setValue(novosPontos); // Coluna D (4)
    SpreadsheetApp.flush();
    return true;
  } finally {
    lock.releaseLock();
  }
}

/**
 * Exclui um cadastro da planilha CADASTRO se a situação for 'EM ABERTO'.
 */
function excluirCadastro(linha, matricula, categoria, token) {
  validarAcesso(token);

  const lock = LockService.getScriptLock();
  if (!lock.tryLock(TEMPO_ESPERA_BLOQUEIO_MS)) {
    throw new Error("Sistema ocupado, tente novamente.");
  }

  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const abaCadastro = ss.getSheetByName("CADASTRO");
    const dados = abaCadastro.getDataRange().getValues();

    // Localiza a linha correta na planilha
    let linhaParaExcluir = -1;

    if (linha <= dados.length && linha >= 2) {
      const rowData = dados[linha - 1];
      if (String(rowData[0]).trim() === String(matricula).trim() && 
          String(rowData[1]).trim() === String(categoria).trim()) {
        linhaParaExcluir = linha;
      }
    }

    if (linhaParaExcluir === -1) {
      for (let i = 1; i < dados.length; i++) {
        if (String(dados[i][0]).trim() === String(matricula).trim() &&
            String(dados[i][1]).trim() === String(categoria).trim()) {
          linhaParaExcluir = i + 1;
          break;
        }
      }
    }

    if (linhaParaExcluir === -1) {
      throw new Error("Registro não encontrado na planilha.");
    }

    const situacaoAtual = String(dados[linhaParaExcluir - 1][2]).trim();
    if (situacaoAtual !== "EM ABERTO") {
      throw new Error("Apenas cadastros com situação 'EM ABERTO' podem ser excluídos.");
    }

    abaCadastro.deleteRow(linhaParaExcluir);
    SpreadsheetApp.flush();

    return { sucesso: true };
  } finally {
    lock.releaseLock();
  }
}

/**
 * Edita um cadastro existente (Categoria e/ou Disciplinas), validando regras de unicidade.
 */
function editarCadastro(dadosEdicao, token) {
  validarAcesso(token);

  const { linha, matricula, categoriaOriginal, novaCategoria, novasDisciplinas } = dadosEdicao;

  if (!novaCategoria) {
    throw new Error("A categoria é obrigatória.");
  }

  if (!novasDisciplinas || novasDisciplinas.length !== QTD_DISCIPLINAS || novasDisciplinas.some(d => !d || !String(d).trim())) {
    throw new Error(`É obrigatório selecionar exatamente ${QTD_DISCIPLINAS} disciplinas.`);
  }

  // Verifica duplicidade interna nas disciplinas selecionadas
  const setDisciplinas = new Set(novasDisciplinas.map(d => String(d).trim()));
  if (setDisciplinas.size !== novasDisciplinas.length) {
    throw new Error("Não é permitido escolher a mesma disciplina mais de uma vez.");
  }

  const lock = LockService.getScriptLock();
  if (!lock.tryLock(TEMPO_ESPERA_BLOQUEIO_MS)) {
    throw new Error("Sistema ocupado, tente novamente.");
  }

  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const abaCadastro = ss.getSheetByName("CADASTRO");
    const dados = abaCadastro.getDataRange().getValues();

    // Localiza a linha correta
    let linhaAlvo = -1;
    if (linha <= dados.length && linha >= 2) {
      const rowData = dados[linha - 1];
      if (String(rowData[0]).trim() === String(matricula).trim() &&
          String(rowData[1]).trim() === String(categoriaOriginal || "").trim()) {
        linhaAlvo = linha;
      }
    }

    if (linhaAlvo === -1) {
      for (let i = 1; i < dados.length; i++) {
        if (String(dados[i][0]).trim() === String(matricula).trim() &&
            String(dados[i][1]).trim() === String(categoriaOriginal || "").trim()) {
          linhaAlvo = i + 1;
          break;
        }
      }
    }

    if (linhaAlvo === -1) {
      throw new Error("Registro original não encontrado na planilha.");
    }

    const situacaoAtual = String(dados[linhaAlvo - 1][2]).trim();
    if (situacaoAtual !== "EM ABERTO") {
      throw new Error("Apenas cadastros com situação 'EM ABERTO' podem ser editados.");
    }

    // Validações de unicidade considerando todos os OUTROS cadastros do aluno
    const todosCadastros = getCadastros();
    const outrosCadastrosAluno = todosCadastros.filter(c => 
      c.matricula === String(matricula).trim() && c.linha !== linhaAlvo
    );

    // Regra 1: Não repetir categoria já usada em outro registro do aluno
    if (outrosCadastrosAluno.some(c => c.categoria === novaCategoria)) {
      throw new Error(`O aluno já possui outro cadastro na categoria '${novaCategoria}'.`);
    }

    // Regra 2: Não repetir disciplinas já usadas em outros registros do aluno
    let disciplinasOutros = [];
    outrosCadastrosAluno.forEach(c => disciplinasOutros.push(...c.disciplinas));

    for (let d of novasDisciplinas) {
      if (disciplinasOutros.includes(d)) {
        throw new Error(`A disciplina '${d}' já foi escolhida por este aluno em outra categoria.`);
      }
    }

    // Atualiza a Categoria (Coluna B / 2)
    abaCadastro.getRange(linhaAlvo, 2).setValue(novaCategoria);

    // Atualiza as Disciplinas (Colunas E em diante / 5 ...)
    const linhaDisciplinas = novasDisciplinas.map(d => String(d).trim());
    abaCadastro.getRange(linhaAlvo, 5, 1, QTD_DISCIPLINAS).setValues([linhaDisciplinas]);

    SpreadsheetApp.flush();

    return { sucesso: true };
  } finally {
    lock.releaseLock();
  }
}

// =================================================================================
// FUNÇÃO PARA GERAR RESULTADOS (PROTEGIDA POR SENHA)
// =================================================================================

function gerarPlanilhasResultados(folderIdInput, substituir, token) {
  validarAcesso(token);

  const folderIdFinal = FOLDER_ID_PADRAO || folderIdInput;
  if (!folderIdFinal) throw new Error("ID da pasta não fornecido.");
  
  let folder;
  try {
    folder = DriveApp.getFolderById(folderIdFinal);
  } catch(e) {
    throw new Error("Pasta não encontrada. Verifique permissões.");
  }

  const sufixoFormatado = SUFIXO_ARQUIVOS.trim() !== "" ? `(${SUFIXO_ARQUIVOS.trim()})` : "";
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const abaDados = ss.getSheetByName("DADOS");
  const dadosIniciais = abaDados.getDataRange().getValues();

  const mapaAlunos = {};
  const mapaAreas = {};

  for (let i = 1; i < dadosIniciais.length; i++) {
    if (dadosIniciais[i][0]) {
      mapaAlunos[String(dadosIniciais[i][0]).trim()] = {
        matricula: String(dadosIniciais[i][0]).trim(),
        turma: String(dadosIniciais[i][1]).trim(),
        nome: String(dadosIniciais[i][2]).trim()
      };
    }
    if (dadosIniciais[i][5]) {
      let disc = String(dadosIniciais[i][5]).trim();
      let area = dadosIniciais[i][6] ? String(dadosIniciais[i][6]).trim() : "OUTRAS";
      mapaAreas[disc] = area;
    }
  }
  
  const cadastrosData = getCadastros();
  const realizados = cadastrosData.filter(c => c.situacao === "REALIZADO");
  
  const dadosPorDisciplina = {};
  
  realizados.forEach(c => {
    const aluno = mapaAlunos[c.matricula];
    if (!aluno) return;
    
    c.disciplinas.forEach(disc => {
      if (!disc) return;
      if (!dadosPorDisciplina[disc]) {
        dadosPorDisciplina[disc] = {
           area: mapaAreas[disc] || "OUTRAS",
           turmas: {}
        };
      }
      if (!dadosPorDisciplina[disc].turmas[aluno.turma]) {
        dadosPorDisciplina[disc].turmas[aluno.turma] = [];
      }
      
      let jaExiste = dadosPorDisciplina[disc].turmas[aluno.turma].find(a => a.matricula === aluno.matricula);
      if (!jaExiste) {
        dadosPorDisciplina[disc].turmas[aluno.turma].push({ 
          matricula: aluno.matricula, 
          nome: aluno.nome,
          pontos: c.pontos 
        });
      }
    });
  });
  
  const disciplinasParaCriar = Object.keys(dadosPorDisciplina);
  if (disciplinasParaCriar.length === 0) {
    throw new Error("Nenhum cadastro com situação 'REALIZADO' encontrado.");
  }

  let folderPlanilhas;
  let iterP = folder.getFoldersByName(NOME_PASTA_PLANILHAS);
  if(iterP.hasNext()) folderPlanilhas = iterP.next();
  else folderPlanilhas = folder.createFolder(NOME_PASTA_PLANILHAS);

  let folderCsv;
  let iterC = folder.getFoldersByName(NOME_PASTA_CSV);
  if(iterC.hasNext()) folderCsv = iterC.next();
  else folderCsv = folder.createFolder(NOME_PASTA_CSV);

  if (!substituir) {
    let arquivosExistentes = [];
    disciplinasParaCriar.forEach(disc => {
      let area = dadosPorDisciplina[disc].area;
      let nomeArquivoPlanilha = `${disc}${sufixoFormatado}`;
      
      let areaFolders = folderPlanilhas.getFoldersByName(area);
      if(areaFolders.hasNext()) {
        let files = areaFolders.next().getFilesByName(nomeArquivoPlanilha);
        if(files.hasNext()) arquivosExistentes.push(`${NOME_PASTA_PLANILHAS}/${area}/${nomeArquivoPlanilha}`);
      }
    });
    
    if (arquivosExistentes.length > 0) return { requerConfirmacao: true, arquivos: arquivosExistentes };
  }

  let cachePastasPlanilhas = {};
  let cachePastasCsv = {};

  disciplinasParaCriar.forEach(disc => {
    let area = dadosPorDisciplina[disc].area;
    let nomeFinalPlanilha = `${disc}${sufixoFormatado}`;
    
    if(!cachePastasPlanilhas[area]) {
      let fs = folderPlanilhas.getFoldersByName(area);
      if(fs.hasNext()) cachePastasPlanilhas[area] = fs.next();
      else cachePastasPlanilhas[area] = folderPlanilhas.createFolder(area);
    }
    let areaFolderPlanilha = cachePastasPlanilhas[area];

    if(!cachePastasCsv[area]) {
      let fs = folderCsv.getFoldersByName(area);
      if(fs.hasNext()) cachePastasCsv[area] = fs.next();
      else cachePastasCsv[area] = folderCsv.createFolder(area);
    }
    let areaFolderCsv = cachePastasCsv[area];

    let iteratorPlanilha = areaFolderPlanilha.getFilesByName(nomeFinalPlanilha);
    while (iteratorPlanilha.hasNext()) iteratorPlanilha.next().setTrashed(true);
    
    const novaPlanilha = SpreadsheetApp.create(nomeFinalPlanilha);
    DriveApp.getFileById(novaPlanilha.getId()).moveTo(areaFolderPlanilha);
    
    const turmasDaDisc = Object.keys(dadosPorDisciplina[disc].turmas).sort();
    
    turmasDaDisc.forEach(turma => {
      const aba = novaPlanilha.insertSheet(turma);
      aba.appendRow(["MATRÍCULA", "NOME DO ALUNO", "PONTOS"]);
      aba.getRange("A1:C1").setFontWeight("bold").setBackground("#e2e8f0");
      
      const alunos = dadosPorDisciplina[disc].turmas[turma].sort((a, b) => a.nome.localeCompare(b.nome));
      const valores = alunos.map(a => [a.matricula, a.nome, a.pontos]);
      
      if (valores.length > 0) aba.getRange(2, 1, valores.length, 3).setValues(valores);
      aba.autoResizeColumns(1, 3);

      let nomeFinalCsv = `${turma}_${disc}${sufixoFormatado}.csv`;
      let csvIterator = areaFolderCsv.getFilesByName(nomeFinalCsv);
      while(csvIterator.hasNext()) csvIterator.next().setTrashed(true);

      let csvContent = "";
      alunos.forEach(a => { csvContent += `${a.matricula},${a.pontos}\r\n`; });
      areaFolderCsv.createFile(nomeFinalCsv, csvContent, MimeType.CSV);
    });
    
    const abaPadrao = novaPlanilha.getSheetByName("Página1") || novaPlanilha.getSheetByName("Sheet1");
    if (abaPadrao && novaPlanilha.getSheets().length > 1) novaPlanilha.deleteSheet(abaPadrao);
  });
  
  return { sucesso: true };
}