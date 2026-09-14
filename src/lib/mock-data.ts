import { UserProfile, Coupon, MicrolearningLesson, CommunityPost, HabitGoal } from "@/types";

export const MOCK_SUPER_ADMIN: UserProfile = {
  uid: "mock-admin-fera",
  email: "feraimentor@gmail.com",
  displayName: "Fera Mentor (Fundador)",
  role: "SUPER_ADMIN",
  plan: "SOVER",
  status: "ACTIVE_VIP",
  streak: 28,
  createdAt: new Date(Date.now() - 30 * 86400000).toISOString(),
  lastActiveDate: new Date().toISOString(),
  completedLessons: ["lesson-1", "lesson-2"],
};

export const MOCK_START_USER: UserProfile = {
  uid: "mock-user-start",
  email: "aluno.iniciante@microshift.app",
  displayName: "Carlos Silva (Iniciante)",
  role: "USER",
  plan: "START",
  status: "ACTIVE",
  streak: 3,
  createdAt: new Date(Date.now() - 5 * 86400000).toISOString(),
  lastActiveDate: new Date().toISOString(),
  completedLessons: ["lesson-1"],
};

export const MOCK_SOVER_USER: UserProfile = {
  uid: "mock-user-sover",
  email: "renata.executiva@microshift.app",
  displayName: "Renata Mendes (Líder Sover)",
  role: "USER",
  plan: "SOVER",
  status: "ACTIVE",
  streak: 42,
  createdAt: new Date(Date.now() - 60 * 86400000).toISOString(),
  lastActiveDate: new Date().toISOString(),
  completedLessons: ["lesson-1", "lesson-2", "lesson-3"],
};

export const INITIAL_COUPONS: Coupon[] = [
  {
    id: "coupon-1",
    code: "VIPMASTER",
    type: "LIFETIME_VIP",
    used: false,
    isRedeemed: false,
    createdAt: new Date().toISOString(),
  },
  {
    id: "coupon-2",
    code: "TRACK90",
    type: "TRIAL_3M_TRACK",
    used: false,
    isRedeemed: false,
    createdAt: new Date().toISOString(),
  },
  {
    id: "coupon-3",
    code: "SOVER90",
    type: "TRIAL_3M_SOVER",
    used: false,
    isRedeemed: false,
    createdAt: new Date().toISOString(),
  },
];

export const INITIAL_LESSONS: MicrolearningLesson[] = [
  {
    id: "lesson-1",
    title: "O Paradoxo dos 35+: Como converter bagagem prévia em autoridade ágil",
    moduleTitle: "Módulo 1: Reposicionamento Sênior",
    youtubeId: "dQw4w9WgXcQ",
    description: "Aprenda a reinterpretar anos de gestão convencional em competências de alto impacto para times de tecnologia e inovação.",
    youtubeUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    durationText: "7 min",
    durationMinutes: 7,
    category: "Transição de Carreira",
    order: 1,
    createdAt: new Date().toISOString(),
  },
  {
    id: "lesson-2",
    title: "Blindagem de Atenção: Micro-hábitos de 15 minutos contra a sobrecarga cognitiva",
    moduleTitle: "Módulo 2: Foco & Neurociência",
    youtubeId: "dQw4w9WgXcQ",
    description: "Princípios da neurociência aplicada para criar blocos de foco inabaláveis sem cair na exaustão mental do multitasking.",
    youtubeUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    durationText: "8 min",
    durationMinutes: 8,
    category: "Foco & Neurociência",
    order: 2,
    createdAt: new Date().toISOString(),
  },
  {
    id: "lesson-3",
    title: "Negociação Salarial Sênior: Posicionando-se como ativo estratégico e não despesa",
    moduleTitle: "Módulo 3: Liderança & Estratégia",
    youtubeId: "dQw4w9WgXcQ",
    description: "Técnicas de enquadramento de valor e comunicação assertiva para defender faixas de remuneração de elite no mercado moderno.",
    youtubeUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    durationText: "10 min",
    durationMinutes: 10,
    category: "Estratégia & Liderança",
    order: 3,
    createdAt: new Date().toISOString(),
  },
];

export const INITIAL_POSTS: CommunityPost[] = [
  {
    id: "post-1",
    authorId: "mock-admin-fera",
    authorName: "Fera Mentor",
    authorPlan: "SOVER",
    category: "VITORIA",
    content: "Hoje um dos nossos mentorados de 44 anos fechou sua primeira proposta como Tech Lead após 3 meses de micro-passos consistentes de 15 minutos ao dia. Idade é repertório estratégico!",
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    reactions: {
      forca: 14,
      inspirador: 29,
      aprendi: 18,
    },
  },
  {
    id: "post-2",
    authorId: "mock-user-sover",
    authorName: "Renata Mendes",
    authorPlan: "SOVER",
    category: "PEDIDO_AJUDA",
    content: "Como vocês têm lidado com o vocabulário das startups modernas (OKRs, squads, dailies) sem soar artificial nas entrevistas? Dicas de como naturalizar isso?",
    createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
    reactions: {
      forca: 8,
      inspirador: 5,
      aprendi: 12,
    },
  },
];

export const INITIAL_GOALS: HabitGoal[] = [
  {
    id: "goal-1",
    userId: "mock-admin-fera",
    title: "15 min de leitura técnica sobre Arquitetura Cloud & Borda",
    category: "Estudos",
    targetMinutes: 15,
    completedToday: false,
    streak: 12,
    createdAt: new Date().toISOString(),
    roadmapSteps: [
      { stepNumber: 1, title: "Mapeamento dos serviços serverless essenciais", durationMinutes: 5, completed: true },
      { stepNumber: 2, title: "Estudo de Edge Workers e latência zero", durationMinutes: 5, completed: false },
      { stepNumber: 3, title: "Resumo em notas atômicas", durationMinutes: 5, completed: false },
    ],
  },
];
