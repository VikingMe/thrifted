import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { SELLER_COOKIE } from "@/lib/auth";

async function login(formData: FormData) {
  "use server";
  const password = String(formData.get("password") ?? "");
  const expected = process.env.SELLER_PASSWORD ?? "";

  if (!expected || password !== expected) {
    redirect("/seller/login?error=1");
  }

  (await cookies()).set(SELLER_COOKIE, "1", {
    httpOnly: true, sameSite: "lax", path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });

  redirect("/seller");
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <>
      <header className="nav-shell">
        <div className="nav-inner">
          <Link href="/" className="logo">THRI<span>FTED</span></Link>
          <nav className="nav-links">
            <Link href="/">Boutique</Link>
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
            Private access
          </p>
          <h1>Atelier<br /><em style={{ fontStyle: "italic", color: "var(--color-gold-deep)" }}>entry</em>.</h1>
          <p className="sub">
            Enter the seller password to manage the collection.
          </p>

          <form action={login} className="login-form">
            <input
              type="password"
              name="password"
              placeholder="Password"
              autoComplete="current-password"
              autoFocus
              required
            />
            {error && <div className="login-error">Incorrect password. Try again.</div>}
            <button type="submit" className="btn btn-primary" style={{ width: "100%" }}>
              Enter atelier
            </button>
          </form>
        </div>
      </div>
    </>
  );
}
