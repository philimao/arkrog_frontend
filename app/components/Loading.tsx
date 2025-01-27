import { Spinner } from "@heroui/react";
import { useEffect, useState } from "react";

export default function Loading() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    setTimeout(() => {
      setShow(true);
    }, 1000);
  }, []);

  if (!show) return null;
  return (
    <div className="w-full flex justify-center pt-[20vh]">
      <Spinner
        color="white"
        label="数据加载中..."
        classNames={{
          wrapper: "w-12 h-12",
          circle1: "text-ak-blue w-12 h-12",
          circle2: "text-ak-blue w-12 h-12",
          label: "text-ak-blue text-2xl font-bold",
        }}
      />
    </div>
  );
}
