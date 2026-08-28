# Sistema de Design: Aura English Ecosystem (Light Clean Theme)

## 1. Identidade e Estética da Marca

* **Nome:** Aura English App
* **Estética:** Premium, minimalista e sofisticada, inspirada em Apple, Linear e Stripe.
* **Tema Principal:** Light Clean Theme com fundo `#f8fafc` e profundidade alcançada via **Glassmorphism**.
* **Sem Ilusões Infantis:** Ausência de animações elásticas/bounce, elementos 3D pesados de desenho animado ou ícones infantis.

## 2. Paleta de Cores

* **Fundo (Background):** `#f8fafc` (Light Clean)
* **Superfícies Glassmorphic:** `rgba(255, 255, 255, 0.85)` com `backdrop-filter: blur(20px)` e bordas `1px solid rgba(15, 23, 42, 0.08)`
* **Texto Primário:** `#0f172a`
* **Texto Secundário / Muted:** `#475569` / `#64748b`
* **Electric Blue (Cor Primária):** `#2563eb` (Ações principais, navegação, indicadores de progresso)
* **Vibrant Orange (Cor Secundária):** `#ea580c` (Destaques motivacionais, chamadas secundárias)
* **Neon Green (Cor Terciária):** `#059669` (Estados de sucesso, respostas corretas, badges)

## 3. Tipografia

* **Headlines (Títulos):** `Metrophobic` (peso 400). Visual tecnológico, geométrico e sofisticado.
* **Body (Corpo do Texto):** `Comfortaa` (pesos 400, 500, 600). Leitura agradável e contraste amigável.
* **Labels, Metadados e Status:** `Public Sans` (peso 500/600, `letter-spacing: 0.05em`). Extrema clareza em métricas, estatísticas e badges.

## 4. Superfícies e Arredondamento

* **Cards e Painéis (.glass-panel):** `rounded-xl` (`1.5rem` a `2rem`). Fundo translúcido com blur.
* **Botões de Ação:** `rounded-lg` (`1rem`) ou `rounded-full`.
* **Inputs de Formulário:** `rounded-md` (`1rem`).

## 5. Animações e Micro-Interações

* **Cards Interativos (.glass-panel-interactive):** Hover `translateY(-6px)`, brilho `box-shadow: 0 20px 40px -15px rgba(37, 99, 235, 0.15)` (duração 250ms easeOutExpo).
* **Botões Primários (.btn-primary-glass):** Hover `scale(1.03)` (180ms) + `box-shadow: 0 8px 30px rgba(37, 99, 235, 0.45)`. Active `scale(0.98)`.
* **Transições de Página:** Fade + Blur simples (200ms).
