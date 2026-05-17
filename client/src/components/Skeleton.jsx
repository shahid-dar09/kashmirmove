const Skeleton = ({ className, width, height, rounded = "rounded-xl" }) => {
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
