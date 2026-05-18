import "./index.css";
export const Loading = () => {
  return (
    <div className="loading span-3">
      <div className="lds-ring">
        <div></div>
        <div></div>
        <div></div>
        <div></div>
      </div>
    </div>
  );
};
