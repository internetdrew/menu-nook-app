import { SignInPrompt } from "@/components/SignInPrompt";

const Login = () => {
  return (
    <main className="h-dvh">
      <nav className="mx-auto max-w-5xl p-4 text-center font-[560] sm:text-lg">
        <span>MenuNook</span>
      </nav>
      <SignInPrompt />
    </main>
  );
};

export default Login;
