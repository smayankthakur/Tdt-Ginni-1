import React from "react";

// Catches any render error so the chat NEVER shows a blank/broken screen.
export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { err: null };
  }
  static getDerivedStateFromError(err) {
    return { err };
  }
  componentDidCatch(err, info) {
    // eslint-disable-next-line no-console
    console.error("Ginni caught an error:", err, info);
  }
  render() {
    if (this.state.err) {
      return (
        <div className="flex min-h-screen items-center justify-center p-6 text-center">
          <div className="max-w-sm rounded-3xl border border-border bg-card p-7 shadow-card">
            <div className="font-serif text-2xl text-gold">Ek pal, kripya…</div>
            <p className="mt-2 text-sm text-muted-foreground">
              Ek chhota technical vighn aaya. Page refresh kijiye — the deck will realign.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 rounded-2xl bg-gold-grad px-5 py-2 font-semibold text-primary-foreground"
            >
              Refresh
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
