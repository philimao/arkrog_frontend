import { type ImgHTMLAttributes, useState } from "react";
import useImageLazyLoad from "~/hooks/useImageLazyLoad";

export function LazyImage(props: ImgHTMLAttributes<HTMLImageElement>) {
  const [isLoaded, setIsLoaded] = useState(false);

  const imgRef = useImageLazyLoad(() => setIsLoaded(true));

  return (
    <img
      ref={imgRef}
      src={isLoaded ? props.src : undefined}
      alt={props.alt}
      className="lazy-image"
      referrerPolicy="no-referrer"
      crossOrigin="anonymous"
    />
  );
}
