import { styled } from "styled-components";
import { Link, useLocation } from "react-router";
import { pages } from "~/routes";

const StyledPageNavbar = styled.div`
  display: flex;
  align-items: center;
  height: 6rem;
  font-size: 1.5rem;
  overflow-y: hidden;
  border-color: rgba(255, 255, 255, 0.2);
`;

const StyledButtonTitle = styled.div`
  font-size: 1.25rem;
  font-weight: 700;
  font-family: "HanSans", sans-serif;
  white-space: nowrap;
`;
const StyledButtonSubtitle = styled.div`
  font-size: 0.8rem;
  font-weight: 600;
  font-family: "HanSans", sans-serif;
`;

export default function PageNavbar() {
  const location = useLocation();
  const currentPage = pages
    .filter((page) =>
      page.pathname === "/"
        ? location.pathname === page.pathname
        : location.pathname.startsWith(page.pathname),
    )
    .sort((a, b) => b.pathname.length - a.pathname.length)[0];

  return (
    <>
      <StyledPageNavbar className="justify-start sm:justify-center my-4 ms-2 sm:ms-0 hide-scroll border-b-1">
        {pages.map((page) => {
          const color = (currentPage?.pathname || "") === page.pathname
            ? "text-ak-blue border-b-ak-blue border-b-2"
            : "text-white";
          return (
            <div
              key={page.title}
              className={`text-xl w-28 h-24 ${color} hover:text-ak-blue mx-3`}
            >
              <button className="h-full w-full">
                <Link to={page.pathname}>
                  <StyledButtonTitle>{page.title}</StyledButtonTitle>
                  <StyledButtonSubtitle>{page.subtitle}</StyledButtonSubtitle>
                </Link>
              </button>
            </div>
          );
        })}
      </StyledPageNavbar>
    </>
  );
}
