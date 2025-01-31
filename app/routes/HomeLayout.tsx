import { styled } from "styled-components";
import { Link, Outlet, useLocation } from "react-router";
import { homePages } from "~/routes";
import RequireAuth from "~/routes/RequireAuth";

const StyledHomeNavContainer = styled.div`
  position: absolute;
  width: 100vw;
  left: 50%;
  top: 0;
  transform: translateX(-48%);
  z-index: 0;
`;

const StyledHomeNav = styled.div<{ active: string }>`
  margin-bottom: 0.5rem;
  padding: 0.25rem 1rem;
  background: ${(props) =>
    props.active === "true" ? "var(--ak-blue)" : "black"};
  color: ${(props) => (props.active === "true" ? "black" : "white")};
  z-index: -1;
`;

export default function HomeLayout() {
  const location = useLocation();
  return (
    <RequireAuth>
      <div className="container relative">
        <StyledHomeNavContainer>
          {homePages.map((page) => {
            const active = location.pathname.endsWith(page.pathname);
            return (
              <Link
                to={"/home" + page.pathname}
                className="block w-[15rem]"
                key={page.title}
              >
                <StyledHomeNav key={page.pathname} active={active.toString()}>
                  {page.title}
                </StyledHomeNav>
              </Link>
            );
          })}
        </StyledHomeNavContainer>
        <Outlet />
      </div>
    </RequireAuth>
  );
}
