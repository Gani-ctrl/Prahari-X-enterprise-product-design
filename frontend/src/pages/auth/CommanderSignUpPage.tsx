import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link, useNavigate } from "react-router-dom";
import { Mail, Lock, ShieldCheck, User } from "lucide-react";
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
 * Commander Sign Up — self-service registration for command-staff accounts.
 * Creates the account immediately (no email verification step) with role
 * "commander" and sends the new commander to the Commander Sign In page.
 * Completely separate from Soldier Sign Up — never creates a Personnel
 * roster record, never grants the "soldier" role.
 */
export default function CommanderSignUpPage() {
  const register_ = useAuthStore((s) => s.register);
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  async function onSubmit(values: FormValues) {
    try {
      await register_(values.name, values.email, values.password, "commander");
      toast.success("Account created successfully", "You can now sign in.");
      navigate("/auth/login");
    } catch (err) {
      toast.error("Registration failed", err instanceof Error ? err.message : "Please try again.");
    }
  }

  return (
    <div>
      <div className="mb-6 flex items-center gap-2.5 text-[color:var(--color-sentinel-400)]">
        <ShieldCheck className="h-5 w-5" />
        <span className="text-xs font-medium uppercase tracking-wider">Commander Portal</span>
      </div>

      <h1 className="text-2xl font-semibold tracking-tight text-[color:var(--color-ink-0)]">Create Commander account</h1>
      <p className="mt-2 text-sm text-[color:var(--color-ink-3)]">Register for full command console access — missions, intelligence, personnel, assets.</p>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-4" noValidate>
        <Input label="Full name" placeholder="Commander Aryan Vashisht" icon={<User />} error={errors.name?.message} {...register("name")} />
        <Input label="Email" type="email" placeholder="you@prahari-x.mil" icon={<Mail />} error={errors.email?.message} {...register("email")} />
        <Input label="Password" type="password" placeholder="••••••••" icon={<Lock />} error={errors.password?.message} {...register("password")} />
        <Input label="Confirm password" type="password" placeholder="••••••••" icon={<Lock />} error={errors.confirmPassword?.message} {...register("confirmPassword")} />

        <Button type="submit" className="w-full" size="lg" loading={isSubmitting}>
          Create account
        </Button>
      </form>

      <p className="mt-8 text-center text-sm text-[color:var(--color-ink-3)]">
        Already have an account?{" "}
        <Link to="/auth/login" className="font-medium text-[color:var(--color-sentinel-400)] hover:text-[color:var(--color-sentinel-300)]">
          Sign in
        </Link>
      </p>
      <p className="mt-2 text-center text-sm text-[color:var(--color-ink-3)]">
        Registering as a Soldier?{" "}
        <Link to="/auth/soldier/signup" className="font-medium text-[color:var(--color-amber-400)] hover:text-[color:var(--color-amber-300)]">
          Go to the Soldier portal
        </Link>
      </p>
    </div>
  );
}
