import React from "react";

interface AsciiProps {
  content: string;
  className: string;
}

const Ascii: React.FC<AsciiProps> = ({ content, className }) => {
  const classname = `${className} ascii`;

  return (
    <div className={classname}>
      {content.split("\n").map((line, lineIndex) => (
        <div key={lineIndex} className="ascii-line">
          {line.split("").map((char, charIndex) => (
            <span key={charIndex} className="ascii-char">
              {char}
            </span>
          ))}
        </div>
      ))}
    </div>
  );
};

export default Ascii;
