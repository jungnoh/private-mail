import { Button } from "@material-ui/core";
import React from "react";
import { useHistory } from "react-router";
const { ipcRenderer } = require('electron');

export default function Index() {
  const history = useHistory();

  const onDownload = () => {
    history.push("/download");
  };

  const onView = () => {
    ipcRenderer.send("setup-viewer");
    ipcRenderer.once("setup-viewer", (ev, url: string | null) => {
      if (url === null) {
        alert("오류가 발생했습니다. 다운로드를 했는지, 했다면 폴더를 옮기지는 않았는지 확인해주세요.");
      }
    });
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
