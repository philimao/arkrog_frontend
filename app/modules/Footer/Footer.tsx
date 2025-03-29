import { styled } from "styled-components";
import { Link } from "react-router";
import { openModal } from "~/utils/dom";

const StyledFooterContainer = styled.footer`
  margin-top: auto;
`;

const StyledFooterInner = styled.div`
  margin-top: 10rem;
  box-shadow: 0 -5px 10px 0 #18d1ff80;
  height: 6rem;
  background: var(--mid-gray);
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 4rem;
`;

const links = [
  { text: "联系我们", to: "#", targetModal: "contact-us" },
  { text: "赞助我们", to: "/sponsor" },
  { text: "友情链接", to: "#" },
];

export function Footer() {
  return (
    <StyledFooterContainer>
      <StyledFooterInner>
        {links.map((link) => (
          <Link
            to={link.to}
            key={link.text}
            className="font-bold text-lg hover:text-ak-blue"
            onClick={(evt) => {
              if (link.targetModal) {
                evt.preventDefault();
                openModal(link.targetModal);
              } else if (link.to === "#") {
                evt.preventDefault();
              }
            }}
          >
            {link.text}
          </Link>
        ))}
      </StyledFooterInner>
    </StyledFooterContainer>
  );
}
