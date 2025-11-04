import SignInButton from "@/components/SignInButton";

export default function NavBar() {
  return (
    <nav className="w-full h-12 flex items-center justify-between px-8 bg-background border-b">
      <div className="text-xl font-semibold">Capsule</div>
      <div>
        <SignInButton />
      </div>
    </nav>
  );
}
