import type { TeamMemberData } from "~/types/recordType";
import { styled } from "styled-components";
import type { Route } from "../../../.react-router/types/app/+types/root";
import { useGameDataStore } from "~/stores/gameDataStore";

const StyledBustImg = styled.img`
  position: absolute;
  width: 100%;
  height: auto;
  left: 0;
  top: -1rem;
`;

const StyledMinorImg = styled.img`
  position: absolute;
  width: 45%;
  height: auto;
  bottom: 0;
  border: rgba(255, 255, 255, 0.6) 1px solid;
`;

const StyledSkillImg = styled(StyledMinorImg)`
  left: 0;
`;

const StyledUniequipImgWrapper = styled.div`
  position: absolute;
  width: 45%;
  aspect-ratio: 1;
  bottom: 0;
  border: rgba(255, 255, 255, 0.6) 1px solid;
  right: 0;
  overflow: hidden;
  background: var(--black-gray);
  display: flex;
  justify-content: center;
`;

const StyledUniequipImg = styled.img`
  height: 100%;
  max-width: unset;
`;

export default function CharAvatar({
  memberData,
  isBust,
  className,
}: {
  memberData?: TeamMemberData;
  isBust: boolean;
  className?: string;
}) {
  const { uniequipDict } = useGameDataStore();
  const bgSrc = `/images/card/noinfo${isBust ? "-bust" : ""}.png`;
  const bustSrc = memberData
    ? `${import.meta.env.VITE_API_BASE_URL}/images/bust/${memberData?.charId.split("_").slice(-1)[0]}_e1.png`
    : "#";
  const skillSrc = memberData
    ? `${import.meta.env.VITE_API_BASE_URL}/images/skill/skill_icon_${memberData?.skillId}.png`
    : "#";
  const uniequipName =
    memberData &&
    uniequipDict &&
    uniequipDict[memberData?.uniequipId || ""]?.typeIcon.toUpperCase();
  const uniequipSrc = uniequipName
    ? `${import.meta.env.VITE_API_BASE_URL}/images/uniequip/${uniequipName}_color.png`
    : "/images/card/no-uniequip.png";

  return (
    <div
      className={
        "relative first-of-type:opacity-0 first-of-type:mb-2 " +
        (className ?? "")
      }
    >
      <div className="bg-dark-gray p-1 relative">
        <div className="relative h-full w-full overflow-hidden">
          {!memberData ? (
            <>
              <img src={bgSrc} alt="bg" className="max-h-full" />
            </>
          ) : (
            <>
              <img src={bgSrc} alt="bg" className="max-h-full" />
              <StyledBustImg src={bustSrc} />
              <StyledSkillImg src={skillSrc} />
              <StyledUniequipImgWrapper>
                <StyledUniequipImg src={uniequipSrc} alt="uniequip" />
              </StyledUniequipImgWrapper>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  console.log(error);
  return <div>{JSON.stringify(error)}</div>;
}
