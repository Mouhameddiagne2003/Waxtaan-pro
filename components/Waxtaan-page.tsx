"use client"

import { useEffect, useState } from "react"
import { MessageCircle, Sparkles } from "lucide-react"

export function WaxtaanLogo() {
  const [isVisible, setIsVisible] = useState(false)
  const [sparklePositions, setSparklePositions] = useState<Array<{ x: number; y: number; delay: number }>>([])

  useEffect(() => {
    setIsVisible(true)

    // Générer des positions aléatoires pour les étincelles
    const positions = Array.from({ length: 8 }, (_, i) => ({
      x: Math.random() * 100,
      y: Math.random() * 100,
      delay: i * 0.2,
    }))
    setSparklePositions(positions)
  }, [])

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-green-50 via-green-100 to-emerald-50 relative overflow-hidden">
      {/* Particules flottantes en arrière-plan */}
      <div className="absolute inset-0 overflow-hidden">
        {sparklePositions.map((pos, i) => (
          <div
            key={i}
            className="absolute animate-pulse"
            style={{
              left: `${pos.x}%`,
              top: `${pos.y}%`,
              animationDelay: `${pos.delay}s`,
              animationDuration: "3s",
            }}
          >
            <Sparkles className="w-4 h-4 text-green-400 opacity-60" />
          </div>
        ))}
      </div>

      {/* Cercles décoratifs animés */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div
          className="w-96 h-96 rounded-full border-2 border-green-200 animate-spin opacity-20"
          style={{ animationDuration: "20s" }}
        ></div>
        <div
          className="absolute w-80 h-80 rounded-full border-2 border-green-300 animate-spin opacity-30"
          style={{ animationDuration: "15s", animationDirection: "reverse" }}
        ></div>
        <div
          className="absolute w-64 h-64 rounded-full border-2 border-emerald-200 animate-spin opacity-20"
          style={{ animationDuration: "25s" }}
        ></div>
      </div>

      {/* Logo principal */}
      <div
        className={`relative z-10 transition-all duration-1000 transform ${isVisible ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"}`}
      >
        {/* Icône de chat avec effet de pulsation */}
        <div className="flex justify-center mb-8">
          <div className="relative">
            <div className="absolute inset-0 bg-[#25D366] rounded-full animate-pulse opacity-75 blur-lg"></div>
            <div className="relative bg-[#25D366] p-6 rounded-full shadow-2xl transform hover:scale-110 transition-transform duration-300">
              <MessageCircle className="w-16 h-16 text-white" />
            </div>

            {/* Bulles de discussion animées */}
            <div
              className="absolute -top-2 -right-2 w-4 h-4 bg-green-400 rounded-full animate-bounce"
              style={{ animationDelay: "0s" }}
            ></div>
            <div
              className="absolute -top-4 right-4 w-3 h-3 bg-green-500 rounded-full animate-bounce"
              style={{ animationDelay: "0.5s" }}
            ></div>
            <div
              className="absolute -bottom-2 -left-2 w-3 h-3 bg-emerald-400 rounded-full animate-bounce"
              style={{ animationDelay: "1s" }}
            ></div>
          </div>
        </div>

        {/* Nom de l'application */}
        <div className="text-center mb-6">
          <h1 className="text-6xl font-bold bg-gradient-to-r from-green-600 via-[#25D366] to-emerald-600 bg-clip-text text-transparent mb-2 animate-pulse">
            Waxtaan
          </h1>
          <div className="flex items-center justify-center gap-2 text-gray-600 text-lg">
            <span className="animate-fade-in" style={{ animationDelay: "0.5s", animationFillMode: "both" }}>
              Discuter
            </span>
            <span className="text-2xl animate-bounce" style={{ animationDelay: "1s" }}>
              •
            </span>
            <span className="animate-fade-in" style={{ animationDelay: "1.5s", animationFillMode: "both" }}>
              Connecter
            </span>
            <span className="text-2xl animate-bounce" style={{ animationDelay: "2s" }}>
              •
            </span>
            <span className="animate-fade-in" style={{ animationDelay: "2.5s", animationFillMode: "both" }}>
              Partager
            </span>
          </div>
        </div>

        {/* Ligne décorative */}
        <div className="flex justify-center mb-6">
          <div className="w-32 h-1 bg-gradient-to-r from-green-500 via-[#25D366] to-emerald-500 rounded-full animate-pulse"></div>
        </div>

        {/* Made in Senegal avec drapeau stylisé */}
        <div className="text-center">
          <div className="inline-flex items-center gap-3 bg-white/80 backdrop-blur-sm px-6 py-3 rounded-full shadow-lg border border-white/20">
            <div className="flex gap-1">
              <div className="w-3 h-6 bg-green-500 rounded-sm animate-pulse"></div>
              <div className="w-3 h-6 bg-[#25D366] rounded-sm animate-pulse"></div>
              <div className="w-3 h-6 bg-emerald-500 rounded-sm animate-pulse"></div>
            </div>
            <span className="text-gray-700 font-medium">Made in Senegal</span>
            <div className="text-2xl animate-bounce">🇸🇳</div>
          </div>
        </div>

        {/* Effet de chargement */}
        <div className="mt-8 flex justify-center">
          <div className="flex gap-2">
            <div className="w-3 h-3 bg-green-500 rounded-full animate-bounce"></div>
            <div className="w-3 h-3 bg-[#25D366] rounded-full animate-bounce"></div>
            <div className="w-3 h-3 bg-emerald-500 rounded-full animate-bounce"></div>
          </div>
        </div>
      </div>

      <div className="text-center mt-8 text-gray-600">
        Sélectionnez une discussion ou démarrer une nouvelle conversation
      </div>

      {/* Vagues animées en bas */}
      <div className="absolute bottom-0 left-0 right-0">
        <svg viewBox="0 0 1200 120" className="w-full h-24">
          <path
            d="M0,60 C300,120 900,0 1200,60 L1200,120 L0,120 Z"
            fill="url(#waveGradient)"
            className="animate-pulse"
          />
          <defs>
            <linearGradient id="waveGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.3" />
              <stop offset="50%" stopColor="#25D366" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#059669" stopOpacity="0.3" />
            </linearGradient>
          </defs>
        </svg>
      </div>
    </div>
  )
}
