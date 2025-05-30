import { type NextRequest, NextResponse } from "next/server"
import { GoogleGenerativeAI } from "@google/generative-ai"

if (!process.env.GEMINI_API_KEY) {
  throw new Error("GEMINI_API_KEY is not configured")
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)

export async function POST(request: NextRequest) {
  try {
    const { projectName, description, githubRepo, projectType = "web" } = await request.json()

    if (!projectName) {
      return NextResponse.json({ error: "Project name is required" }, { status: 400 })
    }

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" })

    const prompt = `Generate a comprehensive and professional README.md file for a ${projectType} project with the following details:

Project Name: ${projectName}
Description: ${description || "No description provided"}
GitHub Repository: ${githubRepo || "Not specified"}

Please create a well-structured README that includes:

1. # ${projectName}
2. A compelling project description
3. ## Features (list key features based on the description)
4. ## Installation
   - Prerequisites
   - Step-by-step installation instructions
5. ## Usage
   - Basic usage examples
   - Code snippets if applicable
6. ## API Documentation (if applicable)
7. ## Contributing
   - How to contribute
   - Code of conduct
8. ## License
9. ## Contact/Support

Make it professional, well-formatted in Markdown, and include relevant badges. Use modern development practices and assume this is a collaborative project. Make the content engaging and informative.

Focus on making it practical and useful for developers who want to understand and contribute to the project.`

    const result = await model.generateContent(prompt)
    const readme = result.response.text()

    if (!readme) {
      throw new Error("No content generated")
    }

    return NextResponse.json({
      readme,
      generatedAt: new Date().toISOString(),
    })
  } catch (error: any) {
    console.error("Error generating README:", error)

    if (error.message?.includes("API key")) {
      return NextResponse.json({ error: "AI service configuration error" }, { status: 500 })
    }

    return NextResponse.json({ error: "Failed to generate README. Please try again." }, { status: 500 })
  }
}
