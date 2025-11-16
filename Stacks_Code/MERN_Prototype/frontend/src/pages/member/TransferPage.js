import React from "react";
import Transfer from "../../components/Transfer";

function TransferPage({ refresh }) {
  return (
    <div className="transfer-page">
      <Transfer onDone={refresh} />
    </div>
  );
}

export default TransferPage;

