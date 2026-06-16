import type { ReactNode } from "react";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import Container from "./Container";

type LayoutProps = {
    children: ReactNode;
};

export default function Layout({ children }: LayoutProps) {
    return (
        <div className="flex min-h-screen bg-slate-100">
            < Sidebar />

            <div className="flex flex-1 flex-col">
                <Topbar />

                <main className="flex-1 overflow-y-auto">
                    <Container>{children}</Container>
                </main>
            </div>
        </div>
    );
}