"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState, useCallback } from "react"
import {
  type User,
  onAuthStateChanged,
  signOut,
  GoogleAuthProvider,
  GithubAuthProvider,
  signInWithPopup,
} from "firebase/auth"
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore"
import { auth, db } from "@/lib/firebase"
import type { UserProfile } from "@/types"
import { useToast } from "@/hooks/use-toast"

interface AuthContextType {
  user: User | null
  userProfile: UserProfile | null
  loading: boolean
  signInWithGoogle: () => Promise<void>
  signInWithGithub: () => Promise<void>
  logout: () => Promise<void>
  updateUserRole: (role: string) => Promise<void>
  refreshUserProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  const refreshUserProfile = useCallback(async () => {
    if (!user) return

    try {
      const userDoc = await getDoc(doc(db, "users", user.uid))
      if (userDoc.exists()) {
        const data = userDoc.data()
        setUserProfile({
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate(),
        } as UserProfile)
      }
    } catch (error) {
      console.error("Error fetching user profile:", error)
    }
  }, [user])

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user)

      if (user) {
        try {
          const userDoc = await getDoc(doc(db, "users", user.uid))

          if (userDoc.exists()) {
            const data = userDoc.data()
            setUserProfile({
              ...data,
              createdAt: data.createdAt?.toDate() || new Date(),
              updatedAt: data.updatedAt?.toDate(),
            } as UserProfile)
          } else {
            // Create new user profile
            const newProfile: Omit<UserProfile, "createdAt"> = {
              uid: user.uid,
              email: user.email!,
              displayName: user.displayName || user.email!.split("@")[0],
              photoURL: user.photoURL || undefined,
            }

            await setDoc(doc(db, "users", user.uid), {
              ...newProfile,
              createdAt: serverTimestamp(),
            })

            setUserProfile({
              ...newProfile,
              createdAt: new Date(),
            })
          }
        } catch (error) {
          console.error("Error handling user authentication:", error)
          toast({
            title: "Authentication Error",
            description: "Failed to load user profile. Please try again.",
            variant: "destructive",
          })
        }
      } else {
        setUserProfile(null)
      }

      setLoading(false)
    })

    return unsubscribe
  }, [toast])

  const signInWithGoogle = async () => {
    try {
      const provider = new GoogleAuthProvider()
      provider.addScope("email")
      provider.addScope("profile")
      await signInWithPopup(auth, provider)
    } catch (error: any) {
      console.error("Google sign-in error:", error)
      toast({
        title: "Sign-in Failed",
        description: error.message || "Failed to sign in with Google",
        variant: "destructive",
      })
      throw error
    }
  }

  const signInWithGithub = async () => {
    try {
      const provider = new GithubAuthProvider()
      provider.addScope("user:email")
      provider.addScope("repo")
      await signInWithPopup(auth, provider)
    } catch (error: any) {
      console.error("GitHub sign-in error:", error)
      toast({
        title: "Sign-in Failed",
        description: error.message || "Failed to sign in with GitHub",
        variant: "destructive",
      })
      throw error
    }
  }

  const logout = async () => {
    try {
      await signOut(auth)
      toast({
        title: "Signed Out",
        description: "You have been successfully signed out.",
      })
    } catch (error: any) {
      console.error("Sign-out error:", error)
      toast({
        title: "Sign-out Failed",
        description: error.message || "Failed to sign out",
        variant: "destructive",
      })
    }
  }

  const updateUserRole = async (role: string) => {
    if (!user || !userProfile) return

    try {
      const updatedProfile = {
        ...userProfile,
        role: role as UserProfile["role"],
        updatedAt: serverTimestamp(),
      }

      await setDoc(doc(db, "users", user.uid), updatedProfile, { merge: true })

      setUserProfile({
        ...userProfile,
        role: role as UserProfile["role"],
        updatedAt: new Date(),
      })
    } catch (error: any) {
      console.error("Error updating user role:", error)
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update user role",
        variant: "destructive",
      })
      throw error
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        userProfile,
        loading,
        signInWithGoogle,
        signInWithGithub,
        logout,
        updateUserRole,
        refreshUserProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
