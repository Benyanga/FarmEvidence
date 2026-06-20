import { describe, expect, test, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import App from "./App";
import { useSessionStore } from "./store/sessionStore";

let signedIn = false;

vi.mock("@clerk/clerk-react", () => ({
  ClerkProvider: ({ children }) => children,
  SignIn: () => <div>Sign In Form</div>,
  SignUp: () => <div>Sign Up Form</div>,
  SignedIn: ({ children }) => (signedIn ? children : null),
  SignedOut: ({ children }) => (!signedIn ? children : null),
  UserButton: () => <div>User</div>,
  useAuth: () => ({ isSignedIn: signedIn, isLoaded: true, getToken: async () => "test_token" }),
}));

describe("route navigation shell", () => {
  test("renders login route content", async () => {
    signedIn = false;
    useSessionStore.setState({ sessionLocked: false, mode: "FARMER" });
    render(
      <MemoryRouter initialEntries={["/login"]}>
        <App />
      </MemoryRouter>,
    );
    expect(await screen.findByText(/Select your role/i)).toBeTruthy();
  });

  test("farmer mode statistics route shows blocked screen", async () => {
    signedIn = true;
    useSessionStore.setState({ mode: "FARMER", sessionLocked: true });
    render(
      <MemoryRouter initialEntries={["/statistics"]}>
        <App />
      </MemoryRouter>,
    );
    expect(await screen.findByText(/Session locked — continue to setup and season workflows/i)).toBeTruthy();
  });
});
