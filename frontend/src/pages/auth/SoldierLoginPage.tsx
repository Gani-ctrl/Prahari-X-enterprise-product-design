import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link, useNavigate } from "react-router-dom";
import { Mail, Lock, User, AlertTriangle } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Checkbox } from "@/components/ui/Checkbox";
import { useAuthStore } from "@/store/authStore";
import { toast } from "@/store/toastStore";
import { useState } from "react";

const schema = z.object({
  email: z.string().email("Enter a valid email address."),
  password: z.string().min(1, "Enter your password."),
});

type FormValues = z.infer<typeof schema>;

const ERROR_TITLES: Record<string, string> = {
  ACCOUNT_NOT_FOUND: "Account not found",
  INVALID_CREDENTIALS: "Invalid email or password",
  WRONG_PORTAL: "Wrong portal",
};

/**
 * Soldier Sign In — a completely separate portal from Commander. A Commander
 * account is rejected here (server-enforced) even with the correct password.
 */
export default function SoldierLoginPage() {
  const login = useAuthStore((s) => s.login);
  const navigate = useNavigate();
  const [remember, setRemember] = useState(true);
  const [bannerCode, setBannerCode] = useState<string | null>(null);
  const [bannerMessage, setBannerMessage] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: "soldier@prahari-x.mil", password: "sentinel" },
  });

  async function onSubmit(values: FormValues) {
    setBannerCode(null);
    setBannerMessage(null);
    try {
      await login(values.email, values.password, remember, "soldier");
      toast.success("Access granted", "Welcome back, Soldier.");
      navigate("/soldier/dashboard");
    } catch (err) {
      const { errorCode, error } = useAuthStore.getState();
      setBannerCode(errorCode);
      setBannerMessage(error ?? (err instanceof Error ? err.message : "Sign-in failed."));
    }
  }

  return (
    <div>
      <div className="mb-6 flex items-center gap-2.5 text-[color:var(--color-amber-400)]">
        <User className="h-5 w-5" />
        <span className="text-xs font-medium uppercase tracking-wider">Soldier Portal</span>
      </div>

      <h1 className="text-2xl font-semibold tracking-tight text-[color:var(--color-ink-0)]">Soldier portal access</h1>
      <p className="mt-2 text-sm text-[color:var(--color-ink-3)]">Your missions, equipment, training, and comms — nothing else.</p>

      <AnimatePresence>
        {bannerCode && (
          <motion.div
            initial={{ opacity: 0, height: 0, marginTop: 0 }}
            animate={{ opacity: 1, height: "auto", marginTop: 20 }}
            exit={{ opacity: 0, height: 0, marginTop: 0 }}
            className="overflow-hidden rounded-xl border border-[color:var(--color-danger-500)]/30 bg-[color:var(--color-danger-500)]/10 p-3.5"
          >
            <div className="flex items-start gap-2.5">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-[color:var(--color-danger-400)]" />
              <div className="min-w-0">
                <p className="text-sm font-medium text-[color:var(--color-danger-400)]">{ERROR_TITLES[bannerCode] ?? "Sign-in failed"}</p>
                <p className="mt-0.5 text-xs leading-relaxed text-[color:var(--color-ink-2)]">{bannerMessage}</p>
                {bannerCode === "ACCOUNT_NOT_FOUND" && (
                  <Link to="/auth/soldier/signup" className="mt-1.5 inline-block text-xs font-medium text-[color:var(--color-amber-400)] hover:text-[color:var(--color-amber-300)]">
                    Create an account &rarr;
                  </Link>
                )}
                {bannerCode === "WRONG_PORTAL" && (
                  <Link to="/auth/login" className="mt-1.5 inline-block text-xs font-medium text-[color:var(--color-amber-400)] hover:text-[color:var(--color-amber-300)]">
                    Go to Commander sign-in &rarr;
                  </Link>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-4" noValidate>
        <Input label="Email" type="email" placeholder="you@prahari-x.mil" icon={<Mail />} error={errors.email?.message} {...register("email")} />
        <Input label="Password" type="password" placeholder="••••••••" icon={<Lock />} error={errors.password?.message} {...register("password")} />

        <div className="flex items-center justify-between pt-1">
          <Checkbox checked={remember} onCheckedChange={setRemember} label="Remember this device" />
        </div>

        <Button type="submit" variant="amber" className="w-full" size="lg" loading={isSubmitting}>
          Sign in
        </Button>

        <p className="pt-2 text-center text-xs text-[color:var(--color-ink-4)]">
          Demo credentials are pre-filled. Password is <span className="mono-tag">sentinel</span>.
        </p>
      </form>

      <p className="mt-8 text-center text-sm text-[color:var(--color-ink-3)]">
        New Soldier?{" "}
        <Link to="/auth/soldier/signup" className="font-medium text-[color:var(--color-amber-400)] hover:text-[color:var(--color-amber-300)]">
          Create an account
        </Link>
      </p>
      <p className="mt-2 text-center text-sm text-[color:var(--color-ink-3)]">
        Signing in as Commander?{" "}
        <Link to="/auth/login" className="font-medium text-[color:var(--color-sentinel-400)] hover:text-[color:var(--color-sentinel-300)]">
          Go to the Commander portal
        </Link>
      </p>
    </div>
  );
}
