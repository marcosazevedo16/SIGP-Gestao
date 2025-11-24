Site live: [https://marcosazevedo16.github.io/SIGP-Gestao](https://marcosazevedo16.github.io/SIGP-Gestao)

# 🏥 SIGP Saúde - Sistema de Gestão de Setor (v4.3)

> **Status:** Em produção (Versão 4.3)  
> **Foco:** Gestão Interna, CRM e Controle Operacional de Setor.

## 🎯 Sobre o Projeto

O **SIGP Saúde** é uma solução de *Back-Office* e Inteligência de Negócio desenvolvida para gerenciar a operação do setor de saúde de uma empresa que atende atualmente **37 municípios** na area da saúde. 

O objetivo do sistema é centralizar indicadores, históricos e demandas, permitindo o controle total sobre a carteira de clientes, treinamentos realizados, suporte técnico e evolução do produto (software de saúde municipal).

A aplicação foi construída com a filosofia **Local-First**, rodando inteiramente no navegador do cliente para garantir máxima performance e independência de servidores complexos para a operação diária.

---

## 🚀 Funcionalidades Principais

### 📊 Gestão e Inteligência (Business Intelligence)
* **Dashboard Interativo:** Visão geral em tempo real de municípios ativos, treinamentos e demandas.
* **Carteira de Clientes:** Controle de 37+ municípios (Status, Data de Implantação, Módulos em uso).
* **Indicadores de Uso:** Monitoramento de tempo de contrato e frequência de utilização.

### 🛠️ Operação e Suporte (CRM)
* **Controle de Treinamentos:** Registro detalhado de capacitações (Quem foi treinado, Cargo, Data).
* **Gestão de Demandas:** Acompanhamento de tickets de suporte e solicitações de melhoria.
* **Controle de Visitas:** Agendamento e histórico de visitas presenciais aos municípios.
* **Envio de Produção:** Monitoramento do fluxo de dados e faturamento dos clientes.

### 💻 Produto e Desenvolvimento
* **Changelog (Novo!):** Registro histórico de versões, correções e novas funcionalidades liberadas no software de saúde.
* **Solicitações de Clientes:** Backlog de sugestões e necessidades reportadas pelos usuários.

### ⚙️ Recursos Técnicos
* **Persistência Local:** Todos os dados são salvos no `localStorage` do navegador.
* **Backup & Restore:** Sistema robusto de exportação (JSON) para segurança dos dados.
* **Exportação de Relatórios:** Geração de CSV e PDF para auditorias e reuniões.
* **Segurança:** Criptografia de senhas (Hash + Salt) e níveis de acesso (Admin/Usuário).
* **Interface:** Design responsivo com Tema Claro/Escuro.

---

## 🛠️ Tecnologias Utilizadas

O projeto utiliza uma abordagem **Vanilla JS (Sem Frameworks)** para garantir leveza, facilidade de manutenção e zero dependência de build tools.

* **Core:** HTML5, CSS3 (CSS Variables), JavaScript (ES6+).
* **Bibliotecas Auxiliares:**
    * `Chart.js`: Gráficos e Dashboards.
    * `CryptoJS`: Segurança e Hashing.
    * `jsPDF` & `html2canvas`: Geração de relatórios em PDF.

---

## 🚀 Como Usar (Instalação)

Não é necessária instalação de dependências (npm/node). O projeto é estático.

1.  **Clone o repositório:**
    ```bash
    git clone [https://github.com/marcosazevedo16/SIGP-Gestao.git](https://github.com/marcosazevedo16/SIGP-Gestao.git)
    ```
2.  **Abra o sistema:**
    * Navegue até a pasta e abra o arquivo `index.html` no seu navegador preferido.

### 🔑 Acesso Padrão (Demo)

Para o primeiro acesso, utilize as credenciais de administrador:

| Login | Senha |
|-------|-------|
| **ADMIN** | `saude2025` |

> **Nota:** O sistema solicitará a troca de senha no primeiro login por segurança.

---

## ⚠️ Avisos Importantes (Local-First)

Como este sistema roda no navegador (Client-Side):

1.  **Seus dados ficam no seu navegador:** Se você limpar o cache do navegador, os dados serão perdidos.
2.  **Faça Backups:** Utilize a função **"Backup e Restauração"** no menu de Configurações diariamente ou semanalmente.
3.  **Segurança:** Embora as senhas sejam criptografadas, recomenda-se o uso em computadores corporativos seguros.

---

## 📄 Licença

Desenvolvido para uso interno de gestão.  
© 2025 Marcos Azevedo.
