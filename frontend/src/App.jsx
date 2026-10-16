
import { useState } from "react";
import "./App.css";

const API_URL = "http://127.0.0.1:8000";

function App() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [paperInfo, setPaperInfo] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");

  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState([]);
  const [asking, setAsking] = useState(false);
  const [chatError, setChatError] = useState("");

  const [activeTab, setActiveTab] = useState("Overview");

  // PDF select karne par automatically backend ko upload karo
  async function handleFileChange(event) {
    const file = event.target.files?.[0];

    // Same PDF ko dobara select karne ke liye input reset
    event.target.value = "";

    if (!file) return;

    if (
      file.type !== "application/pdf" &&
      !file.name.toLowerCase().endsWith(".pdf")
    ) {
      setUploadError("Please select a PDF file.");
      return;
    }

    if (file.size === 0) {
      setUploadError("The selected PDF is empty.");
      return;
    }

    setSelectedFile(file);
    setPaperInfo(null);
    setUploadError("");
    setChatError("");
    setMessages([]);

    const formData = new FormData();
    formData.append("file", file);

    try {
      setUploading(true);

      const response = await fetch(`${API_URL}/upload-pdf`, {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail || "Could not process this PDF."
        );
      }

      setPaperInfo(data);
    } catch (error) {
      setUploadError(
        error.message === "Failed to fetch"
          ? "Backend se connection nahi ho raha. Check karo ki FastAPI running hai."
          : error.message || "PDF upload failed."
      );
    } finally {
      setUploading(false);
    }
  }

  // Selected PDF ko clear karo
  function handleRemoveFile() {
    setSelectedFile(null);
    setPaperInfo(null);
    setUploadError("");
    setChatError("");
    setMessages([]);
  }

  // User ka question backend ke /ask endpoint par bhejo
  async function handleSendMessage(event) {
    event.preventDefault();

    const userQuestion = question.trim();

    if (!userQuestion || asking) return;

    if (!paperInfo) {
      setChatError("Pehle PDF upload aur process karo.");
      return;
    }

    setQuestion("");
    setChatError("");
    setAsking(true);

    setMessages((previous) => [
      ...previous,
      {
        role: "user",
        text: userQuestion,
      },
    ]);

    try {
      const response = await fetch(`${API_URL}/ask`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          question: userQuestion,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail || "Could not answer this question."
        );
      }

      setMessages((previous) => [
        ...previous,
        {
          role: "assistant",
          text: data.answer,
          sources: data.sources || [],
        },
      ]);
    } catch (error) {
      setChatError(
        error.message === "Failed to fetch"
          ? "Backend connection failed. Check the FastAPI terminal."
          : error.message || "Question processing failed."
      );
    } finally {
      setAsking(false);
    }
  }

  function startNewConversation() {
    setMessages([]);
    setQuestion("");
    setChatError("");
    setActiveTab("Overview");
  }

  const questionsAsked = messages.filter(
    (message) => message.role === "user"
  ).length;

  const statusText = uploading
    ? "Processing"
    : uploadError
      ? "Upload failed"
      : paperInfo
        ? "Processed"
        : "Ready";

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-icon">R</div>
          <div>
            <h2>ResearchIQ</h2>
            <p>Research workspace</p>
          </div>
        </div>

        <button
          className="new-chat-button"
          onClick={startNewConversation}
        >
          <span>＋</span> New conversation
        </button>

        <p className="sidebar-label">WORKSPACE</p>

        {[
          ["▦", "Overview"],
          ["▤", "My Papers"],
          ["✧", "AI Assistant"],
          ["☆", "Bookmarks"],
        ].map(([icon, label]) => (
          <button
            key={label}
            className={`nav-item ${
              activeTab === label ? "active" : ""
            }`}
            onClick={() => setActiveTab(label)}
          >
            <span>{icon}</span>
            {label}
          </button>
        ))}

        <div className="sidebar-bottom">
          <div className="storage-card">
            <div className="storage-heading">
              <span>Paper library</span>
              <span>{paperInfo ? "01" : "00"} / 20</span>
            </div>
            <div className="storage-track">
              <div className="storage-progress" />
            </div>
            <p>Organize your research in one place.</p>
          </div>

          <div className="profile">
            <div className="avatar">K</div>
            <div>
              <strong>Researcher</strong>
              <p>Personal workspace</p>
            </div>
            <span className="profile-menu">•••</span>
          </div>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div className="breadcrumb">
            Workspace <span>/</span> {activeTab}
          </div>
          <div className="topbar-right">
            <span className="status-dot" />
            <span>Local workspace</span>
            <div className="avatar small-avatar">K</div>
          </div>
        </header>

        <div className="page-content">
          <section className="welcome-section">
            <div>
              <p className="eyebrow">YOUR RESEARCH, SIMPLIFIED</p>
              <h1>
                Think deeper.
                <br />
                <span>Discover more.</span>
              </h1>
              <p className="welcome-description">
                Upload research papers, explore key findings, and ask
                questions about your documents in one workspace.
              </p>
            </div>

            <div className="welcome-decoration" aria-hidden="true">
              <div className="orbit orbit-one" />
              <div className="orbit orbit-two" />
              <div className="decoration-center">✧</div>
            </div>
          </section>

          <section className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon purple">▤</div>
              <p>Research papers</p>
              <h3>{paperInfo ? "01" : "00"}</h3>
              <span>In this session</span>
            </div>

            <div className="stat-card">
              <div className="stat-icon green">✧</div>
              <p>Questions asked</p>
              <h3>{questionsAsked.toString().padStart(2, "0")}</h3>
              <span>Current conversation</span>
            </div>

            <div className="stat-card">
              <div className="stat-icon orange">◎</div>
              <p>Workspace status</p>
              <h3 className="ready-label">{statusText}</h3>
              <span>
                {uploading
                  ? "Reading your research paper"
                  : paperInfo
                    ? "PDF indexed successfully"
                    : "Backend integration"}
              </span>
            </div>
          </section>

          <section className="workspace-grid">
            <div className="panel upload-panel">
              <div className="panel-heading">
                <div>
                  <p className="section-kicker">GET STARTED</p>
                  <h2>Add a research paper</h2>
                </div>
                <span className="heading-icon">↥</span>
              </div>

              <label className="upload-zone">
                <input
                  type="file"
                  accept=".pdf,application/pdf"
                  onChange={handleFileChange}
                  disabled={uploading}
                />

                <div className="upload-icon">↑</div>
                <h3>
                  {uploading
                    ? "Processing your PDF..."
                    : "Drop your PDF here"}
                </h3>
                <p>
                  {uploading
                    ? "Please wait. This may take a little while."
                    : "or click to browse your computer"}
                </p>
                <span className="file-type">PDF files only</span>
              </label>

              {selectedFile && (
                <div className="selected-file">
                  <div className="pdf-icon">PDF</div>
                  <div className="file-details">
                    <strong>{selectedFile.name}</strong>
                    <span>
                      {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                      {" · "}
                      {uploading
                        ? "Uploading and indexing..."
                        : paperInfo
                          ? "Processed successfully"
                          : "Selected"}
                    </span>
                  </div>
                  {!uploading && (
                    <button
                      className="remove-file"
                      onClick={handleRemoveFile}
                      aria-label="Remove selected PDF"
                      type="button"
                    >
                      ×
                    </button>
                  )}
                </div>
              )}

              {uploading && (
                <div className="upload-note">
                  <span>⏳</span>
                  <p>
                    Extracting text and creating the search index.
                    The first upload may take longer while the model loads.
                  </p>
                </div>
              )}

              {uploadError && (
                <div className="upload-note">
                  <span>⚠</span>
                  <p>{uploadError}</p>
                </div>
              )}

              {paperInfo && (
                <div className="upload-note">
                  <span>✓</span>
                  <p>
                    PDF processed successfully!
                    <br />
                    Pages: {paperInfo.total_pages}
                    {" · "}
                    Text chunks: {paperInfo.total_chunks}
                    <br />
                    Characters extracted: {paperInfo.extracted_characters}
                  </p>
                </div>
              )}
            </div>

            <div className="panel chat-panel">
              <div className="panel-heading">
                <div>
                  <p className="section-kicker">AI RESEARCH COMPANION</p>
                  <h2>Ask your research</h2>
                </div>
                <span className="ai-badge">✧ AI</span>
              </div>

              <div className="chat-messages">
                {messages.length === 0 ? (
                  <div className="chat-empty">
                    <div className="chat-sparkle">✧</div>
                    <h3>What would you like to explore?</h3>
                    <p>
                      {paperInfo
                        ? "Your paper is ready. Choose a question or type your own."
                        : "Upload and process a research paper before asking questions."}
                    </p>

                    <div className="suggestion-list">
                      {[
                        "Summarize the key findings",
                        "Explain the research methodology",
                        "What are the main limitations?",
                      ].map((suggestion) => (
                        <button
                          key={suggestion}
                          disabled={!paperInfo || asking}
                          onClick={() => setQuestion(suggestion)}
                          type="button"
                        >
                          <span>↗</span> {suggestion}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  messages.map((message, index) => (
                    <div
                      key={`${message.role}-${index}`}
                      className={`message ${message.role}`}
                    >
                      <div className="message-role">
                        {message.role === "user"
                          ? "You"
                          : "ResearchIQ AI"}
                      </div>

                      <p>{message.text}</p>

                      {message.sources?.length > 0 && (
                        <div className="answer-sources">
                          <strong>Relevant passages from your paper</strong>

                          {message.sources.map((source, sourceIndex) => (
                            <div
                              className="source-item"
                              key={`${source.page}-${sourceIndex}`}
                            >
                              <strong>Page {source.page}</strong>
                              <p>{source.text}</p>
                              <span>
                                Relevance score: {source.similarity}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))
                )}

                {asking && (
                  <div className="message assistant">
                    <div className="message-role">ResearchIQ AI</div>
                    <p>Searching your research paper...</p>
                  </div>
                )}
              </div>

              {chatError && (
                <p className="chat-disclaimer">{chatError}</p>
              )}

              <form
                className="chat-input-area"
                onSubmit={handleSendMessage}
              >
                <input
                  type="text"
                  value={question}
                  onChange={(event) => setQuestion(event.target.value)}
                  placeholder={
                    paperInfo
                      ? "Ask anything about your research..."
                      : "Upload a PDF to start asking questions..."
                  }
                  aria-label="Your research question"
                  disabled={!paperInfo || asking}
                />

                <button
                  className="send-button"
                  type="submit"
                  disabled={!paperInfo || !question.trim() || asking}
                  aria-label="Send question"
                >
                  {asking ? "…" : "↑"}
                </button>
              </form>

              <p className="chat-disclaimer">
                {paperInfo
                  ? "Answers are based on relevant passages retrieved from your PDF."
                  : "Upload a research paper to enable questions."}
              </p>
            </div>
          </section>

          <section className="bottom-section">
            <div className="section-title-row">
              <div>
                <p className="section-kicker">YOUR LIBRARY</p>
                <h2>Recent research papers</h2>
              </div>
              <button
                className="text-button"
                onClick={() => setActiveTab("My Papers")}
              >
                View library →
              </button>
            </div>

            {selectedFile ? (
              <div className="recent-paper">
                <div className="paper-icon">PDF</div>
                <div className="paper-info">
                  <h3>{selectedFile.name}</h3>
                  <p>
                    {uploading
                      ? "Uploading and processing..."
                      : paperInfo
                        ? `${paperInfo.total_pages} pages · ${paperInfo.total_chunks} text chunks indexed`
                        : uploadError
                          ? "Processing failed"
                          : "Waiting for processing"}
                  </p>
                </div>
                <span className="pending-badge">
                  {uploading
                    ? "Processing"
                    : paperInfo
                      ? "Processed"
                      : "Pending"}
                </span>
              </div>
            ) : (
              <div className="empty-library">
                <div className="empty-library-icon">▤</div>
                <div>
                  <h3>Your library is waiting</h3>
                  <p>Select a PDF above to see it listed here.</p>
                </div>
              </div>
            )}
          </section>

          <footer className="footer">
            <span>ResearchIQ · Research made clearer.</span>
            <span>AI-powered research workspace</span>
          </footer>
        </div>
      </main>
    </div>
  );
}

export default App;
