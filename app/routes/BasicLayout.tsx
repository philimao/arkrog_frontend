import MyNavbar from "~/modules/TopNav/TopNavbar";
import { Outlet } from "react-router";
import PageNavbar from "~/modules/PageNav/PageNavbar";
import LoginModal from "~/modules/LoginModal/LoginModal";
import { ToastContainer } from "react-toastify";
import React, { useState } from "react";
import { styled, ThemeProvider } from "styled-components";
import theme from "~/styles/theme";
import { Footer } from "~/modules/Footer/Footer";

const StyledBackground = styled.div`
  min-height: 100vh; /* 确保最小高度为视口高度 */
  background-image: url("/bg/01.png"), url("/bg/02.png");
  background-size:
    100% auto,
    100% auto;
  background-position: top, top;
  background-repeat: no-repeat, repeat-y;
`;

export default function BasicLayout() {
  const [currentTheme, setCurrentTheme] = useState("dark");
  return (
    <ThemeProvider theme={theme[currentTheme as keyof typeof theme]}>
      <StyledBackground>
        <MyNavbar />
        <PageNavbar />
        <Outlet />
        <Footer />
        <ToastContainer
          autoClose={3000}
          position="top-right"
          stacked
          hideProgressBar
        />
      </StyledBackground>
    </ThemeProvider>
  );
}
