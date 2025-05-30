import { Button } from "@/components/ui/button"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Code, Users, GitBranch, Mail, Zap, Shield, ArrowRight, Star, CheckCircle, Sparkles } from "lucide-react"
import Link from "next/link"

export default function LandingPage() {
  const features = [
    {
      icon: GitBranch,
      title: "GitHub Integration",
      description: "Seamlessly connect your projects with GitHub repositories and track changes in real-time.",
      color: "text-orange-600",
    },
    {
      icon: Zap,
      title: "AI-Powered Analysis",
      description: "Get intelligent code analysis and automated README generation powered by Gemini AI.",
      color: "text-yellow-600",
    },
    {
      icon: Users,
      title: "Team Collaboration",
      description: "Invite team members, manage roles, and keep everyone updated with automatic notifications.",
      color: "text-blue-600",
    },
    {
      icon: Mail,
      title: "Smart Notifications",
      description: "Receive intelligent email summaries of project changes and updates automatically.",
      color: "text-green-600",
    },
    {
      icon: Shield,
      title: "Secure & Private",
      description: "Control project visibility and manage access with enterprise-grade security.",
      color: "text-purple-600",
    },
    {
      icon: Code,
      title: "Developer Friendly",
      description: "Built by developers, for developers. Integrate with your existing workflow seamlessly.",
      color: "text-indigo-600",
    },
  ]

  const benefits = [
    "Automated README generation",
    "Real-time collaboration",
    "AI-powered code insights",
    "Email notifications",
    "GitHub integration",
    "Role-based access control",
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200">
        <div className="container mx-auto px-4 py-4">
          <nav className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="relative">
                <Code className="h-8 w-8 text-blue-600" />
                <Sparkles className="h-4 w-4 text-yellow-500 absolute -top-1 -right-1" />
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                DevCollab
              </span>
              <Badge variant="secondary" className="hidden sm:inline-flex">
                Beta
              </Badge>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/auth">
                <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700">
                  Get Started
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <div className="max-w-4xl mx-auto">
          <Badge variant="outline" className="mb-6 px-4 py-2">
            <Star className="h-4 w-4 mr-2 text-yellow-500" />
            AI-Powered Collaboration Platform
          </Badge>

          <h1 className="text-5xl md:text-7xl font-bold text-gray-900 mb-6 leading-tight">
            Collaborate Smarter,{" "}
            <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
              Build Better
            </span>
          </h1>

          <p className="text-xl md:text-2xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed">
            The ultimate collaboration platform for developers, project managers, and product managers. Streamline your
            workflow with AI-powered insights and seamless GitHub integration.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Link href="/auth">
              <Button
                size="lg"
                className="px-8 py-4 text-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
              >
                Start Collaborating
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Button variant="outline" size="lg" className="px-8 py-4 text-lg border-2">
              Watch Demo
            </Button>
          </div>

          {/* Benefits List */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-w-2xl mx-auto">
            {benefits.map((benefit, index) => (
              <div key={index} className="flex items-center space-x-2 text-sm text-gray-600">
                <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                <span>{benefit}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="text-center mb-16">
          <Badge variant="outline" className="mb-4">
            Features
          </Badge>
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Everything you need to collaborate effectively
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Powerful tools designed to enhance your development workflow and team productivity.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <Card
              key={index}
              className="group hover:shadow-xl transition-all duration-300 border-0 bg-white/60 backdrop-blur-sm hover:bg-white/80"
            >
              <CardHeader className="text-center">
                <div className="mx-auto mb-4 p-3 rounded-full bg-gray-50 group-hover:bg-gray-100 transition-colors">
                  <feature.icon className={`h-8 w-8 ${feature.color}`} />
                </div>
                <CardTitle className="text-xl mb-2">{feature.title}</CardTitle>
                <CardDescription className="text-base leading-relaxed">{feature.description}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-600"></div>
        <div className="relative container mx-auto px-4 py-20 text-center text-white">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">Ready to transform your collaboration?</h2>
          <p className="text-xl md:text-2xl mb-8 opacity-90 max-w-2xl mx-auto">
            Join thousands of teams already using DevCollab to build better software together.
          </p>
          <Link href="/auth">
            <Button size="lg" variant="secondary" className="px-8 py-4 text-lg bg-white text-blue-600 hover:bg-gray-50">
              Get Started for Free
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-16">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <div className="flex items-center justify-center space-x-3 mb-6">
              <Code className="h-8 w-8 text-blue-400" />
              <span className="text-2xl font-bold">DevCollab</span>
            </div>
            <p className="text-gray-400 mb-8 max-w-md mx-auto">
              Empowering teams to collaborate smarter and build better software with AI-powered insights.
            </p>
            <div className="border-t border-gray-800 pt-8">
              <p className="text-gray-500">© 2024 DevCollab. All rights reserved.</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
