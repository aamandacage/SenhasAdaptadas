const numeroSenha = document.querySelector('.parametro-senha__texto');
let tamanhoSenha = 12;
numeroSenha.textContent = tamanhoSenha;

// conjuntos de caracteres
let letrasMaiusculas = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
let letrasMinusculas = 'abcdefghijklmnopqrstuvwxyz';
let numeros = '0123456789';
let simbolos = '!@%*?#$&+-_=';
const caracteresAmbiguos = /[O0l1I]/g;

// elementos da tela
const botoes = document.querySelectorAll('.parametro-senha__botao');
const campoSenha = document.querySelector('#campo-senha');
const checkbox = document.querySelectorAll('.checkbox');
const forcaSenha = document.querySelector('.forca');
const valorEntropia = document.querySelector('.entropia');
const feedbackSenha = document.querySelector('.feedback-senha');
const mensagemErro = document.querySelector('#mensagem-erro');
const mensagemCopia = document.querySelector('#mensagem-copia');
const botaoCopiar = document.querySelector('#copiar-senha');
const botaoGerar = document.querySelector('#gerar-senha');
const listaHistorico = document.querySelector('#lista-historico');
const botaoLimparHistorico = document.querySelector('#limpar-historico');
const anoAtual = document.querySelector('#ano-atual');

// checkboxes extras
const chkNaoRepetir = document.querySelector('#nao-repetir');
const chkNaoAmbiguos = document.querySelector('#nao-ambiguos');

// ano automático no rodapé
if (anoAtual) {
    anoAtual.textContent = new Date().getFullYear();
}

// botões + e -
botoes[0].onclick = diminuiTamanho;
botoes[1].onclick = aumentaTamanho;

// atualiza ao clicar nas checkboxes
for (let i = 0; i < checkbox.length; i++) {
    checkbox[i].onclick = geraSenha;
}

// botão gerar
botaoGerar.onclick = geraSenha;

// botão copiar
botaoCopiar.onclick = copiarSenha;

// limpar histórico
botaoLimparHistorico.onclick = limparHistorico;

// gera uma senha ao abrir
carregarHistorico();
geraSenha();

function diminuiTamanho() {
    if (tamanhoSenha > 4) {
        tamanhoSenha--;
    }
    numeroSenha.textContent = tamanhoSenha;
    geraSenha();
}

function aumentaTamanho() {
    if (tamanhoSenha < 32) {
        tamanhoSenha++;
    }
    numeroSenha.textContent = tamanhoSenha;
    geraSenha();
}

// gera número aleatório seguro
function numeroSeguro(max) {
    const array = new Uint32Array(1);
    crypto.getRandomValues(array);
    return array[0] % max;
}

