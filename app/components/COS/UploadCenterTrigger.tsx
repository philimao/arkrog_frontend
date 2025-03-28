import React from "react";
import { styled } from "styled-components";
import { openModal } from "~/utils/dom";

const StyledTrigger = styled.button`
  position: fixed;
  right: 3rem;
  bottom: 3rem;
  width: 3rem;
  height: 3rem;
  background: var(--black-gray);
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
`;

export default function UploadCenterTrigger() {
  return (
    <StyledTrigger onClick={() => openModal("upload-center")}>
      <svg
        width="1.5rem"
        height="1.5rem"
        viewBox="0 0 16 16"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <g id="SVGRepo_bgCarrier" stroke-width="0"></g>
        <g
          id="SVGRepo_tracerCarrier"
          stroke-linecap="round"
          stroke-linejoin="round"
        ></g>
        <g id="SVGRepo_iconCarrier">
          <path
            d="M10 2C9.44772 2 9 2.44772 9 3V12H7V3C7 1.34315 8.34315 0 10 0C11.6569 0 13 1.34315 13 3V11C13 13.7614 10.7614 16 8 16C5.23858 16 3 13.7614 3 11V3.5H5V11C5 12.6569 6.34315 14 8 14C9.65685 14 11 12.6569 11 11V3C11 2.44772 10.5523 2 10 2Z"
            fill="#ffffff"
          ></path>
        </g>
      </svg>
    </StyledTrigger>
  );
}
