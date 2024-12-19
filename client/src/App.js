import { useRef, useEffect, useState } from "react";
import { toast, Toaster } from "react-hot-toast";

import "./App.css";

function App() {
  const fileInputRef = useRef(null);
  const progressRef = useRef(null);
  const progressBarFillRef = useRef(null);
  const [uploadPercentage, setUploadPercentage] = useState(0);

  const resetProgressBarFill = () => {
    if (progressRef.current) {
      progressBarFillRef.current.style.width = `${0}%`;
      fileInputRef.current.value = null;
      setUploadPercentage(0);
    }
  };

  const updateProgressBarFill = (percentage) => {
    if (progressBarFillRef.current) {
      progressBarFillRef.current.style.width = `${percentage}%`;
      setUploadPercentage(percentage);
    }
  };

  const uploadFileInChunks = async (file, chunkSize, uploadURL) => {
    const totalChunks = Math.ceil(file.size / chunkSize);

    for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
      // Get the current chunk
      const start = chunkSize * chunkIndex;
      const end = Math.min(start + chunkSize, file.size);
      const chunk = file.slice(start, end);
      console.log(chunkIndex, { chunk });

      // Create a FormData object
      const formData = new FormData();
      formData.append("fileName", file.name);
      formData.append("chunkIndex", chunkIndex);
      formData.append("totalChunks", totalChunks);
      formData.append("uploadFile", chunk);

      try {
        const res = await fetch(uploadURL, {
          method: "POST",
          body: formData,
        });

        if (!res.ok) {
          throw new Error(`Chunk ${chunkIndex + 1} upload failed`);
        }

        const data = await res.json();
        // console.log({ data });

        if (data?.data?.is_complete) {
          resetProgressBarFill();
          toast.success("File uploaded successfully!");
        } else {
          updateProgressBarFill(data?.data?.chunk_percentage);
        }
      } catch (err) {
        console.error("Error uploading chunk:", err);
      }
    }
  };

  useEffect(() => {
    const uploadURL = "http://localhost:8000/upload";

    if (fileInputRef.current) {
      fileInputRef.current.addEventListener("change", async (event) => {
        const file = event.target.files[0];
        const chunkSize = 5 * 1024 * 1024; // 5MB

        if (file) {
          await uploadFileInChunks(file, chunkSize, uploadURL);
        }
      });
    }
  }, []);

  return (
    <main className="App">
      <div>
        <Toaster />
      </div>

      <section>
        <h1>Welcome to FileIO App</h1>
        <p>This is a simple file input/output application using React.</p>

        <div className="">
          <label htmlFor="">Upload</label>
          <input ref={fileInputRef} type="file" id="fileInput" />
        </div>

        <div ref={progressRef} className="progress">
          <div className="progress-bar">
            <div ref={progressBarFillRef} className="progress-bar-fill"></div>
          </div>
          <div id="upload-percentage">{uploadPercentage}%</div>
        </div>
      </section>
    </main>
  );
}

export default App;
