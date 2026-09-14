export type SubscriptionPlan = "START" | "TRACK" | "SOVER";

export type PlanStatus = "ACTIVE" | "EXPIRED" | "ACTIVE_VIP" | "CANCELLED" | "TRIAL";

export type UserRole = "USER" | "SUPER_ADMIN";

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  role: UserRole;
  plan: SubscriptionPlan;
  status: PlanStatus;
  planStatus?: PlanStatus;
  streak: number;
  streakDays?: number;
  targetCareer?: string;
  headline?: string;
  lastActiveDate?: string;
  planExpiresAt?: string;
  completedLessons?: string[];
  createdAt: string;
}

export type CouponType = "LIFETIME_VIP" | "TRIAL_3M_TRACK" | "TRIAL_3M_SOVER";

export interface Coupon {
  id: string;
  code: string;
  type: CouponType;
  used: boolean;
  isRedeemed: boolean;
  usedBy?: string;
  redeemedBy?: string;
  redeemedByUserId?: string;
  usedAt?: string;
  redeemedAt?: string;
  createdAt: string;
}

export interface RoadmapStep {
  stepNumber: number;
  title: string;
  description?: string;
  durationMinutes: number;
  completed: boolean;
}

export interface HabitGoal {
  id: string;
  userId: string;
  title: string;
  category: string;
  targetMinutes: number;
  durationMinutes?: number;
  completedToday: boolean;
  streak: number;
  lastCompletedDate?: string;
  createdAt: string;
  roadmapSteps?: RoadmapStep[];
  aiRoadmap?: RoadmapStep[];
  steps?: RoadmapStep[] | any[];
  difficultModeUsed?: boolean;
}

export type PostCategory = "VITORIA" | "PEDIDO_AJUDA";

export interface CommunityPost {
  id: string;
  authorId: string;
  authorName: string;
  authorPhoto?: string;
  authorPlan?: SubscriptionPlan;
  category: PostCategory;
  content: string;
  createdAt: string;
  reactions: {
    forca: number;
    inspirador: number;
    aprendi: number;
  };
  userReactions?: {
    [userId: string]: "forca" | "inspirador" | "aprendi";
  };
}

export interface MicrolearningLesson {
  id: string;
  title: string;
  moduleTitle: string;
  youtubeId: string;
  durationText: string;
  description?: string;
  youtubeUrl?: string;
  durationMinutes?: number;
  category?: string;
  order?: number;
  createdAt?: string;
}
