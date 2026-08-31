import { Outlet } from "react-router";
import { Header } from "./Header";

export function Layout() {
  return (
    <div className="min-h-screen">
      <Header />
      <main className="mx-auto max-w-5x1 px-4 py-8">
        <Outlet />
      </main>
    </div>
  )
}