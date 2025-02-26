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
import { SearchIcon } from "~/components/Icons";

function SearchComp({ ...props }: React.ComponentPropsWithoutRef<"div">) {
  const [searchOption, setSearchOption] = useState("全站");
  const [searchValue, setSearchValue] = useState("");

  return (
    <div className="w-96 me-6" {...props}>
      <Select
        name="select"
        className="w-28"
        classNames={{
          trigger: "bg-mid-gray rounded-none",
          value: "",
          popoverContent: "bg-mid-gray rounded-none",
          listbox: "rounded-none",
        }}
        aria-label="select"
        selectedKeys={[searchOption]}
        onChange={(evt) => setSearchOption(evt.target.value)}
      >
        {["全站"].map((opt) => (
          <SelectItem key={opt}>{opt}</SelectItem>
        ))}
      </Select>
      <Divider orientation="vertical" />
      <Input
        className="rounded-none"
        classNames={{
          base: "max-w-full sm:max-w-[30rem]",
          mainWrapper: "h-full",
          input: "text-small hover:bg-transparent",
          inputWrapper:
            "h-full font-normal text-default-500 bg-mid-gray data-[hover=true]:bg-mid-gray group-data-[focus=true]:bg-mid-gray rounded-none",
        }}
        placeholder="搜索功能稍后上线..."
        endContent={<SearchIcon fill="none" aria-hidden="true" focusable="false" role="presentation" width='18px' height='18px' />}
        type="search"
        value={searchValue}
        onValueChange={setSearchValue}
      />
    </div>
  );
}

export default function TopNavbar() {
  return (
    <>
      <Navbar
        isBordered
        maxWidth="2xl"
        className="bg-black-gray h-20 font-han-sans"
      >
        <NavbarContent>
          <NavbarBrand className="text-2xl font-bold text-white">
            <Link to="/">
              <img
                src="/images/logo/logo-text.png"
                alt="logo"
                className="h-16"
              />
            </Link>
          </NavbarBrand>
        </NavbarContent>
        <NavbarContent justify="end">
          <NavbarItem>
            <SearchComp className="hidden md:flex" />
          </NavbarItem>
          <NavbarItem>
            <UserOrLogin />
          </NavbarItem>
        </NavbarContent>
      </Navbar>
      <SearchComp className="flex md:hidden px-2 pt-3" />
    </>
  );
}
