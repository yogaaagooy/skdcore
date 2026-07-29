import logo from "../assets/logo.png";

const sizes = {
  sm: "h-8 max-w-[145px]",
  md: "h-9 max-w-[165px]",
  lg: "h-12 max-w-[210px]",
};

export default function BrandLogo({ size = "md", compact = false, className = "" }) {
  return (
    <span className={`inline-flex items-center justify-center rounded-xl bg-white ${compact ? "p-1" : "px-2 py-1.5"} shadow-[0_1px_2px_rgba(15,23,42,0.08)] ${className}`}>
      <img
        src={logo}
        alt="NalarASN"
        className={`${sizes[size] || sizes.md} w-auto object-contain`}
      />
    </span>
  );
}
