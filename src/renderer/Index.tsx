import { Button } from "@material-ui/core";
import React from "react";
import { useHistory } from "react-router";
import { ipcRenderer } from "electron";

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
      <Button
        className="mainButton"
        variant="contained"
        color="primary"
        onClick={() => history.push("/import")}
      >
        ⚠️&nbsp;&nbsp;&nbsp;Import User&nbsp;&nbsp;⚠️
      </Button>
      <Button
        className="mainButton"
        variant="contained"
        color="primary"
        onClick={() => history.push("/export")}
      >
        ⚠️&nbsp;&nbsp;&nbsp;Export User&nbsp;&nbsp;⚠️
      </Button>
      <div className="disclaimer">
        본 프로그램의 이용에 따른 책임은 사용자에게 있으며,<br />개발자는 프로그램을 사용함에 따라 발생할 수 있는 결과에 일체 책임을 지지 않습니다.
      </div>
    </div>
  );
}
