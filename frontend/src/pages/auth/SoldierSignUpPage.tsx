import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link, useNavigate } from "react-router-dom";
import { Mail, Lock, User } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useAuthStore } from "@/store/authStore";
import { toast } from "@/store/toastStore";

const schema = z
  .object({
    name: z.string().min(2, "Enter your full name."),
    email: z.string().email("Enter a valid email address."),
    password: z.string().min(6, "Password must be at least 6 characters."),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

type FormValues = z.infer<typeof schema>;

/**
 * Soldier Sign Up — the only self-service registration in the app. Creates
 * the account immediately (no email verification step) and sends the
 * soldier to the Soldier Sign In page to log in. Commander accounts cannot
 * be created here or anywhere else in the UI.
 */
export default function SoldierSignUpPage() {
  const register_ = useAuthStore((s) => s.register);
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  async function onSubmit(values: FormValues) {
    try {
      await register_(values.name, values.email, values.password, "soldier");
      toast.success("Account created successfully", "You can now sign in.");
      navigate("/auth/soldier/login");
    } catch (err) {
      toast.error("Registration failed", err instanceof Error ? err.message : "Please try again.");
    }
  }

  return (
    <div>
      <div className="mb-6 flex items-center gap-2.5 text-[color:var(--color-amber-400)]">
        <User className="h-5 w-5" />
        <span className="text-xs font-medium uppercase tracking-wider">Soldier Portal</span>
      </div>

      <h1 className="text-2xl font-semibold tracking-tight text-[color:var(--color-ink-0)]">Create your Soldier account</h1>
      <p className="mt-2 text-sm text-[color:var(--color-ink-3)]">Register to access your missions, equipment, training, and comms.</p>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-4" noValidate>
        <Input label="Full name" placeholder="Sergeant Ananya Nair" icon={<User />} error={errors.name?.message} {...register("name")} />
        <Input label="Email" type="email" placeholder="you@prahari-x.mil" icon={<Mail />} error={errors.email?.message} {...register("email")} />
        <Input label="Password" type="password" placeholder="••••••••" icon={<Lock />} error={errors.password?.message} {...register("password")} />
        <Input label="Confirm password" type="password" placeholder="••••••••" icon={<Lock />} error={errors.confirmPassword?.message} {...register("confirmPassword")} />

        <Button type="submit" variant="amber" className="w-full" size="lg" loading={isSubmitting}>
          Create account
        </Button>
      </form>

      <p className="mt-8 text-center text-sm text-[color:var(--color-ink-3)]">
        Already have an account?{" "}
        <Link to="/auth/soldier/login" className="font-medium text-[color:var(--color-amber-400)] hover:text-[color:var(--color-amber-300)]">
          Sign in
        </Link>
      </p>
    </div>
  );
}
