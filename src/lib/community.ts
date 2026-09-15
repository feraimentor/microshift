import {
  collection,
  doc,
  getDocs,
  setDoc,
  updateDoc,
  query,
  where,
  increment,
} from "firebase/firestore";
import { db, hasFirebaseConfig } from "./firebase";
import { CommunityPost, PostCategory } from "@/types";
import { INITIAL_POSTS } from "./mock-data";
import { withTimeout } from "./firestore-utils";

const LOCAL_POSTS_KEY = "microshift_community_posts";

export function getLocalPosts(): CommunityPost[] {
  if (typeof window === "undefined") return INITIAL_POSTS;
  const saved = localStorage.getItem(LOCAL_POSTS_KEY);
  if (!saved) {
    localStorage.setItem(LOCAL_POSTS_KEY, JSON.stringify(INITIAL_POSTS));
    return INITIAL_POSTS;
  }
  try {
    return JSON.parse(saved);
  } catch {
    return INITIAL_POSTS;
  }
}

export function saveLocalPosts(posts: CommunityPost[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(LOCAL_POSTS_KEY, JSON.stringify(posts));
  } catch {}
}

export async function fetchCommunityPosts(category?: PostCategory): Promise<CommunityPost[]> {
  const localList = getLocalPosts();
  const filterCategory = (list: CommunityPost[]) =>
    category ? list.filter((p) => p.category === category) : list;

  if (!hasFirebaseConfig) {
    return filterCategory(localList);
  }

  try {
    let q = query(collection(db, "community"));
    if (category) {
      q = query(collection(db, "community"), where("category", "==", category));
    }
    const snap = await withTimeout(getDocs(q), 1500, "Firestore community timeout");
    const posts: CommunityPost[] = [];
    snap.forEach((d) => posts.push(d.data() as CommunityPost));
    if (posts.length === 0) {
      return filterCategory(localList);
    }
    const sorted = posts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    saveLocalPosts(sorted);
    return sorted;
  } catch (err) {
    console.warn("Falha ou timeout ao buscar posts da Tribo no Firestore, usando fallback local:", err);
    return filterCategory(localList);
  }
}

export async function createCommunityPost(
  authorOrData: any,
  category?: PostCategory,
  content?: string
): Promise<CommunityPost> {
  let authorId = "";
  let authorName = "Membro da Tribo";
  let authorPhoto: string | undefined = undefined;
  let finalCategory: PostCategory = "VITORIA";
  let finalContent = "";

  if (typeof authorOrData === "object") {
    authorId = authorOrData.uid || authorOrData.authorId || "anonymous";
    authorName = authorOrData.displayName || authorOrData.authorName || "Membro da Tribo";
    authorPhoto = authorOrData.photoURL || authorOrData.authorPhoto;
    finalCategory = category || authorOrData.category || "VITORIA";
    finalContent = content || authorOrData.content || "";
  } else {
    authorId = authorOrData;
    finalCategory = category || "VITORIA";
    finalContent = content || "";
  }

  const newPost: CommunityPost = {
    id: `post_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    authorId,
    authorName,
    authorPhoto,
    category: finalCategory,
    content: finalContent,
    createdAt: new Date().toISOString(),
    reactions: {
      forca: 0,
      inspirador: 0,
      aprendi: 0,
    },
    userReactions: {},
  };

  // Salva localmente em 0ms
  const posts = getLocalPosts();
  posts.unshift(newPost);
  saveLocalPosts(posts);

  // Sincroniza com o Firestore em background
  if (hasFirebaseConfig) {
    const postRef = doc(db, "community", newPost.id);
    withTimeout(setDoc(postRef, newPost), 1500).catch((err) => {
      console.warn("Sync do Firestore ao criar post falhou ou deu timeout:", err);
    });
  }

  return newPost;
}

export async function reactToCommunityPost(
  postId: string,
  reactionTypeOrUserId: string,
  optionalType?: "forca" | "inspirador" | "aprendi"
): Promise<CommunityPost> {
  const reactionType = (optionalType || reactionTypeOrUserId) as "forca" | "inspirador" | "aprendi";

  // Atualiza localmente em 0ms
  const posts = getLocalPosts();
  const post = posts.find((p) => p.id === postId);
  if (!post) throw new Error("Post não encontrado.");

  if (!post.reactions) {
    post.reactions = { forca: 0, inspirador: 0, aprendi: 0 };
  }
  post.reactions[reactionType] = (post.reactions[reactionType] || 0) + 1;
  saveLocalPosts(posts);

  // Sincroniza com o Firestore em background
  if (hasFirebaseConfig) {
    const postRef = doc(db, "community", postId);
    const updates: any = {};
    updates[`reactions.${reactionType}`] = increment(1);
    withTimeout(updateDoc(postRef, updates), 1500).catch((err) => {
      console.warn("Sync de reação no Firestore falhou ou deu timeout:", err);
    });
  }

  return post;
}
