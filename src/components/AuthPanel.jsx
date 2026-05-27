import React, { useEffect, useState } from "react";
import { LogIn, LogOut, UserPlus } from "lucide-react";
import { supabase } from "../supabaseClient";

export default function AuthPanel({ onUserChange }) {
  const [user, setUser] = useState(null);
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    loadUser();

    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
      onUserChange?.(session?.user || null);
    });

    return () => data.subscription.unsubscribe();
  }, []);

  async function loadUser() {
    const { data } = await supabase.auth.getUser();
    setUser(data.user || null);
    onUserChange?.(data.user || null);
  }

  async function signUp() {
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) return alert(error.message);
    alert("Akun berhasil dibuat. Cek email jika perlu verifikasi.");
  }

  async function signIn() {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return alert(error.message);
    await loadUser();
  }

  async function signOut() {
    await supabase.auth.signOut();
    setUser(null);
    onUserChange?.(null);
  }

  if (user) {
    return (
      <div style={styles.box}>
        <p style={styles.muted}>Login sebagai:</p>
        <strong>{user.email}</strong>

        <button onClick={signOut} style={styles.button}>
          <LogOut size={16} />
          Logout
        </button>
      </div>
    );
  }

  return (
    <div style={styles.box}>
      <h3>{mode === "login" ? "Login User" : "Buat Akun"}</h3>

      <input
        style={styles.input}
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />

      <input
        style={styles.input}
        placeholder="Password"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />

      {mode === "login" ? (
        <button onClick={signIn} style={styles.button}>
          <LogIn size={16} />
          Login
        </button>
      ) : (
        <button onClick={signUp} style={styles.button}>
          <UserPlus size={16} />
          Register
        </button>
      )}

      <button
        onClick={() => setMode(mode === "login" ? "register" : "login")}
        style={styles.linkButton}
      >
        {mode === "login" ? "Belum punya akun? Register" : "Sudah punya akun? Login"}
      </button>
    </div>
  );
}

const styles = {
  box: {
    background: "rgba(255,255,255,.07)",
    border: "1px solid rgba(255,255,255,.14)",
    borderRadius: 20,
    padding: 16,
    marginTop: 16
  },
  muted: {
    color: "rgba(255,255,255,.65)",
    marginBottom: 4
  },
  input: {
    width: "100%",
    padding: 12,
    marginBottom: 10,
    borderRadius: 12,
    border: "1px solid rgba(255,47,179,.25)",
    background: "rgba(0,0,0,.35)",
    color: "white"
  },
  button: {
    width: "100%",
    display: "flex",
    justifyContent: "center",
    gap: 8,
    alignItems: "center",
    border: 0,
    borderRadius: 12,
    padding: 12,
    background: "linear-gradient(135deg,#ff2fb3,#ffffff)",
    color: "#08000d",
    fontWeight: 900,
    cursor: "pointer",
    marginTop: 8
  },
  linkButton: {
    marginTop: 10,
    background: "transparent",
    border: 0,
    color: "#ff8bd8",
    cursor: "pointer"
  }
};