import type { ReactNode } from "react";

type CardProps = {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  onClick?: () => void;
};

export default function Card({
  children,
  className = "",
  hover = false,
  onClick,
}: CardProps) {
  const Tag = onClick ? "button" : "div";
  return (
    <Tag
      onClick={onClick}
      className={[
        "glass-card",
        hover ? "glass-hover" : "",
        onClick ? "w-full text-left cursor-pointer" : "",
        "p-5",
        className,
      ].join(" ")}
    >
      {children}
    </Tag>
  );
}
