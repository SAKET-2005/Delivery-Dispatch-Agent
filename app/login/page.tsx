"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, MapPinned } from "lucide-react";

export default function LoginPage() {
  const [passcode, setPasscode] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setBusy(true);
    try {
      const response = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ passcode }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Unable to sign in.");
      router.replace("/dashboard");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to sign in.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="auth-screen">
      <section className="auth-art">
        <div className="auth-logo">
          <span className="brand-mark">
            <MapPinned size={18} />
          </span>
          <span className="brand-title">
            RouteWise<span className="brand-sub">Chennai delivery hub</span>
          </span>
        </div>
        <div className="map-orbit">
          <span className="orbit-dot" />
          <span className="orbit-dot" />
          <span className="orbit-dot" />
        </div>
        <div className="auth-art-copy">
          <div className="eyebrow" style={{ color: "#49c2a3" }}>
            Dispatch intelligence
          </div>
          <h1>
            Every route,
            <br />
            in good hands.
          </h1>
          <p>
            Your Chennai delivery operation, in sync. See the fleet, move every parcel, and keep
            the day on course.
          </p>
        </div>
        <div className="auth-foot">CHENNAI · INDIA&nbsp;&nbsp; / &nbsp;&nbsp;ROUTEWISE OPERATIONS</div>
      </section>

      <section className="auth-form-side">
        <form className="auth-form" onSubmit={submit}>
          <div className="eyebrow">Chennai Delivery Hub</div>
          <h2>Dispatcher sign in</h2>
          <p>Enter your hub passcode to access operations.</p>
          <div className="form-control">
            <label htmlFor="passcode">Passcode</label>
            <input
              className="login-input"
              id="passcode"
              type="password"
              autoComplete="current-password"
              required
              value={passcode}
              onChange={(e) => setPasscode(e.target.value)}
              placeholder="Enter your passcode"
            />
          </div>
          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}
          <button className="btn btn-primary login-submit" type="submit" disabled={busy}>
            {busy ? "Signing in…" : "Sign in to hub"}
            <ArrowRight size={15} />
          </button>
          <div className="login-note">Authorized dispatch personnel only</div>
        </form>
      </section>
    </main>
  );
}
