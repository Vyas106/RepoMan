import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, description, private: isPrivate } = body

    // Validation
    if (!name || typeof name !== "string") {
      return NextResponse.json({ error: "Project name is required" }, { status: 400 })
    }

    if (!process.env.GITHUB_TOKEN) {
      return NextResponse.json({ error: "GitHub token not configured" }, { status: 500 })
    }

    const repoName = name
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, "-")
      .replace(/-+/g, "-")

    const response = await fetch("https://api.github.com/user/repos", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
        Accept: "application/vnd.github.v3+json",
        "Content-Type": "application/json",
        "User-Agent": "DevCollab-App",
      },
      body: JSON.stringify({
        name: repoName,
        description: description || `DevCollab project: ${name}`,
        private: isPrivate !== false,
        auto_init: true,
        gitignore_template: "Node",
        license_template: "mit",
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      console.error("GitHub API Error:", error)
      return NextResponse.json({ error: error.message || "Failed to create repository" }, { status: response.status })
    }

    const repo = await response.json()
    return NextResponse.json({
      id: repo.id,
      name: repo.name,
      full_name: repo.full_name,
      html_url: repo.html_url,
      description: repo.description,
      private: repo.private,
      created_at: repo.created_at,
    })
  } catch (error) {
    console.error("Repository creation error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
