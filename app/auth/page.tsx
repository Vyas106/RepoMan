"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Github, Chrome, Code, ArrowRight, Loader2, Sparkles } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

const roles = [
  { value: "developer", label: "Developer", description: "Write and maintain code" },
  { value: "project-manager", label: "Project Manager", description: "Manage projects and timelines" },
  { value: "product-manager", label: "Product Manager", description: "Define product strategy" },
  { value: "designer", label: "Designer", description: "Create user experiences" },
  { value: "other", label: "Other", description: "Other role" },
]

export default function AuthPage() {
  const [showRoleSelection, setShowRoleSelection] = useState(false)
  const [selectedRole, setSelectedRole] = useState("")
  const [loading, setLoading] = useState(false)
  const [authMethod, setAuthMethod] = useState<"google" | "github" | null>(null)

  const { user, userProfile, signInWithGoogle, signInWithGithub, updateUserRole } = useAuth()
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    if (user && userProfile) {
      if (userProfile.role) {
        router.push(`/dashboard/${user.uid}`)
      } else {
        setShowRoleSelection(true)
      }
    }
  }, [user, userProfile, router])

  const handleGoogleSignIn = async () => {
    setLoading(true)
    setAuthMethod("google")
    try {
      await signInWithGoogle()
      toast({
        title: "Welcome!",
        description: "Successfully signed in with Google.",
      })
    } catch (error) {
      // Error is handled in the auth context
    } finally {
      setLoading(false)
      setAuthMethod(null)
    }
  }

  const handleGithubSignIn = async () => {
    setLoading(true)
    setAuthMethod("github")
    try {
      await signInWithGithub()
      toast({
        title: "Welcome!",
        description: "Successfully signed in with GitHub.",
      })
    } catch (error) {
      // Error is handled in the auth context
    } finally {
      setLoading(false)
      setAuthMethod(null)
    }
  }

  const handleRoleSelection = async () => {
    if (!selectedRole) return

    setLoading(true)
    try {
      await updateUserRole(selectedRole)
      toast({
        title: "Profile Complete!",
        description: "Your role has been set successfully.",
      })
      router.push(`/dashboard/${user?.uid}`)
    } catch (error) {
      // Error is handled in the auth context
    } finally {
      setLoading(false)
    }
  }

  if (showRoleSelection) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-lg shadow-xl border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader className="text-center pb-6">
            <div className="flex items-center justify-center space-x-3 mb-4">
              <div className="relative">
                <Code className="h-10 w-10 text-blue-600" />
                <Sparkles className="h-5 w-5 text-yellow-500 absolute -top-1 -right-1" />
              </div>
              <span className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                DevCollab
              </span>
            </div>
            <CardTitle className="text-2xl">Welcome to DevCollab!</CardTitle>
            <CardDescription className="text-base">
              Please select your role to personalize your experience and get started with the platform.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-3">
              <label className="text-sm font-medium text-gray-700">Select your role</label>
              <Select value={selectedRole} onValueChange={setSelectedRole}>
                <SelectTrigger className="h-12">
                  <SelectValue placeholder="Choose your primary role" />
                </SelectTrigger>
                <SelectContent>
                  {roles.map((role) => (
                    <SelectItem key={role.value} value={role.value} className="py-3">
                      <div className="flex flex-col items-start">
                        <span className="font-medium">{role.label}</span>
                        <span className="text-sm text-gray-500">{role.description}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button
              onClick={handleRoleSelection}
              disabled={!selectedRole || loading}
              className="w-full h-12 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Setting up your profile...
                </>
              ) : (
                <>
                  Continue to Dashboard
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-xl border-0 bg-white/80 backdrop-blur-sm">
        <CardHeader className="text-center pb-6">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <div className="relative">
              <Code className="h-10 w-10 text-blue-600" />
              <Sparkles className="h-5 w-5 text-yellow-500 absolute -top-1 -right-1" />
            </div>
            <span className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              DevCollab
            </span>
          </div>
          <Badge variant="outline" className="mb-4">
            AI-Powered Collaboration
          </Badge>
          <CardTitle className="text-2xl">Welcome Back</CardTitle>
          <CardDescription className="text-base">
            Sign in to your account to continue collaborating with your team and building amazing projects.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button
            onClick={handleGoogleSignIn}
            disabled={loading}
            variant="outline"
            className="w-full h-12 border-2 hover:bg-gray-50"
          >
            {loading && authMethod === "google" ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Chrome className="mr-2 h-4 w-4" />
            )}
            Continue with Google
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <Separator className="w-full" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-gray-500">Or</span>
            </div>
          </div>

          <Button
            onClick={handleGithubSignIn}
            disabled={loading}
            variant="outline"
            className="w-full h-12 border-2 hover:bg-gray-50"
          >
            {loading && authMethod === "github" ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Github className="mr-2 h-4 w-4" />
            )}
            Continue with GitHub
          </Button>

          <div className="text-center pt-4">
            <p className="text-xs text-gray-500">By signing in, you agree to our Terms of Service and Privacy Policy</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
