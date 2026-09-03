import { signOutAction } from "@/server/actions/sign-out";
import { requireUser } from "@/server/auth/current";

export default async function StudentHomePage() {
  const user = await requireUser("STUDENT");
  return (
    <main>
      <h1>Student desk</h1>
      <p>Signed in as {user.fullName}</p>
      <form action={signOutAction}>
        <button type="submit">Sign out</button>
      </form>
    </main>
  );
}
