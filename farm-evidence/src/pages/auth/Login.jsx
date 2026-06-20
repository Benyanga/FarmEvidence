import { SignIn } from '@clerk/clerk-react';

export default function Login() {
  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-10">
      <div className="w-full max-w-md">
        <SignIn routing="hash" signUpUrl="#/sign-up" afterSignInUrl="/dashboard" />
      </div>
    </div>
  );
}
