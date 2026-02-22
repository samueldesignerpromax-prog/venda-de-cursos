// ==================== CONFIGURAÇÕES ====================
const API_URL = 'http://localhost:3000/api';

// ==================== ESTADO DA APLICAÇÃO ====================
let usuarioLogado = null;
let token = localStorage.getItem('token');

// ==================== INICIALIZAÇÃO ====================
document.addEventListener('DOMContentLoaded', () => {
    verificarLogin();
    atualizarNav();
    carregarPaginaAtual();
});

function verificarLogin() {
    if (token) {
        // Buscar dados do usuário
        fetch(`${API_URL}/usuario`, {
            headers: {
                'Authorization': token
            }
        })
        .then(res => res.json())
        .then(data => {
            if (!data.erro) {
                usuarioLogado = data;
                atualizarNav();
            } else {
                token = null;
                localStorage.removeItem('token');
            }
        })
        .catch(() => {
            token = null;
            localStorage.removeItem('token');
        });
    }
}

function carregarPaginaAtual() {
    const path = window.location.pathname;
    
    if (path.includes('cursos.html')) {
        carregarCursos();
    }
    
    if (path.includes('index.html') || path === '/') {
        carregarDestaques();
    }
    
    if (path.includes('dashboard.html')) {
        if (!token) {
            window.location.href = 'login.html';
            return;
        }
        carregarDashboard();
    }
    
    if (path.includes('login.html')) {
        if (token) {
            window.location.href = 'dashboard.html';
        }
        setupLoginForm();
    }
    
    if (path.includes('cadastro.html')) {
        if (token) {
            window.location.href = 'dashboard.html';
        }
        setupCadastroForm();
    }
}

// ==================== NAVEGAÇÃO ====================
function atualizarNav() {
    const navAuth = document.getElementById('navAuth');
    if (!navAuth) return;

    if (usuarioLogado) {
        navAuth.innerHTML = `
            <span class="user-name">Olá, ${usuarioLogado.nome.split(' ')[0]}</span>
            <a href="dashboard.html" class="btn-register">Meus Cursos</a>
        `;
    } else {
        navAuth.innerHTML = `
            <a href="login.html" class="btn-login">Entrar</a>
            <a href="cadastro.html" class="btn-register">Cadastrar</a>
        `;
    }
}

// ==================== CURSOS ====================
function carregarCursos(categoria = 'todos', busca = '') {
    const grid = document.getElementById('cursosGrid');
    const loading = document.getElementById('loading');
    
    if (!grid) return;
    
    loading.style.display = 'block';
    grid.innerHTML = '';
    
    let url = `${API_URL}/cursos`;
    if (categoria !== 'todos') {
        url += `?categoria=${categoria}`;
    }
    
    fetch(url)
        .then(res => res.json())
        .then(cursos => {
            loading.style.display = 'none';
            
            let cursosFiltrados = cursos;
            
            // Filtrar por busca
            if (busca) {
                cursosFiltrados = cursos.filter(c => 
                    c.nome.toLowerCase().includes(busca.toLowerCase()) ||
                    c.descricao.toLowerCase().includes(busca.toLowerCase())
                );
            }
            
            if (cursosFiltrados.length === 0) {
                grid.innerHTML = '<p class="text-center">Nenhum curso encontrado</p>';
                return;
            }
            
            grid.innerHTML = cursosFiltrados.map(curso => `
                <div class="curso-card">
                    <div class="curso-image" style="background: ${getCorCurso(curso.categoria)}">
                        <img src="${curso.imagem}" alt="${curso.nome}" width="64">
                    </div>
                    <div class="curso-info">
                        <div class="curso-categoria">${curso.categoria}</div>
                        <h3 class="curso-nome">${curso.nome}</h3>
                        <p class="curso-descricao">${curso.descricao}</p>
                        <div class="curso-meta">
                            <span><i class="fas fa-play-circle"></i> ${curso.aulas} aulas</span>
                            <span><i class="fas fa-clock"></i> ${curso.horas}h</span>
                            <span><i class="fas fa-users"></i> ${curso.alunos} alunos</span>
                        </div>
                        <div class="curso-preco">R$ ${curso.preco.toFixed(2)}</div>
                        <button class="btn-comprar" onclick="comprarCurso(${curso.id})">
                            Comprar Agora
                        </button>
                    </div>
                </div>
            `).join('');
            
            // Configurar filtros
            setupFiltros();
        })
        .catch(erro => {
            loading.style.display = 'none';
            mostrarMensagem('erro', 'Erro ao carregar cursos');
        });
}

