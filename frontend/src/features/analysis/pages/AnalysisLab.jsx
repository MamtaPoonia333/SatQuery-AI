import React, { useEffect, useMemo, useState } from "react";
import Topbar from "../../../shared/components/Topbar.jsx";
import { listRemoteAnalyses, runRemoteAnalysis } from "../services/analysis.api.js";
import "../../../style/analysis.css";

const MODE_CONFIG = {
  single: { label: "Single image", count: 1, hint: "VQA plus captioning or region grounding" },
  temporal: { label: "Bi-temporal pair", count: 2, hint: "Compare corresponding observations from two dates" },
  "cross-modal": { label: "Optical + SAR pair", count: 2, hint: "Combine spectral context with radar structure" },
};

const TASKS = {
  single: "Describe the land-cover and major objects visible in this image.",
  temporal: "What changed between these two dates, and where did the change occur?",
  "cross-modal": "Use the optical and SAR images together to identify built-up and water-covered regions.",
};

const AnalysisLab = () => {
  const [mode, setMode] = useState("single");
  const [task, setTask] = useState(TASKS.single);
  const [files, setFiles] = useState([]);
  const [roles, setRoles] = useState(["optical", "sar"]);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [running, setRunning] = useState(false);
  const [history, setHistory] = useState([]);

  const previews = useMemo(
    () => files.map((file) => ({ file, url: URL.createObjectURL(file) })),
    [files]
  );

  useEffect(() => () => previews.forEach(({ url }) => URL.revokeObjectURL(url)), [previews]);

  useEffect(() => {
    listRemoteAnalyses().then(setHistory).catch(() => setHistory([]));
  }, []);

  const selectMode = (nextMode) => {
    setMode(nextMode);
    setTask(TASKS[nextMode]);
    setFiles([]);
    setRoles(["optical", "sar"]);
    setResult(null);
    setError(null);
  };

  const onFiles = (event) => {
    setFiles(Array.from(event.target.files || []).slice(0, MODE_CONFIG[mode].count));
    setResult(null);
    setError(null);
  };

  const submit = async (event) => {
    event.preventDefault();
    setRunning(true);
    setError(null);
    try {
      const analysis = await runRemoteAnalysis({ mode, task, files, roles });
      setResult(analysis);
      setHistory((current) => [{ ...analysis, createdAt: new Date().toISOString() }, ...current]);
    } catch (submissionError) {
      setError(submissionError.message || "Analysis failed");
    } finally {
      setRunning(false);
    }
  };

  const downloadTrace = () => {
    const blob = new Blob([JSON.stringify(result, null, 2)], { type: "application/json" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "satquery-analysis-trace.json";
    link.click();
    URL.revokeObjectURL(link.href);
  };

  return (
    <>
      <Topbar title="Analysis Lab" subtitle="Upload remote-sensing imagery and route it to a specialist workflow" />
      <div className="analysis-page">
        <section className="analysis-intro">
          <div>
            <div className="eyebrow">AGENTIC REMOTE SENSING</div>
            <h1>Ask the image, not the workflow.</h1>
            <p>Choose an input configuration, add supported files from your computer, and let the task router select the analysis path.</p>
          </div>
          <div className="baseline-badge">
            {result?.modelStatus === "gemini-vision-adapter"
              ? "Gemini vision active"
              : "Vision adapter ready"}
          </div>
        </section>

        <section className="analysis-grid">
          <form className="analysis-form" onSubmit={submit}>
            <label className="field-label">INPUT CONFIGURATION</label>
            <div className="mode-tabs">
              {Object.entries(MODE_CONFIG).map(([key, config]) => (
                <button type="button" className={mode === key ? "mode-tab active" : "mode-tab"} key={key} onClick={() => selectMode(key)}>
                  <strong>{config.label}</strong>
                  <span>{config.hint}</span>
                </button>
              ))}
            </div>

            <label className="field-label" htmlFor="analysis-task">NATURAL-LANGUAGE TASK</label>
            <textarea id="analysis-task" value={task} onChange={(event) => setTask(event.target.value)} rows="3" />

            <label className="field-label" htmlFor="analysis-files">IMAGERY FILES</label>
            <div className="file-drop">
              <input id="analysis-files" type="file" multiple={MODE_CONFIG[mode].count === 2} accept=".tif,.tiff,.png,.jpg,.jpeg,image/tiff,image/png,image/jpeg" onChange={onFiles} />
              <strong>Select from computer</strong>
              <span>GeoTIFF, TIFF, PNG, or JPEG · up to 50 MB each · {MODE_CONFIG[mode].count} file{MODE_CONFIG[mode].count > 1 ? "s" : ""}</span>
            </div>

            {files.length > 0 && (
              <div className="file-list">
                {files.map((file, index) => <div className="file-row" key={`${file.name}-${file.lastModified}`}><span>{file.name}</span><span className="file-meta"><small>{(file.size / 1024 / 1024).toFixed(2)} MB</small>{mode === "cross-modal" && <select value={roles[index] || ""} onChange={(event) => setRoles((current) => current.map((role, roleIndex) => roleIndex === index ? event.target.value : role))}><option value="optical">Optical / multispectral</option><option value="sar">SAR / radar</option></select>}</span></div>)}
              </div>
            )}

            {error && <div className="analysis-error">{error}</div>}
            <button className="analysis-submit" type="submit" disabled={running || files.length !== MODE_CONFIG[mode].count}>
              {running ? "Routing and analysing..." : "Run specialist analysis"}
            </button>
          </form>

          <div className="analysis-preview">
            <div className="panel-title">VISUAL EVIDENCE</div>
            {previews.length === 0 ? <div className="preview-empty">Your selected imagery will appear here before execution.</div> : <div className="preview-grid">{previews.map(({ file, url }) => <figure key={url}><img src={url} alt={file.name} /><figcaption>{file.name}</figcaption></figure>)}</div>}
          </div>
        </section>

        {result && (
          <section className="analysis-result">
            <div className="result-head"><div><div className="eyebrow">EXECUTION COMPLETE · {result.task}</div><h2>{result.answer}</h2></div><button className="trace-button" type="button" onClick={downloadTrace}>Download trace</button></div>
            <div className="result-metrics"><div><span>Confidence</span><strong>{result.confidence}%</strong></div><div><span>Mode</span><strong>{result.mode}</strong></div><div><span>Model status</span><strong>{result.modelStatus}</strong></div></div>
            <div className="trace-grid"><div><div className="panel-title">EXECUTION TRACE</div>{result.executionTrace.map((step) => <div className="trace-row" key={step.step}><b>{step.step}</b><span>{step.tool}</span><em>{step.status}</em></div>)}</div><div><div className="panel-title">AI EVIDENCE</div>{result.evidence?.observations?.length > 0 && <ul className="observation-list">{result.evidence.observations.map((observation) => <li key={observation}>{observation}</li>)}</ul>}{result.evidence?.limitations?.length > 0 && <div className="limitation-note">{result.evidence.limitations.join(" ")}</div>}<pre className="evidence-block">{JSON.stringify(result.evidence, null, 2)}</pre></div></div>
          </section>
        )}

        <section className="analysis-history">
          <div className="panel-title">RECENT ANALYSES</div>
          {history.length === 0 ? <p className="history-empty">Completed analyses will appear here.</p> : history.slice(0, 8).map((item) => <div className="history-row" key={item._id || item.analysisId}><div><strong>{item.task}</strong><span>{item.mode} · {new Date(item.createdAt).toLocaleString()}</span></div><b>{item.confidence}%</b></div>)}
        </section>
      </div>
    </>
  );
};

export default AnalysisLab;