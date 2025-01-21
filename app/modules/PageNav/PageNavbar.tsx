import { styled } from "styled-components";
import { Button } from "@heroui/react";

const StyledPageNavbar = styled.div`
  height: 3rem;
`;

export default function PageNavbar() {
  return (
    <StyledPageNavbar className="flex justify-center">
      <Button color="primary" variant="ghost">
        首页
      </Button>
      <Button color="primary" variant="ghost">
        无藏收录
      </Button>
      <Button color="primary" variant="ghost">
        攻略博客
      </Button>
      <Button color="primary" variant="ghost">
        伤害计算
      </Button>
      <Button color="primary" variant="ghost">
        赛事整理
      </Button>
    </StyledPageNavbar>
  );
}
