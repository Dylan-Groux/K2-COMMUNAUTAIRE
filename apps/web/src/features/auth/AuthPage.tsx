import { useState, type FormEvent } from "react"
import { useLocation, useNavigate } from "react-router"
import { loginSchema, registerSchema } from "@k2/shared"
import { Shell } from "@/components/layout/Shell"
import { errorMessage } from "@/lib/api-client"
import { useLogin, useRegister } from "./queries"

const emptyForm = { email: "", pseudo: "", phone: "", password: "" }

export function AuthPage() {
  const [isLogin, setIsLogin] = useState(true)
  const [form, setForm] = useState(emptyForm)
  const [notice, setNotice] = useState("")
  const login = useLogin()
  const register = useRegister()
  const navigate = useNavigate()
  const from = (useLocation().state as { from?: string } | null)?.from ?? "/profil"

  const pending = login.isPending || register.isPending
  const field = (name: keyof typeof emptyForm) => ({
    value: form[name],
    onChange: (event: { target: { value: string } }) =>
      setForm((current) => ({ ...current, [name]: event.target.value })),
  })

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    const parsed = isLogin ? loginSchema.safeParse(form) : registerSchema.safeParse(form)
    if (!parsed.success) {
      setNotice(parsed.error.issues[0]?.message ?? "Formulaire invalide")
      return
    }
    setNotice("")
    try {
      if (isLogin) await login.mutateAsync(loginSchema.parse(form))
      else await register.mutateAsync(registerSchema.parse(form))
      navigate(from, { replace: true })
    } catch (error) {
      setNotice(errorMessage(error))
    }
  }

  return (
    <Shell>
      <div className="auth-card">
        <p className="eyebrow">{isLogin ? "Bon retour" : "Bienvenue"}</p>
        <h1 className="font-display text-5xl font-bold">
          {isLogin ? "Connexion" : "Créer un compte"}
        </h1>
        <form onSubmit={submit} className="mt-10 space-y-4" noValidate>
          <input
            required
            type="email"
            autoComplete="email"
            className="profile-input"
            placeholder="Email"
            aria-label="Email"
            {...field("email")}
          />
          {!isLogin && (
            <>
              <input
                required
                autoComplete="username"
                className="profile-input"
                placeholder="Pseudo unique"
                aria-label="Pseudo unique"
                {...field("pseudo")}
              />
              <input
                type="tel"
                autoComplete="tel"
                className="profile-input"
                placeholder="Téléphone (optionnel)"
                aria-label="Téléphone (optionnel)"
                {...field("phone")}
              />
            </>
          )}
          <input
            required
            type="password"
            autoComplete={isLogin ? "current-password" : "new-password"}
            className="profile-input"
            placeholder="Mot de passe"
            aria-label="Mot de passe"
            {...field("password")}
          />
          <button
            disabled={pending}
            className="w-full rounded-xl bg-[#5865F2] px-5 py-4 font-semibold disabled:opacity-60"
          >
            {isLogin ? "Se connecter" : "Créer mon compte"}
          </button>
        </form>
        <button
          type="button"
          onClick={() => {
            setIsLogin(!isLogin)
            setNotice("")
          }}
          className="mt-6 text-sm text-white/45"
        >
          {isLogin ? "Pas encore de compte ? Créer un compte" : "Déjà membre ? Connexion"}
        </button>
        <p className="mt-5 text-sm text-amber-300/70" role="alert">
          {notice}
        </p>
      </div>
    </Shell>
  )
}
