import { Button } from "@material-ui/core";
import React from "react";
import { useHistory } from "react-router";

export default function Index() {
  const history = useHistory();

  const onDownload = () => {
    history.push("/download");
  };

  const onView = () => {
    
  };

  return (
    <div className="container">
      <div className="title">IZ*ONE Private Mail Archiver</div>
      <Button
        className="main-button"
        variant="contained"
        color="primary"
        onClick={() => onDownload()}
      >
        Download
      </Button>
      <Button
        className="mainButton"
        variant="contained"
        color="primary"
        onClick={() => onView()}
      >
        View
      </Button>
    </div>
  );
}
