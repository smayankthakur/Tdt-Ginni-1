import React, { useState } from "react";
import MoonLogo from "./MoonLogo";
import StarField from "./StarField";

export default function Onboarding({ onEnter, initialName = "" }) {
  const [name, setName] = useState(initialName);

  const submit = (e) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (trimmed) onEnter(trimmed);
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center px-4">
      <StarField />
      <form
        onSubmit={submit}
        className="relative z-10 w-full max-w-md animate-rise rounded-3xl border border-border bg-card/80 p-8 shadow-card backdrop-blur"
      >
        <div className="mb-5 flex justify-center">
          <MoonLogo size={64} />
        </div>
        <h1 className="text-center font-serif text-4xl text-gold">Ginni Ki Baatein</h1>
        <p className="mx-auto mt-2 max-w-xs text-center text-sm text-muted-foreground">
          Ek private tarot counsel. Aapko kis naam se sambodhan karun?
        </p>

        <input
          autoFocus
          aria-label="Your name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Your name"
          className="mt-6 w-full rounded-2xl border border-gold/50 bg-input/60 px-4 py-3 text-center text-foreground placeholder:text-muted-foreground/70 outline-none transition focus:border-gold focus:shadow-gold"
        />

        <button
          type="submit"
          disabled={!name.trim()}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-gold-grad py-3 font-semibold text-primary-foreground transition hover:brightness-105 disabled:opacity-40"
        >
          <span>✦</span> Enter the Sanctum
        </button>
      </form>
    </div>
  );
}
