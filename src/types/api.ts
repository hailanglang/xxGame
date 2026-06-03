// ---- 通用 ----

export interface ApiError {
  error: string
}

// ---- 用户 ----

export interface UserInfo {
  id: string
  phone: string
  nickname: string | null
  role: string
  hasPassword: boolean
}

// ---- GET /api/posts/[id] ----

export interface PostDetail {
  id: string
  title: string
  content: string
  summary: string | null
  author: Pick<UserInfo, "id" | "nickname"> & { avatarUrl: string | null }
  workspace: { id: string; name: string; slug: string } | null
  images: string[]
  viewCount: number
  likeCount: number
  commentCount: number
  publishedAt: string
  createdAt: string
}

// ---- GET /api/posts ----

interface Author {
  id?: string;
  nickname: string | null;
  avatarUrl: string | null
}

export interface PostItem {
  id: string
  title: string
  summary: string | null
  author: Author
  workspace: { id: string; name: string; slug: string } | null
  images: string[]
  viewCount: number
  likeCount: number
  commentCount: number
  publishedAt: Date
}

export interface PostRow {
  id: string
  title: string
  summary: string | null
  author: { id: string; nickname: string | null; avatarUrl: string | null }
  workspace: { id: string; name: string; slug: string } | null
  images: { imageUrl: string }[]
  viewCount: number
  likeCount: number
  commentCount: number
  publishedAt: Date
}

export interface PostsResponse {
  items: PostItem[]
  nextCursor: string | null
}

// ---- POST /api/posts ----

export interface CreatePostBody {
  title: string
  content: string
  category?: string
  images: string[]
}

export interface CreatePostResponse {
  id: string
  title: string
  content: string
  summary: string | null
  authorId: string
  images: { imageUrl: string }[]
  author: Pick<UserInfo, "id" | "nickname">
}

// ---- POST /api/auth/verify-code ----

export interface VerifyCodeBody {
  phone: string
  code: string
}

export interface VerifyCodeResponse {
  token: string
  user: UserInfo
}

// ---- POST /api/sms/send-code ----

export interface SendCodeBody {
  phone: string
}

export interface SendCodeResponse {
  success: true
}

// ---- POST /api/auth/password-login ----

export interface PasswordLoginBody {
  phone: string
  password: string
}

export type PasswordLoginResponse = VerifyCodeResponse

// ---- PUT /api/auth/password ----

export interface ChangePasswordBody {
  oldPassword?: string
  newPassword: string
}

export interface ChangePasswordResponse {
  success: true
}

// ---- POST /api/upload ----

export interface UploadResponse {
  imageUrl: string
}
