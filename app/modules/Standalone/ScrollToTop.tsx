import { ArrowUpIcon } from "~/components/Icons";
import { useState, useEffect } from "react";

const SCROLL_OFFSET = 300;
const SCROLL_TIMEOUT = 2000;

export default function ScrollToTop() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    let scrollTimeout: NodeJS.Timeout;

    const toggleVisibility = () => {
      if (window.scrollY > SCROLL_OFFSET) {
        setIsVisible(true);
        clearTimeout(scrollTimeout);
        scrollTimeout = setTimeout(() => {
          setIsVisible(false);
        }, SCROLL_TIMEOUT);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener("scroll", toggleVisibility);

    return () => {
      window.removeEventListener("scroll", toggleVisibility);
      clearTimeout(scrollTimeout);
    };
  }, []);

  return (
    <>
      <div className={`fixed right-3 bottom-3 z-50 transition-opacity duration-300 ease-in-out ${isVisible ? "opacity-100" : "pointer-events-none opacity-0"}`}>
        <button
          className="bg-black-gray text-ak-blue w-10 h-10 flex items-center justify-center"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        >
          <ArrowUpIcon width="1rem" height="1rem" />
        </button>
      </div>
    </>
  );
}
