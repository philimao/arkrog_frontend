import { styled } from "styled-components";
import { Link, Outlet, useLocation } from "react-router";
import { homePages } from "~/routes";
import RequireAuth from "~/routes/RequireAuth";

const StyledHomeNavContainer = styled.div`
  position: absolute;
  width: 100vw;
  left: 50%;
  transform: translateX(-50%);
  padding-left: 0.5rem;
  z-index: 0;
`;

const StyledHomeNav = styled.div<{ active: boolean }>`
  margin-bottom: 0.5rem;
  padding: 0.25rem 1rem;
  background: ${(props) =>
    props.active ? "var(--ak-blue)" : "black"};
  color: ${(props) => (props.active ? "black" : "white")};
  z-index: -1;
`;

export default function HomeLayout() {
  const location = useLocation();
  return (
    <RequireAuth>
      <div className="container block lg:flex relative">
        <div className="min-w-60 min-h-36">
          <StyledHomeNavContainer>
            {homePages.map((page) => {
              const active = location.pathname.endsWith(page.pathname);
              return (
                <Link
                  to={"/home" + page.pathname}
                  className="block w-[15rem]"
                  key={page.title}
                >
                  <StyledHomeNav key={page.pathname} active>
                    {page.title}
                  </StyledHomeNav>
                </Link>
              );
            })}
          </StyledHomeNavContainer>
        </div>
        <div className="flex-grow">
          <Outlet />
        </div>
      </div>
    </RequireAuth>
  );
}
