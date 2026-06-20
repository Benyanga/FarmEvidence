import { SignUp } from '@clerk/clerk-react';

export default function Register() {
  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-10">
      <div className="w-full max-w-md">
        <SignUp routing="hash" signInUrl="#/sign-in" afterSignUpUrl="/dashboard" />
      </div>
    </div>
  );
}
