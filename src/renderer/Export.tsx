import { Button, TextField } from "@material-ui/core";
import React, { useEffect, useState } from "react";
import { useHistory } from "react-router";
import { ipcRenderer } from "electron";

export default function Export() {
  const history = useHistory();
  const [userId, setUserId] = useState("");
  const [accessToken, setAccessToken] = useState("");
  const [lock, setLock] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);

  useEffect(() => {
    const listener = (e: unknown, msg: string) => {
      setLogs((v) => [...v, msg]);
      console.log(msg);
    };
    ipcRenderer.on("export-message", listener);
    return () => {
      ipcRenderer.removeListener("export-message", listener);
    };
  }, []);

  const onSubmit = () => {
    setLogs([]);
    setLock(true);
    ipcRenderer.send("export", userId, accessToken);
    ipcRenderer.once("export-done", () => {
      setLogs((v) => [...v, "완료되었습니다."]);
      setLock(false);
    });
  };

  const onHome = () => {
    history.push("/");
  };

  return (
    <div className="container">
      <div className="title">Export</div>
      <div className="notice">
        스마트폰에서 다시 프메를 사용할 수 있도록 정보를 내보냅니다.<br/>
        Download 페이지에서 입력했던 User ID, Access Token을 그대로 입력해주세요.
      </div>
      <TextField
        className="fullWidth"
        label="User ID"
        value={userId}
        onChange={(e) => setUserId(e.target.value)}
      />
      <TextField
        className="fullWidth"
        label="Access Token"
        value={accessToken}
        onChange={(e) => setAccessToken(e.target.value)}
      />
      <div className="logs">
        {logs.map(x => <>{x}<br /></>)}
      </div>
      <Button
        className="button"
        variant="contained"
        color="primary"
        disabled={lock}
        onClick={() => onSubmit()}
      >
        Import
      </Button>
      <Button
        className="button"
        variant="contained"
        color="primary"
        disabled={lock}
        onClick={() => onHome()}
      >
        Go back
      </Button>
    </div>
  );
}
