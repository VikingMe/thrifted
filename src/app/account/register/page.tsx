import { redirect } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db";
import { hashPassword } from "@/lib/password";
import { setBuyerSession, getCurrentBuyer } from "@/lib/buyer-session";

async function register(formData: FormData) {
  "use server";
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const name = String(formData.get("name") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !name || !password) {
    redirect("/account/register?error=missing");
  }
  if (password.length < 8) {
    redirect("/account/register?error=short");
  }

  const existing = await db.user.findUnique({ where: { email } });
  if (existing) {
    redirect("/account/register?error=exists");
  }

  const passwordHash = await hashPassword(password);
  const user = await db.user.create({
    data: { email, name, passwordHash, role: "BUYER" },
  });

  await setBuyerSession(user.id);
  redirect("/account");
}

const ERRORS: Record<string, string> = {
  missing: "All fields are required.",
  short: "Password must be at least 8 characters.",
  exists: "An account with that email already exists.",
};

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const existing = await getCurrentBuyer();
  if (existing) redirect("/account");

  const { error } = await searchParams;

  return (
    <>
      <header className="nav-shell">
        <div className="nav-inner">
          <Link href="/" className="logo">THRI<span>FTED</span></Link>
          <nav className="nav-links">
            <Link href="/">Boutique</Link>
            <Link href="/account/login">Sign in</Link>
          </nav>
        </div>
      </header>

      <div className="login-wrap">
        <div className="login-card">
          <p style={{
            fontFamily: "var(--font-sans)", fontSize: 10,
            letterSpacing: "0.32em", textTransform: "uppercase",
            color: "var(--color-gold-deep)", marginBottom: 20,
          }}>
            New account
          </p>
          <h1>Join the<br /><em style={{ fontStyle: "italic", color: "var(--color-gold-deep)" }}>atelier</em>.</h1>
          <p className="sub">
            Create an account to save pieces, track orders, and try them on your silhouette.
          </p>

          <form action={register} className="login-form">
            <input name="name" placeholder="Full name" autoComplete="name" required />
            <input name="email" type="email" placeholder="Email" autoComplete="email" required />
            <input name="password" type="password" placeholder="Password (8+ characters)" autoComplete="new-password" required />
            {error && ERRORS[error] && <div className="login-error">{ERRORS[error]}</div>}
            <button type="submit" className="btn btn-primary" style={{ width: "100%" }}>
              Create account
            </button>
          </form>

          <p style={{
            marginTop: 28, textAlign: "center",
            fontFamily: "var(--font-sans)", fontSize: 12,
            color: "var(--color-muted)",
          }}>
            Already have an account?{" "}
            <Link href="/account/login" style={{ color: "var(--color-gold-deep)", borderBottom: "1px solid var(--color-gold)" }}>
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </>
  );
}
