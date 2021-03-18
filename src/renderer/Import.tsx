import { Button, TextField } from "@material-ui/core";
import React, { useEffect, useState } from "react";
import { useHistory } from "react-router";
import { ipcRenderer } from "electron";

export default function Import() {
  const history = useHistory();
  const [userId, setUserId] = useState("");
  const [password, setPassword] = useState("");
  const [lock, setLock] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);

  useEffect(() => {
    const listener = (e: unknown, msg: string) => {
      setLogs((v) => [...v, msg]);
      console.log(msg);
    };
    ipcRenderer.on("import-message", listener);
    return () => {
      ipcRenderer.removeListener("import-message", listener);
    };
  }, []);

  const onSubmit = () => {
    setLogs([]);
    setLock(true);
    ipcRenderer.send("import", userId, password);
    ipcRenderer.once("import-done", () => {
      setLogs((v) => [...v, "완료되었습니다."]);
      setLock(false);
    });
  };

  const onHome = () => {
    history.push("/");
  };

  return (
    <div className="container">
      <div className="title">Import</div>
      <div className="notice">
        백업을 할 수 있도록 스마트폰의 프메 앱에서 정보를 가져옵니다.<br/>
        프메 앱의 기종변경 페이지에서 ID와 이어받기 패스워드를 찾아 입력해주세요.
      </div>
      <TextField
        className="fullWidth"
        label="ID"
        value={userId}
        onChange={(e) => setUserId(e.target.value)}
      />
      <TextField
        className="fullWidth"
        label="이이받기 패스워드"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
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