function carregarDestaques() {
    const grid = document.getElementById('destaquesGrid');
    if (!grid) return;
    
    fetch(`${API_URL}/cursos`)
        .then(res => res.json())
        .then(cursos => {
            const destaques = cursos.slice(0, 3);
            
            grid.innerHTML = destaques.map(curso => `
                <div class="curso-card">
                    <div class="curso-image" style="background: ${getCorCurso(curso.categoria)}">
                        <img src="${curso.imagem}" alt="${curso.nome}" width="64">
                    </div>
                    <div class="curso-info">
                        <div class="curso-categoria">${curso.categoria}</div>
                        <h3 class="curso-nome">${curso.nome}</h3>
                        <p class="curso-descricao">${curso.descricao.substring(0, 60)}...</p>
                        <div class="curso-meta">
                            <span><i class="fas fa-play-circle"></i> ${curso.aulas} aulas</span>
                        </div>
                        <div class="curso-preco">R$ ${curso.preco.toFixed(2)}</div>
                        <button class="btn-comprar" onclick="comprarCurso(${curso.id})">
                            Comprar
                        </button>
                    </div>
                </div>
            `).join('');
        });
}

function getCorCurso(categoria) {
    const cores = {
        'Programação': '#2563eb',
        'Front-end': '#f59e0b',
        'Back-end': '#10b981',
        'Framework': '#8b5cf6',
        'Data Science': '#ec4899',
        'Banco de Dados': '#ef4444'
    };
    return cores[categoria] || '#64748b';
}

function setupFiltros() {
    const filterBtns = document.querySelectorAll('.filter-btn');
    const searchBtn = document.getElementById('searchBtn');
    const searchInput = document.getElementById('searchInput');
    
    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const categoria = btn.dataset.cat;
            const busca = searchInput ? searchInput.value : '';
            carregarCursos(categoria, busca);
        });
    });
    
    if (searchBtn && searchInput) {
        searchBtn.addEventListener('click', () => {
            const categoria = document.querySelector('.filter-btn.active')?.dataset.cat || 'todos';
            carregarCursos(categoria, searchInput.value);
        });
        
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                const categoria = document.querySelector('.filter-btn.active')?.dataset.cat || 'todos';
                carregarCursos(categoria, searchInput.value);
            }
        });
    }
}

// ==================== COMPRAS ====================
function comprarCurso(cursoId) {
    if (!token) {
        if (confirm('Você precisa estar logado para comprar. Deseja fazer login?')) {
            window.location.href = 'login.html';
        }
        return;
    }
    
    fetch(`${API_URL}/compras`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': token
        },
        body: JSON.stringify({ cursoId })
    })
    .then(res => res.json())
    .then(data => {
        if (data.erro) {
            mostrarMensagem('erro', data.erro);
        } else {
            mostrarMensagem('sucesso', 'Curso adquirido com sucesso!');
            setTimeout(() => {
                window.location.href = 'dashboard.html';
            }, 2000);
        }
    })
    .catch(() => {
        mostrarMensagem('erro', 'Erro ao processar compra');
    });
}

