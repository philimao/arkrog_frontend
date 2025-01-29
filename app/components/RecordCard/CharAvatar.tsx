import type { TeamMemberData } from "~/types/recordType";
import { styled } from "styled-components";

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

const StyledUniequipImg = styled(StyledMinorImg)`
  right: 0;
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
  const bustSrc = `/images/bust/${memberData?.charId.split("_").slice(-1)[0]}_e1.png`;
  const skillSrc = `/images/skill/skill_icon_${memberData?.skillId}.png`;
  const uniequipSrc = `/images/card/no-uniequip.png`;

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
              <StyledUniequipImg src={uniequipSrc} />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
