import type { TeamMemberData } from "~/types/recordType";
import { styled } from "styled-components";
import type { Route } from "../../../.react-router/types/app/+types/root";
import { getPath, imageHost } from "~/utils/tools";

const StyledBustImg = styled.img`
  position: absolute;
  width: 100%;
  height: auto;
  left: 0;
  top: -18%;
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
  const bgSrc = `/images/card/noinfo${isBust ? "-bust" : ""}.png`;
  const bustSrc = memberData
    ? encodeURI(imageHost + getPath(`半身像_${memberData.name}_1.png`))
    : "#";
  const skillSrc = memberData?.skillName
    ? encodeURI(imageHost + getPath(`技能_${memberData.skillName}.png`))
    : "/images/card/no-uniequip.png";
  const uniequipSrc =
    memberData?.uniequipName && memberData.uniequipName !== "ORIGINAL"
      ? encodeURI(
          imageHost + getPath(`模组类型_${memberData.uniequipName}_小图.png`),
        )
      : "/images/card/no-uniequip.png";

  return (
    <div
      className={`relative first-of-type:opacity-0 first-of-type:mb-2 ${className}`}
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
