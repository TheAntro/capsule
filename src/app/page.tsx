import WaitlistForm from "@/components/WaitlistForm/WaitlistForm";

export default function Home() {
  return (
    <main className="h-screen flex flex-col gap-6 items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-foreground mb-4">Welcome to Capsule</h1>
      </div>
      <div className="w-full px-4 md:w-2/3 mx-auto flex justify-center items-center">
        <WaitlistForm />
      </div>
    </main>
  );
}
