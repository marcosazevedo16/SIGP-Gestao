🏥 SIGP Saúde - Sistema de Gestão de Setor (v4.4)
Status: Em produção (Versão 4.4 - Segurança Aprimorada)
Foco: Gestão Interna, CRM e Controle Operacional de Setor + Segurança
Site live: https://marcosazevedo16.github.io/SIGP-Gestao

🎯 Sobre o Projeto
O SIGP Saúde é uma solução de Back-Office e Inteligência de Negócio desenvolvida para gerenciar a operação do setor de saúde de uma empresa que atende atualmente 37 municípios na área da saúde.

O objetivo do sistema é centralizar indicadores, históricos e demandas, permitindo o controle total sobre a carteira de clientes, treinamentos realizados, suporte técnico e evolução do produto (software de saúde municipal).

A aplicação foi construída com a filosofia Local-First, rodando inteiramente no navegador do cliente para garantir máxima performance e independência de servidores complexos para a operação diária.

✨ O QUE MUDOU NA v4.4
🔒 Segurança Aprimorada
✅ Rate Limiting - Proteção contra força bruta (5 tentativas = 15 min bloqueado)
✅ Timeout de Sessão - Logout automático após 15 min de inatividade
✅ Sanitização XSS - Proteção contra injeção de scripts maliciosos
✅ Sincronização entre Abas - Alterações em uma aba refletem na outra
✅ Backup Automático - Salva automaticamente a cada 1 hora

📊 Otimizações
✅ Paginação - Reduz lag com 100+ registros
✅ Destruição de Gráficos - Sem vazamento de memória
✅ UF nos Dropdowns - Melhor seleção de municípios
✅ Validações Rigorosas - Duplicidade, dados obrigatórios verificados

🚀 Funcionalidades Principais
📊 Gestão e Inteligência (Business Intelligence)
Dashboard Interativo: Visão geral em tempo real de municípios ativos, treinamentos e demandas.

Carteira de Clientes: Controle de 37+ municípios (Status, Data de Implantação, Módulos em uso).

Indicadores de Uso: Monitoramento de tempo de contrato e frequência de utilização.

🛠️ Operação e Suporte (CRM)
Controle de Treinamentos: Registro detalhado de capacitações (Quem foi treinado, Cargo, Data).

Gestão de Demandas: Acompanhamento de tickets de suporte e solicitações de melhoria.

Controle de Visitas: Agendamento e histórico de visitas presenciais aos municípios.

Envio de Produção: Monitoramento do fluxo de dados e faturamento dos clientes.

💻 Produto e Desenvolvimento
Changelog (Novo!): Registro histórico de versões, correções e novas funcionalidades liberadas no software de saúde.

Solicitações de Clientes: Backlog de sugestões e necessidades reportadas pelos usuários.

⚙️ Recursos Técnicos
Persistência Local: Todos os dados são salvos no localStorage do navegador.

Backup & Restore: Sistema robusto de exportação (JSON) com versionamento para segurança dos dados.

Backup Automático: Salva automaticamente a cada 1 hora (últimos 7 backups retidos).

Exportação de Relatórios: Geração de CSV e PDF para auditorias e reuniões.

Segurança:

✅ Criptografia de senhas (Hash + Salt SHA256)

✅ Níveis de acesso (Admin/Usuário)

✅ Rate Limiting contra força bruta

✅ Timeout automático de sessão

✅ Sanitização XSS de inputs

Interface: Design responsivo com Tema Claro/Escuro.

Sincronização: Alterações refletem automaticamente entre abas do navegador.

🛠️ Tecnologias Utilizadas
O projeto utiliza uma abordagem Vanilla JS (Sem Frameworks) para garantir leveza, facilidade de manutenção e zero dependência de build tools.

Core: HTML5, CSS3 (CSS Variables), JavaScript (ES6+).

Bibliotecas Auxiliares:

Chart.js: Gráficos e Dashboards.

CryptoJS: Segurança e Hashing SHA256.

jsPDF & html2canvas: Geração de relatórios em PDF.

🚀 Como Usar (Instalação)
Não é necessária instalação de dependências (npm/node). O projeto é estático.

Clone o repositório:

bash
git clone https://github.com/marcosazevedo16/SIGP-Gestao.git
Abra o sistema:

Navegue até a pasta e abra o arquivo index.html no seu navegador preferido.

🔑 Acesso Padrão (Demo)
Para o primeiro acesso, você será solicitado a criar um usuário administrador com uma senha aleatória.

⚠️ IMPORTANTE: Altere a senha padrão imediatamente no primeiro login!

Segurança: O sistema solicitará a troca de senha no primeiro login e terá timeout de 15 minutos de inatividade.

⚠️ Avisos Importantes (Local-First)
Como este sistema roda no navegador (Client-Side):

Seus dados ficam no seu navegador: Se você limpar o cache do navegador, os dados serão perdidos.

Faça Backups: Utilize a função "Backup e Restauração" no menu de Configurações regularmente (também faz backup automático a cada 1 hora).

Segurança:

Embora as senhas sejam criptografadas com SHA256+Salt, recomenda-se o uso em computadores corporativos seguros.

O sistema faz logout automático após 15 minutos de inatividade.

Proteção contra força bruta: 5 tentativas bloqueiam por 15 minutos.

📋 Changelog
v4.4 (28 de Novembro de 2025)
✅ Rate Limiting - Proteção contra força bruta
✅ Timeout de Sessão - Logout automático
✅ Sanitização XSS - Proteção contra injeção
✅ Sincronização entre Abas - Real-time sync
✅ Backup Automático - A cada 1 hora

v4.3 (Anterior)
✅ Paginação para tabelas
✅ Destruição correta de gráficos
✅ UF nos dropdowns
✅ Validações de duplicidade
✅ Contadores atualizados em tempo real

📞 Suporte e Contribuições
Para reportar bugs ou sugerir melhorias:

Abra uma issue no GitHub

Forneça detalhes do problema

Inclua screenshots se possível

📄 Licença
Desenvolvido para uso interno de gestão.
© 2025 Marcos Azevedo.

🎓 Documentação de Segurança
Rate Limiting
Limite: 5 tentativas erradas de login

Bloqueio: 15 minutos automático

Reset: Automático após período de bloqueio

Timeout de Sessão
Inatividade: 15 minutos

Ação: Logout automático com aviso

Rastreamento: Click, Keypress, Mousemove, Scroll

Sanitização XSS
Proteção: Contra injeção de scripts

Aplicação: Todos os campos de texto

Método: HTML entity encoding

Sincronização entre Abas
Evento: Storage (localStorage)

Delay: Automático em tempo real

Cobertura: Todos os datasets

Backup Automático
Frequência: A cada 1 hora

Retenção: Últimos 7 backups

Restauração: Manual via interface

Conteúdo: Todos os dados do sistema

Aproveite o SIGP Saúde! 🚀