function geraSenha() {
    mensagemErro.textContent = '';
    mensagemCopia.textContent = '';

    let usarMaiusculas = checkbox[0].checked;
    let usarMinusculas = checkbox[1].checked;
    let usarNumeros = checkbox[2].checked;
    let usarSimbolos = checkbox[3].checked;
    let evitarRepetidos = chkNaoRepetir.checked;
    let evitarAmbiguos = chkNaoAmbiguos.checked;

    let gruposSelecionados = [];

    let maiusculas = letrasMaiusculas;
    let minusculas = letrasMinusculas;
    let nums = numeros;
    let sims = simbolos;

    // remove caracteres ambíguos se marcado
    if (evitarAmbiguos) {
        maiusculas = maiusculas.replace(caracteresAmbiguos, '');
        minusculas = minusculas.replace(caracteresAmbiguos, '');
        nums = nums.replace(caracteresAmbiguos, '');
    }

    if (usarMaiusculas) gruposSelecionados.push(maiusculas);
    if (usarMinusculas) gruposSelecionados.push(minusculas);
    if (usarNumeros) gruposSelecionados.push(nums);
    if (usarSimbolos) gruposSelecionados.push(sims);

    // validação: pelo menos um tipo de caractere
    if (gruposSelecionados.length === 0) {
        campoSenha.value = '';
        valorEntropia.textContent = '';
        feedbackSenha.textContent = '';
        forcaSenha.classList.remove('fraca', 'media', 'forte');
        mensagemErro.textContent = 'Selecione pelo menos uma característica para gerar a senha.';
        return;
    }

    let alfabeto = gruposSelecionados.join('');
    let senhaArray = [];

    // garante pelo menos 1 caractere de cada grupo selecionado
    for (let grupo of gruposSelecionados) {
        let indice = numeroSeguro(grupo.length);
        senhaArray.push(grupo[indice]);
    }

    // completa o restante da senha
    while (senhaArray.length < tamanhoSenha) {
        let char = alfabeto[numeroSeguro(alfabeto.length)];

        if (evitarRepetidos && senhaArray[senhaArray.length - 1] === char) {
            continue;
        }

        senhaArray.push(char);
    }

    // embaralha a senha para não deixar o padrão previsível
    senhaArray = embaralharArray(senhaArray);

    let senha = senhaArray.join('');
    campoSenha.value = senha;

    classificaSenha(alfabeto.length);
    salvarHistorico(senha);
    carregarHistorico();
}

function embaralharArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        let j = numeroSeguro(i + 1);
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

function classificaSenha(tamanhoAlfabeto) {
    let entropia = tamanhoSenha * Math.log2(tamanhoAlfabeto);

    forcaSenha.classList.remove('fraca', 'media', 'forte');

    if (entropia > 57) {
        forcaSenha.classList.add('forte');
        feedbackSenha.textContent = 'Senha forte: boa combinação de tamanho e variedade de caracteres.';
    } else if (entropia > 35) {
        forcaSenha.classList.add('media');
        feedbackSenha.textContent = 'Senha média: tente aumentar o tamanho ou adicionar mais tipos de caracteres.';
    } else {
        forcaSenha.classList.add('fraca');
        feedbackSenha.textContent = 'Senha fraca: aumente o tamanho e utilize mais tipos de caracteres.';
    }

    let dias = Math.floor(2 ** entropia / (100e6 * 60 * 60 * 24));

    if (!isFinite(dias) || dias > 999999999999) {
        valorEntropia.textContent = `Entropia estimada: ${entropia.toFixed(2)} bits. Tempo estimado de quebra: extremamente alto.`;
    } else {
        valorEntropia.textContent =
            `Entropia estimada: ${entropia.toFixed(2)} bits. Um computador poderia levar cerca de ${dias} dias para descobrir essa senha.`;
    }
}

async function copiarSenha() {
    if (!campoSenha.value) return;

    try {
        await navigator.clipboard.writeText(campoSenha.value);
        mensagemCopia.textContent = 'Senha copiada com sucesso!';
    } catch (erro) {
        mensagemCopia.textContent = 'Não foi possível copiar a senha.';
    }
}

// histórico local
function salvarHistorico(senha) {
    let historico = JSON.parse(localStorage.getItem('historicoSenhas')) || [];

    // evita duplicatas seguidas
    if (historico[0] !== senha) {
        historico.unshift(senha);
    }

    // mantém no máximo 5
    historico = historico.slice(0, 5);

    localStorage.setItem('historicoSenhas', JSON.stringify(historico));
}

function carregarHistorico() {
    let historico = JSON.parse(localStorage.getItem('historicoSenhas')) || [];
    listaHistorico.innerHTML = '';

    if (historico.length === 0) {
        listaHistorico.innerHTML = '<li>Nenhuma senha gerada ainda.</li>';
        return;
    }

    historico.forEach((senha) => {
        let item = document.createElement('li');
        item.textContent = senha;
        listaHistorico.appendChild(item);
    });
}

function limparHistorico() {
    localStorage.removeItem('historicoSenhas');
    carregarHistorico();
}