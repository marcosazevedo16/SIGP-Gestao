🏥 SIGP Saúde - Sistema de Gestão de Setor (v5.0)
Status: Em produção (Versão 5.0 - Relatórios Avançados & UX Refinada)

Link de Acesso: https://marcosazevedo16.github.io/SIGP-Gestao

🎯 Sobre o Projeto
O SIGP Saúde é uma solução completa de Back-Office e Business Intelligence (BI) desenvolvida para gerenciar a operação estratégica de um setor de saúde que atende dezenas de municípios.

O sistema centraliza a gestão da carteira de clientes, treinamentos, suporte técnico, integrações de API e gestão de equipe, substituindo planilhas dispersas por uma aplicação web robusta, segura e Local-First (todos os dados ficam no dispositivo do usuário).

✨ O QUE HÁ DE NOVO NA v5.0 (Atualização Major)
Esta versão traz uma reformulação completa do módulo de relatórios e melhorias significativas de interface.

📄 Relatórios Inteligentes & PDF
PDFs Profissionais (Vetoriais): Migração de print de tela para geração nativa com jsPDF-AutoTable. Textos selecionáveis e alta qualidade de impressão.

Formato Paisagem A4: Relatórios otimizados para folhas largas, ideais para tabelas extensas.

Paginação Automática: O sistema detecta o fim da folha A4 e cria novas páginas automaticamente.

Cabeçalho Recorrente: Títulos e filtros aplicados se repetem no topo de todas as páginas do PDF.

📊 Filtros Dinâmicos & Excel
Filtros Contextuais: A tela de relatórios adapta os campos de filtro conforme o tipo selecionado (Ex: Treinamentos mostram filtros de Cargo/Instrutor; Clientes mostram Status/Implantação).

Exportação Excel (.xlsx): Botão dedicado para baixar planilhas formatadas e filtradas de qualquer módulo.

Botões de Ação: Nova barra de ferramentas unificada (Limpar, Excel, Visualizar).

🎨 UX & Layout
Menu Responsivo Inteligente: Sidebar retrátil no Desktop (expande ao passar o mouse) e Menu Gaveta no Mobile.

Undo (Desfazer): Possibilidade de desfazer exclusões acidentais em qualquer módulo.

Modo Offline: Detecção automática de queda de internet com aviso visual.

Visualização Limpa: Pré-visualização de relatórios em modal "Tela Cheia" simulando papel.

🚀 Funcionalidades Principais
🏢 Gestão de Carteira (CRM)
Municípios: Controle detalhado (Status, Gestor, Contato, Módulos Ativos).

Histórico: Datas de implantação, última visita e tempo de contrato.

Integrações (Novo!): Monitoramento de vencimento de certificados digitais e APIs ativas por cliente.

🎓 Operação e Treinamentos
Controle de Capacitação: Registro de treinamentos (Solicitante, Instrutor, Cargo do treinado, Status).

Apresentações: Gestão de demonstrações do software (Comercial/Técnico).

Visitas: Histórico e agendamento de visitas presenciais.

🛠️ Suporte e Produção
Demandas: Backlog de solicitações de melhoria e tickets de suporte.

Envio de Produção: Controle de faturamento e envio de arquivos XML/BPA.

Solicitações: Registro de sugestões de clientes.

👥 RH e Administrativo
Colaboradores (Novo!): Ficha completa da equipe (Admissão, Férias, Tempo de Casa).

Gestão de Usuários: Controle de acesso (Admin/User) com log de auditoria.

⚙️ Recursos Técnicos & Segurança
A aplicação segue a filosofia Local-First, garantindo privacidade e performance instantânea.

🔒 Segurança Avançada
✅ Criptografia: Senhas armazenadas com Hash SHA-256 + Salt dinâmico.

✅ Rate Limiting: Bloqueio temporário (15 min) após 5 tentativas falhas de login.

✅ Sessão Inteligente: Logout automático após 15 minutos de inatividade.

✅ Sanitização XSS: Proteção contra injeção de códigos maliciosos nos inputs.

✅ Auditoria: Log completo de ações (Quem fez, O que fez, Quando fez).

💾 Persistência e Backup
Storage Local: Dados salvos no navegador (IndexedDB/LocalStorage).

Sincronização entre Abas: Alterações em uma janela atualizam as outras em tempo real.

Backup JSON: Sistema robusto de backup e restauração manual.

Validação de Restore: Verifica a integridade do arquivo de backup antes de restaurar.

🛠️ Tecnologias Utilizadas
Projeto desenvolvido em Vanilla JavaScript (Sem Frameworks) para máxima leveza e longevidade.

Core: HTML5, CSS3 (CSS Variables, Grid, Flexbox), JavaScript ES6+.

Relatórios PDF: jsPDF + jspdf-autotable (Geração vetorial).

Relatórios Excel: SheetJS (xlsx) (Geração de planilhas).

Gráficos: Chart.js (Dashboards interativos).

Segurança: CryptoJS (Hashing).

🚀 Como Rodar o Projeto
Não é necessário instalação de dependências (npm/node). O projeto é estático.

Clone o repositório:

Bash

git clone https://github.com/marcosazevedo16/SIGP-Gestao.git
Abra o sistema: Navegue até a pasta e abra o arquivo index.html em qualquer navegador moderno.

🔑 Acesso Inicial (Primeira Execução)
Ao abrir o sistema pela primeira vez:

Crie o usuário Administrador.

Defina uma senha forte.

Dica: O sistema pedirá troca de senha se detectar credenciais padrão antigas.

📄 Licença
Desenvolvido para uso interno de gestão estratégica.

© 2025 Marcos Azevedo.
