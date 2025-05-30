import { type NextRequest, NextResponse } from "next/server"
import { collection, query, where, getDocs } from "firebase/firestore"
import { db } from "@/lib/firebase"

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json()

    // Verify this is a push event
    if (payload.ref !== "refs/heads/main" && payload.ref !== "refs/heads/master") {
      return NextResponse.json({ message: "Not a main branch push" })
    }

    const repoUrl = payload.repository.html_url

    // Find the project associated with this GitHub repo
    const projectsQuery = query(collection(db, "projects"), where("githubRepo", "==", repoUrl))

    const querySnapshot = await getDocs(projectsQuery)

    if (querySnapshot.empty) {
      return NextResponse.json({ message: "Project not found" })
    }

    const projectDoc = querySnapshot.docs[0]
    const project = projectDoc.data()

    // Extract commit information
    const commits = payload.commits.map((commit: any) => ({
      message: commit.message,
      author: commit.author.name,
      url: commit.url,
      timestamp: commit.timestamp,
    }))

    const changes = commits.map((commit) => `${commit.author}: ${commit.message}`).join("\n")

    // Send notification to collaborators
    await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/notifications/send-update`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        projectName: project.name,
        collaborators: project.collaborators,
        changes,
        githubRepo: repoUrl,
      }),
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Webhook error:", error)
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 })
  }
}
