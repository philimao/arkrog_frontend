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
import { useRelicFreeStore } from "~/stores/relicFreeStore";

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
  // 用户信息
  const { fetchUserInfo } = useUserInfoStore();
  // 主页应用数据
  const { fetchAppData } = useAppDataStore();
  // 无藏记录数据
  const { fetchRelicFreeData, fetchStagePreview } = useRelicFreeStore();
  // 游戏数据
  const { fetchGameDataBasic, fetchGameDataExt } = useGameDataStore();
  // 赛事数据
  const { fetchTournamentsData } = useTournamentDataStore();
  // 桌面端
  const desktop = window.matchMedia("(min-width: 640px)").matches;
  const [loading, setLoading] = useState(true);

  // 根据首屏路由加载数据，避免多层同步加载数据，在切换路由时，再次检查是否已经加载
  useEffect(() => {
    const route = window.location.pathname.split("/")[1] || "index";
    const preload = {
      index: [fetchAppData],
      "relic-free": [fetchGameDataBasic, fetchRelicFreeData, fetchStagePreview],
      tool: [fetchGameDataBasic, fetchGameDataExt],
      tournament: [fetchGameDataBasic, fetchTournamentsData],
    };
    const loadArray = [fetchUserInfo, ...preload[route as keyof typeof preload]];
    Promise.all(loadArray.map((f) => f())).then(() => setLoading(false));
  }, [fetchAppData, fetchGameDataBasic, fetchGameDataExt, fetchRelicFreeData, fetchTournamentsData, fetchUserInfo]);

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
