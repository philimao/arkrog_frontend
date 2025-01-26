import { styled } from "styled-components";
import "app/styles/nav.css";
import { Link, useLocation } from "react-router";
import { pages } from "~/routes";

const StyledPageNavbar = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 8rem;
  font-weight: 700;
  font-size: 1.5rem;
`;

const StyledButtonTitle = styled.div`
  font-size: 1.25rem;
  font-weight: 700;
`;
const StyledButtonSubtitle = styled.div`
  font-size: 0.8rem;
  font-weight: 600;
`;

export default function PageNavbar() {
  const location = useLocation();
  return (
    <StyledPageNavbar>
      {pages.map((page) => {
        const color = (
          page.pathname === "/"
            ? location.pathname === page.pathname
            : location.pathname.startsWith(page.pathname)
        )
          ? "text-ak-blue"
          : "text-white";
        return (
          <button
            key={page.title}
            className={`text-xl w-28 h-16 ${color} hover:text-ak-blue rounded-3xl mx-3`}
          >
            <Link to={page.pathname}>
              <StyledButtonTitle>{page.title}</StyledButtonTitle>
              <StyledButtonSubtitle>{page.subtitle}</StyledButtonSubtitle>
            </Link>
          </button>
        );
      })}
    </StyledPageNavbar>
  );
}
