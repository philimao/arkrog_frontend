import MyNavbar from "~/modules/TopNav/TopNavbar";
import { Outlet } from "react-router";
import PageNavbar from "~/modules/PageNav/PageNavbar";
import { ToastContainer } from "react-toastify";
import React, { useEffect, useState } from "react";
import { styled, ThemeProvider } from "styled-components";
import theme from "~/styles/theme";
import { Footer } from "~/modules/Footer/Footer";
import { useGameDataStore } from "~/stores/gameDataStore";
import { useUserInfoStore } from "~/stores/userInfoStore";
import GlobalModals from "~/routes/GlobalModals";
import { useAppDataStore } from "~/stores/appDataStore";
import { useTournamentDataStore } from "~/stores/tournamentsDataStore";
import ScrollToTop from "~/modules/Standalone/ScrollToTop";
import UploadCenter from "~/components/COS/UploadCenter";
import Loading from "~/components/Loading";

const StyledBackground = styled.div`
  min-height: 100vh; /* 确保最小高度为视口高度 */
  overflow: hidden;
  background-image: url("/images/bg/01.png"), url("/images/bg/02.png");
  background-size:
    100% auto,
    100% auto;
  background-position: top, top;
  background-repeat: no-repeat, repeat-y;
  display: flex;
  flex-direction: column;
`;

export default function RootLayout() {
  const [currentTheme] = useState("dark");
  const { fetchGameData } = useGameDataStore();
  const { fetchUserInfo } = useUserInfoStore();
  const { fetchAppData } = useAppDataStore();
  const { fetchTournamentsData } = useTournamentDataStore();
  const desktop = window.matchMedia("(min-width: 640px)").matches;
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetchAppData(),
      fetchUserInfo(),
      fetchGameData(),
      fetchTournamentsData(),
    ]).then(() => setLoading(false));
  }, [fetchAppData, fetchGameData, fetchTournamentsData, fetchUserInfo]);

  return (
    <ThemeProvider theme={theme[currentTheme as keyof typeof theme]}>
      <StyledBackground>
        {loading ? (
          <Loading />
        ) : (
          <>
            <MyNavbar />
            <PageNavbar />
            <Outlet />
            <Footer />
            <GlobalModals />
            <ScrollToTop />
            <UploadCenter />
          </>
        )}
        <ToastContainer
          autoClose={3000}
          position={desktop ? "bottom-right" : "top-right"}
          theme="dark"
          closeOnClick
          stacked
          hideProgressBar
          style={desktop ? {} : { width: "100vw" }}
        />
      </StyledBackground>
    </ThemeProvider>
  );
}
