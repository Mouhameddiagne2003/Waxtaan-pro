"use client"

import Image from "next/image"
import { Sparkles } from "lucide-react"
import { useEffect, useState } from "react"

export function LogoSidePanel() {
  const [sparklePositions, setSparklePositions] = useState<Array<{ x: number; y: number; delay: number }>>([])

  useEffect(() => {
    // Générer des positions aléatoires pour les étincelles
    const positions = Array.from({ length: 10 }, (_, i) => ({
      x: 26.3086,
      y: 26.3086,
      delay: i * 0.3,
    }))
    setSparklePositions(positions)
  }, [])

  return (
    <div className="relative hidden lg:flex flex-col items-center justify-center p-8 bg-gradient-to-br from-green-500 to-emerald-600 text-white rounded-l-2xl overflow-hidden lg:w-1/2 xl:w-2/5">
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
              animationDuration: "5s",
            }}
          >
            <Sparkles className="w-4 h-4 text-white opacity-60" />
          </div>
        ))}
      </div>

      {/* Cercles décoratifs animés */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div
          className="w-96 h-96 rounded-full border-2 border-white animate-spin opacity-10"
          style={{ animationDuration: "40s" }}
        ></div>
        <div
          className="absolute w-80 h-80 rounded-full border-2 border-white animate-spin opacity-15"
          style={{ animationDuration: "30s", animationDirection: "reverse" }}
        ></div>
      </div>

      <div className="relative z-10 text-center">
        <Image
          src="/waxtaan.png" // Chemin corrigé
          alt="Waxtaan Logo"
          width={250}
          height={100}
          className="mb-4 mx-auto animate-fade-in"
          priority
        />
        <h2 className="text-4xl font-bold mb-2 animate-fade-in" style={{ animationDelay: "0.2s" }}>
          Bienvenue sur Waxtaan !
        </h2>
        <p className="text-lg opacity-90 animate-fade-in" style={{ animationDelay: "0.4s" }}>
          Discutez, connectez-vous et partagez en toute simplicité.
        </p>
        <div
          className="mt-8 inline-flex items-center gap-2 text-white text-sm opacity-80 animate-fade-in"
          style={{ animationDelay: "0.6s" }}
        >
          <span>Made in Senegal</span>
          <span className="animate-bounce">🇸🇳</span>
        </div>
      </div>
    </div>
  )
}
