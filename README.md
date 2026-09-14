# MicroShift 🚀

Plataforma de microlearning e mentoria reflexiva orientada por IA, construída com Next.js 14, Tailwind CSS, Firebase Auth/Firestore e Google Gemini.

## 🛠️ Tecnologias
- **Frontend / Framework:** Next.js 14 (App Router) + React 18
- **Estilização:** Tailwind CSS + Lucide Icons + Framer Motion
- **Autenticação & Banco:** Firebase Authentication & Cloud Firestore
- **IA Generativa:** Google Gemini API (`@google/genai`)
- **Deploy & Borda:** Cloudflare Pages (com suporte a Edge Runtime e Node.js compat)

## 📦 Scripts Disponíveis
```bash
npm run dev        # Inicia o servidor local em desenvolvimento
npm run build      # Realiza o build de produção do Next.js
npm run start      # Inicia o servidor de produção
npm run pages:build # Constrói a aplicação para o Cloudflare Pages
```

## ⚙️ Variáveis de Ambiente
Crie um arquivo `.env.local` na raiz com as seguintes credenciais:
```env
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...
GEMINI_API_KEY=...
```

## 🌐 Deploy no Cloudflare Pages
1. Conecte este repositório no Cloudflare Pages Dashboard.
2. Configure o framework preset como **Next.js**.
3. Defina o comando de build: `npx @cloudflare/next-on-pages` (ou build padrão dependendo da estratégia de deploy).
4. Adicione as variáveis de ambiente no console do Cloudflare Pages.
5. Adicione o domínio `.pages.dev` gerado na lista de Domínios Autorizados no console do Firebase Authentication.
