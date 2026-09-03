import { signOutAction } from "@/server/actions/sign-out";
import { requireUser } from "@/server/auth/current";

export default async function FacultyHomePage() {
  const user = await requireUser("FACULTY");
  return (
    <main>
      <h1>Faculty desk</h1>
      <p>Signed in as {user.fullName}</p>
      <form action={signOutAction}>
        <button type="submit">Sign out</button>
      </form>
    </main>
  );
}
