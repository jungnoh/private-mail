import { Button, LinearProgress, TextField } from "@material-ui/core";
import React, { useState } from "react";

export default function Index() {
  const [userID, setUserID] = useState("");
  const [accessToken, setAccessToken] = useState("");
  const [progressText, setProgressText] = useState("로딩중");
  const [active, setActive] = useState(true);

  return (
    <div className="root">
      <TextField
        className="fullWidth"
        label="User ID"
        value={userID}
        onChange={(e) => setUserID(e.target.value)}
      />
      <TextField
        className="fullWidth"
        label="Access Token"
        value={accessToken}
        onChange={(e) => setAccessToken(e.target.value)}
      />
      <div className="progressText">{progressText}</div>
      <LinearProgress
        className="progress"
      />
      <Button className="button" variant="contained" color="primary" disabled={!active}>
        Download
      </Button>
    </div>
  );
}
