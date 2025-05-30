"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/auth-context"
import { doc, getDoc, updateDoc, arrayUnion, serverTimestamp } from "firebase/firestore"
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
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  GitBranch,
  Users,
  Share2,
  FileText,
  ArrowLeft,
  Plus,
  Github,
  Copy,
  ExternalLink,
  Settings,
  Loader2,
  CheckCircle,
  AlertCircle,
  Sparkles,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"
import type { Project } from "@/types"
import { formatRelativeTime, validateEmail, getInitials } from "@/lib/utils"
// import { Loading } from "@/components/ui/loading"

export default function ProjectPage({
  params,
}: {
  params: { userId: string; projectId: string }
}) {
  const [project, setProject] = useState<Project | null>(null)
  const [loading, setLoading] = useState(true)
  const [shareDialogOpen, setShareDialogOpen] = useState(false)
  const [collaboratorEmail, setCollaboratorEmail] = useState("")
  const [generatingReadme, setGeneratingReadme] = useState(false)
  const [connectingGithub, setConnectingGithub] = useState(false)
  const [addingCollaborator, setAddingCollaborator] = useState(false)

  const { user } = useAuth()
  const { toast } = useToast()

  useEffect(() => {
    fetchProject()
  }, [params.projectId])

  const fetchProject = async () => {
    try {
      const docRef = doc(db, "projects", params.projectId)
      const docSnap = await getDoc(docRef)

      if (docSnap.exists()) {
        const projectData = {
          id: docSnap.id,
          ...docSnap.data(),
          createdAt: docSnap.data().createdAt?.toDate() || new Date(),
          updatedAt: docSnap.data().updatedAt?.toDate(),
        } as Project
        setProject(projectData)
      } else {
        toast({
          title: "Project Not Found",
          description: "The project you're looking for doesn't exist.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error fetching project:", error)
      toast({
        title: "Error",
        description: "Failed to fetch project details.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const connectGithub = async () => {
    if (!project || !user) return

    setConnectingGithub(true)
    try {
      const response = await fetch("/api/github/create-repo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: project.name,
          description: project.description,
          private: project.visibility === "private",
        }),
      })

      const data = await response.json()

      if (response.ok) {
        await updateDoc(doc(db, "projects", project.id), {
          githubRepo: data.html_url,
          githubRepoId: data.id,
          updatedAt: serverTimestamp(),
        })

        setProject({
          ...project,
          githubRepo: data.html_url,
          githubRepoId: data.id,
          updatedAt: new Date(),
        })

        toast({
          title: "Success!",
          description: "GitHub repository created and connected.",
        })
      } else {
        throw new Error(data.error)
      }
    } catch (error: any) {
      console.error("GitHub connection error:", error)
      toast({
        title: "Connection Failed",
        description: error.message || "Failed to connect GitHub repository.",
        variant: "destructive",
      })
    } finally {
      setConnectingGithub(false)
    }
  }

  const generateReadme = async () => {
    if (!project) return

    setGeneratingReadme(true)
    try {
      const response = await fetch("/api/ai/generate-readme", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectName: project.name,
          description: project.description,
          githubRepo: project.githubRepo,
          projectType: "web",
        }),
      })

      const data = await response.json()

      if (response.ok) {
        await updateDoc(doc(db, "projects", project.id), {
          readme: data.readme,
          updatedAt: serverTimestamp(),
        })

        setProject({ ...project, readme: data.readme, updatedAt: new Date() })

        toast({
          title: "README Generated!",
          description: "AI-powered README.md has been created successfully.",
        })
      } else {
        throw new Error(data.error)
      }
    } catch (error: any) {
      console.error("README generation error:", error)
      toast({
        title: "Generation Failed",
        description: error.message || "Failed to generate README.",
        variant: "destructive",
      })
    } finally {
      setGeneratingReadme(false)
    }
  }

  const addCollaborator = async () => {
    if (!project || !collaboratorEmail.trim() || !user) return

    if (!validateEmail(collaboratorEmail.trim())) {
      toast({
        title: "Invalid Email",
        description: "Please enter a valid email address.",
        variant: "destructive",
      })
      return
    }

    if (project.collaborators.includes(collaboratorEmail.trim())) {
      toast({
        title: "Already Added",
        description: "This user is already a collaborator.",
        variant: "destructive",
      })
      return
    }

    setAddingCollaborator(true)
    try {
      await updateDoc(doc(db, "projects", project.id), {
        collaborators: arrayUnion(collaboratorEmail.trim()),
        updatedAt: serverTimestamp(),
      })

      setProject({
        ...project,
        collaborators: [...project.collaborators, collaboratorEmail.trim()],
        updatedAt: new Date(),
      })

      setCollaboratorEmail("")
      setShareDialogOpen(false)

      toast({
        title: "Collaborator Added!",
        description: `${collaboratorEmail.trim()} has been added to the project.`,
      })
    } catch (error) {
      console.error("Error adding collaborator:", error)
      toast({
        title: "Failed to Add",
        description: "Failed to add collaborator. Please try again.",
        variant: "destructive",
      })
    } finally {
      setAddingCollaborator(false)
    }
  }

  const shareProject = () => {
    const shareUrl = `${window.location.origin}/${params.userId}/project/${params.projectId}`
    navigator.clipboard.writeText(shareUrl)
    toast({
      title: "Link Copied!",
      description: "Project link has been copied to clipboard.",
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        {/* <Loading size="lg" text="Loading project..." /> */}
      </div>
    )
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <CardTitle>Project Not Found</CardTitle>
            <CardDescription>
              The project you're looking for doesn't exist or you don't have access to it.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href={`/dashboard/${params.userId}`}>
              <Button>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  const isOwner = user?.uid === project.ownerId

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-gray-200">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href={`/dashboard/${params.userId}`}>
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Dashboard
                </Button>
              </Link>
              <Separator orientation="vertical" className="h-6" />
              <div>
                <div className="flex items-center space-x-3">
                  <h1 className="text-2xl font-bold">{project.name}</h1>
                  <Badge variant={project.visibility === "public" ? "default" : "secondary"}>
                    {project.visibility}
                  </Badge>
                  {project.status && (
                    <Badge variant="outline" className="capitalize">
                      {project.status}
                    </Badge>
                  )}
                </div>
                <p className="text-gray-600 mt-1">{project.description}</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm" onClick={shareProject}>
                <Share2 className="h-4 w-4 mr-2" />
                Share
              </Button>
              {isOwner && (
                <Button variant="outline" size="sm">
                  <Settings className="h-4 w-4 mr-2" />
                  Settings
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-4 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-3">
            <Tabs defaultValue="overview" className="space-y-6">
              <TabsList className="grid w-full grid-cols-3 bg-white/60 backdrop-blur-sm">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="readme">README</TabsTrigger>
                <TabsTrigger value="activity">Activity</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-6">
                {/* GitHub Integration */}
                <Card className="bg-white/60 backdrop-blur-sm border-0">
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <GitBranch className="h-5 w-5 mr-2" />
                      GitHub Integration
                    </CardTitle>
                    <CardDescription>
                      Connect your project with a GitHub repository for version control and collaboration.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {project.githubRepo ? (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-200">
                          <div className="flex items-center space-x-3">
                            <CheckCircle className="h-5 w-5 text-green-600" />
                            <div>
                              <p className="font-medium text-green-900">Repository Connected</p>
                              <p className="text-sm text-green-700">
                                {project.githubRepo.split("/").slice(-2).join("/")}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Button variant="outline" size="sm" asChild>
                              <a href={project.githubRepo} target="_blank" rel="noopener noreferrer">
                                <ExternalLink className="h-4 w-4 mr-2" />
                                View on GitHub
                              </a>
                            </Button>
                          </div>
                        </div>
                      </div>
                    ) : isOwner ? (
                      <div className="text-center py-8">
                        <Github className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No Repository Connected</h3>
                        <p className="text-gray-600 mb-6">
                          Connect a GitHub repository to enable version control and collaboration features.
                        </p>
                        <Button
                          onClick={connectGithub}
                          disabled={connectingGithub}
                          className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                        >
                          {connectingGithub ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Creating Repository...
                            </>
                          ) : (
                            <>
                              <Github className="h-4 w-4 mr-2" />
                              Connect GitHub Repository
                            </>
                          )}
                        </Button>
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <Github className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-600">No GitHub repository connected to this project.</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Project Stats */}
                <div className="grid md:grid-cols-3 gap-4">
                  <Card className="bg-white/60 backdrop-blur-sm border-0">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-600">Collaborators</p>
                          <p className="text-2xl font-bold">{project.collaborators.length}</p>
                        </div>
                        <Users className="h-8 w-8 text-blue-600" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-white/60 backdrop-blur-sm border-0">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-600">Created</p>
                          <p className="text-lg font-semibold">{formatRelativeTime(project.createdAt)}</p>
                        </div>
                        <FileText className="h-8 w-8 text-green-600" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-white/60 backdrop-blur-sm border-0">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-600">Status</p>
                          <p className="text-lg font-semibold capitalize">{project.status}</p>
                        </div>
                        <CheckCircle className="h-8 w-8 text-purple-600" />
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="readme" className="space-y-6">
                <Card className="bg-white/60 backdrop-blur-sm border-0">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <FileText className="h-5 w-5 mr-2" />
                        <CardTitle>README.md</CardTitle>
                        {project.readme && (
                          <Badge variant="outline" className="ml-2">
                            <Sparkles className="h-3 w-3 mr-1" />
                            AI Generated
                          </Badge>
                        )}
                      </div>
                      {isOwner && (
                        <Button
                          onClick={generateReadme}
                          disabled={generatingReadme}
                          variant={project.readme ? "outline" : "default"}
                          className={
                            !project.readme
                              ? "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                              : ""
                          }
                        >
                          {generatingReadme ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Generating...
                            </>
                          ) : (
                            <>
                              <Sparkles className="h-4 w-4 mr-2" />
                              {project.readme ? "Regenerate" : "Generate"} README
                            </>
                          )}
                        </Button>
                      )}
                    </div>
                    <CardDescription>AI-generated documentation for your project using Gemini AI.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {project.readme ? (
                      <div className="space-y-4">
                        <div className="bg-gray-50 rounded-lg p-4 max-h-96 overflow-auto">
                          <pre className="text-sm whitespace-pre-wrap font-mono">{project.readme}</pre>
                        </div>
                        <div className="flex items-center justify-between">
                          <p className="text-sm text-gray-600">
                            Generated {project.updatedAt ? formatRelativeTime(project.updatedAt) : "recently"}
                          </p>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => navigator.clipboard.writeText(project.readme!)}
                          >
                            <Copy className="h-4 w-4 mr-2" />
                            Copy
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No README Generated</h3>
                        <p className="text-gray-600 mb-6">
                          Generate an AI-powered README.md file to document your project.
                        </p>
                        {isOwner && (
                          <Button
                            onClick={generateReadme}
                            disabled={generatingReadme}
                            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                          >
                            {generatingReadme ? (
                              <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Generating README...
                              </>
                            ) : (
                              <>
                                <Sparkles className="h-4 w-4 mr-2" />
                                Generate README
                              </>
                            )}
                          </Button>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="activity">
                <Card className="bg-white/60 backdrop-blur-sm border-0">
                  <CardHeader>
                    <CardTitle>Recent Activity</CardTitle>
                    <CardDescription>Track changes and updates to your project.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-12">
                      <p className="text-gray-600">Activity tracking coming soon...</p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Collaborators */}
            <Card className="bg-white/60 backdrop-blur-sm border-0">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center">
                    <Users className="h-5 w-5 mr-2" />
                    Collaborators
                  </CardTitle>
                  {isOwner && (
                    <Dialog open={shareDialogOpen} onOpenChange={setShareDialogOpen}>
                      <DialogTrigger asChild>
                        <Button size="sm" variant="outline">
                          <Plus className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Add Collaborator</DialogTitle>
                          <DialogDescription>
                            Enter the email address of the person you want to add as a collaborator.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <Label htmlFor="email">Email Address</Label>
                            <Input
                              id="email"
                              type="email"
                              value={collaboratorEmail}
                              onChange={(e) => setCollaboratorEmail(e.target.value)}
                              placeholder="colleague@example.com"
                              className="mt-1"
                            />
                          </div>
                        </div>
                        <DialogFooter>
                          <Button variant="outline" onClick={() => setShareDialogOpen(false)}>
                            Cancel
                          </Button>
                          <Button onClick={addCollaborator} disabled={!collaboratorEmail.trim() || addingCollaborator}>
                            {addingCollaborator ? (
                              <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Adding...
                              </>
                            ) : (
                              "Add Collaborator"
                            )}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {project.collaborators.map((email, index) => (
                    <div key={index} className="flex items-center space-x-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${email}`} />
                        <AvatarFallback className="text-xs">{getInitials(email)}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{email}</p>
                        {email === user?.email && (
                          <Badge variant="outline" className="text-xs">
                            You
                          </Badge>
                        )}
                        {email === project.ownerEmail && (
                          <Badge variant="outline" className="text-xs">
                            Owner
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Project Information */}
            <Card className="bg-white/60 backdrop-blur-sm border-0">
              <CardHeader>
                <CardTitle>Project Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-sm font-medium text-gray-700">Created</Label>
                  <p className="text-sm text-gray-900">{formatRelativeTime(project.createdAt)}</p>
                </div>

                {project.updatedAt && (
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Last Updated</Label>
                    <p className="text-sm text-gray-900">{formatRelativeTime(project.updatedAt)}</p>
                  </div>
                )}

                <div>
                  <Label className="text-sm font-medium text-gray-700">Visibility</Label>
                  <p className="text-sm text-gray-900 capitalize">{project.visibility}</p>
                </div>

                <div>
                  <Label className="text-sm font-medium text-gray-700">Status</Label>
                  <p className="text-sm text-gray-900 capitalize">{project.status}</p>
                </div>

                <div>
                  <Label className="text-sm font-medium text-gray-700">Owner</Label>
                  <p className="text-sm text-gray-900">{project.ownerEmail}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
