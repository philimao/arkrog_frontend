import { styled } from "styled-components";
import { Link, Outlet, useLocation } from "react-router";
import type { ReactNode } from "react";

const StyledAside = styled.aside`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  width: 100%;
  @media (min-width: 1024px) {
    width: 12rem;
    flex-shrink: 0;
  }
`;

const StyledNavItem = styled.div<{ active: boolean }>`
  padding: 0.375rem 1rem;
  background: ${(p) => (p.active ? "var(--ak-blue)" : "black")};
  color: ${(p) => (p.active ? "black" : "white")};
  font-family: "HanSans", sans-serif;
  cursor: pointer;
  transition: background 0.15s;
  &:hover {
    background: ${(p) =>
      p.active ? "var(--ak-blue)" : "rgba(255, 255, 255, 0.1)"};
  }
`;

export interface SidebarPage {
  pathname: string;
  title: string;
}

export interface SidebarLayoutProps {
  basePath: string;
  pages: SidebarPage[];
  /** Wrapper for guards (e.g. RequireAuth + LevelGuard). Defaults to identity. */
  wrap?: (children: ReactNode) => ReactNode;
}

export default function SidebarLayout({
  basePath,
  pages,
  wrap = (c) => c,
}: SidebarLayoutProps) {
  const location = useLocation();
  return wrap(
    <div className="mx-auto w-full max-w-screen-2xl px-3 sm:px-6 flex flex-col lg:flex-row gap-4 lg:gap-6">
      <StyledAside>
        {pages.map((page) => {
          const fullPrefix = basePath + page.pathname;
          const active =
            location.pathname === fullPrefix ||
            location.pathname.startsWith(fullPrefix + "/");
          return (
            <Link to={fullPrefix} key={page.title}>
              <StyledNavItem active={active}>{page.title}</StyledNavItem>
            </Link>
          );
        })}
      </StyledAside>
      <main className="grow min-w-0">
        <Outlet />
      </main>
    </div>,
  );
}
