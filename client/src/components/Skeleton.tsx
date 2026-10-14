import React from 'react';

interface SkeletonProps {
  className?: string;
  width?: string | number;
  height?: string | number;
  rounded?: string;
}

const Skeleton: React.FC<SkeletonProps> = ({ className = '', width, height, rounded = "rounded-xl" }) => {
  return (
    <div
      className={`skeleton-box ${rounded} ${className}`}
      style={{
        width: width || "100%",
        height: height || "1rem",
      }}
    />
  );
};

export default Skeleton;
