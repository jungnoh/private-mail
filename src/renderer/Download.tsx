import { Button, Checkbox, FormControlLabel, LinearProgress, TextField } from "@material-ui/core";
const { ipcRenderer } = require('electron');

import React, { useEffect, useState } from "react";
import { useHistory } from "react-router";

interface Progress {
  stage: number;
  now: number;
  count: number;
}

export default function Download() {
  const history = useHistory();
  const [userId, setUserId] = useState("");
  const [accessToken, setAccessToken] = useState("");
  const [progressText, setProgressText] = useState("로딩중");
  const [percent, setPercent] = useState(0);
  const [firstPage, setFirstPage] = useState(false);

  const [progress, setProgress] = useState<Progress>({
    stage: 0,
    now: 0,
    count: 0
  });
  
  useEffect(() => {
    if (progress.stage === 0) {
      setProgressText("Waiting");
    } else if (progress.stage === 1) {
      setProgressText(`Step 1: List Pages (${progress.count} and counting)`);
      setPercent(-1);
    } else if (progress.stage === 2) {
      setProgressText(`Step 2: Read Mail (${progress.now}/${progress.count})`);
      setPercent(100 * progress.now / (progress.count === 0 ? 100 : progress.count));
    } else if (progress.stage === 3) {
      setProgressText(`Step 3: Download (${progress.now}/${progress.count})`);
      setPercent(100 * progress.now / (progress.count === 0 ? 100 : progress.count));
    } else if (progress.stage === 4) {
      setProgressText("Done!");
      setPercent(100);
    } else {
      setProgressText("Error");
      setPercent(0);
    }
  }, [progress]);

  useEffect(() => {
    ipcRenderer.on("progress", (ev, progress: Progress) => {
      setProgress(progress);
    });
  }, []);

  const onSearch = () => {
    ipcRenderer.send("download", {
      accessToken,
      userId,
      firstPage
    });
  };

  const onHome = () => {
    history.push("/");
  };

  return (
    <div className="container">
      <div className="title">Download</div>
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
      <div className="progressText">{progressText}</div>
      <LinearProgress
        className="progress"
        variant={percent === -1 ? "indeterminate" : "determinate"}
        value={percent === -1 ? undefined: percent}
      />
      <Button
        className="button"
        variant="contained"
        color="primary"
        disabled={0 < progress.stage && progress.stage < 4}
        onClick={() => onSearch()}
      >
        Download
      </Button>
      <FormControlLabel
        control={
          <Checkbox
            checked={firstPage}
            onChange={() => setFirstPage(!firstPage)}
            name="checkFirstPage"
            color="primary"
          />
        }
        label="First page only"
      />
      <Button
        className="button"
        variant="contained"
        color="primary"
        disabled={0 < progress.stage && progress.stage < 4}
        onClick={() => onHome()}
      >
        Go back
      </Button>
    </div>
  );
}
