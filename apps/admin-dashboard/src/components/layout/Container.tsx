import type { ReactNode } from "react";

type ContainerProps = {
    children: ReactNode;
};

export default function Container({ children }: ContainerProps) {
    return (
        <div className="mx-auto w-full max-w-7xl px-4 py-6 md:px-6">
            {children}
        </div>
    );
}