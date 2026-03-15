"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { TARGET_URL } from "@/app/layout"
import Cookies from "js-cookie"
import Image from "next/image"

export default function LoginPage() {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    try {
      const res = await fetch(`http://${TARGET_URL}/api/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      })

      if (res.ok) {
        const data = await res.json()
        Cookies.set("auth_token", data.access_token, { expires: 1 })
        router.push("/")
        router.refresh()
      } else {
        setError("Invalid credentials")
      }
    } catch (err) {
      setError("Server connection failed")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-sm shadow-2xl border-primary/10 bg-card/90 backdrop-blur-md overflow-hidden">
        
        {/* LOGO A NÁZEV UVNITŘ KARTY */}
        <CardHeader className="p-4 flex flex-col items-center text-center">
          
          <div className="space-y-1">
            <CardTitle className="text-2xl font-bold tracking-tighter flex flex-row gap-2 justify-center items-center">
              <div className="relative w-16 h-12">
                <Image
                  src="/images/barlymediaos_logob.svg" // Ověř, že soubor je v public/images/barlymediaos_logob.svg
                  alt="Logo"
                  fill
                  className="object-contain"
                  priority
                />
              </div>
              barlyMediaOS
            </CardTitle>
            <CardDescription>
              Enter credentials to access the system
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="pt-8">
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input 
                id="username" 
                type="text" 
                placeholder="admin" 
                value={username} 
                onChange={(e) => setUsername(e.target.value)} 
                required
                className="bg-background"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input 
                id="password" 
                type="password" 
                placeholder="barly123"
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                required
                className="bg-background"
              />
            </div>
            
            {error && (
              <div className="p-3 rounded-md bg-destructive/10 text-destructive text-xs font-semibold text-center border border-destructive/20 animate-in shake-1">
                {error}
              </div>
            )}

            <Button 
              type="submit" 
              className="w-full h-11 font-bold text-base mt-2 shadow-lg shadow-primary/20" 
              disabled={isLoading}
            >
              {isLoading ? "Connecting..." : "Sign In"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}