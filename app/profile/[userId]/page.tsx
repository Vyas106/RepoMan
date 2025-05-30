"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/auth-context"
import { doc, updateDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ArrowLeft, Save, User } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"

export default function ProfilePage({ params }: { params: { userId: string } }) {
  const [displayName, setDisplayName] = useState("")
  const [role, setRole] = useState("")
  const [saving, setSaving] = useState(false)
  const { user, userProfile, updateUserRole } = useAuth()
  const { toast } = useToast()

  useEffect(() => {
    if (userProfile) {
      setDisplayName(userProfile.displayName)
      setRole(userProfile.role || "")
    }
  }, [userProfile])

  const saveProfile = async () => {
    if (!user || !userProfile) return

    setSaving(true)
    try {
      await updateDoc(doc(db, "users", user.uid), {
        displayName,
        role,
      })

      await updateUserRole(role)

      toast({
        title: "Success!",
        description: "Profile updated successfully.",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update profile.",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  if (!user || !userProfile) {
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center">Loading...</div>
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center space-x-4">
            <Link href={`/dashboard/${user.uid}`}>
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
            </Link>
            <div className="flex items-center space-x-2">
              <User className="h-6 w-6" />
              <span className="text-xl font-semibold">Profile Settings</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>Update your profile information and preferences.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Avatar */}
              <div className="flex items-center space-x-4">
                <Avatar className="h-20 w-20">
                  <AvatarImage src={userProfile.photoURL || "/placeholder.svg"} />
                  <AvatarFallback className="text-lg">{userProfile.displayName.charAt(0).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-lg font-medium">{userProfile.displayName}</h3>
                  <p className="text-gray-600">{userProfile.email}</p>
                </div>
              </div>

              {/* Form */}
              <div className="space-y-4">
                <div>
                  <Label htmlFor="displayName">Display Name</Label>
                  <Input
                    id="displayName"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Enter your display name"
                  />
                </div>

                <div>
                  <Label htmlFor="email">Email Address</Label>
                  <Input id="email" value={userProfile.email} disabled className="bg-gray-50" />
                  <p className="text-sm text-gray-500 mt-1">Email cannot be changed</p>
                </div>

                <div>
                  <Label htmlFor="role">Role</Label>
                  <Select value={role} onValueChange={setRole}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select your role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="developer">Developer</SelectItem>
                      <SelectItem value="project-manager">Project Manager</SelectItem>
                      <SelectItem value="product-manager">Product Manager</SelectItem>
                      <SelectItem value="designer">Designer</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Account Created</Label>
                  <p className="text-sm text-gray-600 mt-1">{userProfile.createdAt.toLocaleDateString()}</p>
                </div>
              </div>

              {/* Save Button */}
              <div className="flex justify-end">
                <Button onClick={saveProfile} disabled={saving}>
                  <Save className="h-4 w-4 mr-2" />
                  {saving ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
