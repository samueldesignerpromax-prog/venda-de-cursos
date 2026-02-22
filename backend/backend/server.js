const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// ==================== BANCO DE DADOS SIMULADO ====================
let usuarios = [
    {
        id: 1,
        nome: "Admin",
        email: "admin@email.com",
        senha: "123456",
        tipo: "admin"
    }
];

let cursos = [
    {
        id: 1,
        nome: "JavaScript Completo",
        descricao: "Aprenda JavaScript do zero ao avançado",
        preco: 97.90,
        categoria: "Programação",
        imagem: "https://img.icons8.com/color/96/000000/javascript.png",
        aulas: 120,
        horas: 30,
        alunos: 1540
    },
    {
        id: 2,
        nome: "HTML5 e CSS3",
        descricao: "Crie sites profissionais com as melhores práticas",
        preco: 79.90,
        categoria: "Front-end",
        imagem: "https://img.icons8.com/color/96/000000/html-5.png",
        aulas: 80,
        horas: 20,
        alunos: 2300
    },
    {
        id: 3,
        nome: "React do Zero",
        descricao: "Desenvolva aplicações React completas",
        preco: 127.90,
        categoria: "Framework",
        imagem: "https://img.icons8.com/color/96/000000/react-native.png",
        aulas: 100,
        horas: 25,
        alunos: 890
    },
    {
        id: 4,
        nome: "Node.js API REST",
        descricao: "Crie APIs profissionais com Node.js",
        preco: 109.90,
        categoria: "Back-end",
        imagem: "https://img.icons8.com/color/96/000000/nodejs.png",
        aulas: 90,
        horas: 22,
        alunos: 650
    },
    {
        id: 5,
        nome: "Python para Dados",
        descricao: "Análise de dados com Python",
        preco: 119.90,
        categoria: "Data Science",
        imagem: "https://img.icons8.com/color/96/000000/python.png",
        aulas: 110,
        horas: 28,
        alunos: 780
    },
    {
        id: 6,
        nome: "Banco de Dados SQL",
        descricao: "Aprenda SQL do básico ao avançado",
        preco: 89.90,
        categoria: "Banco de Dados",
        imagem: "https://img.icons8.com/color/96/000000/database.png",
        aulas: 70,
        horas: 18,
        alunos: 920
    }
];

let compras = [];

