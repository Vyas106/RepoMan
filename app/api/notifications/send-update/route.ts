import { type NextRequest, NextResponse } from "next/server"
import nodemailer from "nodemailer"
import { GoogleGenerativeAI } from "@google/generative-ai"

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

const transporter = nodemailer.createTransporter({
  service: "gmail",
  auth: {
    user: process.env.NODEMAILER_EMAIL,
    pass: process.env.NODEMAILER_PASSWORD,
  },
})

export async function POST(request: NextRequest) {
  try {
    const { projectName, collaborators, changes, githubRepo } = await request.json()

    // Generate AI summary of changes
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" })

    const prompt = `Analyze the following code changes and provide a concise summary for team members:
    
Project: ${projectName}
Repository: ${githubRepo}
Changes: ${changes}

Please provide:
1. A brief summary of what was changed
2. Impact on the project
3. Any important notes for collaborators

Keep it professional and easy to understand.`

    const result = await model.generateContent(prompt)
    const summary = result.response.text()

    // Send emails to all collaborators
    const emailPromises = collaborators.map((email: string) => {
      const mailOptions = {
        from: process.env.NODEMAILER_EMAIL,
        to: email,
        subject: `${projectName} - New Updates Available`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #2563eb;">DevCollab - Project Update</h2>
            <h3>${projectName}</h3>
            <p>New changes have been made to your project. Here's a summary:</p>
            <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <pre style="white-space: pre-wrap; font-family: inherit;">${summary}</pre>
            </div>
            <p>
              <a href="${githubRepo}" style="color: #2563eb; text-decoration: none;">
                View on GitHub →
              </a>
            </p>
            <hr style="margin: 30px 0; border: none; border-top: 1px solid #e2e8f0;">
            <p style="color: #64748b; font-size: 14px;">
              This email was sent by DevCollab. You're receiving this because you're a collaborator on this project.
            </p>
          </div>
        `,
      }

      return transporter.sendMail(mailOptions)
    })

    await Promise.all(emailPromises)

    return NextResponse.json({ success: true, summary })
  } catch (error) {
    console.error("Error sending notifications:", error)
    return NextResponse.json({ error: "Failed to send notifications" }, { status: 500 })
  }
}
