import React from "react";

const sizeStyles = {
  sm: {
    track: "w-[2.4rem] h-[1.3rem]",
    knob: "w-4 h-4",
    translateOn: "translate-x-5",
    translateOff: "translate-x-0.5",
  },
  md: {
    track: "w-14 h-8",
    knob: "w-6 h-6",
    translateOn: "translate-x-7",
    translateOff: "translate-x-1",
  },
  lg: {
    track: "w-20 h-10",
    knob: "w-8 h-8",
    translateOn: "translate-x-10",
    translateOff: "translate-x-1",
  },
};

const GlowSwitch = ({
  value,
  onChange,
  size = "md",
  disabled = false,
  className = "",
}) => {
  const styles = sizeStyles[size] || sizeStyles.md;

  return (
    <div
      onClick={() => !disabled && onChange(!value)}
      className={`${styles.track} flex items-center rounded-full cursor-pointer transition-all duration-300
        ${
          value
            ? "bg-[#DC2E73] shadow-[0_0_15px_rgba(220,46,115,0.7),0_0_30px_rgba(220,46,115,0.4)]"
            : "bg-white/20"
        }
        ${disabled ? "opacity-50 cursor-not-allowed" : ""}
        ${className}
      `}
    >
      <div
        className={`${styles.knob} bg-white rounded-full shadow-md transform transition-all duration-300
          ${value ? styles.translateOn : styles.translateOff}`}
      />
    </div>
  );
};

export default GlowSwitch;
