import React, { useMemo } from "react";
import { ReactSVG } from "react-svg";

export interface IconProperties {
  className?: string;
  title?: string;
  description?: string;
  role?: string;
  size:
    | "12"
    | "16"
    | "20"
    | "24"
    | "32"
    | "40"
    | "48"
    | "56"
    | "64"
    | "80"
    | "84"
    | "100"
    | "120";
  name: string;
  stroke?: string;
  fill?: string;
  bordered?: boolean;
  bg?: string;
  shadow?: boolean;
}

const Icon: React.FC<IconProperties> = ({
  className,
  title,
  description,
  size,
  name,
  fill,
  stroke,
  shadow = false,
  ...props
}) => {
  const iconFile: string | null = useMemo(() => {
    if (name) {
      const fileExt = name.split(".").pop();
      const base: string = `/assets/icons/`;
      if (fileExt === "svg" || fileExt === "png") {
        return `${base}${name}`;
      } else {
        return `${base}${name}.svg`;
      }
    } else {
      console.error("No icon name provided!");
      return null;
    }
  }, [name]);
  const fileExt = name ? name.split(".").pop() : "";
  const iconType = fileExt || "";
  if (!iconFile) return <span>No icon file found!</span>;
  
  const shadowClass = shadow ? "drop-shadow-lg" : ""; // Tailwind shadow utility
  return iconType === "png" ? (
    <img
      src={iconFile!}
      width={`${size}`}
      height={`${size}`}
      aria-hidden={true}
      alt={name}
    />
  ) : (
    <ReactSVG
    className={`icon-svg flex items-center h-full ${shadowClass} ${className ?? ""}`}
      style={{ width: `${size}px`, height: `${size}px`}}
      beforeInjection={(svg: SVGElement) => {
        // svg.classList.add("stroke-inherit");
        svg.setAttribute("width", size);
        svg.setAttribute("height", size);
        svg.querySelectorAll("path").forEach((element) => {
          if (stroke) element.setAttribute("stroke", stroke);
          if (fill) element.setAttribute("fill", fill);
          element.setAttribute("stroke-width", "1.4");
        });
      }}
      // fill={fill}
      desc={description}
      evalScripts="always"
      fallback={() => <strong>{name}</strong>}
      httpRequestWithCredentials={true}
      renumerateIRIElements={false}
      src={`${iconFile}`}
      title={title}
      useRequestCache={true}
      wrapper="span"
      aria-hidden={true}
      {...props}
    />
  );
};

Icon.displayName = "Icon";

export default Icon;