import { useEffect } from "react";

import "./App.css";

function App() {
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
          throw new Error(`Chunk ${chunkIndex + 1} upload failed.`);
        }

        const data = await res.json();
        console.log({ data });
      } catch (err) {
        console.error("Error uploading chunk:", err);
      }
    }
  };

  useEffect(() => {
    const uploadURL = "http://localhost:8000/upload";
    const fileInputElement = document.getElementById("fileInput");

    fileInputElement.addEventListener("change", async (event) => {
      const file = event.target.files[0];
      const chunkSize = 5 * 1024 * 1024; // 5MB

      if (file) {
        await uploadFileInChunks(file, chunkSize, uploadURL);
      }
    });
  }, []);

  return (
    <main>
      <section>
        <h1>Welcome to FileIO App</h1>
        <p>This is a simple file input/output application using React.</p>

        <div className="">
          <label htmlFor="">Upload</label>
          <input type="file" id="fileInput" />
        </div>
      </section>
    </main>
  );
}

export default App;
