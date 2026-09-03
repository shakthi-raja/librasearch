import { signOutAction } from "@/server/actions/sign-out";
import { requireUser } from "@/server/auth/current";

export default async function LibraryHomePage() {
  const user = await requireUser("LIBRARIAN");
  return (
    <main>
      <h1>Library desk</h1>
      <p>Signed in as {user.fullName}</p>
      <form action={signOutAction}>
        <button type="submit">Sign out</button>
      </form>
    </main>
  );
}
