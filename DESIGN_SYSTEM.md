# Sistema de Design AuraUP — Especificação Canônica

Este documento define o **padrão unificado de design** para a aplicação AuraUP. Todos os novos componentes, páginas e refatorações devem seguir rigorosamente as regras aqui estabelecidas para manter uma estética **alegre, colorida, acolhedora para crianças e estudantes, limpa e padronizada (sem sombras grotescas ou fontes desproporcionais)**.

---

## 1. Tipografia Canônica & Legibilidade

A AuraUP utiliza a família **Nunito** como fonte padrão para toda a aplicação.

| Papel | Peso | Tamanho Base | Classes Recomendadas | Exemplo de Uso |
| :--- | :--- | :--- | :--- | :--- |
| **Título da Página (H1)** | 800 (Extrabold) | `text-2xl sm:text-3xl` | `font-sans font-extrabold text-slate-900 dark:text-white tracking-tight` | "Meus Baralhos", "Painel Admin", "Liga dos Campeões" |
| **Título de Seção (H2)** | 700 (Bold) | `text-lg sm:text-xl` | `font-sans font-bold text-slate-800 dark:text-white` | "Missão de Hoje", "Palavra do Dia", "Alunos Cadastrados" |
| **Título de Card (H3)** | 700 (Bold) | `text-base sm:text-lg` | `font-bold text-slate-900 dark:text-white` | Nome do deck, nome do aluno no ranking |
| **Corpo & Descrições** | 500 (Medium) | `text-xs sm:text-sm` | `font-medium text-slate-600 dark:text-slate-300` | Explicações, descrições de decks |
| **Rótulos de Métricas** | 600 (Semibold) | `text-xs` | `font-semibold text-slate-500 dark:text-slate-400` | "Alunos ativos", "Baralhos oficiais" |
| **Badges & Indicadores** | 700 (Bold) | `text-xs` | `font-bold px-2.5 py-1 rounded-full` | "3 baralhos", "+10 XP", "Nível 1" |

### 🚫 Regra de Ouro contra ALL-CAPS Arbitrário
- É proibido transformar microtextos de dados em caixa alta (`uppercase`), como `0 ATIVOS` ou `ALUNOS ATIVOS`.
- Todo rótulo e badge deve usar **Sentence case** ou **Title case** ("Alunos ativos", "3 baralhos").

---

## 2. Botões Limpos, Coloridos e Táteis

Todos os botões utilizam cores vibrantes, cantos amigáveis (`rounded-xl`), toque suave (`active:scale-95`) e **zero extrusão escura** (`box-shadow: 0 5px 0 0 ...` é estritamente proibido).

### Alturas Padronizadas (Perfeito Alinhamento Vertical)
- `sm`: `h-10 px-4 text-xs sm:text-sm rounded-xl` (Alinhado com selects, inputs e filtros de toolbar).
- `md`: `h-11 px-5 text-sm rounded-xl` (Formulários e ações gerais).
- `lg`: `h-12 px-6 text-base rounded-xl` (Grandes CTAs comemorativos).

### Variantes Padronizadas
1. **Primary (`btn-3d-blue` / `variant="primary"`)**:
   - Azul Real Vibrante (`#2563EB`), hover `#1D4ED8`, texto branco `#FFFFFF`.
   - Uso: Ações principais da tela (Criar baralho, Novo aluno, Salvar).
2. **Orange (`btn-3d-orange` / `variant="orange"`)**:
   - Âmbar / Laranja Solar (`#F59E0B`), hover `#D97706`, texto branco `#FFFFFF`.
   - Uso: Começar missão diária, estudar agora, ações de XP/streak.
3. **Success (`btn-3d-green` / `variant="success"`)**:
   - Verde Esmeralda (`#10B981`), hover `#059669`, texto branco `#FFFFFF`.
   - Uso: Avaliação "Fácil" no estudo, confirmações de sucesso.
4. **Danger (`btn-3d-red` / `variant="danger"`)**:
   - Vermelho Coral (`#F43F5E`), hover `#E11D48`, texto branco `#FFFFFF`.
   - Uso: Avaliação "De novo", excluir deck/card.
5. **Secondary (`btn-3d-white` / `variant="secondary"`)**:
   - Fundo branco `#FFFFFF`, borda `#CBD5E1`, texto `#334155`, hover `text-blue-600 border-blue-300 bg-slate-50`.
   - Uso: Ações secundárias (Importar, Cancelar, Praticar).
6. **Icon Button (`btn-3d-icon` / `variant="icon"`)**:
   - `w-10 h-10` ou `w-8 h-8 rounded-xl`, fundo branco, borda `#E2E8F0`.

---

## 3. Cards & Superfícies

- **`.card-3d`**: Fundo branco puro `#FFFFFF`, `border border-slate-200/80`, `rounded-2xl`, sombra sutil `shadow-xs`.
- **`.card-3d-interactive`**: Inclui elevação sutil no hover (`translateY(-2px) shadow-md border-blue-200`) e leve compressão no clique (`scale-[0.99]`).

---

## 4. Alto Contraste & Navbar

- A aba ativa na Navbar deve **sempre** ter alto contraste:
  - Aba ativa: `bg-blue-600 text-white font-bold shadow-sm` (ícone e texto brancos nítidos sobre azul).
  - Aba inativa: `text-slate-600 dark:text-slate-300 hover:text-blue-600 hover:bg-white dark:hover:bg-slate-700`.
- É **proibido** utilizar texto branco ou claro sobre fundos claros.
