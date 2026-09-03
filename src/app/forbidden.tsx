import Link from "next/link";

export default function Forbidden() {
  return (
    <main>
      <h1>Not available to your account</h1>
      <p>This page belongs to another role. If you think that is wrong, ask the library desk.</p>
      <Link href="/">Back to the catalogue</Link>
    </main>
  );
}
