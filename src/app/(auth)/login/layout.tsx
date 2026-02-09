export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <section className="bg-zinc-50 min-h-screen">
      {children}
    </section>
  );
}