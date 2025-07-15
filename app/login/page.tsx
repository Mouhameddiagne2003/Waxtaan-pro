"use client"
import type React from "react"
import { useState } from "react"
import { useRouter } from 'next/navigation'
import { Eye, EyeOff, User, Lock, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import dynamic from 'next/dynamic'

const LogoSidePanel = dynamic(
  () => import('../../components/logo-side-panel').then((mod) => mod.LogoSidePanel),
  { ssr: false }
)

import { login } from "../../services/user.service"
import { Toaster, toast } from 'sonner'

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [formData, setFormData] = useState({
    username: "",
    password: "",
  })
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    try {
      const { token } = await login(formData.username, formData.password)
      localStorage.setItem('token', token)
      toast.success('Connexion réussie ! Redirection...')
      router.push('/')
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Une erreur inconnue est survenue.'
      toast.error(`Échec de la connexion: ${errorMessage}`)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 via-green-100 to-emerald-50 relative overflow-hidden p-4">
      <Toaster richColors />
      {/* Particules flottantes en arrière-plan global */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="absolute animate-pulse"
            style={{
              left: `40%`,
              top: `40%`,
              animationDelay: `${i * 0.4}s`,
              animationDuration: "5s",
            }}
          >
            <Sparkles className="w-4 h-4 text-green-300 opacity-40" />
          </div>
        ))}
      </div>

      {/* Conteneur principal du formulaire et du panneau latéral */}
      <div className="relative z-10 flex w-full max-w-5xl bg-white/80 backdrop-blur-sm rounded-2xl shadow-2xl border border-white/20 overflow-hidden">
        {/* Panneau latéral avec logo et animations */}
        <LogoSidePanel />

        {/* Formulaire de connexion */}
        <div className="w-full lg:w-1/2 xl:w-3/5 p-8 md:p-12 flex flex-col justify-center">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Connexion</h1>
            <p className="text-gray-600">Connectez-vous à votre compte Waxtaan</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Nom d'utilisateur */}
            <div className="space-y-2 animate-fade-in">
              <Label className="text-gray-700 font-medium">Nom d'utilisateur</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  type="text"
                  value={formData.username}
                  onChange={(e) => handleInputChange("username", e.target.value)}
                  className="pl-10 h-12 border-gray-200 focus:border-[#25D366] focus:ring-[#25D366] rounded-lg"
                  placeholder="Votre nom d'utilisateur"
                  required
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* Mot de passe */}
            <div className="space-y-2 animate-fade-in" style={{ animationDelay: "0.1s" }}>
              <Label className="text-gray-700 font-medium">Mot de passe</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={(e) => handleInputChange("password", e.target.value)}
                  className="pl-10 pr-10 h-12 border-gray-200 focus:border-[#25D366] focus:ring-[#25D366] rounded-lg"
                  placeholder="Votre mot de passe"
                  required
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Bouton de connexion */}
            <Button
              type="submit"
              className="w-full h-12 bg-[#25D366] hover:bg-green-600 text-white font-medium rounded-lg transition-all duration-300 transform hover:scale-105 animate-fade-in"
              style={{ animationDelay: "0.2s" }}
              disabled={isLoading}
            >
              {isLoading ? 'Connexion...' : 'Se connecter'}
            </Button>
          </form>

          {/* Liens */}
          <div className="text-center mt-6 animate-fade-in" style={{ animationDelay: "0.3s" }}>
            <p className="text-gray-600">
              Pas encore de compte ?
              <Link
                href="/register"
                className="ml-2 text-[#25D366] font-medium hover:underline transition-all duration-200"
              >
                S'inscrire
              </Link>
            </p>
          </div>
          <div className="text-center mt-4 animate-fade-in" style={{ animationDelay: "0.4s" }}>
            <Link href="/forgot-password" className="text-sm text-gray-500 hover:text-[#25D366] transition-colors">
              Mot de passe oublié ?
            </Link>
          </div>
        </div>
      </div>

      {/* Vagues en bas */}
      <div className="absolute bottom-0 left-0 right-0 pointer-events-none">
        <svg viewBox="0 0 1200 120" className="w-full h-16">
          <path
            d="M0,60 C300,120 900,0 1200,60 L1200,120 L0,120 Z"
            fill="url(#loginWaveGradient)"
            className="animate-pulse"
          />
          <defs>
            <linearGradient id="loginWaveGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#25D366" stopOpacity="0.1" />
              <stop offset="50%" stopColor="#10b981" stopOpacity="0.2" />
              <stop offset="100%" stopColor="#059669" stopOpacity="0.1" />
            </linearGradient>
          </defs>
        </svg>
      </div>
    </div>
  )
}

