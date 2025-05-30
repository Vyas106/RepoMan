"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/auth-context"
import { collection, query, where, getDocs, addDoc, orderBy, serverTimestamp } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Plus,
  FolderOpen,
  Users,
  GitBranch,
  Settings,
  LogOut,
  Search,
  Filter,
  Grid3X3,
  List,
  Sparkles,
  TrendingUp,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"
import { useRouter } from "next/navigation"
import type { Project } from "@/types"
import { formatRelativeTime } from "@/lib/utils"

export default function DashboardPage({ params }: { params: { userId: string } }) {
  const [projects, setProjects] = useState<Project[]>([])
  const [filteredProjects, setFilteredProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [filterStatus, setFilterStatus] = useState<"all" | "active" | "completed" | "archived">("all")
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [newProject, setNewProject] = useState({
    name: "",
    description: "",
    visibility: "private" as "public" | "private",
    tags: [] as string[],
  })
  const [creating, setCreating] = useState(false)

  const { user, userProfile, logout } = useAuth()
  const { toast } = useToast()
  const router = useRouter()

  useEffect(() => {
    if (user && params.userId !== user.uid) {
      router.push(`/dashboard/${user.uid}`)
      return
    }
    fetchProjects()
  }, [user, params.userId])

  useEffect(() => {
    filterProjects()
  }, [projects, searchQuery, filterStatus])

  const fetchProjects = async () => {
    if (!user) return

    try {
      const q = query(collection(db, "projects"), where("ownerId", "==", user.uid), orderBy("createdAt", "desc"))
      const querySnapshot = await getDocs(q)
      const projectsData = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate(),
      })) as Project[]

      setProjects(projectsData)
    } catch (error) {
      console.error("Error fetching projects:", error)
      toast({
        title: "Error",
        description: "Failed to fetch projects. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const filterProjects = () => {
    let filtered = projects

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(
        (project) =>
          project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          project.description.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    }

    // Filter by status
    if (filterStatus !== "all") {
      filtered = filtered.filter((project) => project.status === filterStatus)
    }

    setFilteredProjects(filtered)
  }

  const createProject = async () => {
    if (!user || !newProject.name.trim()) return

    setCreating(true)
    try {
      const projectData = {
        ...newProject,
        ownerId: user.uid,
        ownerEmail: user.email!,
        createdAt: serverTimestamp(),
        collaborators: [user.email!],
        status: "active" as const,
      }

      const docRef = await addDoc(collection(db, "projects"), projectData)

      toast({
        title: "Success!",
        description: "Project created successfully.",
      })

      setCreateDialogOpen(false)
      setNewProject({ name: "", description: "", visibility: "private", tags: [] })

      // Navigate to the new project
      router.push(`/${user.uid}/project/${docRef.id}`)
    } catch (error) {
      console.error("Error creating project:", error)
      toast({
        title: "Error",
        description: "Failed to create project. Please try again.",
        variant: "destructive",
      })
    } finally {
      setCreating(false)
    }
  }

  const ProjectCard = ({ project }: { project: Project }) => (
    <Link href={`/${user?.uid}/project/${project.id}`}>
      <Card className="group hover:shadow-lg transition-all duration-300 cursor-pointer border-0 bg-white/60 backdrop-blur-sm hover:bg-white/80">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="text-lg group-hover:text-blue-600 transition-colors">{project.name}</CardTitle>
              <CardDescription className="mt-1 line-clamp-2">{project.description}</CardDescription>
            </div>
            <Badge variant={project.visibility === "public" ? "default" : "secondary"} className="ml-2">
              {project.visibility}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex items-center justify-between text-sm text-gray-500 mb-3">
            <div className="flex items-center space-x-4">
              <div className="flex items-center">
                <Users className="h-4 w-4 mr-1" />
                {project.collaborators.length}
              </div>
              {project.githubRepo && (
                <div className="flex items-center text-green-600">
                  <GitBranch className="h-4 w-4 mr-1" />
                  Connected
                </div>
              )}
            </div>
            <span>{formatRelativeTime(project.createdAt)}</span>
          </div>

          <div className="flex items-center justify-between">
            <Badge variant="outline" className="text-xs">
              {project.status}
            </Badge>
            {project.readme && (
              <div className="flex items-center text-xs text-purple-600">
                <Sparkles className="h-3 w-3 mr-1" />
                AI README
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  )

  if (!user || !userProfile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-gray-200">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/" className="flex items-center space-x-3">
                <FolderOpen className="h-8 w-8 text-blue-600" />
                <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  DevCollab
                </span>
              </Link>
              <Badge variant="outline">Dashboard</Badge>
            </div>
            <div className="flex items-center space-x-3">
              <Link href={`/profile/${user.uid}`}>
                <Button variant="ghost" size="sm">
                  <Settings className="h-4 w-4 mr-2" />
                  Profile
                </Button>
              </Link>
              <Button variant="ghost" size="sm" onClick={logout}>
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
                Welcome back, {userProfile.displayName}! 👋
              </h1>
              <p className="text-gray-600 text-lg">Manage your projects and collaborate with your team.</p>
            </div>

            <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700">
                  <Plus className="h-4 w-4 mr-2" />
                  New Project
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Create New Project</DialogTitle>
                  <DialogDescription>Create a new project to start collaborating with your team.</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="name">Project Name *</Label>
                    <Input
                      id="name"
                      value={newProject.name}
                      onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                      placeholder="Enter project name"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={newProject.description}
                      onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                      placeholder="Enter project description"
                      className="mt-1"
                      rows={3}
                    />
                  </div>
                  <div>
                    <Label htmlFor="visibility">Visibility</Label>
                    <Select
                      value={newProject.visibility}
                      onValueChange={(value: "public" | "private") =>
                        setNewProject({ ...newProject, visibility: value })
                      }
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="private">
                          <div className="flex flex-col items-start">
                            <span>Private</span>
                            <span className="text-xs text-gray-500">Only you and collaborators can see</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="public">
                          <div className="flex flex-col items-start">
                            <span>Public</span>
                            <span className="text-xs text-gray-500">Anyone can view this project</span>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button
                    onClick={createProject}
                    disabled={!newProject.name.trim() || creating}
                    className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                  >
                    {creating ? "Creating..." : "Create Project"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <Card className="bg-white/60 backdrop-blur-sm border-0">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total Projects</p>
                    <p className="text-2xl font-bold text-gray-900">{projects.length}</p>
                  </div>
                  <FolderOpen className="h-8 w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/60 backdrop-blur-sm border-0">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Active Projects</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {projects.filter((p) => p.status === "active").length}
                    </p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/60 backdrop-blur-sm border-0">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Connected Repos</p>
                    <p className="text-2xl font-bold text-gray-900">{projects.filter((p) => p.githubRepo).length}</p>
                  </div>
                  <GitBranch className="h-8 w-8 text-orange-600" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/60 backdrop-blur-sm border-0">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Collaborators</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {new Set(projects.flatMap((p) => p.collaborators)).size}
                    </p>
                  </div>
                  <Users className="h-8 w-8 text-purple-600" />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search projects..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-white/60 backdrop-blur-sm border-0"
              />
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Select value={filterStatus} onValueChange={(value: any) => setFilterStatus(value)}>
              <SelectTrigger className="w-40 bg-white/60 backdrop-blur-sm border-0">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Projects</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="archived">Archived</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex items-center border rounded-lg bg-white/60 backdrop-blur-sm">
              <Button
                variant={viewMode === "grid" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("grid")}
                className="rounded-r-none"
              >
                <Grid3X3 className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === "list" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("list")}
                className="rounded-l-none"
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Projects Grid/List */}
        {loading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="bg-white/60 backdrop-blur-sm border-0">
                <CardHeader>
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-3 w-full mb-2" />
                  <Skeleton className="h-3 w-2/3" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredProjects.length === 0 ? (
          <div className="text-center py-16">
            <FolderOpen className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {searchQuery || filterStatus !== "all" ? "No projects found" : "No projects yet"}
            </h3>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              {searchQuery || filterStatus !== "all"
                ? "Try adjusting your search or filter criteria."
                : "Create your first project to get started with DevCollab."}
            </p>
            {!searchQuery && filterStatus === "all" && (
              <Button
                onClick={() => setCreateDialogOpen(true)}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Project
              </Button>
            )}
          </div>
        ) : (
          <div className={viewMode === "grid" ? "grid md:grid-cols-2 lg:grid-cols-3 gap-6" : "space-y-4"}>
            {filteredProjects.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
