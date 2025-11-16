import React from "react";

const Box = ({ title, children }) => (
  <div className="box">
    <h2>{title}</h2>
    {children}
  </div>
);

export default Box;