// ==================== FUNÇÕES AUXILIARES ====================
function gerarToken(usuario) {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

function encontrarUsuario(email) {
    return usuarios.find(u => u.email === email);
}

// ==================== ROTAS PÚBLICAS ====================

// Rota de teste
app.get('/', (req, res) => {
    res.json({ message: "API de Venda de Cursos funcionando!" });
});

// Listar todos os cursos
app.get('/api/cursos', (req, res) => {
    const { categoria } = req.query;
    
    let cursosFiltrados = cursos;
    
    if (categoria) {
        cursosFiltrados = cursos.filter(c => c.categoria === categoria);
    }
    
    res.json(cursosFiltrados);
});

// Buscar curso por ID
app.get('/api/cursos/:id', (req, res) => {
    const curso = cursos.find(c => c.id === parseInt(req.params.id));
    
    if (!curso) {
        return res.status(404).json({ erro: "Curso não encontrado" });
    }
    
    res.json(curso);
});

// ==================== ROTAS DE AUTENTICAÇÃO ====================

// Cadastro
app.post('/api/auth/cadastro', (req, res) => {
    const { nome, email, senha } = req.body;
    
    // Validar dados
    if (!nome || !email || !senha) {
        return res.status(400).json({ erro: "Todos os campos são obrigatórios" });
    }
    
    // Verificar se usuário já existe
    if (encontrarUsuario(email)) {
        return res.status(400).json({ erro: "Email já cadastrado" });
    }
    
    // Criar novo usuário
    const novoUsuario = {
        id: usuarios.length + 1,
        nome,
        email,
        senha,
        tipo: "cliente",
        dataCadastro: new Date()
    };
    
    usuarios.push(novoUsuario);
    
    // Gerar token
    const token = gerarToken(novoUsuario);
    
    res.status(201).json({
        mensagem: "Cadastro realizado com sucesso!",
        token,
        usuario: {
            id: novoUsuario.id,
            nome: novoUsuario.nome,
            email: novoUsuario.email,
            tipo: novoUsuario.tipo
        }
    });
});

// Login
app.post('/api/auth/login', (req, res) => {
    const { email, senha } = req.body;
    
    // Validar dados
    if (!email || !senha) {
        return res.status(400).json({ erro: "Email e senha são obrigatórios" });
    }
    
    // Buscar usuário
    const usuario = encontrarUsuario(email);
    
    if (!usuario || usuario.senha !== senha) {
        return res.status(401).json({ erro: "Email ou senha inválidos" });
    }
    
    // Gerar token
    const token = gerarToken(usuario);
    
    res.json({
        mensagem: "Login realizado com sucesso!",
        token,
        usuario: {
            id: usuario.id,
            nome: usuario.nome,
            email: usuario.email,
            tipo: usuario.tipo
        }
    });
});

// ==================== ROTAS PROTEGIDAS ====================

// Middleware de autenticação simples
function autenticar(req, res, next) {
    const token = req.headers['authorization'];
    
    if (!token) {
        return res.status(401).json({ erro: "Token não fornecido" });
    }
    
    // Buscar usuário pelo token (simplificado)
    const usuario = usuarios.find(u => token.includes(u.email));
    
    if (!usuario) {
        return res.status(401).json({ erro: "Token inválido" });
    }
    
    req.usuario = usuario;
    next();
}

// Comprar curso
app.post('/api/compras', autenticar, (req, res) => {
    const { cursoId } = req.body;
    
    // Buscar curso
    const curso = cursos.find(c => c.id === cursoId);
    
    if (!curso) {
        return res.status(404).json({ erro: "Curso não encontrado" });
    }
    
    // Verificar se já comprou
    const compraExistente = compras.find(c => 
        c.usuarioId === req.usuario.id && c.cursoId === cursoId
    );
    
    if (compraExistente) {
        return res.status(400).json({ erro: "Você já comprou este curso" });
    }
    
    // Registrar compra
    const novaCompra = {
        id: compras.length + 1,
        usuarioId: req.usuario.id,
        cursoId: curso.id,
        cursoNome: curso.nome,
        valor: curso.preco,
        dataCompra: new Date(),
        status: "aprovado"
    };
    
    compras.push(novaCompra);
    
    res.status(201).json({
        mensagem: "Compra realizada com sucesso!",
        compra: novaCompra
    });
});

// Listar compras do usuário
app.get('/api/compras', autenticar, (req, res) => {
    const comprasUsuario = compras.filter(c => c.usuarioId === req.usuario.id);
    
    // Adicionar detalhes do curso
    const comprasDetalhadas = comprasUsuario.map(compra => {
        const curso = cursos.find(c => c.id === compra.cursoId);
        return {
            ...compra,
            curso: curso
        };
    });
    
    res.json(comprasDetalhadas);
});

// Dados do usuário
app.get('/api/usuario', autenticar, (req, res) => {
    res.json({
        id: req.usuario.id,
        nome: req.usuario.nome,
        email: req.usuario.email,
        tipo: req.usuario.tipo,
        dataCadastro: req.usuario.dataCadastro
    });
});

// ==================== ROTAS ADMIN ====================

// Middleware admin
function adminAuth(req, res, next) {
    if (req.usuario.tipo !== 'admin') {
        return res.status(403).json({ erro: "Acesso negado" });
    }
    next();
}

// Estatísticas (admin)
app.get('/api/admin/stats', autenticar, adminAuth, (req, res) => {
    const totalUsuarios = usuarios.length;
    const totalCursos = cursos.length;
    const totalVendas = compras.length;
    const faturamento = compras.reduce((acc, compra) => acc + compra.valor, 0);
    
    res.json({
        totalUsuarios,
        totalCursos,
        totalVendas,
        faturamento
    });
});

// Iniciar servidor
app.listen(PORT, () => {
    console.log(`🚀 Servidor rodando em http://localhost:${PORT}`);
    console.log(`📚 Total de cursos: ${cursos.length}`);
    console.log(`👥 Usuários cadastrados: ${usuarios.length}`);
});
