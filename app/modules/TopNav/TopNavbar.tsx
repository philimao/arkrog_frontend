import {
  Divider,
  Navbar,
  NavbarBrand,
  NavbarContent,
  NavbarItem,
  Select,
  SelectItem,
} from "@heroui/react";
import { Input } from "@heroui/input";
import React, { useState } from "react";
import UserOrLogin from "~/modules/TopNav/UserOrLogin";
import { Link } from "react-router";

interface SearchIconProps extends React.SVGProps<SVGSVGElement> {
  size?: number;
  strokeWidth?: number;
  width?: number;
  height?: number;
}

export const SearchIcon: React.FC<SearchIconProps> = ({
  size = 24,
  strokeWidth = 1.5,
  width,
  height,
  ...props
}) => {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      focusable="false"
      height={height || size}
      role="presentation"
      viewBox="0 0 24 24"
      width={width || size}
      {...props}
    >
      <path
        d="M11.5 21C16.7467 21 21 16.7467 21 11.5C21 6.25329 16.7467 2 11.5 2C6.25329 2 2 6.25329 2 11.5C2 16.7467 6.25329 21 11.5 21Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={strokeWidth}
      />
      <path
        d="M22 22L20 20"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={strokeWidth}
      />
    </svg>
  );
};

export default function TopNavbar() {
  const [searchOption, setSearchOption] = useState("全站");
  const [searchValue, setSearchValue] = useState("");

  return (
    <Navbar
      isBordered
      maxWidth="2xl"
      className="bg-black-gray text-mid-gray h-20"
    >
      <NavbarContent>
        <NavbarBrand className="text-2xl font-bold text-white">
          <Link to="/">Logo</Link>
        </NavbarBrand>
      </NavbarContent>
      <NavbarContent justify="end">
        <NavbarItem className="w-96 flex me-6">
          <Select
            name="select"
            className="w-28"
            classNames={{
              trigger: "bg-mid-gray rounded-none",
              value: "text-mid-gray",
              popoverContent: "bg-mid-gray text-mid-gray rounded-none",
              listbox: "rounded-none",
            }}
            aria-label="select"
            selectedKeys={[searchOption]}
            onChange={(evt) => setSearchOption(evt.target.value)}
          >
            {["全站", "部分"].map((opt) => (
              <SelectItem key={opt}>{opt}</SelectItem>
            ))}
          </Select>
          <Divider orientation="vertical" />
          <Input
            className="rounded-none"
            classNames={{
              base: "max-w-full sm:max-w-[30rem]",
              mainWrapper: "h-full",
              input: "text-small text-mid-gray hover:bg-transparent",
              inputWrapper:
                "h-full font-normal text-default-500 bg-mid-gray data-[hover=true]:bg-mid-gray group-data-[focus=true]:bg-mid-gray rounded-none",
            }}
            placeholder="Type to search..."
            endContent={<SearchIcon size={18} />}
            type="search"
            value={searchValue}
            onValueChange={setSearchValue}
          />
        </NavbarItem>
        <NavbarItem>
          <UserOrLogin />
        </NavbarItem>
      </NavbarContent>
    </Navbar>
  );
}
