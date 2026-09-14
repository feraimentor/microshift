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

const LOCAL_POSTS_KEY = "microshift_community_posts";

function getLocalPosts(): CommunityPost[] {
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

function saveLocalPosts(posts: CommunityPost[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(LOCAL_POSTS_KEY, JSON.stringify(posts));
}

export async function fetchCommunityPosts(category?: PostCategory): Promise<CommunityPost[]> {
  if (!hasFirebaseConfig) {
    const list = getLocalPosts();
    if (!category) return list;
    return list.filter((p) => p.category === category);
  }

  try {
    let q = query(collection(db, "community"));
    if (category) {
      q = query(collection(db, "community"), where("category", "==", category));
    }
    const snap = await getDocs(q);
    const posts: CommunityPost[] = [];
    snap.forEach((d) => posts.push(d.data() as CommunityPost));
    if (posts.length === 0) {
      const list = getLocalPosts();
      if (!category) return list;
      return list.filter((p) => p.category === category);
    }
    return posts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } catch (err) {
    console.warn("Falha ao buscar posts da Tribo no Firestore, usando fallback local:", err);
    const list = getLocalPosts();
    if (!category) return list;
    return list.filter((p) => p.category === category);
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

  if (!hasFirebaseConfig) {
    const posts = getLocalPosts();
    posts.unshift(newPost);
    saveLocalPosts(posts);
    return newPost;
  }

  const postRef = doc(db, "community", newPost.id);
  await setDoc(postRef, newPost);
  return newPost;
}

export async function reactToCommunityPost(
  postId: string,
  reactionTypeOrUserId: string,
  optionalType?: "forca" | "inspirador" | "aprendi"
): Promise<CommunityPost> {
  const reactionType = (optionalType || reactionTypeOrUserId) as "forca" | "inspirador" | "aprendi";
  const userId = optionalType ? reactionTypeOrUserId : "user_reaction_anonymous";

  if (!hasFirebaseConfig) {
    const posts = getLocalPosts();
    const post = posts.find((p) => p.id === postId);
    if (!post) throw new Error("Post não encontrado.");

    if (!post.reactions) {
      post.reactions = { forca: 0, inspirador: 0, aprendi: 0 };
    }
    post.reactions[reactionType] = (post.reactions[reactionType] || 0) + 1;
    saveLocalPosts(posts);
    return post;
  }

  const postRef = doc(db, "community", postId);
  const posts = await fetchCommunityPosts();
  const post = posts.find((p) => p.id === postId);
  if (!post) throw new Error("Post não encontrado.");

  const updates: any = {};
  updates[`reactions.${reactionType}`] = increment(1);
  await updateDoc(postRef, updates);

  return {
    ...post,
    reactions: {
      ...post.reactions,
      [reactionType]: (post.reactions?.[reactionType] || 0) + 1,
    },
  };
}
