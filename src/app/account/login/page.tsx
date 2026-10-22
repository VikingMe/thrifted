import { redirect } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db";
import { verifyPassword } from "@/lib/password";
import { setBuyerSession, getCurrentBuyer } from "@/lib/buyer-session";

async function login(formData: FormData) {
  "use server";
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    redirect("/account/login?error=missing");
  }

  const user = await db.user.findUnique({ where: { email } });
  if (!user || user.role !== "BUYER" || !user.passwordHash) {
    redirect("/account/login?error=invalid");
  }

  const ok = await verifyPassword(password, user.passwordHash);
  if (!ok) {
    redirect("/account/login?error=invalid");
  }

  await setBuyerSession(user.id);
  redirect("/account");
}

const ERRORS: Record<string, string> = {
  missing: "Email and password are required.",
  invalid: "Incorrect email or password.",
};

export default async function BuyerLoginPage({
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
            <Link href="/account/register">Join</Link>
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
            Welcome back
          </p>
          <h1>Sign<br /><em style={{ fontStyle: "italic", color: "var(--color-gold-deep)" }}>in</em>.</h1>
          <p className="sub">
            Enter your details to continue.
          </p>

          <form action={login} className="login-form">
            <input name="email" type="email" placeholder="Email" autoComplete="email" autoFocus required />
            <input name="password" type="password" placeholder="Password" autoComplete="current-password" required />
            {error && ERRORS[error] && <div className="login-error">{ERRORS[error]}</div>}
            <button type="submit" className="btn btn-primary" style={{ width: "100%" }}>
              Sign in
            </button>
          </form>

          <p style={{
            marginTop: 28, textAlign: "center",
            fontFamily: "var(--font-sans)", fontSize: 12,
            color: "var(--color-muted)",
          }}>
            New here?{" "}
            <Link href="/account/register" style={{ color: "var(--color-gold-deep)", borderBottom: "1px solid var(--color-gold)" }}>
              Create an account
            </Link>
          </p>
        </div>
      </div>
    </>
  );
}
