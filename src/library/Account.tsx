import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { cloud } from "./cloud";
import { useLibrary } from "./LibraryProvider";
import { SyncStatus } from "./Library";
export default function Account() {
  const { user, sync, syncing, ready } = useLibrary();
  const [email, setEmail] = useState("");
  const [token, setToken] = useState("");
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  async function send() {
    if (!cloud) return;
    setBusy(true);
    setMessage("");
    try {
      const { error } = await cloud.auth.signInWithOtp({
        email: email.trim(),
        options: {
          emailRedirectTo: window.location.origin + "/library/account",
        },
      });
      if (error) throw error;
      setSent(true);
      setMessage("Check your email for the sign-in link or code.");
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Couldn’t send email.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="library-page library-account">
      <Link className="library-back" to="/library">
        <ArrowLeft size={17} />
        Library
      </Link>
      <h1>Backup & Sync</h1>
      <p>Your mushaf, MemoBuddy, and device Library work without an account.</p>
      <SyncStatus />
      {!cloud ? (
        <section>
          <h2>Cloud sync isn’t connected yet</h2>
          <p>
            Your entries save on this device. Export a backup from Library while
            the new AyahVault cloud project is being connected.
          </p>
        </section>
      ) : user ? (
        <section>
          <h2>Signed in</h2>
          <p>{user.email}</p>
          <p>
            Entries created on this device are added to this account when
            syncing. Offline edits upload when you reconnect.
          </p>
          <button
            className="library-primary"
            disabled={syncing}
            onClick={() => void sync()}
          >
            {syncing ? "Syncing…" : "Sync Now"}
          </button>
          <button
            className="library-text-button"
            onClick={async () => {
              setMessage("");
              const { error } = await cloud!.auth.signOut({ scope: "local" });
              if (error) setMessage(error.message);
            }}
          >
            Sign Out on This Device
          </button>
          <p className="library-muted">
            Account entries stay stored separately on this device and reappear
            when you sign into the same account.
          </p>
        </section>
      ) : (
        <section>
          <h2>Keep your Library across devices</h2>
          <p>
            Sign in by email. Your saved device entries will join this account’s
            Library.
          </p>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void send();
            }}
          >
            <label className="library-field">
              Email
              <input
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setSent(false);
                }}
              />
            </label>
            <button className="library-primary" disabled={busy || !ready}>
              {busy
                ? "Sending…"
                : sent
                  ? "Send Again"
                  : "Email Me a Sign-in Link"}
            </button>
          </form>
          {sent && (
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (!cloud) return;
                setBusy(true);
                const { error } = await cloud.auth.verifyOtp({
                  email: email.trim(),
                  token: token.trim(),
                  type: "email",
                });
                setMessage(error?.message || "Signed in.");
                setBusy(false);
              }}
            >
              <label className="library-field">
                Or enter the email code
                <input
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                />
              </label>
              <button
                className="library-text-button"
                disabled={!token.trim() || busy}
              >
                Verify Code
              </button>
            </form>
          )}
        </section>
      )}
      {message && <p role="status">{message}</p>}
    </div>
  );
}
