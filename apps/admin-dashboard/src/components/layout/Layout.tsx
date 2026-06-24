import type { ReactNode } from "react";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import Container from "./Container";

type LayoutProps = {
  children: ReactNode;
};

export default function Layout({ children }: LayoutProps) {
  return (
    <div className="flex min-h-screen" style={{ background: "var(--bg)" }}>
      <Sidebar />
      <div className="flex flex-1 flex-col lg:me-60">
        <Topbar />
        <main className="flex-1 overflow-y-auto">
          <Container>{children}</Container>
        </main>
      </div>
    </div>
  );
}
