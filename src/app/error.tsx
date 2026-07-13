"use client";
export default function ErrorPage({ reset }: { reset: () => void }) { return <section className="container py-20 text-center"><h1 className="text-4xl font-black text-navy">Something went wrong</h1><button onClick={reset} className="mt-6 rounded-md bg-coral px-6 py-3 font-black text-white">Try again</button></section>; }
