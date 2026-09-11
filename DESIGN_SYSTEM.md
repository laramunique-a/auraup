# Sistema de Design AuraUP — Especificação Canônica

Este documento define o **padrão unificado de design** para a aplicação AuraUP. Todos os novos componentes, páginas e refatorações devem seguir rigorosamente as regras aqui estabelecidas para manter uma estética **moderna, limpa, equilibrada, acolhedora e refinada (sem fontes excessivamente grossas/bolha e sem cantos excessivamente redondos estilo pílula)**.

---

## 1. Tipografia Canônica & Legibilidade

A AuraUP utiliza a família **Plus Jakarta Sans** para títulos, destaques e componentes, e **Nunito** para textos de apoio, garantindo modernidade, clareza e elegância sem peso visual excessivo.

| Papel | Peso | Tamanho Base | Classes Recomendadas | Exemplo de Uso |
| :--- | :--- | :--- | :--- | :--- |
| **Título da Página (H1)** | 700 (Bold) / 600 (Semibold) | `text-2xl sm:text-3xl` | `font-heading font-bold text-slate-800 dark:text-white tracking-tight` | "Meus Baralhos", "Painel Admin", "Liga dos Campeões" |
| **Título de Seção (H2)** | 600 (Semibold) | `text-lg sm:text-xl` | `font-heading font-semibold text-slate-800 dark:text-white` | "Missão de Hoje", "Palavra do Dia", "Alunos Cadastrados" |
| **Título de Card (H3)** | 600 (Semibold) | `text-base sm:text-lg` | `font-heading font-semibold text-slate-800 dark:text-white` | Nome do deck, nome do aluno no ranking |
| **Corpo & Descrições** | 400 (Regular) / 500 (Medium) | `text-xs sm:text-sm` | `font-normal text-slate-600 dark:text-slate-300` | Explicações, descrições de decks |
| **Rótulos de Métricas** | 500 (Medium) / 600 (Semibold) | `text-xs` | `font-medium text-slate-500 dark:text-slate-400` | "Alunos ativos", "Aprendidos na Semana" |
| **Badges & Indicadores** | 600 (Semibold) | `text-xs` | `font-semibold px-2.5 py-0.5 rounded-md` | "3 baralhos", "+10 XP", "Nível 1" |

### 🚫 Regras de Suavização
- **Evitar Negrito Excessivo:** Evitar `font-black` (900) e `font-extrabold` (800) em textos corridos, títulos e botões. Preferir `font-semibold` (600) ou `font-bold` (700).
- **Sem ALL-CAPS Arbitrário:** Microtextos e dados devem usar **Sentence case** ou **Title case** ("Alunos ativos", "3 baralhos"), nunca caixa alta forçada.

---

## 2. Botões Limpos, Elegantes e Táteis

Todos os botões utilizam cores vibrantes, cantos modernos e sutis (**`rounded-lg` / 8px**), toque tátil suave (`active:scale-95`) e **zero extrusão escura**. Não usar botões em formato de pílula circular (`rounded-full`) nem cantos vivos quadrados (`rounded-none`).

### Alturas Padronizadas (Perfeito Alinhamento Vertical)
- `sm`: `h-9 px-3.5 text-xs sm:text-sm rounded-lg` (Alinhado com selects, inputs e filtros de toolbar).
- `md`: `h-10 px-4 text-sm rounded-lg` (Formulários e ações gerais).
- `lg`: `h-11 px-5 text-base rounded-lg` (Grandes CTAs de estudo).

### Variantes Padronizadas
1. **Primary (`btn-3d-blue` / `variant="primary"`)**:
   - Azul Real Vibrante (`#2563EB`), hover `#1D4ED8`, texto branco `#FFFFFF`, `font-semibold`, `rounded-lg`.
   - Uso: Ações principais da tela (Criar baralho, Novo aluno, Salvar).
2. **Orange (`btn-3d-orange` / `variant="orange"`)**:
   - Âmbar / Laranja Solar (`#F59E0B`), hover `#D97706`, texto branco `#FFFFFF`, `font-semibold`, `rounded-lg`.
   - Uso: Começar missão diária, estudar agora, ações de XP/streak.
3. **Success (`btn-3d-green` / `variant="success"`)**:
   - Verde Esmeralda (`#10B981`), hover `#059669`, texto branco `#FFFFFF`, `font-semibold`, `rounded-lg`.
   - Uso: Avaliação "Fácil" no estudo, confirmações de sucesso.
4. **Danger (`btn-3d-red` / `variant="danger"`)**:
   - Vermelho Coral (`#F43F5E`), hover `#E11D48`, texto branco `#FFFFFF`, `font-semibold`, `rounded-lg`.
   - Uso: Avaliação "De novo", excluir deck/card.
5. **Secondary (`btn-3d-white` / `variant="secondary"`)**:
   - Fundo branco `#FFFFFF`, borda `#CBD5E1`, texto `#334155`, hover `text-blue-600 border-blue-300 bg-slate-50`, `font-semibold`, `rounded-lg`.
   - Uso: Ações secundárias (Importar, Cancelar, Praticar).
6. **Icon Button (`btn-3d-icon` / `variant="icon"`)**:
   - `w-9 h-9` ou `w-8 h-8 rounded-lg`, fundo branco, borda `#CBD5E1` / `#E2E8F0`.

---

## 3. Cards, Superfícies & Badges

- **`.card-3d`**: Fundo branco puro `#FFFFFF`, `border border-slate-200`, **`rounded-xl` (12px / `0.75rem`)**, sombra sutil `shadow-xs`. Menos redondo que o padrão anterior de 20px–24px, mantendo a firmeza e modernidade.
- **`.card-3d-interactive`**: `rounded-xl`, inclui elevação sutil no hover (`translateY(-2px) shadow-xs border-blue-200`) e leve compressão no clique (`scale-[0.99]`).
- **Badges & Contadores:**
  - Usar cantos **`rounded-md` (6px)** ou **`rounded-lg` (8px)** com padding compacto (`px-2.5 py-0.5`).
  - **Não utilizar** `rounded-full` (pílulas de 9999px) para badges ou estatísticas.

---

## 4. Alto Contraste & Navbar

- A barra de navegação utiliza cantos elegantes: container `rounded-xl` e links `rounded-lg`.
- A aba ativa na Navbar deve **sempre** ter alto contraste:
  - Aba ativa: `bg-blue-600 text-white font-semibold shadow-xs` (ícone e texto brancos nítidos sobre azul).
  - Aba inativa: `text-slate-600 dark:text-slate-300 hover:text-blue-600 hover:bg-white dark:hover:bg-slate-700 font-semibold`.
- É **proibido** utilizar texto branco ou claro sobre fundos claros.