// ==================== DASHBOARD ====================
function carregarDashboard() {
    if (!token) return;
    
    // Carregar dados do usuário
    fetch(`${API_URL}/usuario`, {
        headers: { 'Authorization': token }
    })
    .then(res => res.json())
    .then(user => {
        document.getElementById('userNome').textContent = user.nome;
        document.getElementById('userEmail').textContent = user.email;
        if (user.dataCadastro) {
            document.getElementById('userData').textContent = new Date(user.dataCadastro).toLocaleDateString();
        }
    });
    
    // Carregar compras
    fetch(`${API_URL}/compras`, {
        headers: { 'Authorization': token }
    })
    .then(res => res.json())
    .then(compras => {
        const container = document.getElementById('meusCursos');
        
        if (compras.length === 0) {
            container.innerHTML = `
                <div class="text-center" style="grid-column: 1/-1;">
                    <p>Você ainda não comprou nenhum curso.</p>
                    <a href="cursos.html" class="btn btn-primary" style="margin-top: 1rem;">Ver Cursos</a>
                </div>
            `;
            return;
        }
        
        container.innerHTML = compras.map(compra => `
            <div class="my-course-card">
                <div class="my-course-image" style="background: ${getCorCurso(compra.curso.categoria)}">
                    <img src="${compra.curso.imagem}" alt="${compra.curso.nome}" width="48">
                </div>
                <div class="my-course-info">
                    <h3>${compra.curso.nome}</h3>
                    <div class="my-course-meta">
                        <span><i class="fas fa-calendar"></i> 
                            ${new Date(compra.dataCompra).toLocaleDateString()}
                        </span>
                    </div>
                    <button class="btn-acessar" onclick="acessarCurso(${compra.curso.id})">
                        <i class="fas fa-play-circle"></i> Acessar Curso
                    </button>
                </div>
            </div>
        `).join('');
    });
    
    // Setup das tabs
    setupTabs();
}

function setupTabs() {
    const tabs = document.querySelectorAll('.tab-btn');
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            
            document.querySelectorAll('.tab-content').forEach(content => {
                content.classList.remove('active');
            });
            
            const tabId = tab.dataset.tab;
            document.getElementById(tabId).classList.add('active');
        });
    });
    
    // Logout
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            token = null;
            usuarioLogado = null;
            localStorage.removeItem('token');
            window.location.href = 'index.html';
        });
    }
}

function acessarCurso(cursoId) {
    // Simular acesso ao curso
    alert('Abrindo curso... (em desenvolvimento)');
}

// ==================== AUTENTICAÇÃO ====================
function setupLoginForm() {
    const form = document.getElementById('loginForm');
    if (!form) return;
    
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const email = document.getElementById('email').value;
        const senha = document.getElementById('senha').value;
        
        fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, senha })
        })
        .then(res => res.json())
        .then(data => {
            if (data.erro) {
                mostrarMensagem('erro', data.erro);
            } else {
                token = data.token;
                usuarioLogado = data.usuario;
                localStorage.setItem('token', token);
                mostrarMensagem('sucesso', 'Login realizado!');
                setTimeout(() => {
                    window.location.href = 'dashboard.html';
                }, 1500);
            }
        })
        .catch(() => {
            mostrarMensagem('erro', 'Erro ao fazer login');
        });
    });
}

function setupCadastroForm() {
    const form = document.getElementById('cadastroForm');
    if (!form) return;
    
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const nome = document.getElementById('nome').value;
        const email = document.getElementById('email').value;
        const senha = document.getElementById('senha').value;
        const confirmarSenha = document.getElementById('confirmarSenha').value;
        
        if (senha !== confirmarSenha) {
            mostrarMensagem('erro', 'As senhas não coincidem');
            return;
        }
        
        if (senha.length < 6) {
            mostrarMensagem('erro', 'A senha deve ter pelo menos 6 caracteres');
            return;
        }
        
        fetch(`${API_URL}/auth/cadastro`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nome, email, senha })
        })
        .then(res => res.json())
        .then(data => {
            if (data.erro) {
                mostrarMensagem('erro', data.erro);
            } else {
                token = data.token;
                usuarioLogado = data.usuario;
                localStorage.setItem('token', token);
                mostrarMensagem('sucesso', 'Cadastro realizado!');
                setTimeout(() => {
                    window.location.href = 'dashboard.html';
                }, 1500);
            }
        })
        .catch(() => {
            mostrarMensagem('erro', 'Erro ao fazer cadastro');
        });
    });
}

// ==================== UTILITÁRIOS ====================
function mostrarMensagem(tipo, texto) {
    const mensagem = document.createElement('div');
    mensagem.className = `message ${tipo}`;
    mensagem.textContent = texto;
    
    document.body.appendChild(mensagem);
    
    setTimeout(() => {
        mensagem.remove();
    }, 3000);
}

// Mobile menu
document.querySelector('.mobile-menu')?.addEventListener('click', () => {
    document.querySelector('.nav-menu').classList.toggle('show');
});
