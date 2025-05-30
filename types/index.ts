export interface UserProfile {
  uid: string
  email: string
  displayName: string
  photoURL?: string
  role?: "developer" | "project-manager" | "product-manager" | "designer" | "other"
  createdAt: Date
  updatedAt?: Date
}

export interface Project {
  id: string
  name: string
  description: string
  visibility: "public" | "private"
  createdAt: Date
  updatedAt?: Date
  ownerId: string
  ownerEmail: string
  githubRepo?: string
  githubRepoId?: string
  collaborators: string[]
  readme?: string
  tags?: string[]
  status: "active" | "archived" | "completed"
}

export interface GitHubRepo {
  id: number
  name: string
  full_name: string
  html_url: string
  description: string
  private: boolean
  created_at: string
  updated_at: string
}

export interface Notification {
  id: string
  projectId: string
  projectName: string
  type: "commit" | "collaborator_added" | "project_updated"
  message: string
  createdAt: Date
  recipients: string[]
  status: "sent" | "pending" | "failed"
}
