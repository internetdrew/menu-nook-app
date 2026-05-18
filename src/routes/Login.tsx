import { SignInPrompt } from "@/components/SignInPrompt";
import loginBackground from "@/assets/login-bg.png";

const Login = () => {
  return (
    <main
      className="min-h-dvh bg-cover bg-center"
      style={{
        backgroundImage: [
          "radial-gradient(circle at 48% 40%, rgba(255, 250, 241, 0.96) 0, rgba(255, 250, 241, 0.62) 22rem, rgba(255, 250, 241, 0.12) 43rem)",
          "linear-gradient(180deg, rgba(255, 249, 238, 0.16), rgba(255, 243, 222, 0.32))",
          `url(${loginBackground})`,
        ].join(", "),
      }}
    >
      <SignInPrompt />
    </main>
  );
};

export default Login;
